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
          <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Select a Process First</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Step 4 requires an active process selection. Go back to Step 1 and select or create a process first.
          </p>
          <div className="button-row mt-4">
            <Button onClick={() => router.push("/")}>Go to Step 1</Button>
          </div>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Candidate Selection & Parameters</h2>
            
            <div className="stack inline-search mb-6">
              <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                Filter Candidates List (Name / SAP ID / Email)
                <Input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Type to filter..."
                  className="mt-1"
                />
              </label>
            </div>

            <form className="stack gap-4" onSubmit={onUpdateResult}>
              <div className="grid-three">
                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                  Select Candidate (SAP ID)
                  <Select
                    value={resultForm.studentId}
                    onChange={(event) =>
                      setResultForm((previous) => ({
                        ...previous,
                        studentId: event.target.value,
                      }))
                    }
                    required
                    className="mt-1"
                  >
                    {filteredStudents.length === 0 ? (
                      <option value="">No candidates found</option>
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

                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                  Target Stage
                  <Select
                    value={resultForm.roundId}
                    onChange={(event) =>
                      setResultForm((previous) => ({
                        ...previous,
                        roundId: event.target.value,
                      }))
                    }
                    required
                    className="mt-1"
                  >
                    {rounds.length === 0 ? <option value="">No stages created</option> : null}
                    {rounds.map((round) => (
                      <option key={round.id} value={round.id}>
                        {round.name}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                  Progress Status
                  <Select
                    value={resultForm.status}
                    onChange={(event) =>
                      setResultForm((previous) => ({
                        ...previous,
                        status: event.target.value,
                      }))
                    }
                    className="mt-1"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="grid-two">
                {(selectedRound?.metadataTemplate?.allowVenue ||
                  selectedRound?.type === "technicalInterview" ||
                  selectedRound?.type === "hrInterview") && (
                  <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                    Venue Info
                    <Input
                      value={resultForm.venue}
                      onChange={(event) =>
                        setResultForm((previous) => ({
                          ...previous,
                          venue: event.target.value,
                        }))
                      }
                      placeholder="e.g. Lab 4 or Placement Office"
                      className="mt-1"
                    />
                  </label>
                )}

                {(selectedRound?.metadataTemplate?.allowGroupNumber ||
                  selectedRound?.type === "groupDiscussion") && (
                  <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                    Group Number
                    <Input
                      value={resultForm.groupNumber}
                      onChange={(event) =>
                        setResultForm((previous) => ({
                          ...previous,
                          groupNumber: event.target.value,
                        }))
                      }
                      placeholder="e.g. Group A"
                      className="mt-1"
                    />
                  </label>
                )}
              </div>

              <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                Remarks / Notes
                <textarea
                  value={resultForm.remarks}
                  onChange={(event) =>
                    setResultForm((previous) => ({
                      ...previous,
                      remarks: event.target.value,
                    }))
                  }
                  placeholder="Include any score, remarks or internal feedback here..."
                  className="mt-1"
                />
              </label>

              <div className="button-row mt-2">
                <Button
                  type="submit"
                  disabled={
                    updateResultMutation.isPending ||
                    !resultForm.studentId ||
                    !resultForm.roundId
                  }
                >
                  {updateResultMutation.isPending
                    ? "Updating Status…"
                    : "Update Progress"}
                </Button>
              </div>
            </form>

            {updateResultMutation.error ? (
              <div className="status-box error mt-4 text-xs">
                {updateResultMutation.error?.response?.data?.message ||
                  updateResultMutation.error.message}
              </div>
            ) : null}

            {updateResultMutation.isSuccess ? (
              <div className="status-box success mt-4 text-xs">Progress status upserted successfully.</div>
            ) : null}
          </section>

          <section className="panel nav-section">
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/rounds")}>
                Back: Configure Rounds
              </Button>
            </div>
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/")}>
                Go to Step 1
              </Button>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
