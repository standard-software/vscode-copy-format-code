const vscode = require(`vscode`);

const {
  _trimFirst,
  _trim,
  _subLength,
} = require(`../parts/parts.js`);

// VSCode System

const registerCommand = (context, commandName, func) => {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      commandName, func
    )
  );
};

const getEditor = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage(`No editor is active`);
    return;
  }
  return editor;
};

const commandQuickPick = (commands, placeHolder) => {
  // const commands = commandsArray.map(c => ({label:c[0], description:c[1], func:c[2]}));
  // command = [
  //   {label:``, description:``, func: ()=>{}},
  //   {label:``, kind:vscode.QuickPickItemKind.Separator}
  // ]
  vscode.window.showQuickPick(

    commands.map(({ func, ...command }) => (command)),
    {
      canPickMany: false,
      placeHolder
    }
  ).then((item) => {
    if (!item) { return; }
    commands.find(({ label }) => label === item.label).func();
  });
};

// VSCode editor.selections

const insertText = (editor, str) => {
  editor.edit(editBuilder => {
    for (const selection of editor.selections) {
      editBuilder.replace(selection, str);
    }
  });
};

const insertTextNotSelected = (editor, str) => {
  editor.edit(editBuilder => {
    for (const selection of editor.selections) {
      editBuilder.replace(selection, str);
    }
  }).then(() => {
    const newSelections = [];
    for (const selection of editor.selections) {
      if (
        selection.start.line === selection.end.line
        && selection.start.character === selection.end.character
      ) {
        newSelections.push(selection);
      } else {
        newSelections.push(new vscode.Selection(
          selection.end.line,
          selection.end.character,
          selection.end.line,
          selection.end.character
        ));
      }
    }
    editor.selections = newSelections;
  });
};

const insertTextSelected = (editor, str) => {
  editor.edit(editBuilder => {
    for (const selection of editor.selections) {
      editBuilder.replace(selection, str);
    }
  }).then(() => {
    const newSelections = [];
    for (const selection of editor.selections) {
      if (
        selection.start.line === selection.end.line
        && selection.start.character === selection.end.character
      ) {
        const strLines = str.split(`\n`);
        if (strLines.length === 0) {
          throw new Error(`insertTextSelected`);
        } else if (strLines.length === 1) {
          newSelections.push(new vscode.Selection(
            selection.start.line,
            selection.start.character - str.length,
            selection.end.line,
            selection.end.character,
          ));
        } else {
          const selectionStartLine = selection.start.line - (strLines.length - 1);
          const selectionStartCharactor =
            editor.document.lineAt(selectionStartLine).text.length -
            strLines[0].length;
          newSelections.push(new vscode.Selection(
            selectionStartLine,
            selectionStartCharactor,
            selection.start.line,
            selection.start.character
          ));
        }
      } else {
        newSelections.push(selection);
      }
    }
    editor.selections = newSelections;
  });
};

const getSelectedText = (editor) => {
  const result = [];
  for (let selection of editor.selections) {
    const text = editor.document.getText(selection);
    result.push(text);
  };
  return result;
};


const loopSelectionsLines = (editor, func) => {
  for (const { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      if (
        start.line !== end.line &&
        i === end.line &&
        end.character === 0
      ) {
        break;
      }
      func(i);
    }
  }
};

// getText

const getIndent = (line) => {
  return line.length - _trimFirst(line, [` `, `\t`]).length;
};

const getMinIndent = (editor) => {
  let minIndent = Infinity;
  loopSelectionsLines(editor, i => {
    const { text } = editor.document.lineAt(i);
    if (_trim(text) === ``) { return; }
    const indent = getIndent(text);
    if (indent < minIndent) {
      minIndent = indent;
    }
  });
  if (minIndent === Infinity) { minIndent = 0; }
  return minIndent;
};

const getMinIndentExcludeLineNumber = (editor) => {
  let minIndent = Infinity;
  loopSelectionsLines(editor, i => {
    const { text } = editor.document.lineAt(i);
    if (_trim(text) === ``) { return; }
    if (isNull(_trim(text).match(/^\d+:+.*$/))) { return; }
    const colonAfterText = _subLastDelimFirst(text, `: `);
    if (_trim(colonAfterText) === ``) { return; }
    const indent = getIndent(colonAfterText);
    if (indent < minIndent) {
      minIndent = indent;
    }
  });
  if (minIndent === Infinity) { minIndent = 0; }
  return minIndent;
};

const getMaxFileLineNumberDigit = (editor) => {
  let result = 0;
  loopSelectionsLines(editor, i => {
    result = Math.max(result, i.toString().length);
  });
  return result;
};

const getInputLineNumberDigit = (editor, lineNumber) => {
  let result = 0;
  loopSelectionsLines(editor, () => {
    result = Math.max(result, lineNumber.toString().length);
    lineNumber += 1;
  });
  return result;
};

const getLineTextInfo = (editor, lineIndex) => {
  const lineAt = editor.document.lineAt(lineIndex);
  const { text } = lineAt;
  const textIncludeLineBreak = editor.document.getText(
    lineAt.rangeIncludingLineBreak
  );
  const lineBreak = _subLength(textIncludeLineBreak, text.length);
  return {
    text, textIncludeLineBreak, lineBreak
  };
};

const getTextNoLineNumberNoFormat = (editor) => {
  let result = ``;
  loopSelectionsLines(editor, i => {
    const { textIncludeLineBreak } = getLineTextInfo(editor, i);
    result += `${textIncludeLineBreak}`;
  });
  return result;
};

const getTextNoLineNumberDeleteIndent = (editor) => {
  let result = ``;
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    result += `${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

const getTextNoLineNumberDeleteBlankLine = (editor) => {
  let result = ``;
  loopSelectionsLines(editor, i => {
    const { text, textIncludeLineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    result += `${textIncludeLineBreak}`;
  });
  return result;
};

const getTextNoLineNumberDeleteIndentBlankLine = (editor) => {
  let result = ``;
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    result += `${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

const getTextLineNumberNoFormat = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  loopSelectionsLines(editor, i => {
    const { textIncludeLineBreak } = getLineTextInfo(editor, i);
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${textIncludeLineBreak}`;
  });
  return result;
};

const getTextLineNumberDeleteIndent = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

const getTextLineNumberDeleteBlankLine = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  loopSelectionsLines(editor, i => {
    const { text, textIncludeLineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${textIncludeLineBreak}`;
  });
  return result;
};

const getTextLineNumberDeleteIndentBlankLine = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

module.exports = {
  registerCommand,
  getEditor,
  commandQuickPick,

  insertText,
  insertTextNotSelected,
  insertTextSelected,
  getSelectedText,

  getTextNoLineNumberNoFormat,
  getTextNoLineNumberDeleteIndent,
  getTextNoLineNumberDeleteBlankLine,
  getTextNoLineNumberDeleteIndentBlankLine,
  getTextLineNumberNoFormat,
  getTextLineNumberDeleteIndent,
  getTextLineNumberDeleteBlankLine,
  getTextLineNumberDeleteIndentBlankLine,

};
