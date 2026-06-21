import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import {
  Plus,
  History,
  Sliders,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import useSelectedProcessId from "@/hooks/useSelectedProcessId";
import {
  addProcessRound,
  fetchAdminProcess,
  removeProcessRound,
  updateProcessRound,
} from "@/utils/api";

const roundTypeOptions = [
  { value: "groupDiscussion", label: "Group Discussion" },
  { value: "technicalInterview", label: "Technical Interview" },
  { value: "hrInterview", label: "HR Interview" },
  { value: "aptitude", label: "Aptitude Test" },
  { value: "codingTest", label: "Coding Test" },
  { value: "custom", label: "Custom" },
];

const predefinedRounds = [
  { value: "groupDiscussion", label: "Group Discussion", type: "groupDiscussion" },
  { value: "technicalInterview", label: "Technical Interview", type: "technicalInterview" },
  { value: "hrInterview", label: "HR Interview", type: "hrInterview" },
  { value: "aptitude", label: "Aptitude Test", type: "aptitude" },
  { value: "codingTest", label: "Coding Test", type: "codingTest" },
  { value: "custom", label: "Custom", type: "custom" },
];

function formatTypeLabel(type) {
  const option = roundTypeOptions.find((item) => item.value === type);
  return option ? option.label : type;
}

function formatTimestamp(value) {
  if (!value) {
    return "-";
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return "-";
  }

  return new Date(timestamp).toLocaleString();
}

export default function RoundsStepPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { selectedProcessId } = useSelectedProcessId();

  const [newRoundForm, setNewRoundForm] = useState({
    name: "Group Discussion",
    type: "groupDiscussion",
    selectedNameOption: "groupDiscussion",
    order: "",
    allowVenue: false,
    allowGroupNumber: false,
  });

  const [roundDrafts, setRoundDrafts] = useState({});
  const [addRoundAck, setAddRoundAck] = useState("");
  const [newVenueInputs, setNewVenueInputs] = useState({});

  function handleAddPredefinedVenue(roundId) {
    const venueText = (newVenueInputs[roundId] || "").trim();
    if (!venueText) return;

    setRoundDrafts((prev) => {
      const draft = prev[roundId];
      if (!draft) return prev;
      const currentVenues = draft.predefinedVenues || [];
      if (currentVenues.includes(venueText)) return prev;

      return {
        ...prev,
        [roundId]: {
          ...draft,
          predefinedVenues: [...currentVenues, venueText],
        },
      };
    });

    setNewVenueInputs((prev) => ({
      ...prev,
      [roundId]: "",
    }));
  }

  function handleRemovePredefinedVenue(roundId, indexToRemove) {
    setRoundDrafts((prev) => {
      const draft = prev[roundId];
      if (!draft) return prev;
      const currentVenues = draft.predefinedVenues || [];

      return {
        ...prev,
        [roundId]: {
          ...draft,
          predefinedVenues: currentVenues.filter((_, idx) => idx !== indexToRemove),
        },
      };
    });
  }

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const processDetailQuery = useQuery({
    queryKey: ["admin-process-detail", selectedProcessId],
    queryFn: () => fetchAdminProcess(selectedProcessId),
    enabled: Boolean(selectedProcessId),
  });

  const processDetail = processDetailQuery.data?.process || null;
  const rounds = processDetail?.rounds || [];

  const selectedProcessLabel = useMemo(() => {
    if (!processDetail) {
      return "";
    }

    return processDetail.processName || processDetail.processIdentifier || "";
  }, [processDetail]);

  useEffect(() => {
    setAddRoundAck("");
  }, [selectedProcessId]);

  useEffect(() => {
    if (!selectedProcessId) {
      setRoundDrafts({});
      setAddRoundAck("");
      return;
    }

    setRoundDrafts((previous) => {
      const nextDrafts = { ...previous };
      const validRoundIds = new Set(rounds.map((round) => round.id));

      Object.keys(nextDrafts).forEach((roundId) => {
        if (!validRoundIds.has(roundId)) {
          delete nextDrafts[roundId];
        }
      });

      rounds.forEach((round) => {
        if (!nextDrafts[round.id]) {
          nextDrafts[round.id] = {
            name: round.name,
            type: round.type,
            order: String(round.order),
            isActive: Boolean(round.isActive),
            allowVenue: Boolean(round.metadataTemplate?.allowVenue),
            allowGroupNumber: Boolean(round.metadataTemplate?.allowGroupNumber),
            predefinedVenues: round.predefinedVenues || [],
          };
        }
      });

      return nextDrafts;
    });
  }, [selectedProcessId, rounds.length]);

  const addRoundMutation = useMutation({
    mutationFn: ({ processId, payload }) => addProcessRound(processId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-process-detail", selectedProcessId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });

      const newRound = response?.process?.rounds?.[response.process.rounds.length - 1];
      setAddRoundAck(
        newRound
          ? `Added round: ${newRound.name} (Order ${newRound.order})`
          : "Round added successfully."
      );

      setNewRoundForm({
        name: "Group Discussion",
        type: "groupDiscussion",
        selectedNameOption: "groupDiscussion",
        order: "",
        allowVenue: false,
        allowGroupNumber: false,
      });
    },
  });

  const updateRoundMutation = useMutation({
    mutationFn: ({ processId, roundId, payload }) =>
      updateProcessRound(processId, roundId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-process-detail", selectedProcessId],
      });
    },
  });

  const deleteRoundMutation = useMutation({
    mutationFn: ({ processId, roundId }) => removeProcessRound(processId, roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-process-detail", selectedProcessId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-process-list"] });
      setAddRoundAck("Round deleted successfully.");
    },
  });

  const roundHistory = useMemo(() => {
    return [...rounds].sort((a, b) => {
      const aTime = Date.parse(a.createdAt || "") || 0;
      const bTime = Date.parse(b.createdAt || "") || 0;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return (a.order || 0) - (b.order || 0);
    });
  }, [rounds]);

  function onAddRound(event) {
    event.preventDefault();

    if (!selectedProcessId) {
      return;
    }

    setAddRoundAck("");

    addRoundMutation.mutate({
      processId: selectedProcessId,
      payload: {
        name: newRoundForm.name,
        type: newRoundForm.type,
        order: Number(newRoundForm.order) || undefined,
        metadataTemplate: {
          allowVenue: Boolean(newRoundForm.allowVenue),
          allowGroupNumber: Boolean(newRoundForm.allowGroupNumber),
        },
      },
    });
  }

  function onSaveRound(roundId) {
    const draft = roundDrafts[roundId];

    if (!draft || !selectedProcessId) {
      return;
    }

    updateRoundMutation.mutate({
      processId: selectedProcessId,
      roundId,
      payload: {
        name: draft.name,
        type: draft.type,
        order: Number(draft.order),
        isActive: Boolean(draft.isActive),
        metadataTemplate: {
          allowVenue: Boolean(draft.allowVenue),
          allowGroupNumber: Boolean(draft.allowGroupNumber),
        },
        predefinedVenues: draft.predefinedVenues || [],
      },
    });
  }

  function onDeleteRound(roundId, name) {
    if (!selectedProcessId) {
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Round Stage",
      message: `Are you sure you want to delete the stage "${name}"? This will permanently remove all candidate progress records for this round.`,
      onConfirm: () => {
        deleteRoundMutation.mutate({ processId: selectedProcessId, roundId });
      },
    });
  }

  return (
    <AdminLayout
      title="Step 3: Manage Rounds"
      description="Add new rounds, edit existing rounds, and review round history for the selected process." 
      processReady={Boolean(selectedProcessId)}
      selectedProcessLabel={selectedProcessLabel}
    >
      {!selectedProcessId ? (
        <section className="panel">
          <h2>Select a Process First</h2>
          <p className="muted">
            Step 3 requires an active process selection. Go back to Step 1 and select/create a process.
          </p>
          <div className="button-row" style={{ marginTop: ".9rem" }}>
            <Button onClick={() => router.push("/")}>Go to Step 1</Button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="panel">
              <h2 className="text-base font-bold tracking-tight mb-4 text-neutral-900 border-b border-neutral-100 pb-2">Add Stage</h2>
              <form className="stack" onSubmit={onAddRound}>
                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                  Select Round Name
                  <Select
                    value={newRoundForm.selectedNameOption}
                    onChange={(event) => {
                      const val = event.target.value;
                      const matchedOption = predefinedRounds.find(opt => opt.value === val);
                      setNewRoundForm((previous) => ({
                        ...previous,
                        selectedNameOption: val,
                        name: val === "custom" ? "" : (matchedOption ? matchedOption.label : ""),
                        type: val === "custom" ? "custom" : (matchedOption ? matchedOption.type : "custom"),
                      }));
                    }}
                    className="mt-1"
                  >
                    {predefinedRounds.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>

                {newRoundForm.selectedNameOption === "custom" && (
                  <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                    Custom Stage / Round Name
                    <Input
                      value={newRoundForm.name}
                      onChange={(event) =>
                        setNewRoundForm((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Managerial Round"
                      required
                      className="mt-1"
                    />
                  </label>
                )}

                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                  Stage Type
                  <Select
                    value={newRoundForm.type}
                    onChange={(event) =>
                      setNewRoundForm((previous) => ({
                        ...previous,
                        type: event.target.value,
                      }))
                    }
                    className="mt-1"
                  >
                    {roundTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                  Order Index (Optional)
                  <Input
                    type="number"
                    min="1"
                    value={newRoundForm.order}
                    onChange={(event) =>
                      setNewRoundForm((previous) => ({
                        ...previous,
                        order: event.target.value,
                      }))
                    }
                    placeholder="Auto-increment if empty"
                    className="mt-1"
                  />
                </label>

                <div className="checkbox-row mt-1 py-1">
                  <label className="text-xs text-neutral-600 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newRoundForm.allowGroupNumber}
                      onChange={(event) =>
                        setNewRoundForm((previous) => ({
                          ...previous,
                          allowGroupNumber: event.target.checked,
                        }))
                      }
                      className="rounded-[3px] border-neutral-300 text-black focus:ring-black h-3.5 w-3.5"
                    />
                    Enable Group Number
                  </label>

                  <label className="text-xs text-neutral-600 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newRoundForm.allowVenue}
                      onChange={(event) =>
                        setNewRoundForm((previous) => ({
                          ...previous,
                          allowVenue: event.target.checked,
                        }))
                      }
                      className="rounded-[3px] border-neutral-300 text-black focus:ring-black h-3.5 w-3.5"
                    />
                    Enable Venue Info
                  </label>
                </div>

                <Button type="submit" disabled={addRoundMutation.isPending} className="w-full justify-center">
                  <Plus size={14} strokeWidth={2.5} className="mr-1.5" />
                  {addRoundMutation.isPending ? "Adding…" : "Add Stage"}
                </Button>
              </form>

              {addRoundAck ? <div className="status-box success mt-4 text-xs">{addRoundAck}</div> : null}

              {addRoundMutation.error ? (
                <div className="status-box error mt-4 text-xs">
                  {addRoundMutation.error?.response?.data?.message ||
                    addRoundMutation.error.message}
                </div>
              ) : null}
            </article>
            
            <article className="panel">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
                <History size={20} className="text-neutral-500" />
                <h2 className="text-base font-bold tracking-tight text-neutral-900 mb-0">Rounds Timelines History</h2>
              </div>
              {roundHistory.length === 0 ? (
                <div className="flex h-36 items-center justify-center rounded-[6px] border border-dashed border-neutral-200 text-xs text-neutral-400">
                  No rounds created yet
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th className="font-mono text-[9px]">Added Timestamp</th>
                        <th className="font-mono text-[9px]">Round</th>
                        <th className="font-mono text-[9px]">Type</th>
                        <th className="font-mono text-[9px]">Order</th>
                        <th className="font-mono text-[9px]">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundHistory.map((round) => (
                        <tr key={round.id} className="text-xs text-neutral-700">
                          <td className="font-mono text-[10px]">{formatTimestamp(round.createdAt)}</td>
                          <td className="font-semibold">{round.name}</td>
                          <td className="font-mono text-[10px]">{formatTypeLabel(round.type)}</td>
                          <td className="font-mono">{round.order}</td>
                          <td>
                            <span className={`inline-block h-2 w-2 rounded-full ${round.isActive === false ? "bg-neutral-300" : "bg-emerald-500"}`} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>

          <section className="panel mt-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
              <Sliders size={20} className="text-neutral-500" />
              <h2 className="text-base font-bold tracking-tight text-neutral-900 mb-0">Configure Stage Templates</h2>
            </div>
            {rounds.length === 0 ? (
              <div className="flex h-36 items-center justify-center rounded-[6px] border border-dashed border-neutral-200 text-xs text-neutral-400">
                No active stages configured. Add a stage above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rounds.map((round) => {
                  const draft = roundDrafts[round.id];
                  if (!draft) {
                    return null;
                  }

                  return (
                    <article key={round.id} className="round-card border border-neutral-200 bg-neutral-50/30 p-4 rounded-[6px] flex flex-col justify-between">
                      <div className="space-y-3">
                        <header className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <h3 className="text-xs font-bold text-neutral-900">{round.name}</h3>
                          <small className="text-[10px] font-mono font-medium text-accent uppercase tracking-wider">{formatTypeLabel(round.type)}</small>
                        </header>

                        <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider mt-2">
                          Display Name
                          <Input
                            value={draft.name}
                            onChange={(event) =>
                              setRoundDrafts((previous) => ({
                                ...previous,
                                [round.id]: {
                                  ...previous[round.id],
                                  name: event.target.value,
                                },
                              }))
                            }
                            className="mt-1"
                          />
                        </label>

                        <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                          Stage Type
                          <Select
                            value={draft.type}
                            onChange={(event) =>
                              setRoundDrafts((previous) => ({
                                ...previous,
                                [round.id]: {
                                  ...previous[round.id],
                                  type: event.target.value,
                                },
                              }))
                            }
                            className="mt-1"
                          >
                            {roundTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </label>

                        <label className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider">
                          Order Index
                          <Input
                            type="number"
                            min="1"
                            value={draft.order}
                            onChange={(event) =>
                              setRoundDrafts((previous) => ({
                                ...previous,
                                [round.id]: {
                                  ...previous[round.id],
                                  order: event.target.value,
                                },
                              }))
                            }
                            className="mt-1 font-mono"
                          />
                        </label>

                        <div className="checkbox-row mt-1 py-1">
                          <label className="text-[11px] text-neutral-600 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draft.allowGroupNumber}
                              onChange={(event) =>
                                setRoundDrafts((previous) => ({
                                  ...previous,
                                  [round.id]: {
                                    ...previous[round.id],
                                    allowGroupNumber: event.target.checked,
                                  },
                                }))
                              }
                              className="rounded-[3px] border-neutral-300 text-black focus:ring-black h-3.5 w-3.5"
                            />
                            Group Info
                          </label>

                          <label className="text-[11px] text-neutral-600 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draft.allowVenue}
                              onChange={(event) =>
                                setRoundDrafts((previous) => ({
                                  ...previous,
                                  [round.id]: {
                                    ...previous[round.id],
                                    allowVenue: event.target.checked,
                                  },
                                }))
                              }
                              className="rounded-[3px] border-neutral-300 text-black focus:ring-black h-3.5 w-3.5"
                            />
                            Venue Info
                          </label>
                        </div>

                        {draft.allowVenue && (
                          <div className="space-y-1.5 mt-2 pt-2 border-t border-neutral-100">
                            <span className="text-[10px] font-mono text-neutral-400 font-semibold tracking-wider block">
                              Predefined Venues
                            </span>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g. Lab 4"
                                value={newVenueInputs[round.id] || ""}
                                onChange={(e) =>
                                  setNewVenueInputs((prev) => ({
                                    ...prev,
                                    [round.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 text-xs py-1 px-2 h-8"
                              />
                              <Button
                                type="button"
                                onClick={() => handleAddPredefinedVenue(round.id)}
                                className="text-xs py-1 px-2.5 h-8 w-auto justify-center"
                              >
                                Add
                              </Button>
                            </div>
                            {draft.predefinedVenues && draft.predefinedVenues.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {draft.predefinedVenues.map((venue, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 bg-neutral-200/80 dark:bg-neutral-800 text-[10px] font-medium text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded"
                                  >
                                    {venue}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemovePredefinedVenue(round.id, index)
                                      }
                                      className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs hover:scale-110 transition-transform"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-neutral-400 italic">No venues predefined.</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4 justify-between w-full">
                        <Button
                          onClick={() => onSaveRound(round.id)}
                          disabled={updateRoundMutation.isPending}
                          variant="secondary"
                          className="text-xs py-1.5 px-3 flex-1 justify-center"
                        >
                          <Save size={12} strokeWidth={2.5} className="mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => onDeleteRound(round.id, round.name)}
                          disabled={deleteRoundMutation.isPending}
                          className="text-xs py-1.5 px-3 flex-1 justify-center"
                        >
                          <Trash2 size={12} strokeWidth={2.5} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {updateRoundMutation.error ? (
              <div className="status-box error mt-4 text-xs">
                {updateRoundMutation.error?.response?.data?.message ||
                  updateRoundMutation.error.message}
              </div>
            ) : null}

            {deleteRoundMutation.error ? (
              <div className="status-box error mt-4 text-xs">
                {deleteRoundMutation.error?.response?.data?.message ||
                  deleteRoundMutation.error.message}
              </div>
            ) : null}
          </section>

          <section className="panel nav-section">
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/students")}>
                Back: Import Students
              </Button>
            </div>
            <div className="button-row">
              <Button onClick={() => router.push("/progress")}>Next: Update Progress</Button>
            </div>
          </section>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-md p-6 rounded-lg shadow-xl animate-floatIn">
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
