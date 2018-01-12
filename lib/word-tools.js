const child_process = require("child_process"); // run terminal commands
const path = require("path");

function wordcount(filePath) {
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

function wordcountAccurate(filePath) {
  let dirPath = path.dirname(filePath);
  let sanFilePath = filePath.replace(" ", "\\space ").trim(); // doesn't work
  let engine = "latex"
  if (atom.config.get("latex-wordcount.enableShellEscape")) { engine.concat(" -shell-escape"); }
  // command should end as: latex wordcount.tex\csname ?\endcsname <file path>
  child_process.exec("kpsewhere wordcount", {encoding: "utf-8"}, (error, stdout, stderr) => {
    let wordcount = stdout;
    child_process.exec(`echo "\"${sanFilePath}\"" | ${engine} ${wordcount}\\csname ?\\endcsname`, {encoding: "utf-8", cwd: dirPath}, (error, stdout, stderr) => {
      if (!stdout) { console.log("no output"); }
      child_process.exec(`grep -c '3[.]0863[35]' wordcount.log`, {encoding: "utf-8", cwd: dirPath}, (error, stdout, stderr) => {
        if (!stdout) {
          atom.notifications.addWarning("Could not detect words");
        } else {
          atom.notifications.addInfo(`\`wordcount.tex\` results: ${stdout} words`, {dismissable: true});
        }
      });
    });
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

module.exports = { wordcount, wordcountAccurate, getRootFilePath }
