# Swadesh AI Chat — Discussion Session Questions

> Prepared for a ~20-minute discussion session covering architecture, design decisions, implementation details, and potential improvements.

---

## 1. Architecture & High-Level Design (3–4 min)

1. **Can you walk us through the overall architecture of Swadesh AI Chat?**
   _Hint: Mention the monorepo (Turborepo + npm workspaces), the three apps/packages (`apps/backend`, `apps/frontend`, `packages/shared`), and how they communicate (HTTP/SSE)._

2. **Why did you choose a multi-agent architecture with a Router Agent instead of a single monolithic agent?**
   _Hint: Single-responsibility principle — Router classifies intent, sub-agents focus on domain expertise. Easier to test, extend, and debug._

3. **How does the Router Agent decide which sub-agent to delegate to?**
   _Hint: Uses `gpt-4o-mini` with `generateObject` to classify intent into `support | order | billing | unknown` with a confidence score. Falls back to the Support Agent for unknown intents._

4. **What is the role of the shared package (`@swadesh/shared`) and why is it important?**
   _Hint: Single source of truth for types — Zod schemas provide both runtime validation and TypeScript type inference (`z.infer<T>`). Prevents type drift between frontend and backend._

---

## 2. Backend Deep Dive (4–5 min)

5. **Why did you choose Hono over Express or Fastify for the backend?**
   _Hint: Hono is lightweight, supports built-in SSE via `streamSSE`, has excellent TypeScript support, and enables RPC-style type-safe client generation (exported `AppType`)._

6. **Explain your "Tools vs Agents" separation. Why are tools thin, deterministic database queries with no AI logic?**
   _Hint: Testability — tools can be unit-tested without mocking AI. Predictability — data access is auditable. Agents decide *when* to call tools, tools decide *how* to query data._

7. **How does conversation context work? How do agents maintain coherence across messages?**
   _Hint: Last 10 messages are loaded from the database and passed as `messageHistory` in `AgentContext`. Router receives the last 6 messages for intent classification._

8. **Walk us through the request lifecycle when a user sends a chat message.**
   _Hint: POST `/api/chat/messages` → Chat Controller → get/create conversation → store user message → build AgentContext → Router Agent classifies intent → delegates to sub-agent → sub-agent calls tools → streams response via SSE → stores agent message with metadata._

9. **How do you handle errors across the application?**
   _Hint: Custom `AppError` hierarchy (`NotFoundError`, `ValidationError`) with status codes. Global error-handler middleware catches all errors and returns consistent `{ error: { code, message } }` JSON. Tool errors propagate up through agents._

10. **Explain the rate-limiting implementation. Why in-memory instead of Redis?**
    _Hint: Sliding-window algorithm per IP. In-memory for simplicity (single-server demo). Trade-off: doesn't persist across restarts, doesn't work in multi-server deployments. Redis would be the production upgrade._

---

## 3. AI/LLM Integration (3–4 min)

11. **Why did you choose `gpt-4o-mini` for all agents? Would you use different models for different agents in production?**
    _Hint: Cost-effective for demos. In production, Router could use a smaller/faster model (it only classifies), while sub-agents handling complex queries might benefit from `gpt-4o` for better reasoning._

12. **How does the Vercel AI SDK's `generateText` differ from `generateObject`, and where do you use each?**
    _Hint: `generateObject` (Router) — returns a structured Zod-validated object (intent + confidence). `generateText` (Sub-agents) — generates free-form text responses with tool-calling capability._

13. **What are "max steps" in the agent configuration, and why do different agents have different values?**
    _Hint: Max steps limit the agentic loop iterations (tool call → result → reason → next call). Support has 3 (simple queries), Order and Billing have 5 (may need multiple tool calls to gather data)._

14. **How would you handle a scenario where the Router Agent misclassifies intent?**
    _Hint: Currently falls back to Support Agent for `unknown`. Improvements: add a feedback loop, log routing decisions for analysis, use confidence thresholds to ask clarifying questions when confidence is low._

---

## 4. Database & Data Modeling (2–3 min)

15. **Why did you choose Drizzle ORM over Prisma or raw SQL?**
    _Hint: Type-safe with zero code generation (unlike Prisma). Closer to SQL (more control). Better TypeScript inference. Lighter weight._

16. **How is agent metadata stored alongside messages?**
    _Hint: The `messages` table has a `metadata` JSONB column that stores routing info (agentType, intent, confidence), tool calls made, and agent reasoning. This enables debugging and transparency._

17. **Explain the database schema design. How are orders, shipments, payments, invoices, and refunds related?**
    _Hint: Orders → Shipments (one-to-many), Orders → Payments (one-to-many), Orders → Invoices (one-to-many), Payments → Refunds (one-to-many). Cascading deletes on foreign keys._

---

## 5. Frontend & Streaming (3–4 min)

18. **How does SSE (Server-Sent Events) streaming work in this application, end to end?**
    _Hint: Backend uses Hono's `streamSSE` to emit events (`message_start`, `agent_typing`, `message_complete`). Frontend reads the `ReadableStream` from `fetch`, buffers incomplete events, parses `event:` and `data:` fields, and updates React state on each complete event._

19. **Why SSE over WebSockets for this use case?**
    _Hint: SSE is simpler for server-to-client unidirectional streaming (which is all we need — user sends a request, server streams back). No connection upgrade needed, works over standard HTTP, easier through proxies/load balancers. WebSockets would be overkill._

20. **How does the `useChat` hook manage streaming state and handle edge cases?**
    _Hint: Uses `AbortController` to cancel in-flight requests when a new message is sent. Buffers partial SSE events. Handles JSON parse errors gracefully. Manages `isLoading`, `isTyping`, and `typingStatus` states for UI feedback._

21. **How does the frontend display agent reasoning and tool calls?**
    _Hint: `MessageBubble` component renders collapsible `<details>` sections showing the agent type badge, intent classification, tools called (with arguments), and the agent's reasoning. This provides transparency._

---

## 6. DevOps & Deployment (1–2 min)

22. **Explain your Docker setup. How are the three services orchestrated?**
    _Hint: `docker-compose.yml` defines three services: PostgreSQL (with health check), Backend (multi-stage build, waits for healthy DB, runs migrations + seed + server), Frontend (multi-stage build, nginx serves SPA + reverse-proxies `/api` to backend)._

23. **How does the nginx configuration support both SPA routing and API proxying?**
    _Hint: `try_files $uri /index.html` for SPA fallback. `/api/` location block proxies to `http://backend:3000`. SSE-specific headers (`proxy_buffering off`, `chunked_transfer_encoding off`) ensure streaming works._

---

## 7. Testing, Scalability & Improvements (2–3 min)

24. **How would you test this application? What's your testing strategy?**
    _Hint: Unit tests for tools (pure functions, easy to test). Integration tests for services (mock DB or use test containers). E2E tests for agent routing (mock OpenAI responses). Frontend tests with React Testing Library for components._

25. **What are the scalability bottlenecks, and how would you address them?**
    _Hint: In-memory rate limiter (→ Redis). Single-server (→ horizontal scaling with load balancer). Context window loading (→ summarization or vector search). OpenAI latency (→ caching common responses, model selection)._

26. **If you had more time, what features or improvements would you add?**
    _Hint: Authentication (JWT/OAuth), persistent user sessions, vector-based context retrieval (RAG), agent feedback/learning, conversation summarization, multi-language support, WebSocket upgrade for bidirectional chat, admin dashboard with agent analytics._

---

## Quick-Fire / Follow-Up Questions

27. **What happens if the OpenAI API is down or returns an error?**
    _Hint: Errors propagate through the agent system to the global error handler. The SSE stream emits an `error` event. The frontend displays the error to the user._

28. **Why do you store `items` as a JSONB array in the `orders` table instead of a separate `order_items` table?**
    _Hint: Simplicity for the demo — items are always fetched with the order. In production, a separate table would be better for querying/filtering individual items._

29. **How does the CORS configuration work, and what would you change for production?**
    _Hint: Currently allows `localhost:5173` and `localhost:3000`. In production, restrict to the actual domain. Consider using environment variables for origin configuration._

30. **What security considerations would you add for a production deployment?**
    _Hint: Input sanitization, authentication/authorization, HTTPS, API key rotation, rate limiting per user (not just IP), OWASP headers, SQL injection prevention (Drizzle parameterizes by default), prompt injection defenses for the AI agents._

---

## Suggested Time Allocation

| Section | Time | Questions |
|---------|------|-----------|
| Architecture & Design | 3–4 min | Q1–Q4 |
| Backend Deep Dive | 4–5 min | Q5–Q10 |
| AI/LLM Integration | 3–4 min | Q11–Q14 |
| Database & Data | 2–3 min | Q15–Q17 |
| Frontend & Streaming | 3–4 min | Q18–Q21 |
| DevOps & Deployment | 1–2 min | Q22–Q23 |
| Testing & Improvements | 2–3 min | Q24–Q26 |
| Quick-Fire (if time) | 1–2 min | Q27–Q30 |

> **Tip:** Focus on Q1–Q20 for the core 20 minutes. Q21–Q30 are great for follow-up or if the discussion moves quickly.
