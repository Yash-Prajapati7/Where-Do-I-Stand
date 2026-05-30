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
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
      default: "",
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
studentSchema.index({ processId: 1, fullName: 1 });

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;

