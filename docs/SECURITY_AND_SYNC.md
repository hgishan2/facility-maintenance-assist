# Security and synchronization rules

## Authentication model

1. Admin creates staff IDs and issues an initial PIN through a protected admin workflow.
2. Store a salted, slow PIN hash on the server; never store plaintext PINs in Sheets.
3. Do not use a short PIN as a long-lived bearer token. Online sign-in should establish a revocable session/device credential.
4. For offline sign-in, a device must first be enrolled while online and receive only the minimum data required for local verification.
5. Keep an offline session expiry. Once expired, require an online check.
6. A PIN reset or staff deactivation takes effect on the server immediately, but a disconnected device learns of it only when it reconnects.
7. On shared devices, explicit sign-out switches the active user; queued records retain their original creator and cannot be reassigned by the next user.

## Local storage

- Use IndexedDB for the durable outbox and cached reference data.
- Keep the minimum necessary personal or operational data on device.
- Avoid caching PINs, server secrets, or unrestricted staff lists.
- Consider a device-specific encryption key, but document that browser-side encryption cannot fully protect data if the device and browser profile are compromised.
- Provide a "clear local data" workflow only after warning about unsynced records; never silently delete pending work.

## Synchronization

1. Client sends a batch of records with unique `recordId` values.
2. Server validates session, device enrollment, active staff, assigned building, allowed service type, field sizes, and record schema.
3. Server checks whether each `recordId` already exists. If it does, return the prior accepted result rather than appending a duplicate.
4. Server appends valid records and writes an audit event.
5. Server returns per-record acknowledgements (`accepted`, `already_received`, or `rejected` with a safe reason).
6. Client marks only acknowledged records as synced. Network failures and rejected records remain visible for retry or correction.
7. Use a lock around duplicate-check + append operations to reduce race conditions.

## Conflict policy

- Service records should be append-only wherever possible.
- Equipment updates need a version/updatedAt check; do not silently overwrite newer server data with an old offline edit.
- PIN changes, staff roles, and building permissions are server-authoritative.
- Device revocation is enforced at the next successful server connection.

## Deployment caveat

Test the selected hosting and Apps Script API transport in Chrome on desktop and Android. Cross-origin requests and Apps Script redirects can complicate direct GitHub Pages-to-Apps-Script calls. Verify read, write, error response, and acknowledgement behavior before relying on it for production.
