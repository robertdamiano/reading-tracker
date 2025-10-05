# Reading Data Model

## Overview
Reading activity is anchored to a top-level `readers` collection so each child has an isolated slice of data. Logs capture every reading event (minutes, pages, or books) and can be extended with metadata as the UI grows.

## Collections
- `readers`
  - One document per tracked child.
  - Document ID (`readerId`) is a short slug such as `luke`.
- `readers/{readerId}/logs`
  - Raw log entries. Every action taken in the app should write a document here so streaks can be reconstructed.
- `readers/{readerId}/importBatches` (optional)
  - Metadata for bulk loads (e.g., when backfilling historical data).

## readers/{readerId}
| Field | Type | Notes |
| --- | --- | --- |
| `readerId` | string | Matches the document ID. |
| `displayName` | string | Friendly name shown in the UI. |
| `fullName` | string | Optional full name for admin views. |
| `createdAt` | Timestamp | When the record was created. |
| `createdBy` | string | Who created the record (email/label). |
| `updatedAt` | Timestamp | Last modification time. |

## readers/{readerId}/logs/{logId}
| Field | Type | Notes |
| --- | --- | --- |
| `logId` | string | Unique identifier for the log (e.g., hash or push id). |
| `readerId` | string | Redundant field to simplify queries. |
| `logDate` | Timestamp | Midnight UTC for the reading day. |
| `logDateString` | string | ISO `YYYY-MM-DD` helper for ordering. |
| `logType` | string | One of `minutes`, `pages`, or `books`. |
| `value` | number | Numeric value associated with the log. |
| `bookTitle` | string | Optional title metadata. |
| `bookAuthor` | string | Optional author metadata. |
| `source` | object | `{ name, details }` describing where the log came from (manual entry, import, etc.). |
| `importBatchId` | string | Optional reference to a batch doc when backfilling. |
| `importSourceRow` | number | Optional row index when backfilling from a file. |
| `createdAt` | Timestamp | Creation time. |
| `updatedAt` | Timestamp | Last update time. |
| `createdBy` | string | Email/label for audit. |
| `updatedBy` | string | Email/label for audit. |

## readers/{readerId}/importBatches/{batchId}
| Field | Type | Notes |
| --- | --- | --- |
| `batchId` | string | Friendly identifier for the bulk load. |
| `readerId` | string | Target reader. |
| `source` | object | `{ name, details }` describing the origin. |
| `totalRows` | number | Number of log documents touched (optional). |
| `totals` | object | Aggregated `{ minutes, pages, books }` (optional). |
| `processedAt` | Timestamp | When the import finished. |
| `createdAt` | Timestamp | Same as `processedAt` (if desired). |
| `createdBy` | string | Email/label for audit. |

## Notes
- Manual entries can generate any `logId` format (e.g., Firestore auto IDs) as long as they remain unique.
- Derived stats (daily streaks, achievements) can live in additional subcollections such as `readers/{readerId}/summaries` once required.
- Supporting additional kids is simply a matter of adding new documents under `readers`.
