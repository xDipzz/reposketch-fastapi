# RepoSketch

RepoSketch is an AI-powered repository understanding tool for Python-first codebases. Paste a GitHub repository URL and the app will clone it, inspect its structure, generate Mermaid diagrams, index the codebase into Chroma, and answer grounded questions with source file references.

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

## Current Status

The scaffold is in place with placeholder routes and UI panels. The next phases wire live repository cloning, AST parsing, graph generation, Chroma indexing, and grounded Q&A.
