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
```json
{
  "reminders": 3,
  "prescriptions": 2,
  "nutrition": 14,
  "yoga_streak": 5,
  "last_active": "2026-07-10"
}
```

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
AI macro estimation from a natural language description.
```json
{ "meal": "2 scrambled eggs, whole wheat toast, glass of orange juice" }
```
**Response**
```json
{
  "result": { "name": "Egg Breakfast", "calories": 420, "protein": 22, "carbs": 45, "fat": 14 }
}
```
Returns `503` if `GROQ_API_KEY` is not set.

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
Returns pose list. Uses ExerciseDB if `RAPIDAPI_KEY` is set, otherwise `static/data/yoga.json`.

```json
{
  "poses": [
    {
      "name": "Downward Dog",
      "category": "Core & Flexibility",
      "description": "Targets hamstrings using bodyweight.",
      "image_url": "https://...",
      "steps": ["Start on hands and knees", "Push hips up and back", "Hold for 30 seconds"]
    }
  ]
}
```

---

## Error Format

All errors follow this shape:
```json
{ "error": "Human-readable message" }
```

HTTP status codes used: `200 201 400 401 403 404 409 502 503`
