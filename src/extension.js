const vscode = require(`vscode`);
path = require(`path`);

const {
  registerCommand,
  commandQuickPick,
} = require(`./lib/libVSCode.js`);

const {
  isUndefined,
  __min, __max,
  _excludeFirst,
  _subLength,
  _subFirstDelimFirst,
  _trim,
  _trimFirst,
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
  return path;
};

const replaceHeaderFooter = (editor, text) => {
  if (!text) {
    return ``;
  }

  const lineBreak = getLineBreak(editor);
  assert(!isUndefined(lineBreak));

  const startLine = __min(editor.selections.map(s=>s.start.line)) + 1;
  const endLine = __max(editor.selections.map(s=>s.end.line)) + 1;

  const replaceTable = {};
  const rf = replaceTable;
  rf.filePathFull = driveLetterUpper(editor.document.uri.fsPath);
  rf.filePathFullSlash =
    rf.filePathFull.replaceAll(`\\`, `/`);
  rf.fileName = path.basename(rf.filePathFull);
  rf.fileExt = _excludeFirst(path.extname(rf.filePathFull), `.`);
  rf.fileNameWithoutExt = _subFirstDelimFirst(rf.fileName, `.`);
  rf.folderPath = path.dirname(rf.filePathFull);
  rf.folderPathSlash = path.dirname(rf.filePathFullSlash);
  rf.folderName = path.basename(rf.folderPath);

  let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  rf.filePathRelative = workspaceFolder
    ? path.relative(
      workspaceFolder.uri.fsPath,
      editor.document.uri.fsPath
    )
    : rf.filePathFull;
  rf.filePathRelativeSlash =
    rf.filePathRelative.replaceAll(`\\`, `/`);
  rf.projectFolderPath = workspaceFolder
    ? driveLetterUpper(workspaceFolder.uri.fsPath)
    : path.dirname(rf.filePathFull);
  rf.projectFolderPathSlash =
    rf.projectFolderPath.replaceAll(`\\`, `/`);
  rf.projectName =
    path.basename(rf.projectFolderPath);

  rf.lineNumberStart = startLine;
  rf.lineNumberStartZeroPad =
    startLine.toString().padStart(endLine.toString().length, `0`);
  rf.lineNumberEnd = endLine;

  rf[`¥r¥n`] = `\n`;
  rf[`\n`] = lineBreak;

  for (const [key, newPattern] of Object.entries(replaceTable)) {
    const oldPattern = `%${key[0].toUpperCase() + key.slice(1)}%`;
    text = text.replaceAll(oldPattern, newPattern);
  }

  text += lineBreak;

  return text;
};

const getIndent = (line) => {
  return line.length - _trimFirst(line, [` `, `\t`]).length;
};

const getMinIndent = (editor) => {
  let minIndent = Infinity;
  for (const { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      const lineText = editor.document.lineAt(i).text;
      if (_trim(lineText) === ``) { continue; }
      const indent = getIndent(lineText);
      if (indent < minIndent) {
        minIndent = indent;
      }
    }
  }
  if (minIndent === Infinity) { minIndent = 0; }
  return minIndent;
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

    let numberDigit = 0;
    if (option.lineNumber === `file`) {
      numberDigit = endLine.toString().length;
    } else if (option.lineNumber === `startOne`) {
      numberDigit = (endLine - startLine + 1).toString().length;
    }

    let minIndent;
    if (option.deleteIndent) {
      minIndent = getMinIndent(editor);
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

        let lineText = editor.document.lineAt(i).text;

        if (option.deleteBlankLine) {
          if (_trim(lineText) === ``) { continue; }
        }

        if (option.deleteIndent) {
          lineText = _subLength(lineText, minIndent);
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


  const {
    deleteIndent = false, deleteBlankLine = false, lineNumber = false
  } = format.option ?? {};
  const body = getText(editor,
    {
      lineNumber: lineNumber ? `file` : `none`,
      deleteBlankLine,
      deleteIndent,
    }
  );

  const copyText = header + body + footer;
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
