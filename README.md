See this on [atom.io](https://atom.io/packages/latex-wordcount)

# latex-wordcount

## Table of contents
- [About](#about)
- [Commands](#commands)
  - [Document wordcount](#document-wordcount)
  - [Document wordcount (more accurate)](#document-wordcount-more-accurate)


## About
Given the nature of LaTeX, it is practically impossible to get an accurate word count for any non-trivial document. However, this package provides several methods of estimating the word count using tools that come with a TeXLive distribution, such [`TeXcount`](http://app.uio.no/ifi/texcount/) and [`wordcount.tex`](https://ctan.org/pkg/wordcount).

- **NOTE:** The more accurate wordcount does not work on files with spaces in the path. E.g., `/Users/username/my TeX files/main.tex` will not work. It also (probably) doesn't work on Windows (yet).

- **Windows:** TeXcount may need to be set up following the instructions [given here](http://app.uio.no/ifi/texcount/faq.html). `wordcount.tex` does not work at all yet.

## Commands
Currently, this package offers two commands. More are being worked on (see [Ideas](#ideas)).

#### Document wordcount
This will count using `TeXcount`, which uses a set of LaTeX specific rules to better estimate the word count. It's quite fast, as it does not compile the document, so useful if you want a rough estimate of the word count. Note that it will not know any macro definitions, so take this into consideration if you use macros that expand into a group of words. It will probably underestimate the word count in most cases. See it's homepage [here](http://app.uio.no/ifi/texcount/).

#### Document wordcount (more accurate)
_Forgive the name._ (this does not work on files with spaces in the path; see top note)

This command runs a different program, and actually compiles your document. The output should be a file called `wordcount.log` located in the same directory as the root file (the one that gets compiled; magic comments are followed). Basically, it redefines several TeX commands to force the log file to include each character and word. A simple search command then finds the number of characters and words, and prints the result.
  - Note: because the file _is_ compiled, and it prints _every_ character to the log file, this method is slow. It also takes a lot of space, so be mindful of that. The taken space increases as the document gets bigger.

This method is more accurate than `TeXcount`; it 'knows' macro definitions, so (for example) it will correctly give the number of words inserted by the `\lipsum` command.

However, it makes no distinction between the type of any text. Tables, captions, math formulas (each individual term; even superscripts are counted), code (in a `minted` block), etc. will all be included in the count.


## Ideas
[X] Word count for entire document; i.e., what results from compiling

[ ] Word count for selected region (less accurate compared to wordcount.tex, as macro definitions are completely unknown)

[ ] Word count for current file (it might be an individual section or chapter)

[ ] Wordcout for current section (where cursor is up until next `\section{}` command); same type for `\subsection{}`, `\subsubsection{}`. If not finished by current file, ~~can check the input~~ cannot check input, as completely ambiguous. Not being finished in file should result in warning.

  - Config file could be used for custom section commands and their 'level'; section goes from current section (by looking above) to next section command of same or greater level.
