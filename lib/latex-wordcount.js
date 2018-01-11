const { CompositeDisposable } = require("atom");
const { wordcount, getRootFilePath } = require("./word-tools");
const path = require("path");

module.exports = {
  async activate(state) {
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.commands.add('atom-text-editor', {
        "latex-wordcount:document-wordcount": async () => { this.documentWordcount() }
      })
    );
  },

  deactivate() {
    this.disposabels.dispose();
  },

  async documentWordcount() {
    let rootFilePath = getRootFilePath();
    await wordcount(rootFilePath);
  }
};
