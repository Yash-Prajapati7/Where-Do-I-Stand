import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

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
    name: "",
    type: "custom",
    order: "",
    allowVenue: false,
    allowGroupNumber: false,
  });

  const [roundDrafts, setRoundDrafts] = useState({});
  const [addRoundAck, setAddRoundAck] = useState("");

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
        name: "",
        type: "custom",
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
      },
    });
  }

  function onDeleteRound(roundId) {
    if (!selectedProcessId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this round? Existing round results for this round will also be removed."
    );

    if (!shouldDelete) {
      return;
    }

    deleteRoundMutation.mutate({ processId: selectedProcessId, roundId });
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
          <section className="grid-two">
            <article className="panel">
              <h2>Add Round</h2>
              <form className="stack" onSubmit={onAddRound}>
                <label>
                  Round Name
                  <Input
                    value={newRoundForm.name}
                    onChange={(event) =>
                      setNewRoundForm((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Example: Round 1 - Technical"
                    required
                  />
                </label>

                <label>
                  Round Type
                  <Select
                    value={newRoundForm.type}
                    onChange={(event) =>
                      setNewRoundForm((previous) => ({
                        ...previous,
                        type: event.target.value,
                      }))
                    }
                  >
                    {roundTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>

                <label>
                  Order (Optional)
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
                  />
                </label>

                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={newRoundForm.allowGroupNumber}
                      onChange={(event) =>
                        setNewRoundForm((previous) => ({
                          ...previous,
                          allowGroupNumber: event.target.checked,
                        }))
                      }
                    />
                    Enable Group Number
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={newRoundForm.allowVenue}
                      onChange={(event) =>
                        setNewRoundForm((previous) => ({
                          ...previous,
                          allowVenue: event.target.checked,
                        }))
                      }
                    />
                    Enable Venue
                  </label>
                </div>

                <Button type="submit" disabled={addRoundMutation.isPending}>
                  {addRoundMutation.isPending ? "Adding…" : "Add Round"}
                </Button>
              </form>

              {addRoundAck ? <div className="status-box success">{addRoundAck}</div> : null}

              {addRoundMutation.error ? (
                <div className="status-box error">
                  {addRoundMutation.error?.response?.data?.message ||
                    addRoundMutation.error.message}
                </div>
              ) : null}
            </article>

            <article className="panel">
              <h2>Round History</h2>
              {roundHistory.length === 0 ? (
                <p className="muted">No rounds created yet.</p>
              ) : (
                <div className="table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Added</th>
                        <th>Round</th>
                        <th>Type</th>
                        <th>Order</th>
                        <th>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundHistory.map((round) => (
                        <tr key={round.id}>
                          <td>{formatTimestamp(round.createdAt)}</td>
                          <td>{round.name}</td>
                          <td>{formatTypeLabel(round.type)}</td>
                          <td>{round.order}</td>
                          <td>{round.isActive === false ? "No" : "Yes"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>

          <section className="panel">
            <h2>Manage Existing Rounds</h2>
            {rounds.length === 0 ? (
              <p className="muted">No rounds created yet.</p>
            ) : (
              <div className="round-grid">
                {rounds.map((round) => {
                  const draft = roundDrafts[round.id];
                  if (!draft) {
                    return null;
                  }

                  return (
                    <article key={round.id} className="round-card">
                      <header>
                        <h3>{round.name}</h3>
                        <small>{formatTypeLabel(round.type)}</small>
                      </header>

                      <label>
                        Name
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
                        />
                      </label>

                      <label>
                        Type
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
                        >
                          {roundTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </label>

                      <label>
                        Order
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
                        />
                      </label>

                      <div className="checkbox-row">
                        <label>
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
                          />
                          Group Number
                        </label>

                        <label>
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
                          />
                          Venue
                        </label>
                      </div>

                      <div className="button-row">
                        <Button
                          onClick={() => onSaveRound(round.id)}
                          disabled={updateRoundMutation.isPending}
                        >
                          Save Round
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => onDeleteRound(round.id)}
                          disabled={deleteRoundMutation.isPending}
                        >
                          Remove Round
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {updateRoundMutation.error ? (
              <div className="status-box error">
                {updateRoundMutation.error?.response?.data?.message ||
                  updateRoundMutation.error.message}
              </div>
            ) : null}

            {deleteRoundMutation.error ? (
              <div className="status-box error">
                {deleteRoundMutation.error?.response?.data?.message ||
                  deleteRoundMutation.error.message}
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="button-row">
              <Button variant="secondary" onClick={() => router.push("/students")}
              >
                Back: Students
              </Button>
              <Button onClick={() => router.push("/progress")}>Next: Progress</Button>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
