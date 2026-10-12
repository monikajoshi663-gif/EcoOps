import mongoose from 'mongoose'

const anomalySchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    buildingId: { type: String, required: true, index: true },
    buildingName: { type: String, required: true },
    resource: { type: String, enum: ['electricity', 'water'], required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    observedValue: { type: Number, required: true },
    baselineValue: { type: Number, required: true },
    score: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['open', 'linked', 'resolved'], default: 'open', index: true },
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

export const Anomaly = mongoose.model('Anomaly', anomalySchema)
