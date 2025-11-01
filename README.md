# Quick Assign Google Apps Script Web App

## Overview
Quick Assign is a lightweight single-page web application designed for Google Apps Script deployment. It provides a clean workspace for capturing named entries, assigning numerical values to those entries over time, and monitoring aggregate totals on a dashboard. All information is saved to Google Sheets so that the experience is consistent for every visitor across sessions.

## Features
### Entries page
- Capture a new name or label through a single text input.
- Enforce case-insensitive uniqueness; duplicates prompt a friendly warning without clearing the form.
- Display the latest entry at the top of the list, persisting data across visits.

### Assign page
- Select any saved entry from a dropdown that updates immediately when new entries are added.
- Record any numeric amount for the selected entry; multiple assignments per entry are supported.
- Present a rolling list of the most recent five records for quick confirmation.

### Dashboard page
- Summarise all assignments in a clear two-column table showing the total per entry.
- Refresh totals on demand without reloading the full application.

### Navigation and feedback
- Fixed left-side navigation with buttons for **Entries**, **Assign**, and **Dashboard** switches views instantly.
- Toast notifications report status such as “Saved entry”, “Duplicate entry”, and error messages when requests fail.
- Layout uses a minimalist design with responsive behaviour for narrower screens.

## Data workflow and persistence
- Data lives in a Google Spreadsheet automatically provisioned (named **“Entries Assignments Store”**).
- Two sheets are created if absent:
  - `Entries`: `Name`, `Normalized`, `Created At`.
  - `Assignments`: `Name`, `Normalized`, `Amount`, `Created At`.
- A script property named `PRIMARY_SPREADSHEET_ID` tracks the backing spreadsheet. If missing, a new spreadsheet is created on first use.
- Server logic uses `LockService` to keep concurrent writes safe.
- Shared logic (see `Logic.js`) sanitizes inputs, enforces uniqueness, validates numbers, and prepares summary totals.

## File layout
| File | Purpose |
| --- | --- |
| `Code.gs` | Google Apps Script backend: HTTP handler, CRUD methods, Sheet orchestration, and JSON-style responses for the UI. |
| `Logic.js` | Shared business rules for entries, assignments, recent history, and summaries. Imported by both Apps Script and Jest tests. |
| `Index.html` | HTML template rendered by Apps Script. Defines sidebar layout and three content sections. |
| `Styles.html` | Scoped CSS for the app’s minimalist look, responsive behaviour, and toast styling. |
| `Scripts.html` | Client-side controller that manages navigation, state rendering, toast messaging, and calls to Apps Script services via `google.script.run`. |
| `appsscript.json` | Manifest enabling V8 runtime and Stackdriver logging. |
| `tests/logic.test.js` | Jest unit tests covering the shared logic module. |
| `package.json`, `package-lock.json` | Local development tooling with Jest configured to gather coverage. |

## Deploying to Google Apps Script
1. Create a new standalone Apps Script project or sync the repository with [`clasp`](https://github.com/google/clasp).
2. Upload the files listed above (`Code.gs`, `Logic.js`, `Index.html`, `Styles.html`, `Scripts.html`, and `appsscript.json`). Ensure they keep the same names.
3. Open **Deploy › Test deployments** (or **New deployment**) and choose **Web app**. Set *Execute as* to “Me” and *Who has access* to “Anyone with the link” (adjust to your needs).
4. Run the web app. On first load the script will create the spreadsheet automatically and persist the ID in script properties. Share the sheet with collaborators as needed.

## Local development & testing
- Requirements: Node.js 18+ and npm.
- Install dependencies once: `npm install`.
- Run the full deterministic test suite (with coverage):
  - `npm test`

### Test coverage summary
| Module | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| `Logic.js` | 91.17% | 84.09% | 94.11% | 91.04% |

The tests in `tests/logic.test.js` cover:
- Successful creation of entries with timestamp handling.
- Duplicate prevention, empty input validation, and collection type safety.
- Assignment recording, numeric validation, entry existence checks, and collection guards.
- Totals aggregation across casing differences and failure modes for invalid data.
- Ordering and limiting for the recent assignments view.

## Changelog
- 2024-02-14: Introduced the Quick Assign web app with Entries, Assign, and Dashboard pages; added Google Sheets persistence, client-side SPA behaviour, toast notifications, and comprehensive Jest tests with coverage reporting.
