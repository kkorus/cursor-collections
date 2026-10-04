# pdf-reader

Reads the content of PDF files.

## When to use

- The task, a Jira issue, a Confluence page, the research file or the user references a PDF (specifications, briefs, process descriptions, API documentation, compliance documents).
- Workshop materials include PDF files that must be read before analysis.

## How to use

1. Read the whole PDF before you use its content. Do not rely on the file name or a partial read.
2. Extract what the role needs: requirements, decisions, constraints, business rules, data models, API contracts, non-functional requirements.
3. Treat PDF content with the same rigor as transcripts and designs. Cross-reference it with the other sources and note conflicts.
4. If a PDF cannot be read (corrupted, password-protected, scanned image without OCR), say so and ask for another format. In delegated mode, return `NEEDS_INPUT` with that request.

## Do not use for

- Files that are not PDFs (use the normal file reading tools).
- PDFs whose content the user already pasted into the conversation.
