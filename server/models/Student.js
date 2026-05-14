import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    processId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Process",
      required: true,
      index: true,
    },
    sapId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: "",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    branch: {
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

studentSchema.index(
  { processId: 1, sapId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sapId: { $exists: true, $ne: "" },
    },
  }
);
studentSchema.index({ processId: 1, rollNumber: 1 });
studentSchema.index({ processId: 1, fullName: 1 });

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
