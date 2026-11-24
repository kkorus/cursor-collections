# Agent Tool-Use Prompt Template

Tools are declared through the provider's native tool (function) calling API, not described in the prompt. Each tool gets a name, a precise description and a JSON Schema for its parameters; the model returns structured tool-call blocks, and your code returns results in tool-result messages. The prompt only tells the model when and how to use the tools.

## Tool definition (sent as API parameter, shown in generic form)

```json
{
  "name": "search_orders",
  "description": "Find orders for the authenticated customer. Use when the user asks about order status or history. Returns at most 10 orders, newest first.",
  "input_schema": {
    "type": "object",
    "properties": {
      "status": { "type": "string", "enum": ["open", "shipped", "delivered", "cancelled"] },
      "limit": { "type": "integer", "minimum": 1, "maximum": 10 }
    },
    "required": []
  }
}
```

The schema key name (`input_schema`, `parameters`) differs between providers; follow the provider's documentation.

## System prompt section

```
You can call the tools provided with this conversation.

- Call a tool only when it is needed to answer the request; answer directly otherwise.
- Prefer the most specific tool. Ask the user for missing required values instead of guessing them.
- Report tool errors to the user accurately; never invent a tool result.
- Call independent tools in the same turn when the API supports parallel calls.
- After receiving tool results, synthesize them into a clear answer for the user.
- Stop and ask for confirmation before any action that changes data or cannot be undone.
```
