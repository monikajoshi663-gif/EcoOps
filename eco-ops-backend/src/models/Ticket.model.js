import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    complaintId: { type: String, default: null, index: true },
    buildingId: { type: String, required: true, index: true },
    location: { type: String, required: true },
    issue: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    cause: { type: String, default: '' },
    recommendedAction: { type: String, default: '' },
    assignee: {
      team: { type: String, default: 'facilities' },
      userId: { type: String, default: null },
      name: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'resolved'],
      default: 'open',
      index: true,
    },
    resolutionNote: { type: String, default: null },
    impact: {
      electricitySavedKwh: { type: Number, default: 0 },
      waterSavedLitres: { type: Number, default: 0 },
      moneySavedInr: { type: Number, default: 0 },
      co2AvoidedKg: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret.id || ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export const Ticket = mongoose.model('Ticket', ticketSchema)
