from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    create_refresh_token, get_jwt_identity, get_jwt, verify_jwt_in_request
)
from flask_cors import CORS
from flasgger import Swagger
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import sqlite3, os, re, uuid, json, requests
from datetime import timedelta

# Load .env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if os.environ.get('VERCEL') == '1' or os.environ.get('VERCEL_ENV'):
    VOLUME_MOUNT = '/tmp'
else:
    VOLUME_MOUNT = BASE_DIR

DB_PATH = os.path.join(VOLUME_MOUNT, 'nutricare360.db')

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'static'))
app.config['JWT_SECRET_KEY']                  = os.environ.get('JWT_SECRET_KEY', 'fallback-dev-secret-change-me')
app.config['JWT_ACCESS_TOKEN_EXPIRES']        = timedelta(hours=24)
app.config['JWT_REFRESH_TOKEN_EXPIRES']       = timedelta(days=30)
app.config['UPLOAD_FOLDER']                   = os.path.join(VOLUME_MOUNT, 'uploads')
app.config['MAX_CONTENT_LENGTH']              = 16 * 1024 * 1024

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ── Swagger / Flasgger ───────────────────────────────────────────────
swagger_config = {
    "headers": [],
    "specs": [{"endpoint": "apispec", "route": "/apispec.json", "rule_filter": lambda rule: True, "model_filter": lambda tag: True}],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs",
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "NutriCare-360 API",
        "description": (
            "REST API for NutriCare-360 — a personal health management platform.\n\n"
            "**Auth:** All protected endpoints require `Authorization: Bearer <access_token>`.\n\n"
            "Obtain tokens via `POST /api/login`."
        ),
        "version": "1.0.0",
        "contact": {"name": "Sairaj Jadhav", "url": "https://github.com/SairajJadhav08"},
    },
    "basePath": "/",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Enter: **Bearer &lt;token&gt;**",
        }
    },
    "security": [{"Bearer": []}],
    "tags": [
        {"name": "Auth",        "description": "Register, login, token refresh, password change"},
        {"name": "Settings",    "description": "User preferences — calorie goal"},
        {"name": "Dashboard",   "description": "Aggregated health stats"},
        {"name": "Reminders",   "description": "Medicine reminders and daily adherence tracking"},
        {"name": "Prescriptions","description": "Secure prescription file storage"},
        {"name": "Nutrition",   "description": "Food search, AI meal analysis, and intake log"},
        {"name": "AI",          "description": "Daily brief, assistant chat, yoga routine builder (Groq)"},
        {"name": "Yoga",        "description": "Exercise and yoga pose library"},
    ],
}

Swagger(app, config=swagger_config, template=swagger_template)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'pdf'}

RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

# ── DB ───────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        medicine TEXT NOT NULL,
        dosage TEXT NOT NULL,
        time TEXT NOT NULL,
        frequency TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS reminder_taken_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reminder_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        taken_at DATE NOT NULL DEFAULT (date('now')),
        UNIQUE(reminder_id, taken_at),
        FOREIGN KEY (reminder_id) REFERENCES reminders(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS nutrition_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        food_name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        calorie_goal INTEGER NOT NULL DEFAULT 2000,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    # AI-written pose details for poses not yet in static/data/yoga_details.json
    c.execute('''CREATE TABLE IF NOT EXISTS pose_details (
        slug TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        model TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    # One cached AI daily brief per user per day — regenerated on demand
    c.execute('''CREATE TABLE IF NOT EXISTS ai_insights (
        user_id INTEGER NOT NULL,
        day DATE NOT NULL,
        payload TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, day),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    conn.commit()
    conn.close()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ══════════════════════════════════════════════════════════════════════
#  AUTH
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/register', methods=['POST'])
def register():
    """
    Create a new user account.
    ---
    tags: [Auth]
    security: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [username, password]
          properties:
            username: {type: string, example: sairaj}
            password: {type: string, example: secret123}
    responses:
      201: {description: Account created}
      400: {description: Validation error}
      409: {description: Username already taken}
    """
    data     = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    conn = get_db()
    if conn.execute('SELECT id FROM users WHERE username=?', (username,)).fetchone():
        conn.close()
        return jsonify({'error': 'Username already taken'}), 409
    conn.execute('INSERT INTO users (username, password) VALUES (?,?)',
                 (username, generate_password_hash(password)))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Account created successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    """
    Authenticate and receive JWT tokens.
    ---
    tags: [Auth]
    security: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [username, password]
          properties:
            username: {type: string, example: sairaj}
            password: {type: string, example: secret123}
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            access_token:  {type: string}
            refresh_token: {type: string}
            username:      {type: string}
      401: {description: Invalid credentials}
    """
    data     = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
    conn.close()
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid username or password'}), 401
    identity = str(user['id'])
    claims   = {'username': user['username']}
    access_token  = create_access_token(identity=identity, additional_claims=claims)
    refresh_token = create_refresh_token(identity=identity, additional_claims=claims)
    return jsonify({
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'username':      user['username']
    })


@app.route('/api/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Get a new access token using a refresh token.
    ---
    tags: [Auth]
    security:
      - Bearer: []
    responses:
      200:
        description: New access token
        schema:
          properties:
            access_token: {type: string}
      401: {description: Invalid or expired refresh token}
    """
    identity = get_jwt_identity()
    claims   = {'username': get_jwt().get('username', '')}
    new_token = create_access_token(identity=identity, additional_claims=claims)
    return jsonify({'access_token': new_token})


@app.route('/api/me')
@jwt_required()
def me():
    """
    Get the currently authenticated user.
    ---
    tags: [Auth]
    responses:
      200:
        description: Current user info
        schema:
          properties:
            id:       {type: integer}
            username: {type: string}
    """
    return jsonify({'id': int(get_jwt_identity()), 'username': get_jwt().get('username', '')})


@app.route('/api/me/password', methods=['PUT'])
@jwt_required()
def change_password():
    """
    Change the authenticated user's password.
    ---
    tags: [Auth]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [current_password, new_password]
          properties:
            current_password: {type: string, example: old_password}
            new_password:     {type: string, example: new_secure_pass}
    responses:
      200: {description: Password updated}
      400: {description: New password too short}
      401: {description: Current password incorrect}
    """
    uid  = int(get_jwt_identity())
    data = request.get_json() or {}
    current  = data.get('current_password', '')
    new_pw   = data.get('new_password', '')
    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    conn = get_db()
    user = conn.execute('SELECT password FROM users WHERE id=?', (uid,)).fetchone()
    if not user or not check_password_hash(user['password'], current):
        conn.close()
        return jsonify({'error': 'Current password is incorrect'}), 401
    conn.execute('UPDATE users SET password=? WHERE id=?', (generate_password_hash(new_pw), uid))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Password updated successfully'})

# ══════════════════════════════════════════════════════════════════════
#  USER SETTINGS (calorie goal)
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """
    Get the user's settings (calorie goal).
    ---
    tags: [Settings]
    responses:
      200:
        description: User settings
        schema:
          properties:
            calorie_goal: {type: integer, example: 2000}
    """
    uid  = int(get_jwt_identity())
    conn = get_db()
    row  = conn.execute('SELECT * FROM user_settings WHERE user_id=?', (uid,)).fetchone()
    conn.close()
    return jsonify({'calorie_goal': row['calorie_goal'] if row else 2000})


@app.route('/api/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    """
    Update the user's calorie goal.
    ---
    tags: [Settings]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            calorie_goal: {type: integer, example: 2200, minimum: 500, maximum: 10000}
    responses:
      200:
        description: Settings saved
        schema:
          properties:
            calorie_goal: {type: integer}
      400: {description: Value out of range}
    """
    uid  = int(get_jwt_identity())
    data = request.get_json() or {}
    goal = data.get('calorie_goal', 2000)
    try:
        goal = int(goal)
        if goal < 500 or goal > 10000:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'calorie_goal must be between 500 and 10000'}), 400
    conn = get_db()
    conn.execute(
        'INSERT INTO user_settings (user_id, calorie_goal) VALUES (?,?) '
        'ON CONFLICT(user_id) DO UPDATE SET calorie_goal=excluded.calorie_goal',
        (uid, goal)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Settings saved', 'calorie_goal': goal})

# ══════════════════════════════════════════════════════════════════════
#  DASHBOARD
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/dashboard-stats')
@jwt_required()
def dashboard_stats():
    """
    Get aggregated health stats for the dashboard.
    ---
    tags: [Dashboard]
    responses:
      200:
        description: Stats summary
        schema:
          properties:
            reminders:     {type: integer}
            prescriptions: {type: integer}
            nutrition:     {type: integer}
            yoga_streak:   {type: integer, description: Active days in last 7 days}
            last_active:   {type: string, example: "2026-07-10"}
            calorie_goal:  {type: integer}
            today:         {type: object, description: "Today's calories/protein/carbs/fat totals"}
            week:          {type: array, description: "Last 7 days of calorie totals, oldest first"}
            meds_today:    {type: array, description: "Reminders with taken_today flag, sorted by time"}
    """
    uid  = int(get_jwt_identity())
    conn = get_db()
    snap = _user_snapshot(conn, uid)
    conn.close()
    return jsonify(snap)


def _user_snapshot(conn, uid):
    """Everything the dashboard shows, and the context the AI features reason over."""
    r = conn.execute('SELECT COUNT(*) FROM reminders WHERE user_id=?', (uid,)).fetchone()[0]
    p = conn.execute('SELECT COUNT(*) FROM prescriptions WHERE user_id=?', (uid,)).fetchone()[0]
    n = conn.execute('SELECT COUNT(*) FROM nutrition_history WHERE user_id=?', (uid,)).fetchone()[0]
    # Active days = distinct days with at least one dose marked taken
    streak_row = conn.execute(
        "SELECT COUNT(DISTINCT taken_at) as streak_days, MAX(taken_at) as last_active "
        "FROM reminder_taken_log WHERE user_id=? AND taken_at >= date('now','-7 days')",
        (uid,)
    ).fetchone()
    goal_row = conn.execute('SELECT calorie_goal FROM user_settings WHERE user_id=?', (uid,)).fetchone()

    today = conn.execute(
        "SELECT COALESCE(SUM(calories),0) c, COALESCE(SUM(protein),0) p, "
        "COALESCE(SUM(carbs),0) cb, COALESCE(SUM(fat),0) f, COUNT(*) n "
        "FROM nutrition_history WHERE user_id=? AND date(created_at)=date('now')", (uid,)
    ).fetchone()
    today_items = [row['food_name'] for row in conn.execute(
        "SELECT food_name FROM nutrition_history WHERE user_id=? AND date(created_at)=date('now') "
        "ORDER BY created_at", (uid,)
    ).fetchall()]

    by_day = {row['d']: row for row in conn.execute(
        "SELECT date(created_at) d, SUM(calories) c, SUM(protein) p, SUM(carbs) cb, SUM(fat) f "
        "FROM nutrition_history WHERE user_id=? AND date(created_at) >= date('now','-6 days') "
        "GROUP BY date(created_at)", (uid,)
    ).fetchall()}
    day_keys = [row[0] for row in conn.execute(
        "WITH RECURSIVE d(x) AS (SELECT date('now','-6 days') UNION ALL "
        "SELECT date(x,'+1 day') FROM d WHERE x < date('now')) SELECT x FROM d"
    ).fetchall()]
    week = [{
        'date':     k,
        'calories': round(by_day[k]['c']) if k in by_day else 0,
        'protein':  round(by_day[k]['p']) if k in by_day else 0,
        'carbs':    round(by_day[k]['cb']) if k in by_day else 0,
        'fat':      round(by_day[k]['f']) if k in by_day else 0,
    } for k in day_keys]

    taken_ids = {row['reminder_id'] for row in conn.execute(
        "SELECT reminder_id FROM reminder_taken_log WHERE user_id=? AND taken_at=date('now')", (uid,)
    ).fetchall()}
    meds = [{
        'id': m['id'], 'medicine': m['medicine'], 'dosage': m['dosage'],
        'time': m['time'], 'frequency': m['frequency'], 'taken_today': m['id'] in taken_ids,
    } for m in conn.execute(
        'SELECT * FROM reminders WHERE user_id=? ORDER BY time', (uid,)
    ).fetchall()]

    return {
        'reminders':     r,
        'prescriptions': p,
        'nutrition':     n,
        'yoga_streak':   streak_row['streak_days'] if streak_row else 0,
        'last_active':   streak_row['last_active'] if streak_row else None,
        'calorie_goal':  goal_row['calorie_goal'] if goal_row else 2000,
        'today': {
            'calories': round(today['c']), 'protein': round(today['p']),
            'carbs': round(today['cb']), 'fat': round(today['f']),
            'entries': today['n'], 'items': today_items,
        },
        'week':       week,
        'meds_today': meds,
    }

# ══════════════════════════════════════════════════════════════════════
#  REMINDERS (with edit + mark-as-taken)
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/reminders', methods=['GET'])
@jwt_required()
def get_reminders():
    """
    List all reminders for the current user.
    ---
    tags: [Reminders]
    responses:
      200:
        description: Reminder list
        schema:
          properties:
            reminders:
              type: array
              items:
                type: object
                properties:
                  id:          {type: integer}
                  medicine:    {type: string}
                  dosage:      {type: string}
                  time:        {type: string, example: "08:00"}
                  frequency:   {type: string, example: "Once Daily"}
                  taken_today: {type: boolean}
    """
    uid  = int(get_jwt_identity())
    conn = get_db()
    rows = conn.execute('SELECT * FROM reminders WHERE user_id=? ORDER BY created_at DESC', (uid,)).fetchall()
    # fetch today's taken ids
    today_taken = set(
        row['reminder_id'] for row in conn.execute(
            "SELECT reminder_id FROM reminder_taken_log WHERE user_id=? AND taken_at=date('now')", (uid,)
        ).fetchall()
    )
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['taken_today'] = d['id'] in today_taken
        result.append(d)
    return jsonify({'reminders': result})


@app.route('/api/reminders', methods=['POST'])
@jwt_required()
def add_reminder():
    """
    Add a new medicine reminder.
    ---
    tags: [Reminders]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [medicine, dosage, time, frequency]
          properties:
            medicine:  {type: string, example: Lisinopril}
            dosage:    {type: string, example: 10mg}
            time:      {type: string, example: "08:00"}
            frequency: {type: string, example: "Once Daily", enum: ["Once Daily","Twice Daily","Weekly","As Needed"]}
    responses:
      201: {description: Reminder added}
      400: {description: Missing required field}
    """
    uid  = int(get_jwt_identity())
    data = request.get_json() or {}
    for f in ['medicine', 'dosage', 'time', 'frequency']:
        if not data.get(f):
            return jsonify({'error': f'Field {f} is required'}), 400
    conn = get_db()
    conn.execute(
        'INSERT INTO reminders (user_id, medicine, dosage, time, frequency) VALUES (?,?,?,?,?)',
        (uid, data['medicine'], data['dosage'], data['time'], data['frequency'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Reminder added'}), 201


@app.route('/api/reminders/<int:rid>', methods=['PUT'])
@jwt_required()
def update_reminder(rid):
    """
    Update an existing reminder.
    ---
    tags: [Reminders]
    parameters:
      - in: path
        name: rid
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [medicine, dosage, time, frequency]
          properties:
            medicine:  {type: string}
            dosage:    {type: string}
            time:      {type: string}
            frequency: {type: string}
    responses:
      200: {description: Reminder updated}
      404: {description: Not found}
    """
    uid  = int(get_jwt_identity())
    data = request.get_json() or {}
    for f in ['medicine', 'dosage', 'time', 'frequency']:
        if not data.get(f):
            return jsonify({'error': f'Field {f} is required'}), 400
    conn = get_db()
    if not conn.execute('SELECT id FROM reminders WHERE id=? AND user_id=?', (rid, uid)).fetchone():
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    conn.execute(
        'UPDATE reminders SET medicine=?, dosage=?, time=?, frequency=? WHERE id=? AND user_id=?',
        (data['medicine'], data['dosage'], data['time'], data['frequency'], rid, uid)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Reminder updated'})


@app.route('/api/reminders/<int:rid>', methods=['DELETE'])
@jwt_required()
def delete_reminder(rid):
    """
    Delete a reminder and its taken log.
    ---
    tags: [Reminders]
    parameters:
      - in: path
        name: rid
        type: integer
        required: true
    responses:
      200: {description: Reminder deleted}
    """
    uid = int(get_jwt_identity())
    conn = get_db()
    conn.execute('DELETE FROM reminder_taken_log WHERE reminder_id=? AND user_id=?', (rid, uid))
    conn.execute('DELETE FROM reminders WHERE id=? AND user_id=?', (rid, uid))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Reminder deleted'})


@app.route('/api/reminders/<int:rid>/taken', methods=['POST'])
@jwt_required()
def mark_taken(rid):
    """
    Toggle today's taken status for a reminder.
    ---
    tags: [Reminders]
    parameters:
      - in: path
        name: rid
        type: integer
        required: true
    responses:
      200:
        description: Toggled taken status
        schema:
          properties:
            taken: {type: boolean, description: true = marked taken, false = unmarked}
      404: {description: Reminder not found}
    """
    uid  = int(get_jwt_identity())
    conn = get_db()
    if not conn.execute('SELECT id FROM reminders WHERE id=? AND user_id=?', (rid, uid)).fetchone():
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    try:
        conn.execute(
            "INSERT INTO reminder_taken_log (reminder_id, user_id, taken_at) VALUES (?, ?, date('now'))",
            (rid, uid)
        )
        conn.commit()
        taken = True
    except sqlite3.IntegrityError:
        # Already taken today — toggle off
        conn.execute(
            "DELETE FROM reminder_taken_log WHERE reminder_id=? AND user_id=? AND taken_at=date('now')",
            (rid, uid)
        )
        conn.commit()
        taken = False
    conn.close()
    return jsonify({'taken': taken})

# ══════════════════════════════════════════════════════════════════════
#  PRESCRIPTIONS
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/prescriptions', methods=['GET'])
@jwt_required()
def get_prescriptions():
    """
    List all uploaded prescriptions.
    ---
    tags: [Prescriptions]
    responses:
      200:
        description: Prescription list
        schema:
          properties:
            prescriptions:
              type: array
              items:
                type: object
                properties:
                  id:                {type: integer}
                  filename:          {type: string, description: UUID filename on disk}
                  original_filename: {type: string}
                  upload_date:       {type: string}
    """
    uid  = int(get_jwt_identity())
    conn = get_db()
    rows = conn.execute('SELECT * FROM prescriptions WHERE user_id=? ORDER BY upload_date DESC', (uid,)).fetchall()
    conn.close()
    return jsonify({'prescriptions': [dict(p) for p in rows]})


@app.route('/api/prescriptions', methods=['POST'])
@jwt_required()
def upload_prescription():
    uid = int(get_jwt_identity())
    if 'prescription' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['prescription']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    original = secure_filename(file.filename)
    ext      = original.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    conn = get_db()
    conn.execute('INSERT INTO prescriptions (user_id, filename, original_filename) VALUES (?,?,?)',
                 (uid, filename, original))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Prescription uploaded', 'filename': filename}), 201


@app.route('/api/prescriptions/<int:pid>', methods=['DELETE'])
@jwt_required()
def delete_prescription(pid):
    uid  = int(get_jwt_identity())
    conn = get_db()
    row  = conn.execute('SELECT filename FROM prescriptions WHERE id=? AND user_id=?', (pid, uid)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], row['filename'])
    if os.path.exists(filepath):
        try: os.remove(filepath)
        except OSError: pass
    conn.execute('DELETE FROM prescriptions WHERE id=? AND user_id=?', (pid, uid))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Prescription deleted'})

# ══════════════════════════════════════════════════════════════════════
#  NUTRITION
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/nutrition/search', methods=['POST'])
@jwt_required()
def nutrition_search():
    data  = request.get_json() or {}
    query = data.get('food', '').strip()
    if not query:
        return jsonify({'error': 'Please enter a food item'}), 400
    try:
        resp = requests.get(
            'https://world.openfoodfacts.org/cgi/search.pl',
            params={
                'search_terms':  query,
                'search_simple': 1,
                'action':        'process',
                'json':          1,
                'page_size':     12,
                'fields':        'product_name,nutriments'
            },
            timeout=8
        )
        resp.raise_for_status()
        products = resp.json().get('products', [])
        results = []
        for p in products:
            name = (p.get('product_name') or '').strip()
            if not name:
                continue
            n = p.get('nutriments', {})
            calories = round(float(n.get('energy-kcal_100g') or n.get('energy-kcal') or 0), 1)
            protein  = round(float(n.get('proteins_100g')    or n.get('proteins')    or 0), 1)
            carbs    = round(float(n.get('carbohydrates_100g') or n.get('carbohydrates') or 0), 1)
            fat      = round(float(n.get('fat_100g')          or n.get('fat')          or 0), 1)
            results.append({'name': name, 'calories': calories,
                            'protein': protein, 'carbs': carbs, 'fat': fat})
            if len(results) >= 8:
                break
        if results:
            return jsonify({'results': results})
    except Exception:
        pass
    return _local_nutrition_search(query)


def _local_nutrition_search(query):
    local_path = os.path.join(BASE_DIR, 'static', 'data', 'nutrition.json')
    try:
        with open(local_path) as f:
            local = json.load(f)
        q = query.lower()
        results = [food for food in local.get('foods', []) if q in food['name'].lower()]
        if not results:
            results = [food for food in local.get('foods', [])
                       if any(w in food['name'].lower() for w in q.split())]
        if not results:
            return jsonify({'error': f'No results found for "{query}"'}), 404
        return jsonify({'results': results})
    except FileNotFoundError:
        return jsonify({'error': 'No results found and local data unavailable'}), 404


@app.route('/api/nutrition/history', methods=['GET'])
@jwt_required()
def nutrition_history():
    uid    = int(get_jwt_identity())
    date_f = request.args.get('date')   # YYYY-MM-DD  — exact day
    period = request.args.get('period') # 'today' | 'week' | 'all'
    conn   = get_db()
    base   = 'SELECT * FROM nutrition_history WHERE user_id=?'
    params = [uid]
    if date_f:
        base  += ' AND date(created_at)=?'
        params.append(date_f)
    elif period == 'today':
        base  += " AND date(created_at)=date('now')"
    elif period == 'week':
        base  += " AND date(created_at)>=date('now','-7 days')"
    # else: 'all' — no filter
    base  += ' ORDER BY created_at DESC'
    rows   = conn.execute(base, params).fetchall()
    conn.close()
    return jsonify({'history': [dict(r) for r in rows]})


@app.route('/api/nutrition/save', methods=['POST'])
@jwt_required()
def nutrition_save():
    uid  = int(get_jwt_identity())
    data = request.get_json() or {}
    for field in ['food_name', 'calories', 'protein', 'carbs', 'fat']:
        if field not in data:
            return jsonify({'error': f'Missing {field}'}), 400
    conn = get_db()
    conn.execute(
        'INSERT INTO nutrition_history (user_id, food_name, calories, protein, carbs, fat) VALUES (?,?,?,?,?,?)',
        (uid, data['food_name'], data['calories'], data['protein'], data['carbs'], data['fat'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Saved'}), 201


@app.route('/api/nutrition/history/<int:hid>', methods=['DELETE'])
@jwt_required()
def delete_nutrition_history(hid):
    uid  = int(get_jwt_identity())
    conn = get_db()
    if not conn.execute('SELECT id FROM nutrition_history WHERE id=? AND user_id=?', (hid, uid)).fetchone():
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    conn.execute('DELETE FROM nutrition_history WHERE id=? AND user_id=?', (hid, uid))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'})

# ══════════════════════════════════════════════════════════════════════
#  AI — Groq (gpt-oss-120b by default; override with GROQ_MODEL)
#  Set GROQ_API_KEY in .env — get one free at https://console.groq.com
# ══════════════════════════════════════════════════════════════════════

GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_MODEL = os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b')

AI_SAFETY = (
    "You are not a doctor. Never diagnose, never suggest starting, stopping or changing "
    "a medication or its dose, and never contradict a clinician's instructions. "
    "If something sounds urgent (chest pain, trouble breathing, overdose, severe reaction), "
    "tell the user to contact emergency services right away."
)


class AIError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def _groq(messages, *, json_mode=False, max_tokens=600, temperature=0.3):
    """Single entry point for every Groq call. Returns text, or a dict in json_mode."""
    if not GROQ_API_KEY:
        raise AIError('AI features are not configured. Add GROQ_API_KEY to backend .env', 503)
    body = {
        'model': GROQ_MODEL, 'messages': messages, 'temperature': temperature,
        # gpt-oss reasons before answering, and reasoning tokens count against the budget
        'max_tokens': max_tokens + 1500,
    }
    if 'gpt-oss' in GROQ_MODEL:
        body['reasoning_effort'] = 'low'

    resp = _groq_post({**body, 'response_format': {'type': 'json_object'}} if json_mode else body)
    # Groq's strict JSON validator occasionally rejects a valid answer; retry once unvalidated
    if json_mode and resp.status_code == 400 and 'json_validate_failed' in resp.text:
        resp = _groq_post(body)
    if resp.status_code == 429:
        raise AIError('The AI service is busy right now. Try again in a minute.', 429)
    if not resp.ok:
        app.logger.warning('Groq %s: %s', resp.status_code, resp.text[:500])
        raise AIError('The AI service returned an error. Try again in a moment.')

    # Narrow no-break spaces show up between numbers and units; normalise them
    content = (resp.json()['choices'][0]['message'].get('content') or '').replace(' ', ' ').strip()
    if not json_mode:
        return content
    start, end = content.find('{'), content.rfind('}')
    try:
        return json.loads(content[start:end + 1])
    except (json.JSONDecodeError, ValueError):
        raise AIError('AI returned an unexpected response. Try rephrasing.')


def _groq_post(body):
    try:
        return requests.post(
            GROQ_URL,
            headers={'Authorization': f'Bearer {GROQ_API_KEY}', 'Content-Type': 'application/json'},
            json=body, timeout=40,
        )
    except requests.RequestException:
        raise AIError('Could not reach the AI service. Try again in a moment.')


def _num(v, default=0):
    try:
        return max(0, round(float(v)))
    except (TypeError, ValueError):
        return default


@app.errorhandler(AIError)
def _handle_ai_error(e):
    return jsonify({'error': str(e)}), e.status


@app.route('/api/ai/status')
@jwt_required()
def ai_status():
    """
    Whether AI features are available.
    ---
    tags: [AI]
    responses:
      200: {description: "{enabled: bool, model: str}"}
    """
    return jsonify({'enabled': bool(GROQ_API_KEY), 'model': GROQ_MODEL})


@app.route('/api/nutrition/analyze', methods=['POST'])
@jwt_required()
def nutrition_analyze():
    """
    Analyze a free-text meal description into itemized macros.
    ---
    tags: [Nutrition, AI]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [meal]
          properties:
            meal: {type: string, example: "2 eggs, toast with butter, glass of OJ"}
    responses:
      200: {description: "result (totals) + items[] + notes"}
      400: {description: Missing meal description}
      502: {description: AI error}
      503: {description: AI not configured}
    """
    data = request.get_json() or {}
    meal = (data.get('meal') or '').strip()[:500]
    if not meal:
        return jsonify({'error': 'Please describe your meal'}), 400

    out = _groq([
        {'role': 'system', 'content': (
            "You are a precise nutrition estimator. Break a meal description into its separate "
            "food items and estimate each one using typical portion sizes (respect any quantities "
            "the user gives). Reply with JSON only, in this shape:\n"
            '{"name": "<short meal title>", "items": [{"name": "<item with portion, e.g. 2 large eggs>", '
            '"calories": int, "protein": int, "carbs": int, "fat": int, "fiber": int}], '
            '"assumptions": "<one sentence on portion sizes you assumed>", '
            '"tip": "<one short, practical suggestion to make this meal more balanced, or empty>"}\n'
            "Macros are grams, calories are kcal, all integers. If the text is not food, return "
            '{"name": "", "items": []}.'
        )},
        {'role': 'user', 'content': meal},
    ], json_mode=True, max_tokens=700, temperature=0.2)

    items = []
    for it in out.get('items') or []:
        if not isinstance(it, dict) or not str(it.get('name', '')).strip():
            continue
        items.append({
            'name': str(it['name']).strip()[:120],
            'calories': _num(it.get('calories')), 'protein': _num(it.get('protein')),
            'carbs': _num(it.get('carbs')), 'fat': _num(it.get('fat')), 'fiber': _num(it.get('fiber')),
        })
    if not items:
        return jsonify({'error': "That didn't look like a meal. Try something like \"bowl of oatmeal with banana\"."}), 422

    totals = {k: sum(i[k] for i in items) for k in ('calories', 'protein', 'carbs', 'fat', 'fiber')}
    name = str(out.get('name') or meal).strip()[:120]
    return jsonify({
        'result': {'name': name, **totals},   # kept for older clients
        'items': items,
        'assumptions': str(out.get('assumptions') or '').strip(),
        'tip': str(out.get('tip') or '').strip(),
    })


def _context_lines(snap):
    """Compact plain-text summary of the user's data for prompts."""
    t, goal = snap['today'], snap['calorie_goal']
    taken = sum(1 for m in snap['meds_today'] if m['taken_today'])
    logged_days = [d for d in snap['week'] if d['calories']]
    avg = round(sum(d['calories'] for d in logged_days) / len(logged_days)) if logged_days else 0
    meds = ', '.join(
        f"{m['medicine']} {m['dosage']} at {m['time']} ({'taken' if m['taken_today'] else 'not yet taken'})"
        for m in snap['meds_today']
    ) or 'none'
    week = '; '.join(f"{d['date']}: {d['calories']} kcal, P{d['protein']} C{d['carbs']} F{d['fat']}"
                     for d in snap['week'])
    return '\n'.join([
        f"Daily calorie goal: {goal} kcal",
        f"Today so far: {t['calories']} kcal, protein {t['protein']}g, carbs {t['carbs']}g, fat {t['fat']}g "
        f"from {t['entries']} entries ({', '.join(t['items']) or 'nothing logged yet'})",
        f"Last 7 days (oldest first): {week}",
        f"Average on days with logs: {avg} kcal across {len(logged_days)} logged days",
        f"Medication reminders today: {taken}/{len(snap['meds_today'])} taken. Details: {meds}",
        f"Days with medication taken in last 7: {snap['yoga_streak']}",
    ])


@app.route('/api/ai/insights', methods=['GET', 'POST'])
@jwt_required()
def ai_insights():
    """
    Today's AI health brief. GET returns today's cached brief (or null); POST regenerates it.
    ---
    tags: [AI]
    responses:
      200: {description: "{brief: {summary, insights[], next_meal}, generated_at}"}
      503: {description: AI not configured}
    """
    uid  = int(get_jwt_identity())
    conn = get_db()
    if request.method == 'GET':
        row = conn.execute(
            "SELECT payload, created_at FROM ai_insights WHERE user_id=? AND day=date('now')", (uid,)
        ).fetchone()
        conn.close()
        if not row:
            return jsonify({'brief': None, 'generated_at': None})
        return jsonify({'brief': json.loads(row['payload']), 'generated_at': row['created_at']})

    snap = _user_snapshot(conn, uid)
    conn.close()
    remaining = snap['calorie_goal'] - snap['today']['calories']

    out = _groq([
        {'role': 'system', 'content': (
            "You write a short daily health brief for a nutrition and medication tracking app. "
            "Base every statement on the data given; never invent numbers or foods. If data is "
            "sparse, say so and suggest what to log. Be specific, warm and brief — no filler, "
            "no exclamation marks, no emoji. " + AI_SAFETY + "\n"
            "Reply with JSON only:\n"
            '{"summary": "<one sentence, max 22 words>", '
            '"insights": [{"title": "<max 6 words>", "detail": "<max 30 words>", '
            '"tone": "positive" | "watch" | "tip", "area": "nutrition" | "medication" | "habits"}], '
            '"next_meal": {"name": "<a specific meal>", "why": "<max 20 words tied to the data>", '
            '"calories": int, "protein": int, "carbs": int, "fat": int}}\n'
            "Give 3 insights. next_meal should fit the remaining calories and fix any macro gap."
        )},
        {'role': 'user', 'content': _context_lines(snap) + f"\nCalories remaining today: {remaining}"},
    ], json_mode=True, max_tokens=700, temperature=0.4)

    insights = []
    for it in (out.get('insights') or [])[:4]:
        if isinstance(it, dict) and it.get('title') and it.get('detail'):
            insights.append({
                'title': str(it['title'])[:80], 'detail': str(it['detail'])[:300],
                'tone': it.get('tone') if it.get('tone') in ('positive', 'watch', 'tip') else 'tip',
                'area': it.get('area') if it.get('area') in ('nutrition', 'medication', 'habits') else 'habits',
            })
    nm = out.get('next_meal') if isinstance(out.get('next_meal'), dict) else None
    brief = {
        'summary': str(out.get('summary') or '').strip(),
        'insights': insights,
        'next_meal': {
            'name': str(nm.get('name', ''))[:120], 'why': str(nm.get('why', ''))[:200],
            'calories': _num(nm.get('calories')), 'protein': _num(nm.get('protein')),
            'carbs': _num(nm.get('carbs')), 'fat': _num(nm.get('fat')),
        } if nm and nm.get('name') else None,
    }

    conn = get_db()
    conn.execute(
        "INSERT INTO ai_insights (user_id, day, payload, created_at) VALUES (?, date('now'), ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(user_id, day) DO UPDATE SET payload=excluded.payload, created_at=CURRENT_TIMESTAMP",
        (uid, json.dumps(brief))
    )
    conn.commit()
    created = conn.execute(
        "SELECT created_at FROM ai_insights WHERE user_id=? AND day=date('now')", (uid,)
    ).fetchone()['created_at']
    conn.close()
    return jsonify({'brief': brief, 'generated_at': created})


@app.route('/api/ai/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    """
    Health assistant chat, grounded in the user's own logs.
    ---
    tags: [AI]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [messages]
          properties:
            messages:
              type: array
              items: {type: object, properties: {role: {type: string}, content: {type: string}}}
    responses:
      200: {description: "{reply: str}"}
    """
    data = request.get_json() or {}
    history = [
        {'role': m['role'], 'content': str(m.get('content', ''))[:2000]}
        for m in (data.get('messages') or [])
        if isinstance(m, dict) and m.get('role') in ('user', 'assistant') and m.get('content')
    ][-12:]
    if not history or history[-1]['role'] != 'user':
        return jsonify({'error': 'Send a message to start'}), 400

    uid  = int(get_jwt_identity())
    conn = get_db()
    snap = _user_snapshot(conn, uid)
    conn.close()

    system = (
        "You are the NutriCare-360 assistant: a calm, knowledgeable guide for everyday nutrition, "
        "movement, sleep and medication routines. You can see the user's own logs below — use them "
        "to make answers specific, and quote their numbers when relevant. Keep replies short: "
        "2–5 sentences or a tight bulleted list. Use **bold** sparingly. No tables, no headings, no emoji. "
        "For general drug questions (what a medicine is for, common side effects, food interactions) "
        "give plain facts and suggest confirming with their pharmacist. " + AI_SAFETY +
        "\n\nUSER DATA\n" + _context_lines(snap)
    )
    reply = _groq([{'role': 'system', 'content': system}, *history], max_tokens=600, temperature=0.5)
    return jsonify({'reply': reply})


def _match_pose(name, poses):
    """Find a library pose for a model-written name ("Cobra Pose" -> "Bhujangasana (Cobra Pose)")."""
    want = _pose_slug(str(name or ''))
    if not want:
        return None
    for p in poses:                                   # exact, ignoring case and punctuation
        if _pose_slug(p['name']) == want:
            return p
    for p in poses:                                   # either part of "Sanskrit (English)"
        parts = [x.strip() for x in re.split(r'[()]', p['name']) if x.strip()]
        if any(_pose_slug(part) == want for part in parts):
            return p
    for p in poses:                                   # one name contains the other
        slug = _pose_slug(p['name'])
        if len(want) >= 5 and (want in slug or slug in want):
            return p
    return None


def _fit_minutes(steps, total):
    """Rescale step durations so the routine adds up to the requested length."""
    current = sum(s['minutes'] for s in steps)
    if current == total or not current:
        return
    for s in steps:
        s['minutes'] = max(1, round(s['minutes'] * total / current))
    # Settle rounding drift on the longest step (usually the final rest)
    drift = total - sum(s['minutes'] for s in steps)
    longest = max(steps, key=lambda s: s['minutes'])
    longest['minutes'] = max(1, longest['minutes'] + drift)


@app.route('/api/ai/yoga-routine', methods=['POST'])
@jwt_required()
def ai_yoga_routine():
    """
    Build a timed yoga sequence from the pose library for a goal.
    ---
    tags: [Yoga, AI]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            goal:    {type: string, example: "Ease lower back stiffness"}
            minutes: {type: integer, example: 15}
            level:   {type: string, example: "Beginner"}
    responses:
      200: {description: "{routine: {title, summary, steps[{name, minutes, cue}]}}"}
    """
    data    = request.get_json() or {}
    goal    = (data.get('goal') or '').strip()[:200] or 'General wellbeing'
    level   = data.get('level') if data.get('level') in ('Beginner', 'Intermediate', 'Advanced') else 'Beginner'
    try:
        minutes = min(60, max(5, int(data.get('minutes', 15))))
    except (TypeError, ValueError):
        minutes = 15

    poses = _load_poses()
    if not poses:
        return jsonify({'error': 'Pose library unavailable'}), 503
    library = {p['name']: p for p in poses}
    catalog = '\n'.join(f"- {p['name']} [{p['category']}]: {p['description'][:110]}" for p in poses)

    out = _groq([
        {'role': 'system', 'content': (
            "You are a yoga teacher building a safe, well-ordered sequence: warm up, build, then "
            "cool down and finish in a resting pose. Only use poses from the library, copying names "
            "exactly. Durations in whole minutes must add up to the requested total. Respect the level: "
            "no inversions or advanced poses for beginners. If the goal mentions pain, injury or "
            "pregnancy, keep it gentle and set caution to a one-sentence note to check with a clinician.\n"
            "Reply with JSON only:\n"
            '{"title": "<max 6 words>", "summary": "<max 25 words>", "caution": "<sentence or empty>", '
            '"steps": [{"name": "<exact library name>", "minutes": int, "cue": "<max 18 words, breath or form cue>"}]}'
        )},
        {'role': 'user', 'content': f"Goal: {goal}\nTotal minutes: {minutes}\nLevel: {level}\n\nLIBRARY\n{catalog}"},
    ], json_mode=True, max_tokens=900, temperature=0.4)

    steps = []
    for s in out.get('steps') or []:
        p = _match_pose(s.get('name'), poses) if isinstance(s, dict) else None
        if p:
            steps.append({
                'name': p['name'], 'category': p['category'], 'image_url': p.get('image_url'),
                'minutes': max(1, _num(s.get('minutes'), 1)), 'cue': str(s.get('cue') or '')[:160],
            })
    if not steps:
        raise AIError("Couldn't build a routine for that goal. Try describing it differently.")
    _fit_minutes(steps, minutes)
    return jsonify({'routine': {
        'title': str(out.get('title') or 'Your routine')[:80],
        'summary': str(out.get('summary') or '')[:240],
        'caution': str(out.get('caution') or '')[:240],
        'goal': goal, 'level': level,
        'total_minutes': sum(s['minutes'] for s in steps),
        'steps': steps,
    }})

# ══════════════════════════════════════════════════════════════════════
#  YOGA
# ══════════════════════════════════════════════════════════════════════

YOGA_IMAGES = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1510894347713-fc3dc6166086?w=400&h=300&fit=crop',
]

def _category_for(body_part, target):
    mapping = {
        'waist': 'Core & Flexibility', 'back': 'Strength & Balance',
        'upper legs': 'Lower Body', 'chest': 'Upper Body',
        'upper arms': 'Upper Body', 'lower legs': 'Lower Body',
        'shoulders': 'Strength & Balance', 'neck': 'Stress Relief',
        'cardio': 'General Wellness',
    }
    return mapping.get((body_part or '').lower(), 'General Wellness')


def _load_poses():
    """Pose library: ExerciseDB when RAPIDAPI_KEY is set, local yoga.json otherwise."""
    if RAPIDAPI_KEY:
        try:
            resp = requests.get(
                'https://exercisedb.p.rapidapi.com/exercises',
                headers={
                    'X-RapidAPI-Key':  RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                },
                params={'limit': 40, 'offset': 0},
                timeout=8
            )
            resp.raise_for_status()
            poses = []
            for i, ex in enumerate(resp.json()):
                instructions = ex.get('instructions', [])
                if isinstance(instructions, str):
                    instructions = [s.strip() for s in instructions.split('.') if s.strip()]
                poses.append({
                    'name':        ex.get('name', '').title(),
                    'category':    _category_for(ex.get('bodyPart'), ex.get('target')),
                    'description': f"Targets {ex.get('target', 'full body')} using {ex.get('equipment', 'bodyweight')}.",
                    'image_url':   ex.get('gifUrl') or YOGA_IMAGES[i % len(YOGA_IMAGES)],
                    'steps':       instructions if instructions else ['Follow standard form for this exercise.'],
                })
            if poses:
                return poses
        except Exception:
            pass

    local_path = os.path.join(BASE_DIR, 'static', 'data', 'yoga.json')
    try:
        with open(local_path, encoding='utf-8') as f:
            poses = json.load(f).get('poses', [])
    except FileNotFoundError:
        return []
    for pose in poses:
        if isinstance(pose.get('steps'), str):
            pose['steps'] = [s.strip() for s in pose['steps'].split('\n') if s.strip()]
    return poses


@app.route('/api/yoga/poses', methods=['GET'])
@jwt_required()
def get_yoga_poses():
    poses = _load_poses()
    if not poses:
        return jsonify({'error': 'Yoga data not found. Set RAPIDAPI_KEY in .env or add static/data/yoga.json'}), 404
    # Attach the card-level facts (slug, level, MET, focus) from the details file when present
    details = _pose_details_file()
    out = []
    for p in poses:
        slug = _pose_slug(p['name'])
        d = details.get(slug) or {}
        out.append({**p, 'slug': slug, 'level': d.get('level'), 'met': d.get('met'),
                    'focus': (d.get('focus_muscles') or [])[:3]})
    return jsonify({'poses': out})


# ══════════════════════════════════════════════════════════════════════
#  YOGA POSE DETAILS — written by AI once, then served from a file or cache
#  static/data/yoga_details.json is the reviewed, committed source; poses
#  missing from it are generated on first view and cached in pose_details.
#  Fill the file for new poses with:  python generate_pose_details.py
# ══════════════════════════════════════════════════════════════════════

POSE_DETAILS_PATH = os.path.join(BASE_DIR, 'static', 'data', 'yoga_details.json')
POSE_LEVELS = ('Beginner', 'Intermediate', 'Advanced')


def _pose_slug(name):
    return re.sub(r'[^a-z0-9]+', '-', (name or '').lower()).strip('-')


def _pose_details_file():
    try:
        with open(POSE_DETAILS_PATH, encoding='utf-8') as f:
            return json.load(f).get('poses', {})
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _str_list(value, max_items, max_len=160):
    if not isinstance(value, list):
        return []
    return [str(v).strip()[:max_len] for v in value if str(v).strip()][:max_items]


def _clean_pose_details(raw, pose, library_names):
    """Validate AI output into the fixed details shape. Raises AIError if unusable."""
    if not isinstance(raw, dict):
        raise AIError('AI returned details in an unexpected shape.')

    steps = []
    for s in raw.get('steps') or []:
        if isinstance(s, dict) and str(s.get('text', '')).strip():
            steps.append({'text': str(s['text']).strip()[:220],
                          'breath': str(s.get('breath') or '').strip()[:40]})
    try:
        met = round(float(raw.get('met')), 1)
    except (TypeError, ValueError):
        met = None
    # Compendium of Physical Activities range for yoga: lying rest ≈1.3 up to vigorous flow ≈4–5
    if met is None or not 1.0 <= met <= 8.0 or len(steps) < 3:
        raise AIError('AI details were incomplete. Try again in a moment.')

    try:
        hold = int(raw.get('hold_seconds'))
    except (TypeError, ValueError):
        hold = 30
    level = raw.get('level') if raw.get('level') in POSE_LEVELS else 'Beginner'

    by_lower = {n.lower(): n for n in library_names if n != pose['name']}
    pairs = [by_lower[str(n).strip().lower()] for n in (raw.get('pairs_with') or [])
             if str(n).strip().lower() in by_lower][:4]

    mistakes = []
    for m in raw.get('common_mistakes') or []:
        if isinstance(m, dict) and m.get('mistake') and m.get('fix'):
            mistakes.append({'mistake': str(m['mistake']).strip()[:140], 'fix': str(m['fix']).strip()[:180]})

    return {
        'name': pose['name'],
        'sanskrit': str(raw.get('sanskrit') or '').strip()[:80],
        'english': str(raw.get('english') or '').strip()[:80],
        'summary': str(raw.get('summary') or pose.get('description') or '').strip()[:500],
        'level': level,
        'met': met,
        'hold': str(raw.get('hold') or '').strip()[:60],
        'hold_seconds': max(10, min(1200, hold)),
        'focus_muscles': _str_list(raw.get('focus_muscles'), 6, 40),
        'benefits': _str_list(raw.get('benefits'), 5),
        'steps': steps[:10],
        'breathing': str(raw.get('breathing') or '').strip()[:240],
        'common_mistakes': mistakes[:4],
        'easier': _str_list(raw.get('easier'), 3),
        'harder': _str_list(raw.get('harder'), 3),
        'props': _str_list(raw.get('props'), 4, 60),
        'avoid_if': _str_list(raw.get('avoid_if'), 5),
        'pairs_with': pairs,
    }


def _generate_pose_details(pose, library_names):
    steps = pose.get('steps') or []
    if isinstance(steps, str):
        steps = [s for s in steps.split('\n') if s.strip()]
    out = _groq([
        {'role': 'system', 'content': (
            "You are an experienced, safety-minded yoga teacher writing the reference page for one pose "
            "in a health app. Be accurate and specific; plain language; no emoji; no spiritual claims "
            "presented as fact. Reply with JSON only, exactly this shape:\n"
            '{"sanskrit": "<Sanskrit name, or empty if none>", "english": "<common English name>", '
            '"summary": "<2 sentences on what the pose is and why people do it>", '
            '"level": "Beginner" | "Intermediate" | "Advanced", '
            '"met": <number>, "hold": "<typical hold, e.g. 30–60 seconds per side>", "hold_seconds": <int>, '
            '"focus_muscles": ["<muscle group>", ...up to 6], '
            '"benefits": ["<one concrete benefit, max 14 words>", ...3-5], '
            '"steps": [{"text": "<one clear instruction>", "breath": "Inhale" | "Exhale" | "Breathe" | ""}, ...5-9], '
            '"breathing": "<one sentence on how to breathe in the pose>", '
            '"common_mistakes": [{"mistake": "<short>", "fix": "<short correction>"}, ...2-4], '
            '"easier": ["<modification>", ...1-3], "harder": ["<progression>", ...1-3], '
            '"props": ["<prop and how it helps>", ...0-4], '
            '"avoid_if": ["<condition where the pose should be skipped or modified>", ...2-5], '
            '"pairs_with": ["<exact pose name from the library list>", ...2-4]}\n'
            "met is the MET value from the Compendium of Physical Activities for practising this pose: "
            "lying restorative ≈1.3, seated or gentle floor work 2.0–2.5, standing hatha holds 2.5–3.0, "
            "strength holds 3.0–4.0, flowing sequences like sun salutations 3.3–4.0. "
            "pairs_with must be copied exactly from the library list."
        )},
        {'role': 'user', 'content': (
            f"Pose: {pose['name']}\nCategory: {pose.get('category', '')}\n"
            f"Description: {pose.get('description', '')}\n"
            f"Existing steps: {' / '.join(steps)}\n\nLibrary: {', '.join(library_names)}"
        )},
    ], json_mode=True, max_tokens=1600, temperature=0.3)
    return _clean_pose_details(out, pose, library_names)


@app.route('/api/yoga/poses/<slug>/details', methods=['GET'])
@jwt_required()
def get_pose_details(slug):
    """
    Full reference details for one pose (steps, MET, muscles, mistakes, cautions).
    ---
    tags: [Yoga, AI]
    parameters:
      - in: path
        name: slug
        type: string
        required: true
        example: tadasana-mountain-pose
    responses:
      200: {description: "{details, source: library|cache|generated}"}
      404: {description: Unknown pose}
      503: {description: Not in library yet and AI not configured}
    """
    poses = _load_poses()
    pose = next((p for p in poses if _pose_slug(p['name']) == slug), None)
    if not pose:
        return jsonify({'error': 'Pose not found'}), 404

    from_file = _pose_details_file().get(slug)
    if from_file:
        return jsonify({'details': from_file, 'source': 'library'})

    conn = get_db()
    row = conn.execute('SELECT payload FROM pose_details WHERE slug=?', (slug,)).fetchone()
    if row:
        conn.close()
        return jsonify({'details': json.loads(row['payload']), 'source': 'cache'})
    conn.close()

    details = _generate_pose_details(pose, [p['name'] for p in poses])
    conn = get_db()
    conn.execute(
        'INSERT OR REPLACE INTO pose_details (slug, payload, model) VALUES (?, ?, ?)',
        (slug, json.dumps(details), GROQ_MODEL)
    )
    conn.commit()
    conn.close()
    return jsonify({'details': details, 'source': 'generated'})


# Initialize DB for Vercel Serverless environment
init_db()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
