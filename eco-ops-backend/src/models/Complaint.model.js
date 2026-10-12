import mongoose from 'mongoose'

const complaintSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['water_leak', 'lights_ac_left_on', 'waste', 'other'],
      required: true,
    },
    buildingId: { type: String, required: true, index: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, minlength: 5, maxlength: 2000, trim: true },
    imageUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['submitted', 'in_review', 'resolved'],
      default: 'submitted',
      index: true,
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

export const Complaint = mongoose.model('Complaint', complaintSchema)
