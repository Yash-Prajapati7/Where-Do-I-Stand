import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import {
  Sparkles,
  Settings,
  Rocket,
  Sliders,
  AlertTriangle,
} from "lucide-react";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  createAdminProcess,
  fetchAdminProcess,
  fetchAdminProcesses,
  updateAdminProcessMetadata,
  deleteAdminProcess,
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

  // Populate edit form when process details are fetched
  useEffect(() => {
    if (processDetail) {
      setEditForm({
        processName: processDetail.processName || "",
        companyName: processDetail.companyName || "",
        description: processDetail.description || "",
        statusColors: processDetail.statusColors || {
          notStarted: "#f3f4f6",
          scheduled: "#dbeafe",
          inProgress: "#fef3c7",
          qualified: "#d1fae5",
          rejected: "#fee2e2",
          onHold: "#f3e8ff",
        },
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

  const pageTitle = useMemo(() => {
    if (flowMode === "create") return "Step 1: Guided Process Setup";
    if (flowMode === "manage") return "Process Dashboard";
    return "Placement Administrator Hub";
  }, [flowMode]);

  const pageDescription = useMemo(() => {
    if (flowMode === "create")
      return "Configure process details step-by-step. Let's start by initializing the new recruitment process cohort.";
    if (flowMode === "manage")
      return "Direct operations panel. Update details, configure round formats, or record status progress.";
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
          {!selectedProcessId ? (
            <article className="panel flex flex-col justify-center items-center text-center p-12 border-dashed border-2">
              <div className="mb-4 text-neutral-400">
                <Settings size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-neutral-700 mb-2">No Process Selected</h3>
              <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mb-6">
                To manage details, please choose an active recruitment process from the **Active Process** selector dropdown at the top right of the navigation header.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setFlowMode(null)}>
                  &larr; Exit to Hub
                </Button>
                <Button variant="primary" onClick={() => setFlowMode("create")}>
                  Create New Process
                </Button>
              </div>
            </article>
          ) : processDetail ? (
            <div className="space-y-6">
              {/* Overview Header Card */}
              <article className="panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-1">
                    Managing: {processDetail.processName}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Company: <span className="font-semibold text-neutral-700">{processDetail.companyName || "-"}</span> | Identifier: <span className="font-mono text-neutral-700">{processDetail.processIdentifier}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setFlowMode(null)}>
                    &larr; Exit to Hub
                  </Button>
                </div>
              </article>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Info & Settings Column */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="panel flex flex-col justify-center p-4 bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider uppercase">Candidates</span>
                      <span className="text-2xl font-bold text-neutral-900 mt-1">{processDetail.studentCount || 0}</span>
                    </div>
                    <div className="panel flex flex-col justify-center p-4 bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider uppercase">Rounds Configured</span>
                      <span className="text-2xl font-bold text-neutral-900 mt-1">{processDetail.rounds.length}</span>
                    </div>
                  </div>

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

                      <div className="flex justify-between items-center pt-4 border-t border-neutral-100 mt-4">
                        <Button variant="secondary" type="submit" disabled={updateProcessMutation.isPending}>
                          {updateProcessMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="danger" onClick={onDeleteProcess} disabled={deleteProcessMutation.isPending}>
                          {deleteProcessMutation.isPending ? "Deleting..." : "Delete Process"}
                        </Button>
                      </div>
                    </form>
                  </article>
                </div>

                {/* Operations & Colors Column */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                  <article className="panel">
                    <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">
                      Operational Directory
                    </h2>
                    <div className="stack gap-3">
                      <Button variant="primary" onClick={() => router.push("/students")} className="w-full justify-center py-2.5">
                        Manage Candidates ({processDetail.studentCount} profiles)
                      </Button>
                      <Button variant="primary" onClick={() => router.push("/rounds")} className="w-full justify-center py-2.5">
                        Configure Rounds ({processDetail.rounds.length} stages)
                      </Button>
                      <Button variant="primary" onClick={() => router.push("/progress")} className="w-full justify-center py-2.5">
                        Update Candidate Progress
                      </Button>
                    </div>
                  </article>

                  <article className="panel">
                    <h3 className="text-xs font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">Status Progress Colors</h3>
                    <form className="stack" onSubmit={onUpdateProcess}>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(editForm.statusColors || {}).map(([statusKey, color]) => {
                          const statusLabels = {
                            notStarted: "Not Started",
                            scheduled: "Scheduled",
                            inProgress: "In Progress",
                            qualified: "Qualified",
                            rejected: "Rejected",
                            onHold: "On Hold",
                          };
                          return (
                            <label key={statusKey} className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider flex flex-col gap-1">
                              {statusLabels[statusKey] || statusKey}
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={color || "#f3f4f6"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditForm(prev => ({
                                      ...prev,
                                      statusColors: {
                                        ...(prev.statusColors || {}),
                                        [statusKey]: val,
                                      }
                                    }));
                                  }}
                                  className="h-8 w-12 rounded border border-neutral-200 cursor-pointer p-0"
                                />
                                <Input
                                  value={color || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditForm(prev => ({
                                      ...prev,
                                      statusColors: {
                                        ...(prev.statusColors || {}),
                                        [statusKey]: val,
                                      }
                                    }));
                                  }}
                                  placeholder="#ffffff"
                                  className="flex-1 mt-0 text-xs py-1 px-2 font-mono h-8"
                                />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <div className="pt-4 mt-2">
                        <Button variant="secondary" type="submit" disabled={updateProcessMutation.isPending} className="w-full justify-center">
                          {updateProcessMutation.isPending ? "Saving Colors..." : "Save Colors"}
                        </Button>
                      </div>
                    </form>
                  </article>
                </div>
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
