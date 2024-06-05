const vscode = require(`vscode`);
path = require(`path`);

const {
  registerCommand,
  commandQuickPick,

  getTextNoLineNumberNoFormat,
  getTextNoLineNumberDeleteIndent,
  getTextNoLineNumberDeleteBlankLine,
  getTextNoLineNumberDeleteIndentBlankLine,
  getTextLineNumberNoFormat,
  getTextLineNumberDeleteIndent,
  getTextLineNumberDeleteBlankLine,
  getTextLineNumberDeleteIndentBlankLine,

} = require(`./lib/libVSCode.js`);

const {
  __min, __max,
  _excludeFirst,
  _subFirstDelimFirst,
  _trim,
} = require(`./parts/parts.js`);

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || `Assertion failed`);
  }
};


const getCopyFormatDataArray = () => {
  const formatData = vscode.workspace
    .getConfiguration(`CopyFormatCode`).get(`CopyFormat`);
  return formatData;
};

const getLineBreak = (editor) => {
  const { eol } = editor.document;
  if (eol === vscode.EndOfLine.LF) {
    return `\n`;
  } else if (eol === vscode.EndOfLine.CRLF) {
    return `\r\n`;
  }
  assert(false, `getLineBreak:eol${eol}`);
};


const driveLetterUpper = path => {
  if (path[1] === `:`) {
    return path[0].toUpperCase() + path.slice(1);
  }
};

const replaceHeaderFooter = (editor, text) => {
  if (!text) {
    return ``;
  }

  const lineBreak = getLineBreak(editor);
  const startLine = __min(editor.selections.map(s=>s.start.line)) + 1;
  const endLine = __max(editor.selections.map(s=>s.end.line)) + 1;

  text = text.replaceAll(`%FilePathFull%`,
    // editor.document.fileName
    driveLetterUpper(editor.document.uri.fsPath)
  );
  text = text.replaceAll(`%FilePathFullSlash%`,
    driveLetterUpper(
      _excludeFirst(editor.document.uri.path, `/`)
    )
  );

  let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (workspaceFolder) {
    const relativePath = path.relative(
      workspaceFolder.uri.fsPath,
      editor.document.uri.fsPath
    );
    text = text.replaceAll(`%FilePathRelative%`,
      relativePath
    );
    text = text.replaceAll(`%FilePathRelativeSlash%`,
      relativePath.replaceAll(`\\`, `/`)
    );

    const projectName = path.basename(workspaceFolder.uri.path);
    text = text.replaceAll(`%ProjectName%`,
      projectName
    );
  }

  text = text.replaceAll(`%FileName%`,
    path.basename(editor.document.uri.path)
  );
  text = text.replaceAll(`%FileExt%`,
    _excludeFirst(path.extname(editor.document.uri.path), `.`)
  );
  text = text.replaceAll(`%FileNameWithoutExt%`,
    _subFirstDelimFirst(path.basename(editor.document.uri.path), `.`)
  );
  text = text.replaceAll(`%ParentFolderName%`,
    path.basename(path.dirname(editor.document.uri.path))
  );

  text = text.replaceAll(`%LineNumberStart%`,
    `${startLine}`
  );
  text = text.replaceAll(`%LineNumberStartZeroPad%`,
    startLine.toString().padStart(endLine.toString().length, `0`)
  );
  text = text.replaceAll(`%LineNumberEnd%`,
    `${endLine}`
  );

  text = text.replaceAll(`¥r¥n`, `¥n`);
  text = text.replaceAll(`¥n`, lineBreak);
  text += lineBreak;

  return text;
};

const copyCode = (format) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage(`No editor is active`);
    return;
  }

  const header = replaceHeaderFooter(editor, format.header);
  const footer = replaceHeaderFooter(editor, format.footer);

  const getText = (editor, option) => {
    assert([`none`, `file`, `startOne`].includes(option.lineNumber));

    const lineBreak = getLineBreak(editor);
    const startLine = __min(editor.selections.map(s=>s.start.line)) + 1;
    const endLine = __max(editor.selections.map(s=>s.end.line)) + 1;

    console.log(`extension.js 142`, startLine, endLine);

    let numberDigit = 0;
    if (option.lineNumber === `file`) {
      numberDigit = endLine.toString().length;
    } else if (option.lineNumber === `startOne`) {
      numberDigit = (endLine - startLine + 1).toString().length;
    }

    let result = ``;
    for (const [selectionIndex, { start, end }] of editor.selections.entries()) {
      for (let i = start.line; i <= end.line; i += 1) {
        if (
          start.line !== end.line &&
          i === end.line &&
          end.character === 0
        ) {
          break;
        }

        const lineText = editor.document.lineAt(i).text;

        if (option.deleteBlankLine) {
          if (_trim(lineText) === ``) { continue; }
        }

        if (option.lineNumber === `none`) {
          result += `${lineText}${lineBreak}`;
        } else if (option.lineNumber === `file`) {
          const lineNumber =
            (i + 1).toString().padStart(numberDigit, `0`);
          result += `${lineNumber}: ${lineText}${lineBreak}`;
        } else if (option.lineNumber === `startOne`) {
          const lineNumber =
            (i + 1 - startLine + 1).toString().padStart(numberDigit, `0`);
          result += `${lineNumber}: ${lineText}${lineBreak}`;
        }
      }
      if (selectionIndex !== editor.selections.length - 1) {
        result += lineBreak;
      }
    }
    return result;
  };


  let body = ``;
  if (!format.option) {
    body = getText(editor,  { lineNumber: `none` });
  } else {
    const { deleteIndent, deleteBlankLine, lineNumber } = format.option;
    if (!lineNumber) {
      if (deleteIndent && deleteBlankLine) {
        body = getTextNoLineNumberDeleteIndentBlankLine(editor);
      } else if (deleteIndent) {
        body = getTextNoLineNumberDeleteIndent(editor);
      } else if (deleteBlankLine) {
        body = getText(editor, { lineNumber: `none`, deleteBlankLine: true });
      } else {
        body = getText(editor, { lineNumber: `none` });
      }
    } else {
      if (deleteIndent && deleteBlankLine) {
        body = getTextLineNumberDeleteIndentBlankLine(editor);
      } else if (deleteIndent) {
        body = getTextLineNumberDeleteIndent(editor);
      } else if (deleteBlankLine) {
        body = getText(editor, { lineNumber: `file`, deleteBlankLine: true });
      } else {
        body = getText(editor, { lineNumber: `file` });
      }
    }
  }

  const copyText = header + body + footer;
  // console.log(`extension.js 65`, copyText);
  vscode.env.clipboard.writeText(copyText);
};

function activate(context) {

  const selectFormat = (placeHolder, formats) => {
    const commands = [];

    for (const [index, formatData] of formats.entries()) {
      if (formatData.format) {
        commands.push({
          label: formatData.label,
          description: ``,
          func: () => {
            copyCode(formatData.format);
          }
        });
      } else if (formatData.items) {
        commands.push({
          label: formatData.label,
          description: `▸`,
          func: () => {
            selectFormat(
              `Copy Format Code : Select Format : ${formatData.label}`,
              formatData.items
            );
          }
        });
      }
    }

    commandQuickPick(
      commands,
      placeHolder
    );
  };

  registerCommand(context,
    `vscode-copy-format-code.SelectFormat`,
    () => {
      selectFormat(
        `Copy Format Code : Select Format`,
        getCopyFormatDataArray()
      );
    }
  );

}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
