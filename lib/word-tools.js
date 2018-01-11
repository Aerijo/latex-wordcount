const child_process = require("child_process"); // run terminal commands
const path = require("path");

function wordcount(filePath) {
  console.log(filePath);
  let dirPath = path.dirname(filePath);
  child_process.exec(`texcount -merge "${filePath}"`, {cwd: dirPath}, (error, stdout, stderr) => {
    if (error) { // probably useless; TeXcount doesn't throw errors the normal way
      atom.notifications.addError(`TeXcount didn't work! Error: \n - ${error}`, {dismissable: true});
      return;
    }
    let data = stdout.trim().split(/\n/);
    if (data[0].startsWith("!!!")) { // TeXcount has a weird way of reporting errors
      atom.notifications.addError(`TeXcount didn't work! Error: \n ${stdout}`, {dismissable: true});
      return;
    }
    data = data.slice(2).join("\n - ");
    data = "\n - ".concat(data);
    let message = `TeXcount results: ${data}`
    atom.notifications.addInfo(message, {dismissable: true});
  });
}

function getRootFilePath() {
  let file = atom.workspace.getActiveTextEditor();
  let currentFilePath = file.getPath();
  let fileText = file.getText();

  let rootFilePath = fileText.match(/% !T[eE]X root =\s*(.*)/);

  if (rootFilePath) {
    rootFilePath = path.resolve(file.getDirectoryPath(), rootFilePath[1]);
    if (!path.extname(rootFilePath)) {
      rootFilePath = rootFilePath.concat(".tex");
    }
    return rootFilePath;
  } else {
    return currentFilePath;
  }
}

module.exports = { wordcount, getRootFilePath }
