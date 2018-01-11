See this on [github](https://github.com/Aerijo/latex-wordcount)

# latex-wordcount

## Table of contents
- [About](#about)


## About
Given the nature of LaTeX, it is practically impossible to get an accurate wordcount for any non-trivial document. However, this package provides several methods of estimating the wordcount using tools that come with a TeXLive distribution, such [`TeXcount`](http://app.uio.no/ifi/texcount/) and [`wordcount.tex`](https://ctan.org/pkg/wordcount).

## Ideas
- Wordcount for entire document; i.e., what results from compiling
- Wordcount for selected region (less accurate compared to wordcount.tex, as macro definitions are completely unknown)
- Wordcount for current file (it might be an individual section or chapter)
- Wordcout for current section (where cursor is up until next `\section{}` command); same type for `\subsection{}`, `\subsubsection{}`. If not finished by current file, ~~can check the input~~ cannot check input, as completely ambiguous. Not being finished in file should result in warning.

  - Config file could be used for custom section commands and their 'level'; section goes from current section (by looking above) to next section command of same or greater level.
