import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    to: { type: String, required: true, index: true }, // e.g. 'demo-staff', 'demo-admin', or user id
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['ticket_assigned', 'approval_needed', 'ticket_resolved', 'general'],
      default: 'general',
    },
    read: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now },
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

export const Notification = mongoose.model('Notification', notificationSchema)
