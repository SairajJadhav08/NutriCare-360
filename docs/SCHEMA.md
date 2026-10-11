# Database Schema

Engine: **SQLite 3** · File: `nutricare360.db`

---

## Entity Relationship Overview

```
users ──┬── reminders ──── reminder_taken_log
        ├── prescriptions
        ├── nutrition_history
        ├── user_settings
        └── ai_insights          (one cached AI brief per day)

pose_details                     (shared cache, not per user)
```

---

## Tables

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `username` | TEXT | UNIQUE NOT NULL |
| `password` | TEXT | NOT NULL (Werkzeug `scrypt` hash) |
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

### `ai_insights`
The AI daily brief, cached so the dashboard does not call the model on every load.

| Column | Type | Constraints |
|---|---|---|
| `user_id` | INTEGER | FK → users.id |
| `day` | DATE | NOT NULL |
| `payload` | TEXT | NOT NULL (JSON: summary, insights[], next_meal) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP (UTC) |
| — | — | PRIMARY KEY (user_id, day) |

`POST /api/ai/insights` upserts today's row; `GET` reads it.

---

### `pose_details`
AI-written pose guides for poses that are **not** in the reviewed file `static/data/yoga_details.json`.
Shared by all users; written once on first view.

| Column | Type | Constraints |
|---|---|---|
| `slug` | TEXT | PRIMARY KEY (e.g. `bhujangasana-cobra-pose`) |
| `payload` | TEXT | NOT NULL (validated details JSON) |
| `model` | TEXT | Groq model that wrote it |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

To promote cached entries into the reviewed file, run `python backend/generate_pose_details.py`, review, and commit.

---

## Key Design Decisions

- **No ORM** — raw SQLite via `sqlite3` for simplicity and zero dependencies.
- **UUID filenames** — prescriptions stored as `<uuid>.<ext>` to avoid collisions and enumeration.
- **UNIQUE constraint** on `(reminder_id, taken_at)` enforces one log per reminder per day at the DB level; toggling deletes the row.
- **user_settings** uses `ON CONFLICT DO UPDATE` (upsert) so no separate insert/update logic.
- **AI output is cached, not recomputed** — the daily brief per user per day, pose guides per pose — to keep the free Groq tier fast and inside its rate limits.
- **Database files are never committed** — `*.db` is git-ignored. On Vercel the database lives in `/tmp` and is recreated on cold start.
