# Proposed data model

## Sheets

- **Buildings**: canonical building IDs and names; never rely on display names as foreign keys.
- **Equipment**: equipment/asset records and PPM schedule fields.
- **ServiceRecords**: append-only service log. Each record has a client-generated `recordId` used as an idempotency key.
- **Staff**: staff IDs, display names, server-side PIN verifier/hash, role, assigned building IDs, active status.
- **Devices**: device enrollment and revocation state.
- **AuditLog**: sensitive actions such as PIN resets, staff deactivation, role changes, and record corrections.
- **Settings**: schema version and deployment settings.

## Offline service record

Minimum client payload:
- `recordId` (UUID)
- `schemaVersion`
- `staffId` (from authenticated session, not freely editable in production UI)
- `deviceId`
- `buildingId`
- `equipmentId`
- `serviceType`
- `date`
- `status`
- `notes`
- `createdAt`
- optional `jobRef`, `cost`

Server-owned fields:
- `receivedAt`
- verified actor identity
- permission decision / audit event

Do not trust `staffId`, `role`, `buildingId`, or `deviceId` merely because the client sent them. The server must verify them against the authenticated session and current access rules.
