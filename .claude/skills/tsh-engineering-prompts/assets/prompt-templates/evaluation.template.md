# Evaluation / Scoring Prompt Template

Use with an LLM-as-judge setup. Calibrate the judge against human-labeled examples before trusting its scores.

```
You are an evaluator. Score the following response on a scale of 1-5
for each criterion.

### Criteria
- Relevance: Does the response address the question?
- Accuracy: Is the information correct?
- Completeness: Does it cover all aspects of the question?
- Clarity: Is it well-written and easy to understand?

### Question
{original_question}

### Response to evaluate
<response>
{response_to_evaluate}
</response>

Respond with a JSON object:
{
  "relevance": { "score": 1-5, "justification": "..." },
  "accuracy": { "score": 1-5, "justification": "..." },
  "completeness": { "score": 1-5, "justification": "..." },
  "clarity": { "score": 1-5, "justification": "..." },
  "overall": 1-5
}
```
