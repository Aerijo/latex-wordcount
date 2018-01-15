const { CompositeDisposable } = require("atom");
const { wordcount, getRootFilePath, wordcountAccurate } = require("./word-tools");
const path = require("path");

module.exports = {
  config: {
    enableShellEscape: {
      description: "⚠️ Allows LaTeX to execute arbitrary code. Potentially harmful. Use only on trusted documents. See [this SE question](https://tex.stackexchange.com/questions/88740/what-does-shell-escape-do)",
      type: "boolean",
      default: false
    }
  },

  activate(state) {
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.commands.add("atom-text-editor", {
        "latex-wordcount:document-wordcount": () => { this.documentWordcount() },
        // "latex-wordcount:section-wordcount": () => { this.sectionWordcount() },
        "latex-wordcount:document-wordcount-(more accurate)": () => { this.documentWordcountAccurate() }
      })
    );
  },

  deactivate() {
    this.disposables.dispose();
  },

  documentWordcount() {
    let rootFilePath = getRootFilePath();
    wordcount(rootFilePath);
  },

  documentWordcountAccurate() {
    let rootFilePath = getRootFilePath();
    wordcountAccurate(rootFilePath);
  },

  // sectionWordcount() {
  //   return "working on it"
  // },


};
