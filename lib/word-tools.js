const child_process = require("child_process"); // run terminal commands
const path = require("path");
const fs = require("fs-plus");
const tmp = require("tmp");
const { Point, Range } = require("atom");

var notify = atom.notifications;

function wordcount(filePath, {dirPath, merge}) { // filePath must be absolute, dirPath is used for \input paths
  if (!dirPath) { dirPath = path.dirname(filePath); }

  let texdocCommand = `texcount -dir="${dirPath}"`;
  if (merge) { texdocCommand += " -merge"; }

  texdocCommand += ` "${filePath}"`;
  console.log(texdocCommand);
  let child = child_process.exec(texdocCommand, {encoding: "utf-8"});
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

function wordcountSection(editor, point, maxDepthString) {
  let textRange = getSectionRange(editor, point, maxDepthString);
  let text = editor.getTextInBufferRange(textRange);
  let dirPath = editor.getDirectoryPath();
  wordcountSelection(text, dirPath);
}

function getSectionRange(editor, point, maxDepthString) {
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

    maxDepth determines what is a valid section label. The smaller it is, the
    more restrictive the set of section commands that will be recognised.

    Section levels are from https://en.wikibooks.org/wiki/LaTeX/Document_Structure#Sectioning_commands
  */

  let levelTable = {
    "part": -1,
    "chapter": 0,
    "section": 1,
    "subsection": 2,
    "subsubsection": 3,
    "paragraph": 4,
    "subparagraph": 5
  };

  let maxDepth = levelTable[maxDepthString];

  let searchRegex = /\\((?:sub)?section|chapter|part|(?:sub)?paragraph)\s*\*?\s*(\[.*?\])?\{/g;
  let scanRange = new Range([0,0], point);
  let sectionRange = null;

  let matchFound = false;
  let sectionLevel = null;
  let startPoint = null;
  let endSearchStartpoint = point;
  let startSectionName = "";

  // console.log(editor.getTextInBufferRange(scanRange));

  editor.backwardsScanInBufferRange(searchRegex, scanRange, ({match, range, stop}) => {
    let command = match[1];

    if (maxDepth < levelTable[command]) {
      // do nothing;
    } else {

      sectionLevel = levelTable[command];
      startPoint = range.start;
      endSearchStartpoint = range.end;

      let line = editor.lineTextForBufferRow(range.end.row);
      let restOfLine = editor.getTextInBufferRange([range.end, [range.end.row, line.length]]);
      startSectionName = restOfLine.match(/^[^\}]*/)[0]; // the name of section where the counting starts

      matchFound = true;
      stop();
    }
  });

  if (!matchFound) {
    notify.addWarning("Section level not found. Beginning from start of current file.");
    startPoint = new Point(0, 0);
  }

  let sectionScanRange = new Range(endSearchStartpoint, editor.getBuffer().getEndPosition());
  matchFound = false;
  editor.scanInBufferRange(searchRegex, sectionScanRange, ({match, range, stop}) => {
    let command = match[1];

    if (sectionLevel < levelTable[command]) {
      // do nothing
    } else {

      endPoint = range.start;

      let line = editor.lineTextForBufferRow(range.end.row);
      let restOfLine = editor.getTextInBufferRange([range.end, [range.end.row, line.length]]);
      endSectionName = restOfLine.match(/^[^\}]*/)[0]; // the name of section where the counting ends

      matchFound = true;
      stop();
    }
  });

  if (!matchFound) {
    endPoint = editor.getBuffer().getEndPosition();
  }

  sectionRange = new Range(startPoint, endPoint);
  return sectionRange;
}

module.exports = { wordcount, wordcountAccurate, getRootFilePath, wordcountSelection, wordcountSection };
