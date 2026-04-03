import axios from "axios";

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLoopbackBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return isLoopbackHost(url.hostname);
  } catch {
    return false;
  }
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const runningLocally = isLoopbackHost(hostname);

    if (configuredBaseUrl) {
      // Ignore loopback-only URLs in deployed environments.
      if (!runningLocally && isLoopbackBaseUrl(configuredBaseUrl)) {
        return "/api";
      }
      return configuredBaseUrl;
    }

    if (runningLocally) {
      return "http://localhost:8000";
    }
  }

  // Use Vercel's same-origin rewrite in deployed environments.
  return configuredBaseUrl || "/api";
}

const apiBaseUrl = resolveApiBaseUrl();
const REPOSITORY_LOAD_TIMEOUT_MS = 120_000;
const REPOSITORY_INDEX_TIMEOUT_MS = 300_000;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000
});

export type Diagram = {
  id: string;
  title: string;
  description: string;
  mermaid: string;
};

export type DiagramResponse = {
  repo_id: string;
  repo_name: string;
  diagrams: Diagram[];
};

export type Summary = {
  repo_id: string;
  repo_name: string;
  repo_url: string;
  detected_framework: string | null;
  loaded_at: string;
  file_count: number;
  indexed_file_count: number;
  total_classes: number;
  total_functions: number;
  top_level_folders: string[];
  important_files: string[];
  entry_points: string[];
  major_modules: string[];
  languages: Record<string, number>;
};

export type RepoLoadResponse = {
  metadata: {
    repo_id: string;
    repo_name: string;
    repo_url: string;
    warnings: string[];
  };
  summary: Summary;
  diagrams: Diagram[];
  warnings: string[];
};

export type IndexResponse = {
  repo_id: string;
  repo_name: string;
  collection_name: string;
  indexed_files: number;
  indexed_chunks: number;
  status: string;
  indexed_at: string;
};

export type AskResponse = {
  repo_id: string;
  repo_name: string;
  answer: string;
  sources: Array<{ file_path: string; symbol_names: string[] }>;
  retrieved_chunks: Array<{
    file_path: string;
    chunk_index: number;
    preview: string;
    symbol_names: string[];
    score?: number | null;
  }>;
};

export async function loadRepository(repoUrl: string) {
  const { data } = await apiClient.post(
    "/analyze/repo-load",
    { repo_url: repoUrl },
    { timeout: REPOSITORY_LOAD_TIMEOUT_MS }
  );
  return data as RepoLoadResponse;
}

export async function fetchSummary(repoId: string) {
  const { data } = await apiClient.get("/analyze/summary", {
    params: { repo_id: repoId }
  });
  return data as Summary;
}

export async function fetchDiagrams(repoId: string) {
  const { data } = await apiClient.get("/analyze/diagrams", {
    params: { repo_id: repoId }
  });
  return data as DiagramResponse;
}

export async function indexRepository(repoId: string) {
  const { data } = await apiClient.post(
    "/analyze/index",
    {
      repo_id: repoId,
      force_reindex: true
    },
    { timeout: REPOSITORY_INDEX_TIMEOUT_MS }
  );
  return data as IndexResponse;
}

export async function askRepository(repoId: string | null, question: string) {
  const { data } = await apiClient.post("/ask", {
    repo_id: repoId,
    question,
    top_k: 6
  });
  return data as AskResponse;
}

export function extractApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    return error.message;
  }
  return "Something went wrong while talking to the backend.";
}
