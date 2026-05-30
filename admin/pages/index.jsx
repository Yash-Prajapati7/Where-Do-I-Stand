import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  createAdminProcess,
  fetchAdminProcess,
  fetchAdminProcesses,
} from "@/utils/api";

export default function ProcessStepPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hydrated, selectedProcessId, setSelectedProcessId } = useSelectedProcessId();

  const [processForm, setProcessForm] = useState({
    processName: "",
    companyName: "",
    description: "",
  });

  const processListQuery = useQuery({
    queryKey: ["admin-process-list"],
    queryFn: fetchAdminProcesses,
    staleTime: 20_000,
  });

  const processes = processListQuery.data?.processes || [];
  const firstProcessId = processes.length > 0 ? processes[0].id : "";

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (selectedProcessId) {
      return;
    }

    if (!firstProcessId) {
      return;
    }

    setSelectedProcessId(firstProcessId);
  }, [hydrated, selectedProcessId, firstProcessId, setSelectedProcessId]);

  const processDetailQuery = useQuery({
    queryKey: ["admin-process-detail", selectedProcessId],
    queryFn: () => fetchAdminProcess(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const processDetail = processDetailQuery.data?.process || null;

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

  return (
    <AdminLayout
      title="Step 1: Process Setup"
      description="Create a new process or select an existing one to continue."
      processReady={Boolean(selectedProcessId)}
      selectedProcessLabel={selectedProcessLabel}
    >
      <section className="grid-two">
        <article className="panel">
          <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Create New Process</h2>
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
                className="mt-1"
              />
            </label>

            <Button type="submit" disabled={createProcessMutation.isPending} className="w-full justify-center">
              {createProcessMutation.isPending ? "Creating…" : "Create Process"}
            </Button>
          </form>

          {createProcessMutation.error ? (
            <div className="status-box error mt-4">
              {createProcessMutation.error?.response?.data?.message ||
                createProcessMutation.error.message}
            </div>
          ) : null}
        </article>

        <article className="panel">
          <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Select Active Process</h2>
          <div className="stack">
            <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
              Active Processes
              <Select
                value={selectedProcessId}
                onChange={(event) => setSelectedProcessId(event.target.value)}
                className="mt-1"
              >
                {processes.length === 0 ? (
                  <option value="">No process found</option>
                ) : null}
                {processes.map((processItem) => (
                  <option key={processItem.id} value={processItem.id}>
                    {processItem.processName} ({processItem.studentCount} candidates)
                  </option>
                ))}
              </Select>
            </label>

            {processDetail ? (
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                <div className="px-3 py-2 bg-neutral-50 rounded-[4px] border border-neutral-100">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Description</p>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{processDetail.description || "No description provided."}</p>
                </div>
                <div className="meta-grid">
                  <p>
                    <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Identifier</strong>
                    <span className="font-mono text-xs text-neutral-800">{processDetail.processIdentifier}</span>
                  </p>
                  <p>
                    <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Company</strong>
                    <span className="text-xs text-neutral-800">{processDetail.companyName || "-"}</span>
                  </p>
                  <p>
                    <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Rounds Configured</strong>
                    <span className="font-mono text-xs text-neutral-800">{processDetail.rounds.length}</span>
                  </p>
                  <p>
                    <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Student Cohort</strong>
                    <span className="font-mono text-xs text-neutral-800">{processDetail.studentCount || 0}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center rounded-[6px] border border-dashed border-neutral-200 text-xs text-neutral-400">
                Select a process above to review details
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel nav-section">
        <div className="button-row">
          <Button
            onClick={() => router.push("/students")}
            disabled={!selectedProcessId}
          >
            Next: Import Students
          </Button>
        </div>
      </section>
    </AdminLayout>
  );
}
