# Prompt Anti-Patterns and Clarity Examples

Reference for the `tsh-engineering-prompts` skill.

## Contents

- Clarity and Specificity
- Anti-Patterns

## Clarity and Specificity

| Weak | Strong |
|------|--------|
| "Summarize this" | "Summarize this article in 3 bullet points, each under 20 words, focusing on financial impact" |
| "Extract the data" | "Extract: company_name (string), revenue (number in USD), fiscal_year (YYYY). Return as JSON." |
| "Be helpful" | "Answer the user's question using only the provided context. If the context doesn't contain the answer, say 'I don't have enough information to answer that.'" |
| "Write good code" | "Write a Python function that takes a list of integers and returns the top-k elements. Use a min-heap for O(n log k) complexity. Include type hints and a docstring." |

## Anti-Patterns

| Anti-Pattern | Why It Fails | Instead Do |
|---|---|---|
| Vague instructions ("be helpful") | Model interprets freely, inconsistent results | Specify exact behavior, constraints, and output format |
| User input in system prompt | Enables prompt injection | Keep user input in a delimited, dedicated section |
| No output format specification | Model chooses its own format, breaks parsing | Use structured outputs or an explicit schema |
| Prompt-only validation | LLM outputs are probabilistic | Parse into typed models, validate schemas |
| Prompt-only security | Injection can bypass any wording | Add least privilege, output validation, approvals |
| "Think step by step" on reasoning models | Redundant, can lower quality | State the goal; set reasoning effort via the API |
| JSON tool-call format described in the prompt | Fragile parsing, no schema enforcement | Use native tool calling |
| Hardcoded secrets in templates | Secrets leak in logs, version control | Use environment variables or secret managers |
| Mega-prompt (everything in one) | Exceeds context window, degrades quality | Split into focused sub-prompts |
| Copy-pasted examples from docs | Examples may not represent your data | Write examples from real production data |
| Testing only happy paths | Fails on edge cases in production | Include adversarial, empty, long, and multilingual inputs |
| Inline prompt strings in code | Hard to version, review, and test | Store prompts as named templates |
| Assuming the model remembers context | Stateless API calls lose prior context | Include all necessary context in each request |
| Over-engineering prompts early | Wastes effort | Start simple, measure, then optimize |
