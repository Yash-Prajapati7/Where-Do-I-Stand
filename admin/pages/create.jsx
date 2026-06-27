import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { Rocket } from "lucide-react";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import { createAdminProcess } from "@/utils/api";

export default function CreateProcessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSelectedProcessId } = useSelectedProcessId();

  const [newProcessCreated, setNewProcessCreated] = useState(false);
  const [processForm, setProcessForm] = useState({
    processName: "",
    companyName: "",
    description: "",
  });

  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Auto-clear feedback messages after 5 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const createProcessMutation = useMutation({
    mutationFn: createAdminProcess,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      setSelectedProcessId(response.process.id);
      setProcessForm({ processName: "", companyName: "", description: "" });
      setFeedbackMessage({ type: "success", text: "New process created! Starting setup flow." });
      setNewProcessCreated(true);
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

  return (
    <AdminLayout
      title="Step 1: Guided Process Setup"
      description="Configure process details step-by-step. Let's start by initializing the new recruitment process cohort."
      isCreating={!newProcessCreated}
      hideNavigation={false}
      hideActiveProcess={true}
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
              <Button variant="secondary" onClick={() => router.push("/")}>
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
          {newProcessCreated ? (
            <Button onClick={() => router.push("/students")} variant="primary">
              Next: Import Students &rarr;
            </Button>
          ) : (
            <span className="text-xs text-neutral-300 font-mono">Awaiting process configuration...</span>
          )}
        </article>
      </section>
    </AdminLayout>
  );
}
