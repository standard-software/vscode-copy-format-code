const vscode = require(`vscode`);
path = require(`path`);

const {
  registerCommand,
  commandQuickPick,
} = require(`./lib/libVSCode.js`);

const {
  isUndefined,
  _excludeFirst,
  _subLength,
  _subFirstDelimLast,
  _subLastDelimLast,
  _trim,
  _trimFirst,
  _trimLast,
} = require(`./parts/parts.js`);

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || `Assertion failed`);
  }
};

const getConfigFormatMenuItems = () => {
  const formatData = vscode.workspace
    .getConfiguration(`CopyFormatCode`).get(`SelectFormatMenu`);
  return formatData;
};

const getConfigDefaultFormat = () => {
  const formatData = vscode.workspace
    .getConfiguration(`CopyFormatCode`).get(`CopyDefaultFormat`);
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

  let replaceTable = [];
  if (lineBreak === `\r\n`) {
    replaceTable = [
      ...replaceTable,
      [`\r\n`, `\n`],
      [`\n`, lineBreak],
    ];
  }

  const filePath = driveLetterUpper(editor.document.uri.fsPath);
  const fileName = path.basename(filePath);
  const folderPath = path.dirname(filePath);
  replaceTable = [
    ...replaceTable,
    [`%FilePath%`, filePath],
    [`%FilePathSlash%`, filePath.replaceAll(`\\`, `/`)],
    [`%FileName%`, fileName],
    [`%FileExt%`, _excludeFirst(path.extname(filePath), `.`)],
    [`%FileNameWithoutExt%`, _subFirstDelimLast(fileName, `.`)],

    [`%FolderPath%`, folderPath],
    [`%FolderPathSlash%`, folderPath.replaceAll(`\\`, `/`)],
    [`%FolderName%`, path.basename(folderPath)],
  ];

  let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  const filePathRelative =
    workspaceFolder
      ? path.relative(
        workspaceFolder.uri.fsPath,
        editor.document.uri.fsPath
      )
      : filePath;
  const folderPathRelative = path.dirname(filePathRelative);
  replaceTable = [
    ...replaceTable,
    [`%FilePathRelative%`,        filePathRelative],
    [`%FilePathRelativeSlash%`,   filePathRelative.replaceAll(`\\`, `/`)],
    [`%FolderPathRelative%`,      folderPathRelative],
    [`%FolderPathRelativeSlash%`, folderPathRelative.replaceAll(`\\`, `/`)],
  ];

  const filePathRelativeProject =
    workspaceFolder
      ? path.relative(
        path.dirname(workspaceFolder.uri.fsPath),
        editor.document.uri.fsPath
      )
      : filePath;
  const folderPathRelativeProject = path.dirname(filePathRelativeProject);
  replaceTable = [
    ...replaceTable,
    [`%FilePathRelativeProject%`,        filePathRelativeProject],
    [`%FilePathRelativeProjectSlash%`,   filePathRelativeProject.replaceAll(`\\`, `/`)],
    [`%FolderPathRelativeProject%`,      folderPathRelativeProject],
    [`%FolderPathRelativeProjectSlash%`, folderPathRelativeProject.replaceAll(`\\`, `/`)],
  ];

  projectFolderPath = workspaceFolder
    ? driveLetterUpper(workspaceFolder.uri.fsPath)
    : path.dirname(filePath);
  replaceTable = [
    ...replaceTable,
    [`%ProjectFolderPath%`,       projectFolderPath],
    [`%ProjectFolderPathSlash%`,  projectFolderPath.replaceAll(`\\`, `/`)],
    [`%ProjectName%`,             path.basename(projectFolderPath)],
  ];

  const startLineStr = startLine.toString();
  const endLineStr = endLine.toString();
  replaceTable = [
    ...replaceTable,
    [`%NumberStart%`,         startLineStr],
    [`%NumberStartZeroPad%`,  startLineStr.padStart(endLineStr.length, `0`)],
    [`%NumberEnd%`,           endLineStr],
  ];

  replaceTable = [
    ...replaceTable,
    [`\\%`, `%`],     // \% -> %
    [`\\\\`, `\\`],    // \\ -> \
  ];

  let line = format;
  for (const [oldPattern, newPattern] of replaceTable) {
    line = line.replaceAll(oldPattern, newPattern);
  }
  line += lineBreak;
  return line;
};

const getIndent = (line) => {
  return line.length - _trimFirst(line, [` `, `\t`]).length;
};

const getMinIndent = (editor) => {
  let minIndent = Infinity;
  for (const { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      if (
        start.line !== end.line &&
        i === end.line &&
        end.character === 0
      ) {
        break;
      }

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
  const selections = [...editor.selections];
  selections.sort((a, b) => {
    if (a.start.line < b.start.line) { return -1; }
    if (a.start.line > b.start.line) { return 1; }
    return 0;
  });
  for (const { start, end } of selections) {
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
      ];

      replaceTable = [
        ...replaceTable,
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

  const selectFormat = (placeHolder, formatMenuItems) => {
    const commands = [];

    for (const formatData of formatMenuItems) {
      if (formatData.visible === false) { continue; }
      if (formatData.separator === true) {
        commands.push({
          label: formatData.label,
          kind: vscode.QuickPickItemKind.Separator,
        });
      } else if (formatData.format) {
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
              `${_subLastDelimLast(placeHolder, ` : `)} : ${formatData.label}`,
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
        getConfigFormatMenuItems()
      );
    }
  );

  registerCommand(context,
    `vscode-copy-format-code.CopyDefaultFormat`,
    () => {
      const formatData = getConfigDefaultFormat();
      copyCode(formatData.format);
    }
  );

}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
