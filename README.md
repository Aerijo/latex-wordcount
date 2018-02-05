See this on [atom.io](https://atom.io/packages/latex-wordcount)

# latex-wordcount

## Table of contents
- [About](#about)
- [Requirements](#requirements)
- [Commands](#commands)
  - [Quick summary](#quick-summary)
  - [Document wordcount](#document-wordcount)
  - [Document wordcount (more accurate)](#document-wordcount-more-accurate)
  - [File wordcount](#file-wordcount)
  - [Section wordcount](#section-wordcount)
  - [Selection wordcount](#selection-wordcount)
- [Settings](#settings)
  - [Enable shell escape](#enable-shell-escape)
  - [Maximum section depth](#maximum-section-depth)


## About
Given the nature of LaTeX, it is practically impossible to get an accurate word count for any non-trivial document. However, this package provides several methods of estimating the word count using tools that come with a TeX Live distribution, such as [`TeXcount`](http://app.uio.no/ifi/texcount/) and [`wordcount.tex`](https://ctan.org/pkg/wordcount).

Most of the provided commands use `TeXcount`, as it is the quicker and more lenient program. However, it is likely to underestimate the wordcount most of the time. The one command that uses `wordcount.tex` only works on the entire document and requires generating a log file that grows larger as the document gets longer. This one will likely overestimate the word count, so (to reiterate the earlier point) these methods are approximations only and you as the user must decide how to interpret the results.

- Note: I recently added code folding based on section commands. This is experimental, must be explicitly enabled to use, and will likely be removed at some point. For now though, I'll leave it here because this package already has section range finding logic, so implementing folding based on this range was easy enough.

## Requirements
- Most commands need the `texcount` command line program. This comes with a standard TeX Live installation. I believe it also comes with MiKTeX, but cannot confirm.
  - Windows: TeXcount may need to be set up following the instructions [given here](http://app.uio.no/ifi/texcount/faq.html).
- The `Document wordcount (more accurate)` command only works on a UNIX shell, as it currently uses commands such as `echo` and `grep`. Most Windows users will be unable to use this command for now.
- The above command also requires that the absolute path to the root file has no spaces in it. E.g., `/Users/username/my TeX files/main.tex` will not work.


## Commands
#### Quick summary
  - `Document wordcount`: counts entire document, from start of root file, including all `\input` files.
  - `Document wordcount (more accurate)`: more accurate version of Document wordcount, but takes longer and requires generation of a log file containing a line for every character in the output.
  - `File wordcount`: counts only current file, and does not count `\input` files (the only one that doesn't).
  - `Section wordcount`: counts the current section, including all `\input` files.
  - `Selection wordcount`: counts the current selection, including `\input` files.

#### Document wordcount
This will count using TeXcount, which uses a set of LaTeX specific rules to better estimate the word count. It's quite fast, as it does not compile the document, so useful if you want a rough estimate of the word count. Note that it will not know any macro definitions, so take this into consideration if you use macros that expand into a group of words. It will probably underestimate the word count in most cases. See it's homepage [here](http://app.uio.no/ifi/texcount/).

#### Document wordcount (more accurate)
_Forgive the name._ (this does not work on files with spaces in the path; see top note)

This command runs a different program, and actually compiles your document. The output should be a file called `wordcount.log` located in the same directory as the root file (the one that gets compiled; magic comments are followed). Basically, it redefines several TeX commands to force the log file to include each character and word. A simple search command then finds the number of characters and words, and prints the result.
  - Note: because the file _is_ compiled, and it prints _every_ character to the log file, this method is slow. It also takes a lot of space, so be mindful of that. The taken space increases as the document gets bigger.

This method is more accurate than TeXcount; it 'knows' macro definitions, so (for example) it will correctly give the number of words inserted by the `\lipsum` command.

However, it makes no distinction between the type of any text. Tables, captions, math formulas (each individual term; even superscripts are counted), code (in a `minted` block), etc. will all be included in the count.

#### File wordcount
Back to TeXcount, this command will run it on the currently open file (not the root one). It will also ignore any `\input`, `\include`, etc. commands that would be honoured by `Document wordcount`.

#### Section wordcount
First, the text in the current section is gathered. This section is determined by looking back from the cursor position to the nearest section command, where section command is one of the following: `\part`, `\chapter`, `\section`, `\subsection`, `\subsubsection`, `\paragraph`, `\subparagraph`. However, only section commands of the level set by [maximum section depth](#maximum-section-depth) or lower (shallower?) will be recognised. When found, the section start (that will eventually be passed to `texcount`) is set to the beginning of that section command.

Next, it will then look for the next section command of same or lower level as the starting one. When found, it will set the end of the section range to just before this section command.

- If not found in the current file, it will stop there. It will not attempt to determine the document structure and work out where the source continues.

Finally, it copies the text in this range and pastes it into a temporary file created by the npm [`tmp`](https://www.npmjs.com/package/tmp) package. It then runs `texcount` on this temporary file, but set up so it thinks it's in the same directory as the original file, ensuring relative file paths still work (as `\input` files are included if they are within the section).

#### Selection wordcount
Similar to Section wordcount, this command will count the words in a selected region. Specifically, it will create a temporary file in the system temp directory and write the selected text to it. It will then run `texcount` on this temporary file, specifying the directory as that of the original file. This way, `\input` statements (and others) will still work if they are completely within the selection. TeXcount will not see the outside of the selection, so if the selection cuts into a macro it may not behave as expected.

In both this case and the above, the temporary file is deleted as soon as the results are returned.

## Settings

#### Enable shell escape
The shell escape flag is generally used to allow LaTeX to execute arbitrary code. This can be useful for packages such as `minted`, where the syntax colours are determined using an external program.

This option is not necessary for TeXcount, as it works by parsing the source. However, `wordcount.tex` requires the document be compiled, so any packages that require shell escape need this flag enabled.

#### Maximum section depth
When counting the words in a section, this setting determines the deepest section command to look for. For example, consider the following document layout
```latex
\section{S:1}
  (1)
  \subsection{SS:1-1}
    (2)
  \subsection{SS:1-2}
    (3)
\section{S:2}
```

A setting of `subsection` will cause the count when the cursor is at (1) to be for the entire `S:1` to `S:2`, the count at (2) to be between `SS:1-1` and `SS:1-2`, and the count at (3) to be between `SS:1-2` and `S:2`.

A setting of `section` will cause all three locations to count the same area (`S:1` to `S:2`), because the deeper `subsection` commands will be ignored.


## Ideas

- Config file could be used for custom section commands and their 'level'; section goes from current section (by looking above) to next section command of same or greater level.
