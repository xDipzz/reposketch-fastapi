# RepoSketch

RepoSketch is an AI-powered repository understanding tool for Python-first codebases. Paste a GitHub repository URL and the app will clone it, inspect its structure, generate Mermaid diagrams, index the codebase into Chroma, and answer grounded questions with source file references.

## What It Does

- Clones a GitHub repository into local storage
- Walks the repo safely while ignoring noisy build and cache directories
- Parses Python files with `ast` to extract classes, functions, imports, and entry-point hints
- Builds structure and dependency graphs with `networkx`
- Renders repository diagrams with Mermaid
- Indexes repository code and docs into Chroma with OpenAI embeddings
- Answers repository questions from retrieved context only, with file references and retrieved chunk previews

## Stack

- Backend: Python 3.11, FastAPI, Uvicorn, Pydantic, python-dotenv, GitPython, networkx, LangChain, langchain-openai, langchain-community, chromadb
- Frontend: React, Vite, TypeScript, Tailwind CSS, Axios, Mermaid.js, react-markdown
- OpenAI models: `gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings

## Project Layout

- `backend/` contains the FastAPI API, repository analysis services, and vector storage configuration.
- `frontend/` contains the Vite React app for repository input, diagrams, summary views, and repo Q&A.

## Backend Setup

1. Create a Python 3.11 virtual environment.
2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Copy the example environment file and fill in values as needed:

```bash
cp .env.example .env
```

`OPENAI_API_KEY` must be present in `backend/.env` before using `POST /analyze/index` or `POST /ask`.

4. Run the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Start the frontend:

```bash
npm run dev
```

## Key API Endpoints

### `POST /analyze/repo-load`

Request:

```json
{
  "repo_url": "https://github.com/pallets/click"
}
```

Response excerpt:

```json
{
  "summary": {
    "repo_id": "pallets-click",
    "repo_name": "click",
    "detected_framework": "Click",
    "file_count": 107
  },
  "diagrams": [
    {
      "id": "project-structure",
      "title": "Project structure"
    }
  ]
}
```

### `POST /analyze/index`

Request:

```json
{
  "repo_id": "pallets-click",
  "force_reindex": true
}
```

Response excerpt:

```json
{
  "repo_id": "pallets-click",
  "collection_name": "reposketch_pallets_click",
  "indexed_files": 42,
  "indexed_chunks": 183,
  "status": "indexed"
}
```

### `POST /ask`

Request:

```json
{
  "repo_id": "pallets-click",
  "question": "Where is the CLI entry point?",
  "top_k": 6
}
```

Response excerpt:

```json
{
  "answer": "The CLI entry point is defined ...",
  "sources": [
    {
      "file_path": "src/click/core.py",
      "symbol_names": ["Command", "Group"]
    }
  ],
  "retrieved_chunks": [
    {
      "file_path": "src/click/core.py",
      "chunk_index": 2,
      "preview": "class Command: ..."
    }
  ]
}
```

## Verification

Backend checks:

```bash
.venv/bin/python -m compileall backend/app
PYTHONPATH=backend .venv/bin/python - <<'PY'
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
print(client.get("/health").json())
PY
```

Frontend check:

```bash
cd frontend
npm run build
```
