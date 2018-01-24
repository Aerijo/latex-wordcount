const child_process = require("child_process"); // run terminal commands
const path = require("path");
const fs = require("fs-plus");
const tmp = require("tmp");

var notify = atom.notifications;

function wordcount(filePath, dirPath) { // filePath must be absolute, dirPath is used for \input paths
  if (!dirPath) { dirPath = path.dirname(filePath); }
  let child = child_process.exec(`texcount -merge -dir="${dirPath}" "${filePath}"`, {encoding: "utf-8"});
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data) => {
    if (data.trim().startsWith("!!!")) {
      notify.addError(data, {dismissable: true, icon: "graph"});
    } else {
      data = data.trim().split(/\n/).slice(2).join("\n- ");
      data = "- ".concat(data);
      let message = "`TeXcount` results:";
      notify.addInfo(message, {dismissable: true, detail: data, icon: "graph"});
    }
  });
}

/* Working on improved wordcount.tex usage

function wordcountAccurate(filePath) {
  let dirPath = path.dirname(filePath);
  let engine = "latex";
  if (atom.config.get("latex-wordcount.enableShellEscape")) { engine.concat(" -shell-escape"); }
  command should end as: latex wordcount.tex\csname ?\endcsname <file path>
  let daPath = "/usr/local/texlive/2017/texmf-dist/tex/latex/wordcount/wordcount.tex"

  const myProcess = child_process.exec(`${engine} ${daPath} \\csname ?\\endcsname`, {encoding: "utf-8", cwd: dirPath});
  myProcess.stdout.setEncoding("utf-8");
  myProcess.stdin.write(filePath, {encodng: "utf-8"})
  myProcess.stdin.end();

  myProcess.stdout.on('close', () => {console.log(`closing stdout...`); });
  myProcess.stdout.on('data', (data) => {console.log(data); });
  myProcess.stdout.on('end', () => {console.log(`ending stdout...`); });
  myProcess.stdout.on('error', (error) => {console.error(error); });
  myProcess.stdout.on('readable', () => {console.log("readable stdout..."); });

  myProcess.on('close', (code, signal) => {console.log(`closing with ${code} ${signal}`)})
  myProcess.on('error', (err) => {console.error(err)})
  myProcess.on('exit', (code, signal) => {console.log(`exiting with ${code} ${signal}`)})
  myProcess.on('message', (message) => {console.log(`messaging ${message}`)})
}

*/

function wordcountAccurate(filePath) {
  let dirPath = path.dirname(filePath);
  let sanFilePath = filePath.replace(" ", "\\space ").trim(); // doesn't work
  let engine = "latex";
  if (atom.config.get("latex-wordcount.enableShellEscape")) { engine.concat(" -shell-escape"); }
  // command should end as: latex wordcount.tex\csname ?\endcsname <file path>
  child_process.exec("kpsewhere wordcount", {encoding: "utf-8"}, (error, stdout, stderr) => {
    if (error) { notify.addError(error, {dismissable: true}); return; }
    let wordcount = stdout;

    child_process.exec(`echo "\"${sanFilePath}\"" | ${engine} ${wordcount}\\csname ?\\endcsname`, {encoding: "utf-8", cwd: dirPath}, (error, stdout, stderr) => {
      if (error) { notify.addError(error, {dismissable: true}); return; }
      if (!stdout) { console.log("no output"); }
      
      child_process.exec(`grep -c '3[.]0863[35]' wordcount.log`, {encoding: "utf-8", cwd: dirPath}, (error, stdout, stderr) => {
        if (error) { notify.addError(error, {dismissable: true}); return; }
        if (!stdout) {
          notify.addWarning("Could not detect words");
        } else {
          notify.addInfo(`\`wordcount.tex\` results: ${stdout} words`, {dismissable: true});
        }
      });
    });
  });
}

function getRootFilePath() {
  let editor = atom.workspace.getActiveTextEditor();
  let currentFilePath = editor.getPath();
  let fileText = editor.getText();

  let rootFilePath = fileText.match(/% !T[eE]X root =\s*(.*)/);

  if (rootFilePath) {
    rootFilePath = path.resolve(editor.getDirectoryPath(), rootFilePath[1]);
    if (!path.extname(rootFilePath)) {
      rootFilePath = rootFilePath.concat(".tex");
    }
    return rootFilePath;
  } else {
    return currentFilePath;
  }
}

function wordcountSelection(selectedText, dirPath) {
  if (selectedText.length === 0) { notify.addWarning("No text selected!"); return; }

  tmp.file((err, path, fd, cleanupCallback) => {
    fs.writeFile(path, selectedText, (err) => {
      if (err) { console.error(err); }

      wordcount(path, dirPath);
    });

    cleanupCallback();
  });
}

function wordcountSection(editor, point) {
  let textRange = getSectionRange(editor, point);
}

function getSectionRange(editor, point) {
  /*
    Gets the text at the current level of the cursor. E.g.,
    \section{Section 1}
    $1
      \subsection{Subsection 1}
      $2
      \subsection{Subsection 2}
      $3

    $1 will get all text within the section and subsections
    $2 will get all text in Subsection 1
    $3 will get all text in Subsection 2 (and any following subsubsection's or lower)
  */
}

module.exports = { wordcount, wordcountAccurate, getRootFilePath, wordcountSelection, wordcountSection };
