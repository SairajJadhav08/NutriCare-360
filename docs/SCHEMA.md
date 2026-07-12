# Database Schema

Engine: **SQLite 3** · File: `nutricare360.db`

---

## Entity Relationship Overview

```
users ──┬── reminders ──── reminder_taken_log
        ├── prescriptions
        ├── nutrition_history
        └── user_settings
```

---

## Tables

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `username` | TEXT | UNIQUE NOT NULL |
| `password` | TEXT | NOT NULL (bcrypt hash) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### `reminders`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `user_id` | INTEGER | FK → users.id |
| `medicine` | TEXT | NOT NULL |
| `dosage` | TEXT | NOT NULL |
| `time` | TEXT | NOT NULL (HH:MM) |
| `frequency` | TEXT | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### `reminder_taken_log`
Tracks daily dose adherence. One row per reminder per day.

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `reminder_id` | INTEGER | FK → reminders.id |
| `user_id` | INTEGER | FK → users.id |
| `taken_at` | DATE | DEFAULT date('now') |
| — | — | UNIQUE(reminder_id, taken_at) |

---

### `prescriptions`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `user_id` | INTEGER | FK → users.id |
| `filename` | TEXT | NOT NULL (UUID filename on disk) |
| `original_filename` | TEXT | NOT NULL |
| `upload_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### `nutrition_history`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `user_id` | INTEGER | FK → users.id |
| `food_name` | TEXT | NOT NULL |
| `calories` | REAL | NOT NULL |
| `protein` | REAL | NOT NULL |
| `carbs` | REAL | NOT NULL |
| `fat` | REAL | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### `user_settings`
| Column | Type | Constraints |
|---|---|---|
| `user_id` | INTEGER | PRIMARY KEY · FK → users.id |
| `calorie_goal` | INTEGER | NOT NULL DEFAULT 2000 |

One row per user — upserted on save.

---

## Key Design Decisions

- **No ORM** — raw SQLite via `sqlite3` for simplicity and zero dependencies.
- **UUID filenames** — prescriptions stored as `<uuid>.<ext>` to avoid collisions and enumeration.
- **UNIQUE constraint** on `(reminder_id, taken_at)` enforces one log per reminder per day at the DB level; toggling deletes the row.
- **user_settings** uses `ON CONFLICT DO UPDATE` (upsert) so no separate insert/update logic.
