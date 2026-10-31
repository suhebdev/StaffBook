# Dihadi — Firestore Data Model & Schema Specification

This document defines the single source of truth for all Firestore document paths, schemas, field types, and deterministic IDs used across both the **Dihadi Web** application and the **Dihadi Android** app.

---

## Root Hierarchy & Multi-Tenant Isolation

All application data is strictly partitioned by the authenticated user's Firebase UID (`uid`). No document or collection exists outside of `/users/{uid}/`.

```
/users/{uid}                                    # User profile metadata
  ├── /employees/{employeeId}                   # Staff records
  ├── /attendance/{employeeId}_{YYYY-MM}        # Monthly attendance sheets
  └── /payments/{employeeId}_{YYYY-MM}          # Monthly payment records
```

---

## 1. User Profile Document

- **Path:** `/users/{uid}`
- **Document ID:** Same as user's Firebase Auth `uid`.
- **Purpose:** Tracks owner account email and registration time.

### Schema:
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | Optional | Account email address (or null for anonymous) |
| `createdAt` | `Timestamp` | Yes | Server timestamp of profile creation |

---

## 2. Employees Collection

- **Path:** `/users/{uid}/employees/{employeeId}`
- **Document ID:** Auto-generated Firestore ID or deterministic ID (string).
- **Purpose:** Stores employee profile, wage rate history, and payday reminder preferences.

### Schema:
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Full display name (e.g., `"Ashok Kumar"`) |
| `phone` | `string` | No | Optional 10-digit mobile number |
| `joinedOn` | `string` | Yes | ISO Date format `YYYY-MM-DD` (e.g., `"2026-01-15"`) |
| `leftOn` | `string` | No | ISO Date format `YYYY-MM-DD` if staff left / archived |
| `active` | `boolean` | Yes | `true` if active staff member, `false` if archived |
| `rates` | `array` | Yes | List of rate entries sorted chronologically |
| `rates[i].effectiveFrom` | `string` | Yes | Month key `YYYY-MM` when rate becomes active |
| `rates[i].full` | `number` | Yes | Daily full-day wage in INR (e.g., `600`) |
| `rates[i].half` | `number` | Yes | Daily half-day wage in INR (e.g., `300`) |
| `reminder` | `map` | Yes | Payday reminder configuration |
| `reminder.enabled` | `boolean` | Yes | Whether reminder is active |
| `reminder.dayOfMonth` | `number` | Yes | Day of month (1–31) |
| `reminder.hour` | `number` | Yes | Hour of day (0–23) |
| `reminder.minute` | `number` | Yes | Minute of hour (0–59) |
| `reminder.forMonth` | `string` | Yes | `"previous"` (for previous month's work) or `"same"` |
| `createdAt` | `Timestamp` | Yes | Server timestamp when employee record was created |
| `updatedAt` | `Timestamp` | Yes | Server timestamp when employee was last updated |

---

## 3. Attendance Documents Collection

- **Path:** `/users/{uid}/attendance/{attendanceDocId}`
- **Deterministic ID Pattern:** `{employeeId}_{YYYY-MM}` (e.g. `emp_abc123_2026-03`)
- **Purpose:** Encapsulates the entire month's daily attendance records for a single employee in one compact document.

### Schema:
| Field | Type | Required | Description |
|---|---|---|---|
| `employeeId` | `string` | Yes | Foreign key referencing `/employees/{employeeId}` |
| `month` | `string` | Yes | Month key in `YYYY-MM` format (e.g. `"2026-03"`) |
| `days` | `map` | Yes | Map where keys are day numbers as strings (`"1"` to `"31"`) and values are status codes |
| `days[day]` | `string` | Yes | `"F"` (Full day), `"H"` (Half day), or `"A"` (Absent) |
| `updatedAt` | `Timestamp` | Yes | Server timestamp of last attendance update |

### Mutations:
- Setting a day status: Uses `setDoc(ref, { employeeId, month, [`days.${day}`]: status, updatedAt: serverTimestamp() }, { merge: true })`.
- Clearing a day status: Uses `deleteField()` on `days.${day}` with `serverTimestamp()`.

---

## 4. Payments Collection

- **Path:** `/users/{uid}/payments/{paymentDocId}`
- **Deterministic ID Pattern:** `{employeeId}_{YYYY-MM}` (e.g. `emp_abc123_2026-03`)
- **Purpose:** Records settlement of a specific month's wage for an employee.

### Schema:
| Field | Type | Required | Description |
|---|---|---|---|
| `employeeId` | `string` | Yes | Foreign key referencing `/employees/{employeeId}` |
| `month` | `string` | Yes | Target salary month key in `YYYY-MM` format |
| `amount` | `number` | Yes | Settled salary amount in INR (e.g., `14500`) |
| `paidOn` | `string` | Yes | Payment settlement date `YYYY-MM-DD` |
| `note` | `string` | No | Optional note (e.g., `"Cash"`, `"GPay ref #8192"`) |
| `createdAt` | `Timestamp` | Yes | Server timestamp of payment recording |

### Mutations:
- Mark paid: `setDoc(ref, { employeeId, month, amount, paidOn, note?, createdAt: serverTimestamp() })`.
- Undo paid: `deleteDoc(ref)`.

---

## 5. Cross-Client Parity (Web & Android)

1. **Deterministic Document IDs:** Both Android and Web construct attendance and payment IDs identically using `${employeeId}_${month}`.
2. **Field Case & Types:** All fields use camelCase (`joinedOn`, `effectiveFrom`, `dayOfMonth`, `forMonth`).
3. **Date Formats:** All dates are stored as ISO strings (`YYYY-MM-DD` or `YYYY-MM`), while audit stamps use Firestore `Timestamp`.
4. **Offline Persistence:** Web uses multi-tab persistent cache (`persistentLocalCache` + `persistentMultipleTabManager`) matching Android's local SQLite persistence layer.
