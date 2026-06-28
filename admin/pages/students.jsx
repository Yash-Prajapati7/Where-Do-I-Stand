import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { Search, Trash2, AlertTriangle, FileSpreadsheet, UserCheck } from "lucide-react";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  fetchAdminProcess,
  uploadStudentsFile,
  fetchProcessStudents,
  deleteStudentFromProcess,
} from "@/utils/api";

export default function StudentsStepPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { selectedProcessId } = useSelectedProcessId();
  const [uploadFile, setUploadFile] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Auto-clear feedback messages after 5 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const processDetailQuery = useQuery({
    queryKey: ["admin-process-detail", selectedProcessId],
    queryFn: () => fetchAdminProcess(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const processDetail = processDetailQuery.data?.process || null;

  const processStudentsQuery = useQuery({
    queryKey: ["admin-process-students", selectedProcessId],
    queryFn: () => fetchProcessStudents(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const studentsList = processStudentsQuery.data?.students || [];

  const uploadStudentsMutation = useMutation({
    mutationFn: ({ id, file }) => uploadStudentsFile(id, file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-process-detail", selectedProcessId] });
      queryClient.invalidateQueries({ queryKey: ["admin-process-students", selectedProcessId] });
      setUploadFile(null);
      
      const stats = response?.stats;
      const countMsg = stats 
        ? `Imported ${stats.validRows} valid rows (inserted ${stats.inserted}, updated ${stats.updated}).`
        : "Students imported successfully!";
      setFeedbackMessage({ type: "success", text: countMsg });
    },
    onError: (err) => {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.message || err.message,
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: ({ id, sapId }) => deleteStudentFromProcess(id, sapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-students", selectedProcessId] });
      queryClient.invalidateQueries({ queryKey: ["admin-process-detail", selectedProcessId] });
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      setFeedbackMessage({ type: "success", text: "Candidate deleted successfully." });
    },
    onError: (err) => {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.message || err.message,
      });
    },
  });

  function onUploadStudents(event) {
    event.preventDefault();
    if (!selectedProcessId || !uploadFile) return;
    uploadStudentsMutation.mutate({
      id: selectedProcessId,
      file: uploadFile,
    });
  }

  function onDeleteStudent(sapId, fullName) {
    if (!selectedProcessId) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Candidate Data",
      message: `Are you sure you want to remove ${fullName} (SAP ID: ${sapId}) and all their evaluation progress from this process?`,
      onConfirm: () => {
        deleteStudentMutation.mutate({ id: selectedProcessId, sapId });
      },
    });
  }

  const selectedProcessLabel = useMemo(() => {
    if (!processDetail) {
      return "";
    }
    return processDetail.processName || processDetail.processIdentifier || "";
  }, [processDetail]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return studentsList;
    const query = studentSearch.toLowerCase().trim();
    return studentsList.filter(
      (s) =>
        (s.fullName || "").toLowerCase().includes(query) ||
        (s.sapId || "").toLowerCase().includes(query) ||
        (s.branch || "").toLowerCase().includes(query)
    );
  }, [studentsList, studentSearch]);

  return (
    <AdminLayout
      title="Step 2: Unified Candidates Directory"
      description="Import the student roster Excel sheet and manage candidate data for the selected process."
      processReady={Boolean(selectedProcessId)}
      selectedProcessLabel={selectedProcessLabel}
    >
      {/* Feedback Messages */}
      {feedbackMessage && (
        <div
          className={`status-box ${
            feedbackMessage.type === "success" ? "success" : "error"
          } mb-4`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {!selectedProcessId ? (
        <section className="panel">
          <h2>Select a Process First</h2>
          <p className="muted">
            Step 2 requires an active process selection. Select a process from the Active Process selector dropdown at the top right, or go to Step 1.
          </p>
          <div className="button-row mt-4">
            <Button onClick={() => router.push("/")}>Go to Step 1</Button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload & Stats Column */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <article className="panel">
                <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Active Process</h2>
                {processDetail ? (
                  <div className="meta-grid">
                    <p>
                      <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Identifier</strong>
                      <span className="font-mono text-xs text-neutral-800">{processDetail.processIdentifier}</span>
                    </p>
                    <p>
                      <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Students</strong>
                      <span className="font-mono text-xs text-neutral-800">{processDetail.studentCount || 0}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">Loading process details…</p>
                )}
              </article>

              <article className="panel">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
                  <FileSpreadsheet size={20} className="text-neutral-500" />
                  <h2 className="text-base font-bold tracking-tight text-neutral-900 mb-0">Upload Candidate Excel</h2>
                </div>
                <form className="stack" onSubmit={onUploadStudents}>
                  <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                    Excel File (.xlsx)
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(event) =>
                        setUploadFile(event.target.files?.[0] || null)
                      }
                      required
                      className="mt-1 block w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-mono file:font-semibold file:bg-neutral-100 file:text-neutral-800 file:cursor-pointer hover:file:bg-neutral-200"
                    />
                  </label>

                  <div className="text-[10px] bg-blue-50 border border-blue-100 rounded p-3 text-neutral-700">
                    <strong className="block mb-2 text-blue-900">Supported Columns:</strong>
                    <div className="space-y-1 font-mono">
                      <p><strong className="text-blue-900">Required:</strong> SAP ID (aliases: SAPID, SAP No, SAP Number, Student ID)</p>
                      <p><strong className="text-blue-900">Required:</strong> Full Name (aliases: Name, Student Name, Candidate Name)</p>
                      <p><strong className="text-blue-900">Optional:</strong> Department/Branch (aliases: Branch, Branch Name, Stream, Course, Dept)</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      !uploadFile ||
                      !selectedProcessId ||
                      uploadStudentsMutation.isPending
                    }
                    className="w-full justify-center"
                  >
                    {uploadStudentsMutation.isPending
                      ? "Uploading…"
                      : "Upload and Import"}
                  </Button>
                </form>
              </article>
            </div>

            {/* Candidates Roster Column */}
            <div className="col-span-12 lg:col-span-8">
              <article className="panel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-2 border-b border-neutral-100">
                  <div className="flex items-center">
                    <UserCheck size={20} className="text-neutral-500 mr-2" />
                    <h2 className="text-base font-bold tracking-tight text-neutral-900 mb-0">
                      Candidates Roster ({filteredStudents.length})
                    </h2>
                  </div>
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={16} className="text-neutral-400 absolute left-3 top-2.5" />
                    <Input
                      placeholder="Search roster..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-[6px] border border-dashed border-neutral-200 text-xs text-neutral-400">
                    {studentSearch ? "No students matching search criteria." : "No candidates imported yet. Upload an Excel list on the left."}
                  </div>
                ) : (
                  <div className="table-wrap max-h-[500px] overflow-y-auto border border-neutral-200 rounded-[6px]">
                    <table className="history-table w-full">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>SAP ID</th>
                          <th>Branch</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.studentDatabaseId || student.id}>
                            <td className="font-semibold text-neutral-950">{student.fullName}</td>
                            <td className="font-mono">{student.sapId}</td>
                            <td>{student.branch || "-"}</td>
                            <td className="text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteStudent(student.sapId, student.fullName)}
                                className="text-red-600 hover:text-red-950 font-medium text-xs px-2.5 py-1 rounded hover:bg-red-50 transition flex items-center gap-1 ml-auto"
                                disabled={deleteStudentMutation.isPending}
                              >
                                <Trash2 size={12} className="inline" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          </div>

          <section className="panel nav-section">
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/")}>
                Back: Process Setup
              </Button>
            </div>
            <div className="button-row">
              <Button onClick={() => router.push("/rounds")}>Next: Configure Rounds</Button>
            </div>
          </section>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-md p-6 rounded-lg shadow-xl animate-floatIn">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} strokeWidth={2.5} className="text-red-600 mr-1" />
              <h3 className="text-base font-bold text-neutral-900 leading-none">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
