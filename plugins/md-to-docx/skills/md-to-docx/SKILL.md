---
name: md-to-docx
description: Convert Markdown files to Word (.docx) documents. Use when user says "convert to Word", "make a docx", "export as Word", "markdown to Word", "md to docx", or asks to create a Word document from a markdown file.
version: 1.0.0
---

# Markdown to Word Converter

Convert `.md` files to `.docx` using pandoc.

## Prerequisites

Pandoc must be installed: `sudo apt-get install -y pandoc`

## Usage

```bash
pandoc input.md -o output.docx
```

The output file is placed in the same directory as the input by default. Name it to match the input file unless the user specifies otherwise.

## Workflow

1. User provides the path to a `.md` file (or asks you to find one)
2. Determine output path — same directory, same base name, `.docx` extension
3. Run pandoc to convert
4. Confirm the output file exists and report its path

## Examples

```bash
# Basic conversion
pandoc /home/obsidian/automation-vault/report.md -o /home/obsidian/automation-vault/report.docx

# With a title in the document metadata
pandoc /path/to/file.md --metadata title="My Document" -o /path/to/file.docx

# Standalone (includes full document structure)
pandoc -s /path/to/file.md -o /path/to/file.docx
```

## Options

- Use `-s` (standalone) for a complete document with proper headers — recommended for most conversions
- Use `--metadata title="..."` if the markdown lacks a YAML frontmatter title
- Use `--reference-doc=template.docx` if the user has a custom Word template
- Use `--toc` to include a table of contents

## Notes

- Pandoc handles frontmatter YAML metadata (title, author, date) automatically
- Images with relative paths will be embedded if they exist at the referenced location
- Tables, code blocks, and lists convert cleanly
- If the markdown uses LaTeX math, add `--mathjax` or pandoc handles it natively for docx

## Guard Assertions

Before converting, verify:
- Input file exists: `test -f "$INPUT"` or error with "File not found"
- pandoc is available: `command -v pandoc` or error with install instructions (`sudo apt-get install -y pandoc`)
- Output directory is writable
- If output file already exists, warn the user before overwriting

After converting, verify:
- Output file exists and is non-zero bytes
- Output file is valid (not corrupted)

## Escalation & Completion

**Escalate when:** Pandoc is not installed and cannot be installed, the input file doesn't exist, or the conversion produces a zero-byte output file. Report the error and ask for guidance.

**Completion:** Report the output file path and confirm it exists with non-zero size. Note any conversion warnings from pandoc.

**Verification:** Verify the output file exists (`test -f`) and has non-zero bytes before reporting success.

## Learning

When this skill runs, append to `.learnings.jsonl`:

```json
{"timestamp": "ISO-8601", "skill": "md-to-docx", "event_type": "edge_case", "context": "YAML frontmatter leaked into docx body — needed --from=markdown+yaml_metadata_block"}
```

Track: Which markdown features cause conversion failures? (tables, LaTeX, custom syntax, images)
