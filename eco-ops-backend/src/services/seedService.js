import { DEMO_BUILDINGS, DEMO_USERS, IMPACT_ASSUMPTIONS } from '../config/constants.js'
import { User } from '../models/User.model.js'
import { Building } from '../models/Building.model.js'
import { Reading } from '../models/Reading.model.js'
import { Anomaly } from '../models/Anomaly.model.js'
import { Impact } from '../models/Impact.model.js'

export async function seedDatabase({ force = false } = {}) {
  console.log('[Seed] Starting database seeding...')

  // 1. Seed demo users
  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email })
    if (!existing) {
      await User.create({
        id: u.id,
        name: u.name,
        email: u.email,
        password: 'password123',
        role: u.role,
        team: u.team || null,
      })
    } else {
      existing.id = u.id
      existing.name = u.name
      existing.role = u.role
      if (u.team) existing.team = u.team
      await existing.save()
    }
  }

  // 2. Seed buildings
  for (const b of DEMO_BUILDINGS) {
    await Building.findOneAndUpdate(
      { id: b.id },
      { id: b.id, name: b.name, type: b.type, elecBase: b.elecBase, waterBase: b.waterBase },
      { upsert: true, new: true }
    )
  }

  // Check if readings already exist
  const existingReadingsCount = await Reading.countDocuments()
  if (existingReadingsCount > 0 && !force) {
    console.log(`[Seed] Readings already present (${existingReadingsCount}). Skipping reading generation.`)
    return {
      buildingsCreated: DEMO_BUILDINGS.length,
      readingsCreated: existingReadingsCount,
      anomaliesDetected: await Anomaly.countDocuments(),
      simulated: true,
    }
  }

  // Clear existing readings and anomalies if forcing or empty
  await Reading.deleteMany({ simulated: true })
  await Anomaly.deleteMany({})

  // 3. Generate 14 days of hourly readings
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const totalHours = 14 * 24 // 336 hours
  const startTime = new Date(now.getTime() - totalHours * 3600 * 1000)

  // Define 6 deterministic anomalies
  const anomalyDefs = [
    {
      id: 'anom-1',
      buildingId: 'building-hostel-b',
      buildingName: 'Hostel B',
      resource: 'water',
      hoursAgo: 18, // yesterday evening
      observedValue: 2400,
      baselineValue: 850,
      score: 2.82,
      reason: 'Water usage is 2.82x baseline: continuous overnight leak detected in washrooms',
    },
    {
      id: 'anom-2',
      buildingId: 'building-academic',
      buildingName: 'Academic Block',
      resource: 'electricity',
      hoursAgo: 42, // 2 days ago noon
      observedValue: 165,
      baselineValue: 70,
      score: 2.36,
      reason: 'Electricity usage is 2.36x baseline: central HVAC running full load during lunch hours',
    },
    {
      id: 'anom-3',
      buildingId: 'building-library',
      buildingName: 'Library',
      resource: 'electricity',
      hoursAgo: 90, // 3-4 days ago late night
      observedValue: 85,
      baselineValue: 30,
      score: 2.83,
      reason: 'Electricity draw is 2.83x baseline: lights and AC active after midnight closing hours',
    },
    {
      id: 'anom-4',
      buildingId: 'building-labs',
      buildingName: 'Labs & Workshop',
      resource: 'water',
      hoursAgo: 26, // yesterday early morning
      observedValue: 750,
      baselineValue: 220,
      score: 3.41,
      reason: 'Water usage is 3.41x baseline: cooling loop valve failure causing continuous drainage',
    },
    {
      id: 'anom-5',
      buildingId: 'building-hostel-a',
      buildingName: 'Hostel A',
      resource: 'electricity',
      hoursAgo: 114, // 5 days ago
      observedValue: 98,
      baselineValue: 42,
      score: 2.33,
      reason: 'Electricity draw is 2.33x baseline: unexpected daytime power surge across residential block',
    },
    {
      id: 'anom-6',
      buildingId: 'building-hostel-a',
      buildingName: 'Hostel A',
      resource: 'water',
      hoursAgo: 140, // 6 days ago
      observedValue: 2100,
      baselineValue: 900,
      score: 2.33,
      reason: 'Water flow is 2.33x baseline: rooftop overhead storage tank overflow alert',
    },
  ]

  // Map of timestamp strings to anomalies for quick lookup
  const anomalyLookup = {}
  const seededAnomalies = []

  for (const ad of anomalyDefs) {
    const anomTime = new Date(now.getTime() - ad.hoursAgo * 3600 * 1000)
    anomTime.setMinutes(0, 0, 0)
    const key = `${ad.buildingId}_${ad.resource}_${anomTime.toISOString()}`
    anomalyLookup[key] = { ...ad, timestamp: anomTime }

    seededAnomalies.push({
      id: ad.id,
      buildingId: ad.buildingId,
      buildingName: ad.buildingName,
      resource: ad.resource,
      timestamp: anomTime,
      observedValue: ad.observedValue,
      baselineValue: ad.baselineValue,
      score: ad.score,
      reason: ad.reason,
      status: 'open',
    })
  }

  // Insert the 6 anomalies
  await Anomaly.insertMany(seededAnomalies)

  const readingsToInsert = []

  for (let h = 0; h < totalHours; h++) {
    const readingTime = new Date(startTime.getTime() + h * 3600 * 1000)
    const hourOfDay = readingTime.getUTCHours()
    const dayOfWeek = readingTime.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    for (const b of DEMO_BUILDINGS) {
      // 1. Electricity calculation
      let elecFactor = 1.0
      if (b.type === 'hostel') {
        // Hostels: peak in morning (6-9) and evening (18-23)
        if (hourOfDay >= 6 && hourOfDay <= 9) elecFactor = 1.3
        else if (hourOfDay >= 18 && hourOfDay <= 23) elecFactor = 1.45
        else if (hourOfDay >= 1 && hourOfDay <= 5) elecFactor = 0.5
        else elecFactor = 0.8
      } else if (b.type === 'academic' || b.type === 'lab') {
        // Academic/Labs: peak 9-17, low on weekends
        if (isWeekend) {
          elecFactor = 0.35
        } else if (hourOfDay >= 9 && hourOfDay <= 17) {
          elecFactor = 1.4
        } else if (hourOfDay >= 18 && hourOfDay <= 21) {
          elecFactor = 0.7
        } else {
          elecFactor = 0.3
        }
      }

      // Add deterministic small fluctuation (sine wave based on hour + building id char code)
      const fluElec = Math.sin((h + b.id.charCodeAt(b.id.length - 1)) / 3) * 0.08
      const elecBaseline = Math.round(b.elecBase * elecFactor * 10) / 10
      let elecValue = Math.round((elecBaseline * (1 + fluElec)) * 10) / 10

      const elecKey = `${b.id}_electricity_${readingTime.toISOString()}`
      let isElecAnomaly = false
      if (anomalyLookup[elecKey]) {
        elecValue = anomalyLookup[elecKey].observedValue
        isElecAnomaly = true
      }

      readingsToInsert.push({
        buildingId: b.id,
        buildingName: b.name,
        resource: 'electricity',
        timestamp: readingTime,
        value: elecValue,
        baseline: elecBaseline,
        isAnomaly: isElecAnomaly,
        simulated: true,
      })

      // 2. Water calculation
      let waterFactor = 1.0
      if (b.type === 'hostel') {
        // Hostels: high usage in morning 6-9, evening 18-21
        if (hourOfDay >= 6 && hourOfDay <= 9) waterFactor = 1.5
        else if (hourOfDay >= 18 && hourOfDay <= 21) waterFactor = 1.3
        else if (hourOfDay >= 0 && hourOfDay <= 5) waterFactor = 0.2
        else waterFactor = 0.75
      } else {
        // Academic/Labs
        if (isWeekend) {
          waterFactor = 0.2
        } else if (hourOfDay >= 9 && hourOfDay <= 17) {
          waterFactor = 1.3
        } else {
          waterFactor = 0.15
        }
      }

      const fluWater = Math.cos((h + b.id.charCodeAt(b.id.length - 1)) / 4) * 0.07
      const waterBaseline = Math.round(b.waterBase * waterFactor * 10) / 10
      let waterValue = Math.round((waterBaseline * (1 + fluWater)) * 10) / 10

      const waterKey = `${b.id}_water_${readingTime.toISOString()}`
      let isWaterAnomaly = false
      if (anomalyLookup[waterKey]) {
        waterValue = anomalyLookup[waterKey].observedValue
        isWaterAnomaly = true
      }

      readingsToInsert.push({
        buildingId: b.id,
        buildingName: b.name,
        resource: 'water',
        timestamp: readingTime,
        value: waterValue,
        baseline: waterBaseline,
        isAnomaly: isWaterAnomaly,
        simulated: true,
      })
    }
  }

  // Insert readings in batches for optimal performance
  const BATCH_SIZE = 1000
  for (let i = 0; i < readingsToInsert.length; i += BATCH_SIZE) {
    await Reading.insertMany(readingsToInsert.slice(i, i + BATCH_SIZE))
  }

  // 4. Ensure Impact document
  const impactDoc = await Impact.findOne()
  if (!impactDoc) {
    await Impact.create({
      issuesDetected: 6,
      issuesResolved: 0,
      electricitySavedKwh: 0,
      waterSavedLitres: 0,
      moneySavedInr: 0,
      co2AvoidedKg: 0,
      assumptions: IMPACT_ASSUMPTIONS,
      simulated: true,
    })
  }

  console.log(`[Seed] Seeded ${DEMO_BUILDINGS.length} buildings, ${readingsToInsert.length} readings, 6 anomalies.`)

  return {
    buildingsCreated: DEMO_BUILDINGS.length,
    readingsCreated: readingsToInsert.length,
    anomaliesDetected: 6,
    simulated: true,
  }
}
