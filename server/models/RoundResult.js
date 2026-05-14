import mongoose from "mongoose";

export const roundResultStatuses = [
  "notStarted",
  "scheduled",
  "inProgress",
  "qualified",
  "rejected",
  "onHold",
];

const roundResultSchema = new mongoose.Schema(
  {
    processId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Process",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: roundResultStatuses,
      default: "scheduled",
    },
    venue: {
      type: String,
      trim: true,
      default: "",
    },
    groupNumber: {
      type: String,
      trim: true,
      default: "",
    },
    score: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

roundResultSchema.index({ processId: 1, studentId: 1, roundId: 1 }, { unique: true });
roundResultSchema.index({ processId: 1, roundId: 1, status: 1 });

const RoundResult =
  mongoose.models.RoundResult || mongoose.model("RoundResult", roundResultSchema);

export default RoundResult;
