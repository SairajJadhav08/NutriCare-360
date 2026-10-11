# API Reference

Base URL: `http://localhost:5000` (dev) · `/api` (production via Vercel)

All protected routes require:
```
Authorization: Bearer <access_token>
```

---

## Auth

### `POST /api/register`
Create a new account.

**Body**
```json
{ "username": "sairaj", "password": "secret123" }
```
**Responses**
| Status | Body |
|---|---|
| `201` | `{ "message": "Account created successfully" }` |
| `400` | `{ "error": "Username must be at least 3 characters" }` |
| `409` | `{ "error": "Username already taken" }` |

---

### `POST /api/login`
Authenticate and receive tokens.

**Body**
```json
{ "username": "sairaj", "password": "secret123" }
```
**Response `200`**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "username": "sairaj"
}
```

---

### `POST /api/refresh` 🔒 *(refresh token)*
Get a new access token silently.

**Header:** `Authorization: Bearer <refresh_token>`

**Response `200`**
```json
{ "access_token": "<new_jwt>" }
```

---

### `GET /api/me` 🔒
Returns the current user's id and username.

---

### `PUT /api/me/password` 🔒
Change password.

**Body**
```json
{ "current_password": "old", "new_password": "newpass123" }
```
**Responses:** `200` success · `401` wrong current password · `400` too short

---

## Settings

### `GET /api/settings` 🔒
```json
{ "calorie_goal": 2000 }
```

### `PUT /api/settings` 🔒
```json
{ "calorie_goal": 2200 }
```
Valid range: 500 – 10 000.

---

## Dashboard

### `GET /api/dashboard-stats` 🔒
Everything the Today page shows. The same snapshot is the context the AI features read.
```json
{
  "reminders": 4,
  "prescriptions": 2,
  "nutrition": 23,
  "yoga_streak": 3,
  "last_active": "2026-10-11",
  "calorie_goal": 2100,
  "today": { "calories": 950, "protein": 57, "carbs": 104, "fat": 33, "entries": 3,
             "items": ["Oatmeal with banana and honey", "Masala chai", "Grilled chicken salad"] },
  "week": [ { "date": "2026-10-05", "calories": 1585, "protein": 61, "carbs": 210, "fat": 52 } ],
  "meds_today": [ { "id": 1, "medicine": "Metformin", "dosage": "500 mg", "time": "08:00",
                    "frequency": "Twice Daily", "taken_today": true } ]
}
```
`week` always has 7 entries (oldest first, zero-filled). `yoga_streak` counts days with at least one dose taken in the last 7.

---

## Reminders

### `GET /api/reminders` 🔒
```json
{
  "reminders": [
    {
      "id": 1, "medicine": "Lisinopril", "dosage": "10mg",
      "time": "08:00", "frequency": "Once Daily",
      "taken_today": false, "created_at": "2026-07-01T10:00:00"
    }
  ]
}
```

### `POST /api/reminders` 🔒
```json
{ "medicine": "Lisinopril", "dosage": "10mg", "time": "08:00", "frequency": "Once Daily" }
```
Returns `201`.

### `PUT /api/reminders/:id` 🔒
Same body as POST. Returns `200`.

### `DELETE /api/reminders/:id` 🔒
Returns `200`.

### `POST /api/reminders/:id/taken` 🔒
Toggles today's taken status.
```json
{ "taken": true }
```

---

## Prescriptions

### `GET /api/prescriptions` 🔒
Returns list of uploaded prescriptions.

### `POST /api/prescriptions` 🔒
`multipart/form-data` — field name: `prescription`
Accepted types: `jpg png gif pdf bmp webp`
Max size: 16 MB. Returns `201`.

### `DELETE /api/prescriptions/:id` 🔒
Deletes file from disk and DB. Returns `200`.

### `GET /api/uploads/:filename`
Serve an uploaded file (no auth — filename is a UUID).

---

## Nutrition

### `POST /api/nutrition/search` 🔒
```json
{ "food": "banana" }
```
**Response**
```json
{
  "results": [
    { "name": "Banana", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3 }
  ]
}
```
Tries Open Food Facts first, falls back to `static/data/nutrition.json`.

---

### `POST /api/nutrition/analyze` 🔒 *(requires GROQ_API_KEY)*
Splits a plain-English meal into items and estimates each one.
```json
{ "meal": "2 scrambled eggs, a slice of whole wheat toast with butter, and a black coffee" }
```
**Response `200`**
```json
{
  "items": [
    { "name": "2 scrambled eggs", "calories": 100, "protein": 12, "carbs": 1, "fat": 10, "fiber": 0 },
    { "name": "1 slice whole wheat toast with 1 tsp butter", "calories": 106, "protein": 3, "carbs": 12, "fat": 5, "fiber": 2 },
    { "name": "1 cup black coffee", "calories": 2, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0 }
  ],
  "result": { "name": "Breakfast", "calories": 208, "protein": 15, "carbs": 13, "fat": 15, "fiber": 2 },
  "assumptions": "Assumed large eggs, one 28 g slice of bread, 5 g butter and 240 ml coffee.",
  "tip": "Add a piece of fruit or some vegetables for extra fiber."
}
```
`result` holds the totals (kept for older clients). `422` if the text is not food · `429` when the AI service is rate-limited · `502` on an AI error · `503` if `GROQ_API_KEY` is not set.

---

### `GET /api/nutrition/history` 🔒
Query params:

| Param | Values | Description |
|---|---|---|
| `period` | `today` `week` (omit = all) | Filter by time range |
| `date` | `YYYY-MM-DD` | Filter by exact date (overrides period) |

**Response**
```json
{ "history": [{ "id": 1, "food_name": "Banana", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "created_at": "..." }] }
```

### `POST /api/nutrition/save` 🔒
```json
{ "food_name": "Banana", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3 }
```

### `DELETE /api/nutrition/history/:id` 🔒

---

## Yoga

### `GET /api/yoga/poses` 🔒
Pose library. Uses ExerciseDB if `RAPIDAPI_KEY` is set and reachable, otherwise `static/data/yoga.json`.
Card-level facts (`level`, `met`, `focus`) are attached from `yoga_details.json` when the pose has an entry (otherwise `null`).

```json
{
  "poses": [
    {
      "slug": "bhujangasana-cobra-pose",
      "name": "Bhujangasana (Cobra Pose)",
      "category": "Back Pain",
      "description": "A gentle backbend that strengthens the spine...",
      "image_url": "https://...",
      "steps": ["Lie face down with forehead on mat", "Place palms under shoulders"],
      "level": "Beginner", "met": 2.5, "focus": ["Spinal Extensors", "Chest (Pectoralis)", "Shoulders (Deltoids)"]
    }
  ]
}
```

---

### `GET /api/yoga/poses/:slug/details` 🔒
Full reference guide for one pose. Lookup order: the reviewed file `static/data/yoga_details.json`, then the
`pose_details` cache table, then generated once with Groq, validated, cached and returned.
```json
{
  "source": "library",
  "details": {
    "name": "Bhujangasana (Cobra Pose)", "sanskrit": "Bhujangasana", "english": "Cobra Pose",
    "summary": "Cobra Pose is a gentle backbend performed while lying prone...",
    "level": "Beginner", "met": 2.5, "hold": "30 seconds", "hold_seconds": 30,
    "focus_muscles": ["Spinal Extensors", "Chest (Pectoralis)", "Shoulders (Deltoids)"],
    "benefits": ["Improves spinal flexibility", "Opens the thoracic cavity"],
    "steps": [ { "text": "Place your hands on the mat directly under your shoulders", "breath": "Inhale" } ],
    "breathing": "Maintain smooth, even breaths, inhaling to lift and exhaling to lower.",
    "common_mistakes": [ { "mistake": "Lifting mainly with the arms", "fix": "Lead the rise with the back muscles" } ],
    "easier": ["Keep elbows bent more and lift only a few inches"], "harder": ["..."],
    "props": ["Yoga block under the chest to reduce the lift height"],
    "avoid_if": ["Recent spinal injury or surgery", "Severe osteoporosis"],
    "pairs_with": ["Balasana (Child's Pose)"]
  }
}
```
`source` is `library` (reviewed file), `cache` or `generated`. Calories in the app use the ACSM formula
`kcal/min = met × 3.5 × kg / 200`. `404` unknown pose · `503` not in the file and no `GROQ_API_KEY`.

---

## AI

All AI routes share one Groq helper (JSON mode with a validated fallback). Errors use the standard shape with
`429` (rate-limited), `502` (AI error) or `503` (not configured).

### `GET /api/ai/status` 🔒
```json
{ "enabled": true, "model": "openai/gpt-oss-120b" }
```
The frontend uses this to hide or disable AI surfaces when no key is configured.

### `GET /api/ai/insights` 🔒 · `POST /api/ai/insights` 🔒
`GET` returns today's cached brief (or `null`); `POST` writes a new one from the user's logs and caches it.
```json
{
  "generated_at": "2026-10-11 07:07:00",
  "brief": {
    "summary": "You have logged a light breakfast and have 1,150 kcal remaining today.",
    "insights": [
      { "title": "Protein below target", "detail": "57 g so far...", "tone": "watch", "area": "nutrition" }
    ],
    "next_meal": { "name": "Grilled salmon with quinoa", "why": "Adds protein...",
                   "calories": 560, "protein": 38, "carbs": 45, "fat": 22 }
  }
}
```
`tone` is `positive` | `watch` | `tip`; `area` is `nutrition` | `medication` | `habits`. `generated_at` is UTC.

### `POST /api/ai/chat` 🔒
Assistant reply grounded in the user's logs (the last 12 messages are sent).
```json
{ "messages": [ { "role": "user", "content": "How am I doing on protein today?" } ] }
```
```json
{ "reply": "- **Protein today:** 57 g of a 105 g target..." }
```
The system prompt forbids diagnosis and medication or dose changes, and directs urgent symptoms to emergency services.

### `POST /api/ai/yoga-routine` 🔒
```json
{ "goal": "Ease lower back stiffness after sitting all day", "minutes": 15, "level": "Beginner" }
```
```json
{
  "routine": {
    "title": "Gentle Lower Back Relief", "summary": "...", "caution": "",
    "goal": "Ease lower back stiffness...", "level": "Beginner", "total_minutes": 15,
    "steps": [ { "name": "Cat-Cow Stretch", "category": "Stress Relief", "image_url": "...",
                 "minutes": 3, "cue": "Inhale arch, exhale round, move with breath" } ]
  }
}
```
Every step is validated against the pose library; unknown pose names are dropped.

---

## Error Format

All errors follow this shape:
```json
{ "error": "Human-readable message" }
```

HTTP status codes used: `200 201 400 401 403 404 409 422 429 502 503`
