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
  _paddingFirst,
} = require(`./parts/parts.js`);

const getCopyFormatDataArray = () => {
  const formatData = vscode.workspace
    .getConfiguration(`CopyFormatCode`).get(`CopyFormat`);
  return formatData;
};

const copyCode = (format) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage(`No editor is active`);
    return;
  }

  const driveLetterUpper = path => {
    if (path[1] === `:`) {
      return path[0].toUpperCase() + path.slice(1);
    }
  };

  const replaceHeaderFooter = (text, startLine, endLine) => {
    if (!text) {
      return ``;
    }
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
      _paddingFirst(`${startLine}`, `${endLine}`.length, `0`)
    );
    text = text.replaceAll(`%LineNumberEnd%`,
      `${endLine}`
    );

    text += `\n`;

    return text;
  };


  const startLine = __min(editor.selections.map(s=>s.start.line)) + 1;
  const endLine = __max(editor.selections.map(s=>s.end.line)) + 1;
  let header = replaceHeaderFooter(format.header, startLine, endLine);
  const footer = replaceHeaderFooter(format.footer, startLine, endLine);

  let body = ``;
  if (!format.option) {
    body = getTextNoLineNumberNoFormat(editor);
  } else {
    const { deleteIndent, deleteBlankLine, lineNumber } = format.option;
    if (!lineNumber) {
      if (deleteIndent && deleteBlankLine) {
        body = getTextNoLineNumberDeleteIndentBlankLine(editor);
      } else if (deleteIndent) {
        body = getTextNoLineNumberDeleteIndent(editor);
      } else if (deleteBlankLine) {
        body = getTextNoLineNumberDeleteBlankLine(editor);
      } else {
        body = getTextNoLineNumberNoFormat(editor);
      }
    } else {
      if (deleteIndent && deleteBlankLine) {
        body = getTextLineNumberDeleteIndentBlankLine(editor);
      } else if (deleteIndent) {
        body = getTextLineNumberDeleteIndent(editor);
      } else if (deleteBlankLine) {
        body = getTextLineNumberDeleteBlankLine(editor);
      } else {
        body = getTextLineNumberNoFormat(editor);
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
