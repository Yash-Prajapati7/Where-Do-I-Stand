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
          <h2>Create Process</h2>
          <form className="stack" onSubmit={onCreateProcess}>
            <label>
              Process Name
              <Input
                value={processForm.processName}
                onChange={(event) =>
                  setProcessForm((previous) => ({
                    ...previous,
                    processName: event.target.value,
                  }))
                }
                placeholder="Example: TCS Day 1"
                required
              />
            </label>

            <label>
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
              />
            </label>

            <label>
              Description
              <textarea
                value={processForm.description}
                onChange={(event) =>
                  setProcessForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional notes for this process"
              />
            </label>

            <Button type="submit" disabled={createProcessMutation.isPending}>
              {createProcessMutation.isPending ? "Creating…" : "Create Process"}
            </Button>
          </form>

          {createProcessMutation.error ? (
            <div className="status-box error">
              {createProcessMutation.error?.response?.data?.message ||
                createProcessMutation.error.message}
            </div>
          ) : null}
        </article>

        <article className="panel">
          <h2>Select Process</h2>
          <label>
            Active Processes
            <Select
              value={selectedProcessId}
              onChange={(event) => setSelectedProcessId(event.target.value)}
            >
              {processes.length === 0 ? (
                <option value="">No process found</option>
              ) : null}
              {processes.map((processItem) => (
                <option key={processItem.id} value={processItem.id}>
                  {processItem.processName} ({processItem.studentCount} students)
                </option>
              ))}
            </Select>
          </label>

          {processDetail ? (
            <div className="meta-grid">
              <p>
                <strong>Identifier</strong>
                <span>{processDetail.processIdentifier}</span>
              </p>
              <p>
                <strong>Company</strong>
                <span>{processDetail.companyName || "-"}</span>
              </p>
              <p>
                <strong>Rounds</strong>
                <span>{processDetail.rounds.length}</span>
              </p>
              <p>
                <strong>Students</strong>
                <span>{processDetail.studentCount || 0}</span>
              </p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="panel">
        <div className="button-row">
          <Button
            onClick={() => router.push("/students")}
            disabled={!selectedProcessId}
          >
            Next: Students
          </Button>
        </div>
      </section>
    </AdminLayout>
  );
}
