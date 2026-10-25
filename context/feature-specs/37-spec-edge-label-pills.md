Require a short label on every AI-generated edge so the canvas always renders inline pill badges.

### Implementation

1. Gemini prompt

Extract `buildDesignPrompt` from `generateDesignPlanFromPrompt`. Instruct the model to give every `add-edge` a short protocol or flow name such as `HTTP`, `Read/Write`, `Publish Event`, `Product API`, or `browse`. Never leave an edge unlabeled.

2. Normalize and apply

`normalizeDesignPlan` and `applyDesignOperations` must write a non-empty `data.label`. If Gemini omits the label or sends only whitespace, infer one from the destination node:

- database / store / lake / archive → `Read/Write`
- queue / broker / event / pubsub → `Publish Event`
- cache → `cache`
- otherwise → `HTTP`

Keep an explicit label when one is present.

3. Keyword fallback

Generic fallback edges use those destination labels instead of `request` / `data`. Commerce flow labels (`browse`, `cart`, `checkout`, `pay`, and the rest) stay as they are.

4. Tests

Update `trigger/design-agent.test.ts`:

- every fallback `add-edge` has a non-empty label
- the chat template edge is `Publish Event`, not `request`
- a browser / gateway / auth / database chain includes `HTTP` and `Read/Write`
- a blank Gemini `add-edge` label becomes `Read/Write` when the target is a database
- applying an unlabeled edge to a queue writes `Publish Event` onto `data.label`
- `buildDesignPrompt` requires “Never leave an edge unlabeled” and names `HTTP`, `Read/Write`, and `Publish Event`

### Scope Limits

- Do not change the edge renderer or how users edit labels
- Do not add chat or CI/CD domain packs
- Do not change Liveblocks mutation or presence behavior
- Do not change `/api/ai/design` access rules

### Check When Done

- Unlabeled AI edges still produce canvas pills
- Commerce edges keep their flow names
- Design-agent tests pass
- ESLint on the touched files is clean
