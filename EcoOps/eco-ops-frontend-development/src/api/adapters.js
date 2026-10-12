export function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return record
  const r = { ...record, id: record.id ?? record._id }
  if (r.observedValue !== undefined && r.value === undefined) r.value = r.observedValue
  if (r.baselineValue !== undefined && r.baseline === undefined) r.baseline = r.baselineValue
  if (r.score !== undefined && r.zScore === undefined) r.zScore = r.score
  if (r.reason !== undefined && r.description === undefined) r.description = r.reason
  return r
}

export function withId(record) {
  return normalizeRecord(record)
}

export function unwrapList(body, key) {
  if (Array.isArray(body)) return body.map(withId)
  if (body && typeof body === 'object') {
    const dataObj = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null
    const list =
      (dataObj && (dataObj[key] ?? dataObj.items ?? dataObj.series ?? dataObj.buildings ?? dataObj.users ?? dataObj.anomalies ?? dataObj.logs)) ??
      body[key] ??
      (Array.isArray(body.data) ? body.data : null) ??
      body.items ??
      body.results
    if (Array.isArray(list)) return list.map(withId)
  }
  return []
}

export function readChatReply(body) {
  if (typeof body === 'string') return body
  if (body && typeof body === 'object') {
    return body.reply ?? body.answer ?? body.data?.answer ?? body.data?.reply ?? body.message ?? body.response ?? body.text ?? JSON.stringify(body)
  }
  return ''
}

export function unwrapObject(body, key) {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const dataObj = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null
    const inner = (key && body[key]) ?? (dataObj && key && dataObj[key]) ?? body.data
    let res = inner && typeof inner === 'object' && !Array.isArray(inner) ? withId(inner) : withId(body)

    if (res && (res.electricitySavedKwh !== undefined || res.kwhSaved !== undefined)) {
      res = {
        ...res,
        kwhSaved: res.kwhSaved ?? res.electricitySavedKwh ?? 0,
        litresSaved: res.litresSaved ?? res.waterSavedLitres ?? 0,
        rupeesSaved: res.rupeesSaved ?? res.moneySavedInr ?? 0,
        co2Saved: res.co2Saved ?? res.co2AvoidedKg ?? 0,
        assumptions: res.assumptions
          ? {
              ...res.assumptions,
              tariffPerKwh: res.assumptions.tariffPerKwh ?? res.assumptions.electricityTariffInrPerKwh ?? 8,
              tariffPerLitre: res.assumptions.tariffPerLitre ?? res.assumptions.waterCostInrPerLitre ?? 0.05,
              co2PerKwh: res.assumptions.co2PerKwh ?? res.assumptions.electricityEmissionKgCo2PerKwh ?? 0.82,
              co2PerLitre: res.assumptions.co2PerLitre ?? 0.0003,
            }
          : res.assumptions,
      }
    }
    return res
  }
  return body
}
