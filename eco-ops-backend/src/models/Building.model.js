import mongoose from 'mongoose'

const buildingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['hostel', 'academic', 'lab'], required: true },
    elecBase: { type: Number, default: 50 },
    waterBase: { type: Number, default: 500 },
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

export const Building = mongoose.model('Building', buildingSchema)
