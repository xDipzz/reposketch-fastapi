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
  return data as { summary: Summary; diagrams: Diagram[]; metadata: { warnings: string[] } };
}

export async function askRepository(repoId: string | null, question: string) {
  const { data } = await apiClient.post("/ask", {
    repo_id: repoId,
    question
  });
  return data as AskResponse;
}
