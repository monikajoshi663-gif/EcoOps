# Changelog - EcoOps Frontend

## [1.0.1] - 2026-10-12
### Added
- Created `FRONTEND_STATUS.md` and `FRONTEND_IMPLEMENTATION.md`.
- Exported `setDemoUser` and `getDemoUser` in `src/api/client.js` and `src/api/index.js`.
- Added dynamic `X-Demo-User-Id` header insertion on every outbound request.

### Fixed
- Fixed `src/api/adapters.js` to correctly unwrap nested API responses (`{ data: { items: [...] } }`).
- Added bidirectional field aliasing for anomaly metrics (`observedValue` <-> `value`, `baselineValue` <-> `baseline`, `score` <-> `zScore`, `reason` <-> `description`).
- Added metric normalizers for campus impact values (`electricitySavedKwh`, `waterSavedLitres`, `moneySavedInr`, `co2AvoidedKg`).
- Aligned notification read endpoint with contract (`PATCH /api/notifications/:id` with `{ read: true }`).
- Corrected buildingId passing during complaint creation.
- Updated `src/api/services/usage.js` and `src/api/services/anomalies.js` to accept both `building` and `buildingId` parameter formats.

### Verified
- Executed `npm run build` with 0 warnings or errors.
