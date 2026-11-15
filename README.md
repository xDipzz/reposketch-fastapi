# RepoSketch

RepoSketch is an AI-powered repository intelligence workspace. Paste a GitHub URL and it clones the repo, maps the architecture with Mermaid diagrams, builds a grounded retrieval index, generates an AI briefing, and answers questions with exact file references — using the **free Google Gemini API** for generation.

Live deployment:

- Frontend: <https://reposketch.vercel.app>
- API: <https://reposketch-api.onrender.com>
- Health: <https://reposketch-api.onrender.com/health>

## What it does

- Clones a public GitHub repository into a temporary workspace
- Walks the tree safely and parses Python files with `ast`
- Extracts top-level classes, functions, imports, entry-point hints, and framework signals
- Builds project-structure, file-dependency, and module-relationship graphs with `networkx`
- Renders interactive Mermaid diagrams with zoom, fit, SVG export, and source copy
- Indexes source files into a lightweight SQLite vector store
- Generates a cached senior-engineer briefing with Gemini (overview, architecture, onboarding, risks, suggested questions)
- Answers questions with Gemini using retrieved repository context only
- Shows sources, symbols, relevance scores, and retrieved chunk previews
- Keeps a recent-repository history with delete support
- Enforces a visible **100-credit daily allowance** per browser/visitor
- Ships in a metallic-black theme with light mode and a responsive layout

## Stack

**Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic, GitPython, networkx, httpx, SQLite, Google Gemini REST API

**Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS 4, Mermaid 11, react-markdown, Axios

**Design system:** components adapted from `/home/dipz/deepak/project/component` (Beautiful UI component library), including its design tokens, atoms, Context Cards, Task Rows, and Loading State.

**AI:** `gemini-3.5-flash-lite` for chat/briefing. Index embeddings use a deterministic local model by default so the app stays inside the free tier. Set `INDEX_EMBEDDING_PROVIDER=gemini` to use `gemini-embedding-001` with automatic fallback on quota errors.

## Project layout

```
backend/
  app/
    main.py                 FastAPI routes, CORS, gzip, health
    config.py               env-driven settings and limits
    prompts.py              grounded QA + JSON briefing prompts
    schemas.py              API contracts
    services/
      gemini_service.py     dependency-free Gemini REST client
      local_embeddings.py   offline deterministic embedding fallback
      vector_store.py       SQLite + float32 cosine/lexical retrieval
      indexing_service.py   chunk -> embed -> store -> retrieve
      qa_service.py         grounded answer generation
      insights_service.py   cached AI repository briefing
      repo_loader.py        clone + size/file limits
      repo_parser.py        AST parsing and repo summary
      graph_builder.py      structure/dependency/module graphs
      diagram_service.py    Mermaid generation
      analysis_store.py     JSON record history + locking
  tests/                    unittest suite
frontend/
  src/
    App.tsx                 workspace shell and state machine
    api/client.ts           typed API client
    components/
      atoms/                design-system primitives
      primitives/           ContextCards, TaskRows, LoadingState
      AppSidebar.tsx        workspace/history navigation
      TopBar.tsx            command bar + mobile nav
      BriefingWorkspace.tsx overview, AI briefing, pipeline
      ArchitectureWorkspace.tsx diagrams + notes
      AskWorkspace.tsx      grounded chat + retrieved context
      MermaidViewer.tsx     Mermaid render/zoom/export
      InsightPanel.tsx      AI briefing card
      RepoInput.tsx         hero + analysis form
render.yaml                 Render Blueprint for the API
vercel.json                 Vercel build + /api rewrite
```

## Local development

### Backend

```bash
python3.11 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
# Put your free Gemini key in backend/.env:
# GEMINI_API_KEY=...
PYTHONPATH=backend backend/.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Get a free key at <https://aistudio.google.com/apikey>. No billing account is required for the free tier.

Test it:

```bash
curl http://localhost:8000/health
PYTHONPATH=backend backend/.venv/bin/python -m unittest discover -s backend/tests -v
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# http://localhost:5173
```

Build check:

```bash
cd frontend
npm run typecheck
npm run build
```

## Environment variables

### Backend

| Variable | Default | Notes |
|---|---|---|
| `APP_ENV` | `development` | Set to `production` on Render |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS origin for the deployed frontend |
| `EXTRA_FRONTEND_ORIGINS` | empty | Comma-separated extra origins |
| `REPO_STORAGE_DIR` | `backend/storage/repos` | Cloned repositories |
| `ANALYSIS_STORAGE_DIR` | `backend/storage/analysis` | Analysis JSON + history |
| `VECTOR_STORE_DIR` | `backend/storage/vectors` | SQLite vector store |
| `MAX_REPO_FILES` | `4000` | Reject larger repos |
| `MAX_REPO_SIZE_MB` | `400` | Reject larger clones |
| `MAX_INDEX_CHUNKS` | `1200` | Retrieval index cap |
| `INDEX_EMBEDDING_PROVIDER` | `local` | `local` (free/reliable) or `gemini` |
| `GEMINI_API_KEY` | empty | Required for briefing + Q&A |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Free-tier chat model |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Used only when provider is `gemini` |
| `GEMINI_EMBEDDING_DIMENSIONS` | `768` | Local fallback uses the same dimensions |

### Frontend

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` when deployed | Local dev falls back to `http://localhost:8000` |

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Status, version, AI config, vector store |
| `GET` | `/usage` | Daily credit balance, reset time, and action costs |
| `GET` | `/analyze/repositories` | Recent repository history |
| `POST` | `/analyze/repo-load` | Clone + parse a repository |
| `GET` | `/analyze/summary?repo_id=` | Stored summary |
| `GET` | `/analyze/diagrams?repo_id=` | Stored Mermaid diagrams |
| `POST` | `/analyze/index` | Build the retrieval index |
| `GET` | `/analyze/insights?repo_id=` | Cached AI briefing |
| `POST` | `/analyze/insights` | Generate/regenerate AI briefing |
| `POST` | `/ask` | Grounded repository question |
| `DELETE` | `/analyze/repository/{repo_id}` | Delete record, clone, and index |

Example:

```bash
curl -X POST https://reposketch-api.onrender.com/analyze/repo-load \
  -H 'Content-Type: application/json' \
  -d '{"repo_url":"https://github.com/pallets/click"}'

curl -X POST https://reposketch-api.onrender.com/analyze/index \
  -H 'Content-Type: application/json' \
  -d '{"repo_id":"pallets-click","force_reindex":true}'

curl -X POST https://reposketch-api.onrender.com/ask \
  -H 'Content-Type: application/json' \
  -d '{"repo_id":"pallets-click","question":"Where is the CLI entry point?","top_k":6}'
```

## Deployment

### Render (API)

The API is a Render Blueprint defined in `render.yaml`:

- Python 3.11
- Free web service, 512 MB RAM
- Build: `pip install --upgrade pip && pip install -r backend/requirements.txt`
- Start: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
- Health check: `/health`
- Storage under `/tmp/reposketch/*` (ephemeral on the free plan)

Set these in the Render dashboard (they are `sync: false` in the Blueprint):

- `GEMINI_API_KEY`
- `FRONTEND_ORIGIN` — e.g. `https://reposketch.vercel.app`

Free Render services spin down after 15 minutes without traffic, so the first request can take about a minute. Clones, records, and indexes in `/tmp` are lost on restart. The UI handles this by showing recent records only while the instance is alive; re-analyze after a cold start.

### Vercel (frontend)

`vercel.json` builds `frontend/dist` and proxies `/api/*` to Render:

```bash
cd /home/dipz/deepak/project/reposketch-fastapi
npx vercel@latest link --scope dipzs-projects --project reposketch --yes
npx vercel@latest deploy --prod --scope dipzs-projects --yes
```

Or simply push to `main` if the Git integration is connected.

## Verification

```bash
# Backend
cd /home/dipz/deepak/project/reposketch-fastapi
python3 -m compileall -q backend/app
PYTHONPATH=backend backend/.venv/bin/python -m unittest discover -s backend/tests -v

# Frontend
cd frontend
npm run typecheck
npm run build

# Live
curl https://reposketch-api.onrender.com/health
curl https://reposketch.vercel.app/api/health
```

## Daily credits

Every browser gets **100 credits per UTC day**. The frontend generates an anonymous
workspace ID and sends it as `X-Client-ID`; the backend also applies a separate
IP-level backstop (`IP_DAILY_CREDIT_LIMIT`, default 300) so clearing browser
storage is not a free reset.

| Action | Cost |
|---|---:|
| Analyze repository | 10 |
| Build retrieval index | 20 |
| Generate AI briefing | 5 |
| Ask a repository question | 2 |

A normal first run costs 35 credits and leaves 65 for questions. Failed charged
actions are refunded. The sidebar and top bar show the remaining balance and
reset time. The daily ledger lives in `backend/storage/analysis/usage.sqlite3`
(or the configured analysis directory).

## Notes and limits

- Only public GitHub URLs are accepted.
- The credit ledger is local SQLite. Render free instances wipe `/tmp` on restart,
  so a free deployment also resets usage on restart; add durable storage if the
  limit must survive restarts.
- Repos are capped at 4000 files / 400 MB.
- `CHANGES.md`, changelogs, licenses, tests, docs, examples, and build folders are excluded from the retrieval index by default to keep answers focused on source code.
- The API is a demo deployment: add authentication/rate limiting before exposing it to untrusted traffic.
- Free tier filesystem is ephemeral; use a paid Render disk or external storage for durable history.
