const { CompositeDisposable } = require("atom");
const { wordcount, getRootFilePath, wordcountAccurate, wordcountSection, wordcountSelection, foldSection } = require("./word-tools");
const path = require("path");

module.exports = {
  config: {
    enableShellEscape: {
      description: "⚠️ Allows LaTeX to execute arbitrary code. Potentially harmful. Use only on trusted documents. See [this SE question](https://tex.stackexchange.com/questions/88740/what-does-shell-escape-do)",
      type: "boolean",
      default: false
    },
    maximumSectionDepth: {
      description: "The deepest section command to look for when finding the beginning of the current section. Note: paragraph refers to the command `\\paragraph{...}`",
      type: "string",
      default: "section",
      enum: ["part", "chapter", "section", "subsection", "subsubsection", "paragraph", "subparagraph"]
    },
    additionalUserOptions: {
      description: "⚠️ Caution: options are passed directly to shell. Use this to pass custom options to all texcount calls. These options are applied last, so will override default settings. For a list of valid options, see http://app.uio.no/ifi/texcount/documentation.html",
      type: "string",
      default: ""
    },
    verboseOutput: {
      description: "See warnings when the sections are not opened/closed within a file",
      type: "boolean",
      default: false
    },
    enableFoldingCommands: {
      description: "Experimental, will be removed at some point. Use to fold by section, much like the section worcount command. Restart Atom to apply this setting.",
      type: "boolean",
      default: false
    }
  },

  activate(state) {
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.commands.add("atom-text-editor", {
        "latex-wordcount:document-wordcount": () => { this.documentWordcount(); },
        "latex-wordcount:file-wordcount": () => { this.fileWordcount(); },
        "latex-wordcount:section-wordcount": () => { this.sectionWordcount(); },
        "latex-wordcount:selection-wordcount": () => { this.selectionWordcount(); },
        "latex-wordcount:document-wordcount-(more accurate)": () => { this.documentWordcountAccurate(); }
      })
    );

    if (atom.config.get("latex-wordcount.enableFoldingCommands")) {
      this.disposables.add(
        atom.commands.add("atom-text-editor", {
          "latex-wordcount:fold-section": () => { this.foldSection(); }
        })
      );
    }
  },

  deactivate() {
    this.disposables.dispose();
  },

  documentWordcount() {
    let rootFilePath = getRootFilePath();
    wordcount(rootFilePath, {merge: true});
  },

  fileWordcount() {
    let editor = atom.workspace.getActiveTextEditor();
    let filePath = editor.getPath();
    wordcount(filePath, {merge: false});
  },

  documentWordcountAccurate() {
    let rootFilePath = getRootFilePath();
    wordcountAccurate(rootFilePath);
  },

  sectionWordcount() {
    let editor = atom.workspace.getActiveTextEditor();
    let point = editor.getCursorBufferPosition();

    let maxDepthString = atom.config.get("latex-wordcount.maximumSectionDepth");
    wordcountSection(editor, point, maxDepthString);
  },

  foldSection() {
    let editor = atom.workspace.getActiveTextEditor();
    let point = editor.getCursorBufferPosition();

    let maxDepthString = atom.config.get("latex-wordcount.maximumSectionDepth");
    foldSection(editor, point, maxDepthString);
  },

  selectionWordcount() {
    let editor = atom.workspace.getActiveTextEditor();
    let selectedText = editor.getSelectedText();
    let dirPath = editor.getDirectoryPath();
    wordcountSelection(selectedText, dirPath);
  }


};
