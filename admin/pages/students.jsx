import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  fetchAdminProcess,
  uploadStudentsFile,
} from "@/utils/api";

export default function StudentsStepPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { selectedProcessId } = useSelectedProcessId();
  const [uploadFile, setUploadFile] = useState(null);

  const processDetailQuery = useQuery({
    queryKey: ["admin-process-detail", selectedProcessId],
    queryFn: () => fetchAdminProcess(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const uploadStudentsMutation = useMutation({
    mutationFn: ({ processId, file }) => uploadStudentsFile(processId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-process-detail", selectedProcessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-process-students", selectedProcessId],
      });
      setUploadFile(null);
    },
  });

  const processDetail = processDetailQuery.data?.process || null;

  const selectedProcessLabel = useMemo(() => {
    if (!processDetail) {
      return "";
    }

    return processDetail.processName || processDetail.processIdentifier || "";
  }, [processDetail]);

  function onUploadStudents(event) {
    event.preventDefault();

    if (!selectedProcessId || !uploadFile) {
      return;
    }

    uploadStudentsMutation.mutate({
      processId: selectedProcessId,
      file: uploadFile,
    });
  }

  return (
    <AdminLayout
      title="Step 2: Import Students"
      description="Upload the Excel sheet for the selected process. SAP ID and Name are required." 
      processReady={Boolean(selectedProcessId)}
      selectedProcessLabel={selectedProcessLabel}
    >
      {!selectedProcessId ? (
        <section className="panel">
          <h2>Select a Process First</h2>
          <p className="muted">
            Step 2 requires an active process selection. Go back to Step 1 and select/create a process.
          </p>
          <div className="button-row" style={{ marginTop: ".9rem" }}>
            <Button onClick={() => router.push("/")}>Go to Step 1</Button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid-two">
            <article className="panel">
              <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Active Process</h2>
              {processDetail ? (
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
                    <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Rounds</strong>
                    <span className="font-mono text-xs text-neutral-800">{processDetail.rounds.length}</span>
                  </p>
                  <p>
                    <strong className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Students</strong>
                    <span className="font-mono text-xs text-neutral-800">{processDetail.studentCount || 0}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">Loading process details…</p>
              )}

              <div className="button-row mt-6">
                <Button variant="secondary" onClick={() => router.push("/")}>
                  Change Process
                </Button>
              </div>
            </article>

            <article className="panel">
              <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Upload Candidate Excel</h2>
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
                    <p><strong className="text-blue-900">Optional:</strong> Department/Branch (aliases: Branch, Stream, Course, Dept)</p>
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

              {uploadStudentsMutation.data?.stats ? (
                <div className="status-box success mt-4 text-xs">
                  Imported {uploadStudentsMutation.data.stats.validRows} valid rows (
                  inserted {uploadStudentsMutation.data.stats.inserted}, updated{" "}
                  {uploadStudentsMutation.data.stats.updated} ).
                </div>
              ) : null}

              {uploadStudentsMutation.error ? (
                <div className="status-box error mt-4 text-xs">
                  {uploadStudentsMutation.error?.response?.data?.message ||
                    uploadStudentsMutation.error.message}
                </div>
              ) : null}
            </article>
          </section>

          <section className="panel nav-section">
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/?mode=create")}>
                Back: Process
              </Button>
            </div>
            <div className="button-row">
              <Button onClick={() => router.push("/rounds")}>Next: Configure Rounds</Button>
            </div>
          </section>

        </>
      )}
    </AdminLayout>
  );
}
