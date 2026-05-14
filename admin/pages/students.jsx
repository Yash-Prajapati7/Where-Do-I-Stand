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
              <h2>Selected Process</h2>
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
              ) : (
                <p className="muted">Loading process details…</p>
              )}

              <div className="button-row" style={{ marginTop: ".9rem" }}>
                <Button variant="secondary" onClick={() => router.push("/")}
                >
                  Change Process
                </Button>
              </div>
            </article>

            <article className="panel">
              <h2>Upload Student Excel</h2>
              <form className="stack" onSubmit={onUploadStudents}>
                <label>
                  Excel File (.xlsx)
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) =>
                      setUploadFile(event.target.files?.[0] || null)
                    }
                    required
                  />
                </label>

                <Button
                  type="submit"
                  disabled={
                    !uploadFile ||
                    !selectedProcessId ||
                    uploadStudentsMutation.isPending
                  }
                >
                  {uploadStudentsMutation.isPending
                    ? "Uploading…"
                    : "Upload and Import"}
                </Button>
              </form>

              {uploadStudentsMutation.data?.stats ? (
                <div className="status-box success">
                  Imported {uploadStudentsMutation.data.stats.validRows} valid rows,
                  inserted {uploadStudentsMutation.data.stats.inserted}, updated{" "}
                  {uploadStudentsMutation.data.stats.updated}.
                </div>
              ) : null}

              {uploadStudentsMutation.error ? (
                <div className="status-box error">
                  {uploadStudentsMutation.error?.response?.data?.message ||
                    uploadStudentsMutation.error.message}
                </div>
              ) : null}
            </article>
          </section>

          <section className="panel">
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/")}
              >
                Back: Process
              </Button>
              <Button onClick={() => router.push("/rounds")}>Next: Rounds</Button>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
