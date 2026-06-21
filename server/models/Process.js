import mongoose from "mongoose";

const customFieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    valueType: {
      type: String,
      enum: ["text", "number"],
      default: "text",
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const roundMetadataTemplateSchema = new mongoose.Schema(
  {
    allowVenue: {
      type: Boolean,
      default: false,
    },
    allowGroupNumber: {
      type: Boolean,
      default: false,
    },
    customFields: {
      type: [customFieldSchema],
      default: [],
    },
  },
  { _id: false }
);

const roundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "groupDiscussion",
        "technicalInterview",
        "hrInterview",
        "aptitude",
        "codingTest",
        "custom",
      ],
      default: "custom",
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    metadataTemplate: {
      type: roundMetadataTemplateSchema,
      default: () => ({
        allowVenue: false,
        allowGroupNumber: false,
        customFields: [],
      }),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    predefinedVenues: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const studentSchema = new mongoose.Schema(
  {
    sapId: {
      type: String,
      required: true,
      trim: true,
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

const processSchema = new mongoose.Schema(
  {
    processName: {
      type: String,
      required: true,
      trim: true,
    },
    processIdentifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    rounds: {
      type: [roundSchema],
      default: [],
    },
    students: {
      type: [studentSchema],
      default: [],
    },
    statusColors: {
      type: Map,
      of: String,
      default: () => ({
        notStarted: "#f3f4f6",
        scheduled: "#dbeafe",
        inProgress: "#fef3c7",
        qualified: "#d1fae5",
        rejected: "#fee2e2",
        onHold: "#f3e8ff",
      }),
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

processSchema.index({ processIdentifier: 1 }, { unique: true });
processSchema.index({ processName: 1 });

const Process = mongoose.models.Process || mongoose.model("Process", processSchema);

export default Process;
