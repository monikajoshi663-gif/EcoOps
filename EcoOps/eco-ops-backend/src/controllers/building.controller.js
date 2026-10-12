import { Building } from '../models/Building.model.js'

export async function getBuildings(req, res) {
  try {
    const buildings = await Building.find().sort({ name: 1 })
    return res.status(200).json({
      success: true,
      data: {
        buildings: buildings.map((b) => ({
          id: b.id,
          name: b.name,
          type: b.type,
          elecBase: b.elecBase,
          waterBase: b.waterBase,
        })),
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
