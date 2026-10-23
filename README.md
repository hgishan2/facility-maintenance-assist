# Facility Maintenance Assist — Starter Architecture

This is a starter scaffold for converting the existing Facility Maintenance Assist HTML into an offline-first installable web app.

## Architecture decision

- **GitHub**: source control and review.
- **Installable frontend**: static PWA files.
- **Google Apps Script**: server-side validation and business rules.
- **Google Sheets**: central operational records.
- **IndexedDB**: offline cache and durable outbox on each device.

### Important deployment note
A GitHub Pages frontend calling an Apps Script web app directly can run into cross-origin/CORS and redirect constraints. Before production, choose and test one supported deployment pattern end-to-end. Do not ship authentication or sync based only on a successful local demo. The safest next implementation step is to test the intended browser + Apps Script deployment with read, write, and acknowledgement flows before migrating all screens.

## Files

- `frontend/`: PWA shell and offline queue design.
- `apps-script/Code.gs`: Apps Script API starter and Sheets schema setup.
- `docs/DATA_MODEL.md`: proposed sheet and record schema.
- `docs/SECURITY_AND_SYNC.md`: auth, shared-device, and sync rules.
- `legacy/`: your original uploaded HTML (included if available).

## Setup outline

1. Create a private GitHub repository and upload `frontend/`, `apps-script/`, and `docs/`.
2. Create a Google Sheet for the app's data.
3. Open Extensions → Apps Script in that Sheet and add `apps-script/Code.gs`.
4. Run `setupWorkbook()` once as the owner and authorize it.
5. Configure deployment and test the API transport in a test spreadsheet before adding real staff.
6. Implement the frontend API transport only after the cross-origin/read/write/acknowledgement test succeeds.
7. Test offline creation, retry, duplicate prevention, staff switching, revoked users, and device loss.

## Prototype status
This scaffold is an implementation starting point, not a production-secure application. Do not put real staff PINs or live maintenance data into it until authentication, deployment, permissions, and synchronization tests are complete.
