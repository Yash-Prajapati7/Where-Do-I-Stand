import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import {
  Sparkles,
  Settings,
  Rocket,
  Sliders,
  FileSpreadsheet,
  UserCheck,
  Search,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  createAdminProcess,
  fetchAdminProcess,
  fetchAdminProcesses,
  updateAdminProcessMetadata,
  deleteAdminProcess,
  deleteStudentFromProcess,
  uploadStudentsFile,
  fetchProcessStudents,
} from "@/utils/api";

export default function ProcessStepPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hydrated, selectedProcessId, setSelectedProcessId } = useSelectedProcessId();

  // Mode: null (selector), "create" (wizard), "manage" (dashboard)
  const [flowMode, setFlowMode] = useState(null);

  const [processForm, setProcessForm] = useState({
    processName: "",
    companyName: "",
    description: "",
  });

  const [editForm, setEditForm] = useState({
    processName: "",
    companyName: "",
    description: "",
  });

  const [studentSearch, setStudentSearch] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
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

  const processListQuery = useQuery({
    queryKey: ["admin-process-list"],
    queryFn: fetchAdminProcesses,
    staleTime: 20_000,
  });

  const processes = processListQuery.data?.processes || [];

  const processDetailQuery = useQuery({
    queryKey: ["admin-process-detail", selectedProcessId],
    queryFn: () => fetchAdminProcess(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const processDetail = processDetailQuery.data?.process || null;

  const processStudentsQuery = useQuery({
    queryKey: ["admin-process-students", selectedProcessId],
    queryFn: () => fetchProcessStudents(selectedProcessId),
    enabled: Boolean(selectedProcessId) && flowMode === "manage",
  });

  const studentsList = processStudentsQuery.data?.students || [];

  // Populate edit form when process details are fetched
  useEffect(() => {
    if (processDetail) {
      setEditForm({
        processName: processDetail.processName || "",
        companyName: processDetail.companyName || "",
        description: processDetail.description || "",
      });
    }
  }, [processDetail]);

  const selectedProcessLabel = useMemo(() => {
    if (!processDetail) {
      return "";
    }
    return processDetail.processName || processDetail.processIdentifier || "";
  }, [processDetail]);

  const createProcessMutation = useMutation({
    mutationFn: createAdminProcess,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      setSelectedProcessId(response.process.id);
      setProcessForm({ processName: "", companyName: "", description: "" });
      setFeedbackMessage({ type: "success", text: "New process created! Starting setup flow." });
      setFlowMode("create");
    },
    onError: (err) => {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.message || err.message,
      });
    },
  });

  const updateProcessMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminProcessMetadata(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-process-detail", selectedProcessId] });
      setFeedbackMessage({ type: "success", text: "Process metadata updated successfully." });
    },
    onError: (err) => {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.message || err.message,
      });
    },
  });

  const deleteProcessMutation = useMutation({
    mutationFn: deleteAdminProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      setSelectedProcessId("");
      setFeedbackMessage({ type: "success", text: "Process deleted successfully." });
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

  const uploadStudentsMutation = useMutation({
    mutationFn: ({ id, file }) => uploadStudentsFile(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-process-detail", selectedProcessId] });
      queryClient.invalidateQueries({ queryKey: ["admin-process-students", selectedProcessId] });
      setUploadFile(null);
      setFeedbackMessage({ type: "success", text: "Students imported successfully!" });
    },
    onError: (err) => {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.message || err.message,
      });
    },
  });

  function onCreateProcess(event) {
    event.preventDefault();
    createProcessMutation.mutate({
      processName: processForm.processName,
      companyName: processForm.companyName,
      description: processForm.description,
    });
  }

  function onUpdateProcess(event) {
    event.preventDefault();
    if (!selectedProcessId) return;
    updateProcessMutation.mutate({
      id: selectedProcessId,
      payload: editForm,
    });
  }

  function onDeleteProcess() {
    if (!selectedProcessId) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Recruitment Process",
      message: "Are you absolutely sure you want to delete this process? This will permanently delete all student rosters and evaluation progress from the database.",
      onConfirm: () => {
        deleteProcessMutation.mutate(selectedProcessId);
      },
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

  function onUploadStudents(event) {
    event.preventDefault();
    if (!selectedProcessId || !uploadFile) return;
    uploadStudentsMutation.mutate({
      id: selectedProcessId,
      file: uploadFile,
    });
  }

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

  const pageTitle = useMemo(() => {
    if (flowMode === "create") return "Step 1: Guided Process Setup";
    if (flowMode === "manage") return "Process Dashboard";
    return "Placement Administrator Hub";
  }, [flowMode]);

  const pageDescription = useMemo(() => {
    if (flowMode === "create")
      return "Configure process details step-by-step. Let's start by initializing the new recruitment process cohort.";
    if (flowMode === "manage")
      return "Direct operations panel. Update details, manage candidate rosters, configure round formats, or record status progress.";
    return "Select how you'd like to work with placement processes. Launch a guided creation workflow, or modify details of existing ones.";
  }, [flowMode]);

  // Handle default flowMode when page loads
  useEffect(() => {
    if (router.isReady) {
      if (router.query.mode) {
        setFlowMode(router.query.mode);
      } else if (selectedProcessId) {
        setFlowMode("manage");
      }
    }
  }, [router.isReady, router.query.mode, selectedProcessId]);

  return (
    <AdminLayout
      title={pageTitle}
      description={pageDescription}
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

      {/* 1. Flow Selector View */}
      {flowMode === null && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <article 
            className="panel flex flex-col justify-between h-full hover:border-black transition duration-200 cursor-pointer" 
            onClick={() => setFlowMode("create")}
          >
            <div>
              <div className="mb-3 text-accent">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Create New Process</h2>
              <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                Start a step-by-step guided setup wizard. Great for creating a fresh placement drive where you will upload candidate excel lists, specify rounds, and start evaluating candidates sequentially.
              </p>
            </div>
            <Button variant="primary" onClick={(e) => { e.stopPropagation(); setFlowMode("create"); }}>
              Start Guided Setup &rarr;
            </Button>
          </article>

          <article 
            className="panel flex flex-col justify-between h-full hover:border-black transition duration-200 cursor-pointer" 
            onClick={() => setFlowMode("manage")}
          >
            <div>
              <div className="mb-3 text-neutral-600">
                <Settings size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Work with Existing Process</h2>
              <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                Directly manage details of an ongoing process. Update metadata information, upload additional candidates, delete individual candidate profiles, check active cohorts, or configure evaluate stages.
              </p>
            </div>
            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setFlowMode("manage"); }}>
              Open Control Dashboard &rarr;
            </Button>
          </article>
        </section>
      )}

      {/* 2. Create Guided Process View */}
      {flowMode === "create" && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="panel">
            <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">
              New Process Cohort
            </h2>
            <form className="stack" onSubmit={onCreateProcess}>
              <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                Process Name
                <Input
                  value={processForm.processName}
                  onChange={(event) =>
                    setProcessForm((previous) => ({
                      ...previous,
                      processName: event.target.value,
                    }))
                  }
                  placeholder="e.g. Google Specialist 2026"
                  required
                  className="mt-1"
                />
              </label>

              <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                Company Name
                <Input
                  value={processForm.companyName}
                  onChange={(event) =>
                    setProcessForm((previous) => ({
                      ...previous,
                      companyName: event.target.value,
                    }))
                  }
                  placeholder="Defaults to process name if empty"
                  className="mt-1"
                />
              </label>

              <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                Description
                <textarea
                  value={processForm.description}
                  onChange={(event) =>
                    setProcessForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional notes or eligibility requirements..."
                  className="mt-1 font-sans"
                />
              </label>

              <div className="flex justify-between items-center pt-2">
                <Button variant="secondary" onClick={() => setFlowMode(null)}>
                  Cancel & Back
                </Button>
                <Button type="submit" disabled={createProcessMutation.isPending}>
                  {createProcessMutation.isPending ? "Creating…" : "Create Process"}
                </Button>
              </div>
            </form>
          </article>

          <article className="panel flex flex-col justify-center items-center text-center p-8 border-dashed border-2">
            <div className="mb-4 text-accent">
              <Rocket size={36} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold text-neutral-700 mb-2">Guided Setup Progress</h3>
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-4">
              Upon successful process creation, the application will automatically activate the cohort and guide you to Step 2: Student Upload.
            </p>
            {selectedProcessId ? (
              <Button onClick={() => router.push("/students")} variant="primary">
                Next: Import Students &rarr;
              </Button>
            ) : (
              <span className="text-xs text-neutral-300 font-mono">Awaiting process configuration...</span>
            )}
          </article>
        </section>
      )}

      {/* 3. Manage Dashboard View */}
      {flowMode === "manage" && (
        <div className="space-y-6">
          {/* Active Process Selection Header */}
          <article className="panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="w-full sm:max-w-md text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                Select Process to Work With
                <Select
                  value={selectedProcessId}
                  onChange={(event) => setSelectedProcessId(event.target.value)}
                  className="mt-1"
                >
                  <option value="">-- Choose Process --</option>
                  {processes.map((processItem) => (
                    <option key={processItem.id} value={processItem.id}>
                      {processItem.processName} ({processItem.studentCount} candidates)
                    </option>
                  ))}
                </Select>
              </label>
              <Button variant="secondary" onClick={() => setFlowMode(null)} className="sm:self-end">
                &larr; Exit to Hub
              </Button>
            </div>
          </article>

          {selectedProcessId && processDetail ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Settings Column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <article className="panel">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
                    <Sliders size={20} className="text-neutral-500" />
                    <h2 className="text-base font-bold tracking-tight text-neutral-900 mb-0">
                      Process Settings
                    </h2>
                  </div>
                  <form className="stack" onSubmit={onUpdateProcess}>
                    <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                      Process Name
                      <Input
                        value={editForm.processName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, processName: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </label>

                    <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                      Company Name
                      <Input
                        value={editForm.companyName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                        className="mt-1"
                      />
                    </label>

                    <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                      Description
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 font-sans"
                      />
                    </label>

                    <div className="flex justify-between items-center pt-2">
                      <Button variant="secondary" type="submit" disabled={updateProcessMutation.isPending}>
                        {updateProcessMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="danger" onClick={onDeleteProcess} disabled={deleteProcessMutation.isPending}>
                        {deleteProcessMutation.isPending ? "Deleting..." : "Delete Process"}
                      </Button>
                    </div>
                  </form>
                </article>

                <article className="panel">
                  <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">
                    Quick Operations
                  </h2>
                  <div className="stack gap-3">
                    <Button variant="primary" onClick={() => router.push("/rounds")} className="w-full justify-center">
                      Configure Rounds ({processDetail.rounds.length})
                    </Button>
                    <Button variant="primary" onClick={() => router.push("/progress")} className="w-full justify-center">
                      Update Candidate Progress
                    </Button>
                  </div>
                </article>
              </div>

              {/* Roster / Students Column */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* Excel Import Inline */}
                <article className="panel">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
                    <FileSpreadsheet size={20} className="text-neutral-500" />
                    <h2 className="text-base font-bold tracking-tight text-neutral-900 mb-0">
                      Import Student Excel
                    </h2>
                  </div>
                  <form className="flex flex-col sm:flex-row items-end gap-3" onSubmit={onUploadStudents}>
                    <label className="flex-1 text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                      Upload Excel file (.xlsx)
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                        required
                        className="mt-1 block w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-mono file:font-semibold file:bg-neutral-100 file:text-neutral-800 file:cursor-pointer hover:file:bg-neutral-200"
                      />
                    </label>
                    <Button type="submit" disabled={!uploadFile || uploadStudentsMutation.isPending} className="w-full sm:w-auto">
                      {uploadStudentsMutation.isPending ? "Uploading..." : "Upload & Import"}
                    </Button>
                  </form>
                </article>

                {/* Candidates Roster List */}
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
                    <div className="flex h-36 items-center justify-center rounded-[6px] border border-dashed border-neutral-200 text-xs text-neutral-400">
                      {studentSearch ? "No students matching search criteria." : "No candidates imported yet. Upload an Excel list above."}
                    </div>
                  ) : (
                    <div className="table-wrap max-h-96 overflow-y-auto border border-neutral-200 rounded-[6px]">
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
          ) : (
            selectedProcessId && (
              <div className="panel flex justify-center py-10">
                <span className="text-neutral-400 text-xs font-mono">Loading process details...</span>
              </div>
            )
          )}
        </div>
      )}

      {/* State-controlled Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-md p-6 rounded-lg shadow-xl transition-all scale-100 animate-floatIn">
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
