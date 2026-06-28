import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { UserCheck, Search, Sliders } from "lucide-react";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  fetchAdminProcess,
  fetchProcessStudents,
  updateStudentRoundResult,
  updateProcessRound,
  updateAdminProcessMetadata,
  bulkUpdateStudentRoundResults,
} from "@/utils/api";

const statusOptions = [
  "notStarted",
  "upNext",
  "ongoing",
  "nextRound",
  "rejected",
  "onHold",
  "awaitingResults",
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
  const [newPredefinedVenue, setNewPredefinedVenue] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [bulkGroupNumber, setBulkGroupNumber] = useState("");
  const [bulkStatus, setBulkStatus] = useState("upNext");
  const [activeTab, setActiveTab] = useState("individual");

  const [resultForm, setResultForm] = useState({
    studentId: "",
    roundId: "",
    status: "upNext",
    venue: "",
    groupNumber: "",
    remarks: "",
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ processId, roundId, payload }) =>
      bulkUpdateStudentRoundResults(processId, roundId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-process-students", selectedProcessId],
      });
      setSelectedStudentIds(new Set());
    },
  });

  useEffect(() => {
    setSelectedStudentIds(new Set());
    setActiveTab("individual");
  }, [resultForm.roundId, selectedProcessId]);

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

  const activeStudent = useMemo(() => {
    return students.find((s) => s.sapId === resultForm.studentId) || null;
  }, [students, resultForm.studentId]);

  useEffect(() => {
    if (!resultForm.roundId && rounds.length > 0) {
      setResultForm((previous) => ({ ...previous, roundId: rounds[0].id }));
    }
  }, [resultForm.roundId, rounds.length]);

  // Set the first candidate in search results as selected by default if nothing is selected
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

  // Populate/Sync form progress when active student or active round changes
  useEffect(() => {
    if (!resultForm.studentId || !resultForm.roundId || students.length === 0) {
      return;
    }

    const student = students.find((s) => s.sapId === resultForm.studentId);
    if (!student) {
      return;
    }

    const progress = student.roundProgress?.find(
      (p) => p.roundId === resultForm.roundId
    );

    setResultForm((previous) => ({
      ...previous,
      status: progress?.status || "upNext",
      venue: progress?.venue || "",
      groupNumber: progress?.groupNumber || "",
      remarks: progress?.remarks || "",
    }));
  }, [resultForm.studentId, resultForm.roundId, students]);

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

  const getStatusBadgeStyle = (stat) => {
    switch (stat) {
      case "nextRound":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "ongoing":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "upNext":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "onHold":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "awaitingResults":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const getStatusLabel = (stat) => {
    switch (stat) {
      case "notStarted": return "Not Started";
      case "ongoing": return "Ongoing";
      case "upNext": return "Up Next";
      case "nextRound": return "Next Round";
      case "onHold": return "On Hold";
      case "rejected": return "Rejected";
      case "awaitingResults": return "Awaiting Results";
      default: return stat.charAt(0).toUpperCase() + stat.slice(1);
    }
  };

  return (
    <AdminLayout
      title="Step 4: Update Candidate Progress"
      description="Select a candidate from the directory pane to update evaluation stages, status logs, venues, and remarks."
      processReady={Boolean(selectedProcessId)}
      selectedProcessLabel={selectedProcessLabel}
    >
      {!selectedProcessId ? (
        <section className="panel">
          <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Select a Process First</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Step 4 requires an active process selection. Choose or create a process using the selector dropdown in the navigation header.
          </p>
          <div className="button-row mt-4">
            <Button onClick={() => router.push("/")}>Go to Step 1</Button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Panel: Search and Directory List */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <article className="panel">
                <div className="relative w-full mb-3">
                  <Search size={16} className="text-neutral-400 absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search candidate (Name, SAP)..."
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex justify-between items-center mb-2">
                  <div className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider uppercase select-none">
                    Candidates List ({filteredStudents.length})
                  </div>
                  {selectedRound?.type === "groupDiscussion" && filteredStudents.length > 0 && (
                    <label className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={filteredStudents.every(s => selectedStudentIds.has(s.sapId))}
                        onChange={(e) => {
                          const next = new Set(selectedStudentIds);
                          if (e.target.checked) {
                            filteredStudents.forEach(s => {
                              if (s.sapId) next.add(s.sapId);
                            });
                          } else {
                            filteredStudents.forEach(s => {
                              next.delete(s.sapId);
                            });
                          }
                          setSelectedStudentIds(next);
                        }}
                        className="rounded border-neutral-300 text-black focus:ring-black h-3.5 w-3.5"
                      />
                      Select All
                    </label>
                  )}
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-[6px] border border-dashed border-neutral-200 text-xs text-neutral-400">
                    No candidates found.
                  </div>
                ) : (
                  <div className="flex flex-col max-h-[500px] overflow-y-auto border border-neutral-200 rounded-[6px] divide-y divide-neutral-100">
                    {filteredStudents.map((student) => {
                      const isSelected = student.sapId === resultForm.studentId;
                      const isChecked = selectedStudentIds.has(student.sapId);
                      const isGD = selectedRound?.type === "groupDiscussion";
                      return (
                        <div
                          key={student.studentDatabaseId || student.id}
                          className={`w-full flex items-center p-3 hover:bg-neutral-50/50 transition duration-150 border-l-4 gap-3 ${
                            isSelected
                              ? "bg-neutral-50 border-l-accent"
                              : "bg-white border-l-transparent"
                          }`}
                        >
                          {isGD && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = new Set(selectedStudentIds);
                                if (e.target.checked) {
                                  next.add(student.sapId);
                                } else {
                                  next.delete(student.sapId);
                                }
                                setSelectedStudentIds(next);
                              }}
                              className="rounded border-neutral-300 text-black focus:ring-black h-4 w-4 flex-shrink-0 cursor-pointer"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setResultForm((prev) => ({
                                ...prev,
                                studentId: student.sapId,
                              }))
                            }
                            className="flex-1 text-left flex flex-col gap-0.5 border-0 bg-transparent p-0 rounded-none focus:outline-none"
                          >
                            <span className="font-semibold text-xs text-neutral-950">
                              {student.fullName}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              SAP: {student.sapId} {student.branch ? `| ${student.branch}` : ""}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>

            {/* Right Panel: Workspace Form */}
            <div className="col-span-12 lg:col-span-8">
              <article className="panel">
                    {selectedRound?.type === "groupDiscussion" && (
                  <div className="flex border-b border-neutral-100 mb-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("individual")}
                      className={`p-2.5 text-xs font-semibold border-b-2 transition duration-150 ${
                        activeTab === "individual"
                          ? "border-accent text-accent"
                          : "border-transparent text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      Candidate Evaluation {selectedStudentIds.size > 0 && `(${selectedStudentIds.size} Selected)`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("groupStatus")}
                      className={`p-2.5 text-xs font-semibold border-b-2 transition duration-150 ${
                        activeTab === "groupStatus"
                          ? "border-accent text-accent"
                          : "border-transparent text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      Group Status Update
                    </button>
                  </div>
                )}

                {selectedRound?.type === "groupDiscussion" && activeTab === "groupStatus" ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedProcessId || !resultForm.roundId || !bulkGroupNumber) return;
                      bulkUpdateMutation.mutate({
                        processId: selectedProcessId,
                        roundId: resultForm.roundId,
                        payload: {
                          groupNumber: bulkGroupNumber,
                          status: bulkStatus,
                        },
                      });
                    }}
                    className="stack gap-4"
                  >
                    <h3 className="text-sm font-bold text-neutral-900 mb-0.5">Update Status Group-Wise</h3>
                    <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                      Select a group to update the status of all its members simultaneously (e.g., mark Group 1 as Ongoing).
                    </p>

                    <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider block">
                      Group Number
                      {selectedRound?.metadataTemplate?.maxGroups > 0 ? (
                        <Select
                          value={bulkGroupNumber}
                          onChange={(e) => setBulkGroupNumber(e.target.value)}
                          required
                          className="mt-1"
                        >
                          <option value="">-- Choose Group --</option>
                          {Array.from({ length: selectedRound.metadataTemplate.maxGroups }, (_, i) => String(i + 1)).map((num) => (
                            <option key={num} value={num}>
                              Group {num}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          placeholder="e.g. 1 or Group A"
                          value={bulkGroupNumber}
                          onChange={(e) => setBulkGroupNumber(e.target.value)}
                          required
                          className="mt-1"
                        />
                      )}
                    </label>

                    <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider block">
                      New Status
                      <Select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                        required
                        className="mt-1"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </Select>
                    </label>

                    <div className="pt-2">
                      <Button type="submit" disabled={bulkUpdateMutation.isPending} className="w-full sm:w-auto justify-center">
                        {bulkUpdateMutation.isPending ? "Updating Group..." : "Update Group Status"}
                      </Button>
                    </div>

                    {bulkUpdateMutation.isError && (
                      <div className="status-box error mt-4 text-xs">
                        {bulkUpdateMutation.error?.response?.data?.message || bulkUpdateMutation.error.message}
                      </div>
                    )}

                    {bulkUpdateMutation.isSuccess && (
                      <div className="status-box success mt-4 text-xs">
                        Group status updated successfully!
                      </div>
                    )}
                  </form>
                ) : (
                  selectedStudentIds.size > 0 ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!selectedProcessId || !resultForm.roundId || !bulkGroupNumber) return;
                        bulkUpdateMutation.mutate({
                          processId: selectedProcessId,
                          roundId: resultForm.roundId,
                          payload: {
                            studentIds: Array.from(selectedStudentIds),
                            groupNumber: bulkGroupNumber,
                          },
                        });
                      }}
                      className="stack gap-4"
                    >
                      <h3 className="text-sm font-bold text-neutral-900 mb-0.5">Bulk Group Assignment</h3>
                      <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                        You have selected <strong>{selectedStudentIds.size}</strong> candidate(s). Assign them to a group number below.
                      </p>

                      <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider block">
                        Assign Group Number
                        {selectedRound?.metadataTemplate?.maxGroups > 0 ? (
                          <Select
                            value={bulkGroupNumber}
                            onChange={(e) => setBulkGroupNumber(e.target.value)}
                            required
                            className="mt-1"
                          >
                            <option value="">-- Choose Group --</option>
                            {Array.from({ length: selectedRound.metadataTemplate.maxGroups }, (_, i) => String(i + 1)).map((num) => (
                              <option key={num} value={num}>
                                Group {num}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            placeholder="e.g. 1 or Group A"
                            value={bulkGroupNumber}
                            onChange={(e) => setBulkGroupNumber(e.target.value)}
                            required
                            className="mt-1"
                          />
                        )}
                      </label>

                      <div className="pt-2 flex gap-2">
                        <Button type="submit" disabled={bulkUpdateMutation.isPending} className="justify-center">
                          {bulkUpdateMutation.isPending ? "Assigning..." : "Assign to Group"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setSelectedStudentIds(new Set())}
                          className="justify-center"
                        >
                          Clear Selection
                        </Button>
                      </div>

                      {bulkUpdateMutation.isError && (
                        <div className="status-box error mt-4 text-xs">
                          {bulkUpdateMutation.error?.response?.data?.message || bulkUpdateMutation.error.message}
                        </div>
                      )}

                      {bulkUpdateMutation.isSuccess && (
                        <div className="status-box success mt-4 text-xs">
                          Candidates assigned to group successfully!
                        </div>
                      )}
                    </form>
                  ) : (
                    !resultForm.studentId || !activeStudent ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <UserCheck size={36} className="text-neutral-300 mb-3" />
                        <h3 className="text-sm font-bold text-neutral-700 mb-1">No Candidate Selected</h3>
                        <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                          Select a candidate profile from the directory on the left to start updating their placement progress parameters.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Header Details */}
                        <div className="pb-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h2 className="text-base font-bold text-neutral-900 mb-0.5">
                              Evaluation Workspace: {activeStudent.fullName}
                            </h2>
                            <p className="text-xs text-neutral-400 font-mono">
                              SAP ID: {activeStudent.sapId} {activeStudent.branch ? `| Stream: ${activeStudent.branch}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Stage Timeline */}
                        <div className="bg-neutral-50/50 p-4 border border-neutral-200/80 rounded-[6px]">
                          <span className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider uppercase block mb-3">
                            Placement Stage Timeline Progress
                          </span>
                          {rounds.length === 0 ? (
                            <p className="text-[11px] text-neutral-400 italic">No stages configured for this process yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {rounds.map((round) => {
                                const progress = activeStudent.roundProgress?.find(
                                  (p) => p.roundId === round.id
                                );
                                const status = progress?.status || "notStarted";

                                return (
                                  <div
                                    key={round.id}
                                    className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 ${getStatusBadgeStyle(
                                      status
                                    )}`}
                                  >
                                    <span className="font-semibold text-neutral-800">{round.name}:</span>
                                    <span>{getStatusLabel(status)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Progress Update Form */}
                        <form className="stack gap-4" onSubmit={onUpdateResult}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                              Target Evaluation Stage
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
                                {rounds.length === 0 ? (
                                  <option value="">No stages created</option>
                                ) : null}
                                {rounds.map((round) => (
                                  <option key={round.id} value={round.id}>
                                    {round.name}
                                  </option>
                                ))}
                              </Select>
                            </label>

                            <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                              Evaluation Status
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
                                    {getStatusLabel(status)}
                                  </option>
                                ))}
                              </Select>
                            </label>
                          </div>

                          {(selectedRound?.metadataTemplate?.allowVenue ||
                            selectedRound?.type === "technicalInterview" ||
                            selectedRound?.type === "hrInterview" ||
                            selectedRound?.metadataTemplate?.allowGroupNumber ||
                            selectedRound?.type === "groupDiscussion") && (
                            <div className="border border-neutral-100 rounded-md p-3 bg-neutral-50/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(selectedRound?.metadataTemplate?.allowVenue ||
                                selectedRound?.type === "technicalInterview" ||
                                selectedRound?.type === "hrInterview") && (
                                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider block">
                                  Venue Assignment
                                  <Select
                                    value={resultForm.venue}
                                    onChange={(event) => {
                                      const val = event.target.value;
                                      setResultForm((previous) => ({
                                        ...previous,
                                        venue: val,
                                      }));
                                    }}
                                    className="mt-1 text-xs"
                                  >
                                    <option value="">-- Choose Venue --</option>
                                    {processDetail?.predefinedVenues?.map((v) => (
                                      <option key={v} value={v}>
                                        {v}
                                      </option>
                                    ))}
                                    {resultForm.venue && processDetail?.predefinedVenues && !processDetail.predefinedVenues.includes(resultForm.venue) && (
                                      <option value={resultForm.venue}>{resultForm.venue} (Custom)</option>
                                    )}
                                  </Select>
                                </label>
                              )}

                              {(selectedRound?.metadataTemplate?.allowGroupNumber ||
                                selectedRound?.type === "groupDiscussion") && (
                                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider block">
                                  Group Code / Number
                                  {selectedRound?.metadataTemplate?.maxGroups > 0 ? (
                                    <Select
                                      value={resultForm.groupNumber}
                                      onChange={(event) =>
                                        setResultForm((previous) => ({
                                          ...previous,
                                          groupNumber: event.target.value,
                                        }))
                                      }
                                      className="mt-1"
                                    >
                                      <option value="">-- Choose Group --</option>
                                      {Array.from({ length: selectedRound.metadataTemplate.maxGroups }, (_, i) => String(i + 1)).map((num) => (
                                        <option key={num} value={num}>
                                          Group {num}
                                        </option>
                                      ))}
                                      {resultForm.groupNumber && !Array.from({ length: selectedRound.metadataTemplate.maxGroups }, (_, i) => String(i + 1)).includes(resultForm.groupNumber) && (
                                        <option value={resultForm.groupNumber}>{resultForm.groupNumber} (Custom)</option>
                                      )}
                                    </Select>
                                  ) : (
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
                                  )}
                                </label>
                              )}
                            </div>
                          )}

                          <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                            Remarks & Performance Notes
                            <textarea
                              value={resultForm.remarks}
                              onChange={(event) =>
                                setResultForm((previous) => ({
                                  ...previous,
                                  remarks: event.target.value,
                                }))
                              }
                              placeholder="Log exam scores, technical remarks, or interview notes..."
                              className="mt-1 font-sans"
                            />
                          </label>

                          <div className="pt-2">
                            <Button
                              type="submit"
                              disabled={
                                updateResultMutation.isPending ||
                                !resultForm.studentId ||
                                !resultForm.roundId
                              }
                              className="w-full sm:w-auto justify-center"
                            >
                              {updateResultMutation.isPending ? "Saving changes..." : "Update Progress"}
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
                          <div className="status-box success mt-4 text-xs">
                            Status parameters for {activeStudent.fullName} logged successfully!
                          </div>
                        ) : null}
                      </div>
                    )
                  )
                )}
              </article>
            </div>
          </div>

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
        </div>
      )}
    </AdminLayout>
  );
}
