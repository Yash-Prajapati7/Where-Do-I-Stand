import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export function normalizeProcessInput(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function fetchProcessData(processName) {
  const normalized = normalizeProcessInput(processName);

  if (!normalized) {
    throw new Error("Process name is required.");
  }

  const response = await api.get(`/process/${encodeURIComponent(normalized)}`);
  return response.data;
}

export async function fetchActiveProcesses() {
  const response = await api.get("/processes");
  return response.data;
}

export function buildProcessEventStreamUrl(processName) {
  const normalized = normalizeProcessInput(processName);

  if (!normalized) {
    throw new Error("Process name is required.");
  }

  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  return `${baseUrl}/process/${encodeURIComponent(normalized)}/events`;
}

export async function fetchHealthStatus() {
  const response = await api.get("/health");
  return response.data;
}

export default api;
