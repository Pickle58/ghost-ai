Add a commerce domain pack so “Design an e-commerce backend” produces catalog, cart, checkout, payments, inventory, webhooks, and notifications instead of the generic Browser–Gateway–Auth–Database chain.

### Implementation

1. Domain match

Extend `ENTITY_TEMPLATES` and `buildDesignPlan` in `trigger/design-logic.ts`.

Today `/api|backend/` already matches “e-commerce backend” and only yields API Gateway plus Database. A commerce domain pack must win when the prompt matches:

`e-commerce|ecommerce|commerce|shop|storefront|checkout`

2. Commerce fallback graph

When the commerce pack matches, the keyword fallback must create these nodes with these exact labels:

- Storefront
- API Gateway
- Catalog Service
- Cart Service
- Checkout Service
- Payment Service
- Inventory Service
- Notification Service
- Webhook Worker
- Orders DB

Edges must describe flow (browse, cart, checkout, pay, reserve, webhook, notify). Do not use a single linear `request` / `data` chain.

3. Gemini hint

Add a short commerce paragraph to the Gemini prompt in `generateDesignPlanFromPrompt` so a successful model plan still includes those bounded contexts.

4. Tests

Update `trigger/design-agent.test.ts`:

- `Design an e-commerce backend` includes Catalog, Cart, Checkout, Payment, and Inventory
- existing chat-template coverage still matches Database and Message Queue
- a CI/CD prompt does not become a commerce graph

### Scope Limits

- Do not add chat or CI/CD domain packs in this unit
- Do not change spec prompt sections (Feature 32)
- Do not add new node shapes or colors
- Do not change Liveblocks mutation or presence behavior
- Do not change `/api/ai/design` access rules (Feature 30)

### Notes

- Check `context/project-overview.md` and `context/architecture-context.md` first
- Chat and CI/CD packs are later work
- Keep generated nodes on allowed shapes, palette colors, and the existing layout grid

### Check When Done

- The starter chip prompt produces a commerce-specific fallback graph
- Chat and CI/CD fallbacks do not switch to commerce
- Existing design-agent tests still pass
- TypeScript and build pass
