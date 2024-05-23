const vscode = require(`vscode`);

const {
  registerCommand,
  commandQuickPick,
} = require(`./lib/libVSCode.js`);

const getCopyFormatArray = () => {
  const formatData = vscode.workspace
    .getConfiguration(`CopyFormatCode`).get(`CopyFormat`);
  return formatData.map(item => item.format);
};

function activate(context) {

  const selectFormat = (placeHolder) => {
    const commands = [];

    const formats = getCopyFormatArray();
    for (const [index, format] of formats.entries()) {
      commands.push({
        label: format,
        description: ``,
        func: () => {

        }
      });
    }

    commandQuickPick(
      commands,
      placeHolder
    );
  };

  registerCommand(context,
    `vscode-copy-format-code.SelectFormat`,
    () => {
      selectFormat(`Copy Format Code : Select Format`);
    }
  );

}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
