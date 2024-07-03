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
  _trimLast,
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

const formatHeaderFooter = (editor, format) => {
  if (!format) { return ``; }

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

  rf[`\\%`] = `%`;    // \% -> %
  rf[`\\\\`] = `\\`;  // \\ -> \

  for (const [key, newPattern] of Object.entries(replaceTable)) {
    const oldPattern = `%${key[0].toUpperCase() + key.slice(1)}%`;
    format = format.replaceAll(oldPattern, newPattern);
  }

  format += lineBreak;

  return format;
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

const formatBody = (editor, bodyFormat, bodySeparator) => {
  if (isUndefined(bodyFormat) || bodyFormat === ``) { return ``; }

  const lineBreak = getLineBreak(editor);
  const startLine = __min(editor.selections.map(s=>s.start.line)) + 1;
  const endLine = __max(editor.selections.map(s=>s.end.line)) + 1;

  const numberDigitFile = endLine.toString().length;
  const numberDigitStart1 = (endLine - startLine + 1).toString().length;

  const minIndent = getMinIndent(editor);

  const skipBlankLine = bodyFormat.includes(`%SkipBlankLine%`);
  bodyFormat = bodyFormat.replaceAll(`%SkipBlankLine%`, ``);

  let maxLineLength = 0;
  const results = [];
  for (const [selectionIndex, { start, end }] of editor.selections.entries()) {
    let result = [];
    for (let i = start.line; i <= end.line; i += 1) {
      if (
        start.line !== end.line &&
        i === end.line &&
        end.character === 0
      ) {
        break;
      }

      let line = bodyFormat;

      const replaceTable = {};
      const rf = replaceTable;
      const _numberStart1 = (i - start.line + 1);
      rf.numberStart1 = _numberStart1.toString().padStart(numberDigitStart1, `0`);
      rf.numberFile = (i + 1).toString().padStart(numberDigitFile, `0`);

      rf.line = editor.document.lineAt(i).text;
      if (skipBlankLine && _trim(rf.line) === ``) { continue; }
      rf.lineCutMinIndent = _subLength(rf.line, minIndent);
      rf.lineTrim = _trim(rf.line);
      rf.lineTrimFirst = _trimFirst(rf.line);
      rf.lineTrimLast = _trimLast(rf.line);
      rf.lineTrimLast = _trimLast(rf.line);
      rf.spaceMinIndent = ` `.repeat(minIndent);

      rf[`¥r¥n`] = `\n`;
      rf[`\n`] = lineBreak;

      rf[`\\%`] = `%`;    // \% -> %
      rf[`\\\\`] = `\\`;  // \\ -> \

      // rf.aaa = `ABC`
      // replaceAll(`Aaa`, `ABC`)
      for (const [key, newPattern] of Object.entries(replaceTable)) {
        const oldPattern = `%${key[0].toUpperCase() + key.slice(1)}%`;
        line = line.replaceAll(oldPattern, newPattern);
      }
      result.push(line + lineBreak);

      maxLineLength = Math.max(
        maxLineLength, line.length - `%SpacePadEnd%`.length
      );
    }
    results.push(result);
  }

  if (bodyFormat.includes(`%SpacePadEnd%`)) {
    for (let result of results) {
      for (let [i, line] of result.entries()) {
        line = line.replaceAll(
          `%SpacePadEnd%`,
          ` `.repeat(
            maxLineLength -  (line.length - `%SpacePadEnd%`.length - lineBreak.length)
          )
        );
        result[i] = line;
      }
    }
  }

  return results.map(r=>r.join(``)).join(
    isUndefined(bodySeparator) ? ``
      : (bodySeparator + lineBreak)
  );

};

const copyCode = (format) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage(`No editor is active`);
    return;
  }
  const header = formatHeaderFooter(editor, format.header);
  const footer = formatHeaderFooter(editor, format.footer);
  const body = formatBody(editor, format.body, format.bodySeparator);

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
