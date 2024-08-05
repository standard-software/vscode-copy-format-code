# SETTING_SAMPLE.md

Default Setting

settings.json
```json
{
  "CopyFormatCode.CopyDefaultFormat": {
    "label": "Markdown LineNumber : Cut MinIndent",
    "format": {
      "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName%",
      "body": "%NumberFile%: %LineCutMinIndent%",
      "bodySeparator": ":",
      "footer": "```"
    }
  },
  "CopyFormatCode.SelectFormatMenu": [
    {
      "label": "Markdown",
      "items": [
        {
          "label": "Markdown",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
            "body": "%Line%",
            "bodySeparator": ":",
            "footer": "```"
          }
        },
        {
          "label": "",
          "separator": true
        },
        {
          "label": "Markdown : Cut MinIndent",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
            "body": "%LineCutMinIndent%",
            "bodySeparator": ":",
            "footer": "```"
          }
        },
        {
          "label": "Markdown : Delete BlankLine",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
            "body": "%SkipBlankLine%%Line%",
            "bodySeparator": ":",
            "footer": "```"
          }
        },
        {
          "label": "Markdown : Cut MinIndent and Delete BlankLine",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
            "body": "%SkipBlankLine%%LineCutMinIndent%",
            "bodySeparator": ":",
            "footer": "```"
          }
        }
      ]
    },
    {
      "label": "Markdown LineNumber",
      "items": [
        {
          "label": "Markdown LineNumber",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName%",
            "body": "%NumberFile%: %Line%",
            "bodySeparator": ":",
            "footer": "```"
          }
        },
        {
          "label": "",
          "separator": true
        },
        {
          "label": "Markdown LineNumber : Cut MinIndent",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName%",
            "body": "%NumberFile%: %LineCutMinIndent%",
            "bodySeparator": ":",
            "footer": "```"
          }
        },
        {
          "label": "Markdown LineNumber : Delete BlankLine",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName%",
            "body": "%NumberFile%: %Line%%SkipBlankLine%",
            "bodySeparator": ":",
            "footer": "```"
          }
        },
        {
          "label": "Markdown LineNumber : Cut MinIndent and Delete BlankLine",
          "format": {
            "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName%",
            "body": "%NumberFile%: %LineCutMinIndent%%SkipBlankLine%",
            "bodySeparator": ":",
            "footer": "```"
          }
        }
      ]
    },
    {
      "label": "Header RelativePath",
      "items": [
        {
          "label": "Header RelativePath",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName% : %NumberStart%-%NumberEnd%",
            "body": "%Line%",
            "bodySeparator": ""
          }
        },
        {
          "label": "",
          "separator": true
        },
        {
          "label": "Header RelativePath : Cut MinIndent",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName% : %NumberStart%-%NumberEnd%",
            "body": "%LineCutMinIndent%",
            "bodySeparator": ""
          }
        },
        {
          "label": "Header RelativePath : Delete BlankLine",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName% : %NumberStart%-%NumberEnd%",
            "body": "%SkipBlankLine%%Line%",
            "bodySeparator": ""
          }
        },
        {
          "label": "Header RelativePath : Cut MinIndent and Delete BlankLine",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName% : %NumberStart%-%NumberEnd%",
            "body": "%SkipBlankLine%%LineCutMinIndent%",
            "bodySeparator": ""
          }
        }
      ]
    },
    {
      "label": "Header RelativePath LineNumber",
      "items": [
        {
          "label": "Header RelativePath LineNumber",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
            "body": "%NumberFile%: %Line%",
            "bodySeparator": ""
          }
        },
        {
          "label": "",
          "separator": true
        },
        {
          "label": "Header RelativePath LineNumber : Cut MinIndent",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
            "body": "%NumberFile%: %LineCutMinIndent%",
            "bodySeparator": ""
          }
        },
        {
          "label": "Header RelativePath LineNumber : Delete BlankLine",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
            "body": "%NumberFile%: %Line%%SkipBlankLine%",
            "bodySeparator": ""
          }
        },
        {
          "label": "Header RelativePath LineNumber : Cut MinIndent and Delete BlankLine",
          "format": {
            "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
            "body": "%NumberFile%: %LineCutMinIndent%%SkipBlankLine%",
            "bodySeparator": ""
          }
        }
      ]
    },
    {
      "label": "",
      "separator": true
    },
    {
      "label": "Other",
      "items": [
        {
          "label": "Delete Indent",
          "items": [
            {
              "label": "Markdown  : Delete Indent",
              "format": {
                "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
                "body": "%LineTrimFirst%",
                "bodySeparator": ":",
                "footer": "```"
              }
            },
            {
              "label": "Markdown LineNumber : Delete Indent",
              "format": {
                "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
                "body": "%NumberFile%: %LineTrimFirst%",
                "bodySeparator": ":",
                "footer": "```"
              }
            },
            {
              "label": "Header RelativePath : Delete Indent",
              "format": {
                "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
                "body": "%LineTrimFirst%",
                "bodySeparator": ""
              }
            },
            {
              "label": "Header RelativePath LineNumber : Delete Indent",
              "format": {
                "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
                "body": "%NumberFile%: %LineTrimFirst%",
                "bodySeparator": ""
              }
            }
          ]
        },
        {
          "label": "Fill Spaces EndOfLine",
          "items": [
            {
              "label": "Markdown : Fill Spaces EndOfLine",
              "format": {
                "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
                "body": "%Line%%SpacePadEnd%",
                "bodySeparator": ":",
                "footer": "```"
              }
            },
            {
              "label": "Markdown LineNumber : Fill Spaces EndOfLine",
              "format": {
                "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
                "body": "%NumberFile%: %Line%%SpacePadEnd%",
                "bodySeparator": ":",
                "footer": "```"
              }
            },
            {
              "label": "Header RelativePath : Fill Spaces EndOfLine",
              "format": {
                "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
                "body": "%Line%%SpacePadEnd%",
                "bodySeparator": ""
              }
            },
            {
              "label": "Header RelativePath LineNumber : Fill Spaces EndOfLine",
              "format": {
                "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
                "body": "%NumberFile%: %Line%%SpacePadEnd%",
                "bodySeparator": ""
              }
            }
          ]
        },
        {
          "label": "Delete Indent and Fill Spaces EndOfLine",
          "items": [
            {
              "label": "Markdown : Delete Indent and Fill Spaces EndOfLine",
              "format": {
                "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
                "body": "%LineTrimFirst%%SpacePadEnd%",
                "bodySeparator": ":",
                "footer": "```"
              }
            },
            {
              "label": "Markdown LineNumber : Delete Indent and Fill Spaces EndOfLine",
              "format": {
                "header": "```%FileExt%\n// %FolderPathRelativeProjectSlash%/\n// %FileName% : %NumberStart%-%NumberEnd%",
                "body": "%NumberFile%: %LineTrimFirst%%SpacePadEnd%",
                "bodySeparator": ":",
                "footer": "```"
              }
            },
            {
              "label": "Header RelativePath : Delete Indent and Fill Spaces EndOfLine",
              "format": {
                "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
                "body": "%LineTrimFirst%%SpacePadEnd%",
                "bodySeparator": ""
              }
            },
            {
              "label": "Header RelativePath LineNumber : Delete Indent and Fill Spaces EndOfLine",
              "format": {
                "header": "%FolderPathRelativeProjectSlash%/\n%FileName%",
                "body": "%NumberFile%: %LineTrimFirst%%SpacePadEnd%",
                "bodySeparator": ""
              }
            }
          ]
        }
      ]
    }
  ]
}
```
