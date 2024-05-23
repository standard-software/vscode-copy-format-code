const vscode = require(`vscode`);

const {
  registerCommand,
} = require(`./lib/libVSCode.js`);

function activate(context) {

  registerCommand(context,
    `vscode-copy-format-code.Hello`,
    () => {
      vscode.window.showInformationMessage(`Hello`);
    }
  );

}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
