import mongoose from 'mongoose'
import { IMPACT_ASSUMPTIONS } from '../config/constants.js'

const impactSchema = new mongoose.Schema(
  {
    issuesDetected: { type: Number, default: 0 },
    issuesResolved: { type: Number, default: 0 },
    electricitySavedKwh: { type: Number, default: 0 },
    waterSavedLitres: { type: Number, default: 0 },
    moneySavedInr: { type: Number, default: 0 },
    co2AvoidedKg: { type: Number, default: 0 },
    assumptions: {
      type: Object,
      default: IMPACT_ASSUMPTIONS,
    },
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

export const Impact = mongoose.model('Impact', impactSchema)
