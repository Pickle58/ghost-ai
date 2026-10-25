Survive Gemini capacity errors in `generate-spec` without retrying validation failures or re-reading the canvas.

This is not a product feature. The LLM provider has rejected `generate-spec` as overloaded more than once on the deployed version. The AI SDK already retries three times with a short backoff. The task keeps `maxAttempts: 1` so empty specs and missing headings stay `AbortTaskRunError`.

### Implementation

1. Capacity helper

Add a testable helper used only around the Gemini `generateText` call:

- Treat 429 / 503 / 529 and overload-style messages (including an AI SDK `RetryError` that wraps them) as capacity errors
- Do not treat daily quota / free-tier exhausted errors as capacity errors; abort those immediately
- Do not treat validation, auth, or other 4xx errors as capacity errors
- Wait with Trigger `wait.for` for 20s then 45s between primary-model attempts (checkpointed, not a busy retry)
- After the primary model is still overloaded, try `gemini-3.7-flash` with the same 20s / 45s waits
- Keep `gemini-3.8-flash` as the primary model
- Log the wait, the fallback, and the model that succeeded

2. Task contract

`generate-spec` still:

- reads the Liveblocks snapshot once
- rejects oversize snapshots, missing keys, empty specs, and missing headings with `AbortTaskRunError`
- keeps `retry.maxAttempts: 1`
- uploads only after the spec passes heading checks

3. Tests

Cover the helper, not a live Gemini call:

- 503 / overloaded and a wrapping `RetryError` are capacity errors
- 400 and a generic `Error` are not
- a later primary attempt succeeds after the recorded waits
- fallback runs only after primary capacity attempts are exhausted
- a non-capacity error is thrown immediately

### Scope Limits

- Do not change design-agent (it already falls back to keyword templates)
- Do not add a new AI provider or AI Gateway
- Do not raise task-level `maxAttempts`
- Do not change spec prompt sections, persistence, or the request schema
- Do not add billing or extra rate-limit tables

### Check When Done

- Helper tests fail if waits or fallback are removed
- Existing generate-spec tests still pass
- ESLint on the touched files is clean
