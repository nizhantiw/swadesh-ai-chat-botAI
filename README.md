# Swadesh AI Chat — Multi-Agent Customer Support System

An AI-powered customer support system with a multi-agent architecture. A **Router Agent** analyzes incoming queries and delegates to specialized sub-agents (Support, Order, Billing), each with access to relevant tools that query real data.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│              Chat UI + Streaming + SSE               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼──────────────────────────────┐
│                  Hono Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │Controller│→ │ Service  │→ │    Database      │   │
│  │  Layer   │  │  Layer   │  │  (PostgreSQL)    │   │
│  └────┬─────┘  └──────────┘  └─────────────────┘   │
│       │                                              │
│  ┌────▼──────────────────────────────────────────┐  │
│  │              Agent System                      │  │
│  │  ┌──────────────┐                             │  │
│  │  │ Router Agent │ ← Classifies intent         │  │
│  │  └──────┬───────┘                             │  │
│  │    ┌────┼────────────┐                        │  │
│  │    ▼    ▼            ▼                        │  │
│  │ Support  Order    Billing                     │  │
│  │  Agent   Agent     Agent                      │  │
│  │    │       │         │                        │  │
│  │    ▼       ▼         ▼                        │  │
│  │  Tools   Tools     Tools    ← Pure DB queries │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer     | Technology                |
|-----------|--------------------------|
| Frontend  | React 19 + Vite + Tailwind CSS v4 |
| Backend   | Hono.dev (Node.js)       |
| Database  | PostgreSQL + Drizzle ORM |
| AI        | Vercel AI SDK + OpenAI   |
| Monorepo  | Turborepo + npm workspaces |

## Project Structure

```
swadesh-ai-chat/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── agents/          # Router + 3 sub-agents
│   │   │   │   ├── base.agent.ts
│   │   │   │   ├── router.agent.ts
│   │   │   │   ├── support.agent.ts
│   │   │   │   ├── order.agent.ts
│   │   │   │   └── billing.agent.ts
│   │   │   ├── controllers/     # Request handlers
│   │   │   │   ├── chat.controller.ts
│   │   │   │   └── agent.controller.ts
│   │   │   ├── services/        # Business logic + data access
│   │   │   │   ├── conversation.service.ts
│   │   │   │   ├── agent.service.ts
│   │   │   │   ├── order.service.ts
│   │   │   │   └── billing.service.ts
│   │   │   ├── tools/           # Deterministic DB query functions
│   │   │   ├── middleware/      # Error handling, logging, rate limiting
│   │   │   ├── routes/          # API route definitions
│   │   │   ├── db/              # Schema, connection, seed data
│   │   │   └── index.ts         # App entry point
│   │   └── drizzle.config.ts
│   └── frontend/
│       └── src/
│           ├── components/      # Chat UI components
│           ├── hooks/           # useChat custom hook
│           └── lib/             # API client
├── packages/
│   └── shared/                  # Shared types (Zod schemas)
├── turbo.json
└── package.json
```

## Setup Instructions

### Option A: Docker (Recommended)

The fastest way to run everything — one command spins up PostgreSQL, backend, and frontend.

**Prerequisites:** Docker & Docker Compose installed.

```bash
# 1. Clone
git clone <repo-url>
cd swadesh-ai-chat

# 2. Set your OpenAI key
export OPENAI_API_KEY=sk-your-key-here

# 3. Run everything
docker compose up --build
```

| Service    | URL                       |
|------------|---------------------------|
| Frontend   | http://localhost:8080      |
| Backend    | http://localhost:3000      |
| PostgreSQL | localhost:5432             |

On first start, the backend container automatically runs `drizzle-kit push` (schema migration) and seeds the database.

To stop: `docker compose down` (add `-v` to also wipe the database volume).

---

### Option B: Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- OpenAI API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd swadesh-ai-chat
npm install
```

### 2. Database Setup

```bash
# Create the database
createdb swadesh_ai_chat

# Or with Docker:
docker run -d --name swadesh-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=swadesh_ai_chat \
  -p 5432:5432 postgres:16
```

### 3. Environment Variables

```bash
# Copy and edit the .env file
cp apps/backend/.env.example apps/backend/.env
# Edit: set your OPENAI_API_KEY
```

### 4. Push Schema & Seed Data

```bash
cd apps/backend
npx drizzle-kit push
npm run db:seed
```

### 5. Run Development Servers

```bash
# From root — runs both backend and frontend
npm run dev
```

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **Health**: http://localhost:3000/api/health

## API Endpoints

| Method | Path                              | Description             |
|--------|-----------------------------------|-------------------------|
| POST   | `/api/chat/messages`              | Send message (SSE stream) |
| GET    | `/api/chat/conversations/:id`     | Get conversation history |
| GET    | `/api/chat/conversations`         | List user conversations |
| DELETE | `/api/chat/conversations/:id`     | Delete conversation     |
| GET    | `/api/agents`                     | List available agents   |
| GET    | `/api/agents/:type/capabilities`  | Get agent capabilities  |
| GET    | `/api/health`                     | Health check            |

## Design Decisions

### Why Router Agent?
The Router Agent acts as a single entry point that classifies intent before delegating. This keeps sub-agents focused on their domain and prevents them from doing classification work. It also enables clean logging of routing decisions.

### Why are Tools Separate from Agents?
Tools are thin, deterministic database query functions with **no AI logic**. This separation means:
- Tools are testable independently
- Agents decide *when* to call tools, not *how* they work
- Data access is predictable and auditable

### How Context is Stored
Each conversation stores messages in the database. When processing a new message, the last 10 messages are loaded and passed to the agent as conversation history. Agent metadata (reasoning, tool calls, routing decisions) is persisted as JSON alongside each message.

### How Routing Works
1. User sends message → Chat Controller
2. Controller builds context from last N messages
3. Router Agent uses `gpt-4o-mini` + `generateObject` to classify intent → `{support, order, billing, unknown}`
4. Router delegates to appropriate sub-agent
5. Sub-agent uses its tools to query real data and generates response
6. Response streams back via SSE

### Error Handling Strategy
- **AppError hierarchy**: `AppError` → `NotFoundError`, `ValidationError` (typed, with status codes)
- **Global middleware**: catches all errors and returns consistent JSON `{error: {code, message}}`
- **Rate limiting**: in-memory sliding window per IP
- **Tool errors**: propagate up through agents to the error middleware

## Bonus Features

- [x] **Hono RPC + Turborepo monorepo** (+30 points) — End-to-end type safety
- [x] **Streaming responses** — SSE from backend
- [x] **Rate limiting** — In-memory sliding window
- [x] **AI reasoning display** — Expandable reasoning section in chat UI
- [x] **Typing indicator** — "Agent is typing..." with animated dots

## Seed Data

The database is seeded with:
- **3 users** (Alice, Bob, Carol)
- **10 orders** with various statuses
- **6 shipments** with tracking info
- **10 payments**
- **5 invoices**
- **3 refunds** (completed, processing, requested)
- **2 existing conversations** with message history
