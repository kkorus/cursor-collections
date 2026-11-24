# Prompt Evaluation Approaches

How to compare, test and version prompts for the `tsh-engineering-prompts` skill.

## Contents

- A/B Testing Prompts
- Metric-Based Comparison
- Edge Case Testing
- Prompt Version Control

## A/B Testing Prompts

Compare prompt variants systematically:

1. **Fix one variable** — change only one aspect per test (wording, structure, examples, constraints).
2. **Use the same test set** — run both variants against identical inputs.
3. **Measure objectively** — define metrics before testing (accuracy, format compliance, latency, token usage).
4. **Sample size** — test against 20+ diverse inputs minimum; edge cases must be represented.
5. **Compare per model** — a prompt tuned for one model, or one model class (reasoning or non-reasoning), can regress on another. Re-run the test set when the model or its version changes.

## Metric-Based Comparison

| Metric | How to Measure | When It Matters |
|--------|---------------|-----------------|
| Format compliance | Parse output against schema; count failures | Structured output tasks |
| Factual accuracy | Compare against ground truth dataset | RAG, Q&A, extraction |
| Consistency | Run same input 5x; measure variance | Any production prompt |
| Token efficiency | Compare input + output token counts (including reasoning tokens) | Cost-sensitive applications |
| Latency | Measure end-to-end response time | Real-time applications |
| Hallucination rate | Check claims against source documents | RAG, knowledge-grounded tasks |

## Edge Case Testing

Always test prompts against adversarial and boundary inputs:

- Empty input
- Extremely long input (near context window limit)
- Input in unexpected language
- Input containing delimiter characters used in the prompt
- Prompt injection attempts ("ignore previous instructions and..."), both in user input and in retrieved documents or tool results
- Ambiguous inputs with multiple valid interpretations
- Input with special characters, Unicode, or code snippets

## Prompt Version Control

- Store prompts as named, versioned constants or files — never inline strings scattered through code.
- Tag prompt versions when deploying to production.
- Log which prompt version (and model version) generated each response for debugging.
- Maintain a changelog when modifying production prompts.
