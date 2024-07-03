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

  const { startLine, endLine } = getLineNumber(editor);

  const replaceTable = {};
  const rf = replaceTable;
  rf.filePath = driveLetterUpper(editor.document.uri.fsPath);
  rf.filePathSlash =
    rf.filePath.replaceAll(`\\`, `/`);
  rf.fileName = path.basename(rf.filePath);
  rf.fileExt = _excludeFirst(path.extname(rf.filePath), `.`);
  rf.fileNameWithoutExt = _subFirstDelimFirst(rf.fileName, `.`);
  rf.folderPath = path.dirname(rf.filePath);
  rf.folderPathSlash = rf.folderPath.replaceAll(`\\`, `/`);
  rf.folderName = path.basename(rf.folderPath);

  let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  rf.filePathRelative = workspaceFolder
    ? path.relative(
      workspaceFolder.uri.fsPath,
      editor.document.uri.fsPath
    )
    : rf.filePath;
  rf.filePathRelativeSlash =
    rf.filePathRelative.replaceAll(`\\`, `/`);
  rf.folderPathRelative = path.dirname(rf.filePathRelative);
  rf.folderPathRelativeSlash = rf.folderPathRelative.replaceAll(`\\`, `/`);

  rf.filePathRelativeProject = workspaceFolder
    ? path.relative(
      path.dirname(workspaceFolder.uri.fsPath),
      editor.document.uri.fsPath
    )
    : rf.filePath;
  rf.filePathRelativeProjectSlash =
    rf.filePathRelativeProject.replaceAll(`\\`, `/`);
  rf.folderPathRelativeProject = path.dirname(rf.filePathRelativeProject);
  rf.folderPathRelativeProjectSlash = rf.folderPathRelative.replaceAll(`\\`, `/`);

  rf.projectFolderPath = workspaceFolder
    ? driveLetterUpper(workspaceFolder.uri.fsPath)
    : path.dirname(rf.filePath);
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

const getLineNumber = (editor) => {
  let startLine = Infinity;
  let endLine = -Infinity;
  for (const { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      if (
        start.line !== end.line &&
        i === end.line &&
        end.character === 0
      ) {
        break;
      }
      endLine = Math.max(endLine, i);
    }
    startLine = Math.min(startLine, start.line);
  }
  assert(startLine !== Infinity);
  assert(endLine !== -Infinity);
  startLine += 1;
  endLine += 1;
  return { startLine, endLine };
};

const formatBody = (editor, bodyFormat, bodySeparator) => {
  if (isUndefined(bodyFormat) || bodyFormat === ``) { return ``; }

  const lineBreak = getLineBreak(editor);
  const { startLine, endLine } = getLineNumber(editor);

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

      const lineText = editor.document.lineAt(i).text;
      if (skipBlankLine && _trim(lineText) === ``) { continue; }

      let replaceTable = [];
      if (lineBreak === `\r\n`) {
        replaceTable = [
          ...replaceTable,
          [`\r\n`, `\n`],
          [`\n`, lineBreak],
        ];
      }
      replaceTable = [
        ...replaceTable,
        [
          `%NumberStart1%`,
          `${i - start.line + 1}`.padStart(numberDigitStart1, `0`)
        ],
        [
          `%NumberFile%`,
          `${i + 1}`.padStart(numberDigitFile, `0`)
        ],

        [`%Line%`,              lineText],
        [`%LineCutMinIndent%`,  _subLength(lineText, minIndent)],
        [`%LineTrim%`,          _trim(lineText)],
        [`%LineTrimFirst%`,     _trimFirst(lineText)],
        [`%LineTrimLast%`,      _trimLast(lineText)],
        [`%LineTrimLast%`,      _trimLast(lineText)],
        [`%SpaceMinIndent%`,    ` `.repeat(minIndent)],

        [`\\%`, `%`],     // \% -> %
        [`\\\\`, `\\`],    // \\ -> \
      ];
      // %Line%     -> Change line text
      // \%Line\%   -> `%Line%`
      // \\%Line\\% -> `\%Line\%`

      let line = bodyFormat;
      for (const [oldPattern, newPattern] of replaceTable) {
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
