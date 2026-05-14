import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  fetchAdminProcess,
  fetchProcessStudents,
  updateStudentRoundResult,
} from "@/utils/api";

const statusOptions = [
  "notStarted",
  "scheduled",
  "inProgress",
  "qualified",
  "rejected",
  "onHold",
];

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default function ProgressStepPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { selectedProcessId } = useSelectedProcessId();

  const [studentSearch, setStudentSearch] = useState("");
  const [resultForm, setResultForm] = useState({
    studentId: "",
    roundId: "",
    status: "scheduled",
    venue: "",
    groupNumber: "",
    remarks: "",
  });

  const processDetailQuery = useQuery({
    queryKey: ["admin-process-detail", selectedProcessId],
    queryFn: () => fetchAdminProcess(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const processStudentsQuery = useQuery({
    queryKey: ["admin-process-students", selectedProcessId],
    queryFn: () => fetchProcessStudents(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const updateResultMutation = useMutation({
    mutationFn: ({ processId, studentId, roundId, payload }) =>
      updateStudentRoundResult(processId, studentId, roundId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-process-students", selectedProcessId],
      });
    },
  });

  const processDetail = processDetailQuery.data?.process || null;
  const rounds = processDetail?.rounds || [];

  const students = processStudentsQuery.data?.students || [];

  const selectedProcessLabel = useMemo(() => {
    if (!processDetail) {
      return "";
    }

    return processDetail.processName || processDetail.processIdentifier || "";
  }, [processDetail]);

  const normalizedStudentSearch = useMemo(
    () => normalizeKey(studentSearch),
    [studentSearch]
  );

  const filteredStudents = useMemo(() => {
    if (!normalizedStudentSearch) {
      return students;
    }

    return students.filter((student) => {
      const haystack = [
        student.fullName,
        student.sapId,
        student.rollNumber,
        student.email,
      ]
        .map((value) => normalizeKey(value))
        .join(" ");

      return haystack.includes(normalizedStudentSearch);
    });
  }, [students, normalizedStudentSearch]);

  useEffect(() => {
    if (!resultForm.roundId && rounds.length > 0) {
      setResultForm((previous) => ({ ...previous, roundId: rounds[0].id }));
    }
  }, [resultForm.roundId, rounds.length]);

  useEffect(() => {
    if (!resultForm.studentId && filteredStudents.length > 0) {
      const firstSelectable = filteredStudents.find((student) => Boolean(student.sapId));

      if (firstSelectable) {
        setResultForm((previous) => ({
          ...previous,
          studentId: firstSelectable.sapId,
        }));
      }
    }
  }, [resultForm.studentId, filteredStudents.length]);

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === resultForm.roundId) || null,
    [rounds, resultForm.roundId]
  );

  function onUpdateResult(event) {
    event.preventDefault();

    if (!selectedProcessId || !resultForm.studentId || !resultForm.roundId) {
      return;
    }

    updateResultMutation.mutate({
      processId: selectedProcessId,
      studentId: resultForm.studentId,
      roundId: resultForm.roundId,
      payload: {
        status: resultForm.status,
        venue: resultForm.venue,
        groupNumber: resultForm.groupNumber,
        remarks: resultForm.remarks,
      },
    });
  }

  return (
    <AdminLayout
      title="Step 4: Update Candidate Progress"
      description="Search candidates locally (no backend search calls) and update their round status using SAP ID." 
      processReady={Boolean(selectedProcessId)}
      selectedProcessLabel={selectedProcessLabel}
    >
      {!selectedProcessId ? (
        <section className="panel">
          <h2>Select a Process First</h2>
          <p className="muted">
            Step 4 requires an active process selection. Go back to Step 1 and select/create a process.
          </p>
          <div className="button-row" style={{ marginTop: ".9rem" }}>
            <Button onClick={() => router.push("/")}>Go to Step 1</Button>
          </div>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>Search Candidate</h2>
            <div className="stack inline-search">
              <label>
                Search (Name / SAP ID / Email)
                <Input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Type candidate name or SAP ID"
                />
              </label>
            </div>

            <form className="grid-three" onSubmit={onUpdateResult}>
              <label>
                Candidate (SAP ID)
                <Select
                  value={resultForm.studentId}
                  onChange={(event) =>
                    setResultForm((previous) => ({
                      ...previous,
                      studentId: event.target.value,
                    }))
                  }
                  required
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">No candidates</option>
                  ) : null}

                  {filteredStudents.map((student) => (
                    <option
                      key={student.studentDatabaseId || student.id}
                      value={student.sapId || ""}
                      disabled={!student.sapId}
                    >
                      {student.fullName} ({student.sapId || "SAP ID missing"})
                    </option>
                  ))}
                </Select>
              </label>

              <label>
                Round
                <Select
                  value={resultForm.roundId}
                  onChange={(event) =>
                    setResultForm((previous) => ({
                      ...previous,
                      roundId: event.target.value,
                    }))
                  }
                  required
                >
                  {rounds.length === 0 ? <option value="">No rounds</option> : null}
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label>
                Status
                <Select
                  value={resultForm.status}
                  onChange={(event) =>
                    setResultForm((previous) => ({
                      ...previous,
                      status: event.target.value,
                    }))
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </label>

              {(selectedRound?.metadataTemplate?.allowVenue ||
                selectedRound?.type === "technicalInterview" ||
                selectedRound?.type === "hrInterview") && (
                <label>
                  Venue
                  <Input
                    value={resultForm.venue}
                    onChange={(event) =>
                      setResultForm((previous) => ({
                        ...previous,
                        venue: event.target.value,
                      }))
                    }
                    placeholder="Editable interview venue"
                  />
                </label>
              )}

              {(selectedRound?.metadataTemplate?.allowGroupNumber ||
                selectedRound?.type === "groupDiscussion") && (
                <label>
                  Group Number
                  <Input
                    value={resultForm.groupNumber}
                    onChange={(event) =>
                      setResultForm((previous) => ({
                        ...previous,
                        groupNumber: event.target.value,
                      }))
                    }
                    placeholder="Optional GD group"
                  />
                </label>
              )}

              <label className="full-width">
                Remarks
                <textarea
                  value={resultForm.remarks}
                  onChange={(event) =>
                    setResultForm((previous) => ({
                      ...previous,
                      remarks: event.target.value,
                    }))
                  }
                  placeholder="Optional notes"
                />
              </label>

              <div className="button-row full-width">
                <Button
                  type="submit"
                  disabled={
                    updateResultMutation.isPending ||
                    !resultForm.studentId ||
                    !resultForm.roundId
                  }
                >
                  {updateResultMutation.isPending
                    ? "Updating…"
                    : "Update Progress"}
                </Button>
              </div>
            </form>

            {updateResultMutation.error ? (
              <div className="status-box error">
                {updateResultMutation.error?.response?.data?.message ||
                  updateResultMutation.error.message}
              </div>
            ) : null}

            {updateResultMutation.isSuccess ? (
              <div className="status-box success">Progress updated successfully.</div>
            ) : null}
          </section>

          <section className="panel">
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/rounds")}
              >
                Back: Rounds
              </Button>
              <Button variant="secondary" onClick={() => router.push("/")}
              >
                Go to Step 1
              </Button>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
