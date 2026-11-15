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
      if (!runningLocally && isLoopbackBaseUrl(configuredBaseUrl)) {
        return "/api";
      }
      return configuredBaseUrl;
    }

    if (runningLocally) {
      return "http://localhost:8000";
    }
  }

  return configuredBaseUrl || "/api";
}

const apiBaseUrl = resolveApiBaseUrl();
const REPOSITORY_LOAD_TIMEOUT_MS = 180_000;
const REPOSITORY_INDEX_TIMEOUT_MS = 300_000;
const INSIGHTS_TIMEOUT_MS = 120_000;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60_000
});

const CLIENT_ID_KEY = "reposketch-client-id";

function getClientId() {
  if (typeof window === "undefined") return "server";
  const stored = localStorage.getItem(CLIENT_ID_KEY);
  if (stored) return stored;
  const generated =
    globalThis.crypto?.randomUUID?.() ??
    `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
}

apiClient.defaults.headers.common["X-Client-ID"] = getClientId();

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
    loaded_at: string;
    detected_framework: string | null;
    file_count: number;
    indexed_file_count: number;
    total_classes: number;
    total_functions: number;
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
  embedding_provider: string;
  embedding_model: string;
  warnings: string[];
};

export type AskResponse = {
  repo_id: string;
  repo_name: string;
  question: string;
  answer: string;
  sources: Array<{ file_path: string; symbol_names: string[] }>;
  retrieved_chunks: Array<{
    file_path: string;
    chunk_index: number;
    preview: string;
    symbol_names: string[];
    score?: number | null;
  }>;
  provider: string;
};

export type RepoInsights = {
  overview: string;
  architecture: string;
  onboarding: string;
  entry_points: string[];
  risks: string[];
  suggested_questions: string[];
  generated_at: string | null;
  model: string;
};

export type InsightsResponse = {
  repo_id: string;
  repo_name: string;
  insights: RepoInsights;
};

export type RepoHistoryItem = {
  repo_id: string;
  repo_name: string;
  repo_url: string;
  loaded_at: string;
  detected_framework: string | null;
  file_count: number;
  indexed_file_count: number;
  indexed_chunks: number;
  has_insights: boolean;
  embedding_provider: string | null;
};

export type Health = {
  status: string;
  app_name: string;
  environment: string;
  version: string;
  ai_configured: boolean;
  ai_model: string;
  embedding_model: string;
  embedding_provider: string;
  vector_store: string;
  uptime_seconds: number;
};

export type UsageAction = {
  action: string;
  label: string;
  cost: number;
};

export type Usage = {
  limit: number;
  used: number;
  remaining: number;
  reset_at: string;
  costs: UsageAction[];
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
    { repo_id: repoId, force_reindex: true },
    { timeout: REPOSITORY_INDEX_TIMEOUT_MS }
  );
  return data as IndexResponse;
}

export async function fetchCachedInsights(repoId: string) {
  const { data } = await apiClient.get("/analyze/insights", {
    params: { repo_id: repoId }
  });
  return (data as InsightsResponse).insights;
}

export async function fetchInsights(repoId: string, forceRegenerate = false) {
  const { data } = await apiClient.post(
    "/analyze/insights",
    { repo_id: repoId, force_regenerate: forceRegenerate },
    { timeout: INSIGHTS_TIMEOUT_MS }
  );
  return data as InsightsResponse;
}

export async function fetchRepositories() {
  const { data } = await apiClient.get("/analyze/repositories");
  return data.repositories as RepoHistoryItem[];
}

export async function fetchHealth() {
  const { data } = await apiClient.get("/health");
  return data as Health;
}

export async function fetchUsage() {
  const { data } = await apiClient.get("/usage");
  return data as Usage;
}

export async function deleteRepository(repoId: string) {
  const { data } = await apiClient.delete(`/analyze/repository/${repoId}`);
  return data as { status: string; repo_id: string };
}

export async function askRepository(repoId: string | null, question: string) {
  const { data } = await apiClient.post(
    "/ask",
    { repo_id: repoId, question, top_k: 6 },
    { timeout: 120_000 }
  );
  return data as AskResponse;
}

export function extractApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return sanitizeProvider(detail);
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (typeof item?.msg === "string" ? item.msg : JSON.stringify(item)))
        .join("; ");
    }
    if (error.code === "ECONNABORTED") {
      return "The request timed out. The backend may still be waking up — try again.";
    }
    return sanitizeProvider(error.message);
  }
  return "Something went wrong while talking to the backend.";
}

function sanitizeProvider(message: string) {
  return message
    .replaceAll("GEMINI_API_KEY", "AI provider key")
    .replaceAll("GEMINI", "AI provider")
    .replaceAll("Gemini", "AI service")
    .replaceAll("gemini", "AI service")
    .replaceAll("OpenAI", "AI provider")
    .replaceAll("OPENAI_API_KEY", "AI provider key");
}
