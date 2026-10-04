# Classification / Extraction Prompt Template

Prefer the provider's structured output mode (JSON schema or a forced tool call) to enforce the response shape. The JSON description below is the fallback for APIs without it.

```
Classify the following text into exactly one of these categories:
{categories}

Text to classify:
<text>
{input_text}
</text>

Respond with a JSON object:
{
  "category": "selected_category",
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence explaining why"
}
```
