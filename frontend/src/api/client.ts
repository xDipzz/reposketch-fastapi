import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
  const { data } = await apiClient.post("/analyze/repo-load", { repo_url: repoUrl });
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
  const { data } = await apiClient.post("/analyze/index", {
    repo_id: repoId,
    force_reindex: true
  });
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
