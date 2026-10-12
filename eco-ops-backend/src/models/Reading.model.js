import mongoose from 'mongoose'

const readingSchema = new mongoose.Schema(
  {
    buildingId: { type: String, required: true, index: true },
    buildingName: { type: String, required: true },
    resource: { type: String, enum: ['electricity', 'water'], required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    value: { type: Number, required: true },
    baseline: { type: Number, required: true },
    isAnomaly: { type: Boolean, default: false },
    simulated: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

readingSchema.index({ buildingId: 1, resource: 1, timestamp: 1 }, { unique: true })

export const Reading = mongoose.model('Reading', readingSchema)
