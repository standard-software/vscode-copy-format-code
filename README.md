# vscode-copy-format-code

Header/Footer

  %FilePathFull%
  %FilePathFullSlash%
  %FileName%
  %FileExt%
  %FileNameWithoutExt%
  %FolderPath%
  %FolderPathSlash%
  %FolderName%
  %FilePathRelative%
  %FilePathRelativeSlash%
  %ProjectFolderPath%
  %ProjectFolderPathSlash%
  %ProjectName%

  %LineNumberStart%
  %LineNumberStartZeroPad%
  %LineNumberEnd%

Body
  %NumberStart1%
  %NumberFile%

  %Line%
  %LineCutMinIndent%
  %LineTrim%
  %LineTrimFirst%
  %LineTrimLast%

  %SpaceMinIndent%%LineCutMinIndent%
    = %Line%

  %SpacePadEnd%

  %SkipBlankLine%

SelectionSeparator
  :



\% -> %
\\ -> \

Option
  DeleteIndent: true/false    Default false
  DeleteEmptyLine: true/false Default false


