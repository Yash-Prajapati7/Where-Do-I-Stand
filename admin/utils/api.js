import axios from "axios";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

export async function fetchAdminProcesses() {
  const response = await api.get("/admin/processes");
  return response.data;
}

export async function createAdminProcess(payload) {
  const response = await api.post("/admin/processes", payload);
  return response.data;
}

export async function fetchAdminProcess(processId) {
  const response = await api.get(`/admin/processes/${processId}`);
  return response.data;
}

export async function uploadStudentsFile(processId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/admin/processes/${processId}/students/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function addProcessRound(processId, payload) {
  const response = await api.post(`/admin/processes/${processId}/rounds`, payload);
  return response.data;
}

export async function updateProcessRound(processId, roundId, payload) {
  const response = await api.patch(
    `/admin/processes/${processId}/rounds/${roundId}`,
    payload
  );
  return response.data;
}

export async function removeProcessRound(processId, roundId) {
  const response = await api.delete(`/admin/processes/${processId}/rounds/${roundId}`);
  return response.data;
}

export async function fetchProcessStudents(processId) {
  const response = await api.get(`/admin/processes/${processId}/students`);
  return response.data;
}

export async function updateStudentRoundResult(processId, studentId, roundId, payload) {
  const response = await api.patch(
    `/admin/processes/${processId}/students/${studentId}/rounds/${roundId}`,
    payload
  );

  return response.data;
}

export async function updateAdminProcessMetadata(processId, payload) {
  const response = await api.patch(`/admin/processes/${processId}`, payload);
  return response.data;
}

export async function deleteAdminProcess(processId) {
  const response = await api.delete(`/admin/processes/${processId}`);
  return response.data;
}

export async function deleteStudentFromProcess(processId, sapId) {
  const response = await api.delete(`/admin/processes/${processId}/students/${sapId}`);
  return response.data;
}

export async function bulkUpdateStudentRoundResults(processId, roundId, payload) {
  const response = await api.patch(
    `/admin/processes/${processId}/rounds/${roundId}/bulk-update`,
    payload
  );
  return response.data;
}

export default api;
