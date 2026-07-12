from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    create_refresh_token, get_jwt_identity, get_jwt, verify_jwt_in_request
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import sqlite3, os, uuid, json, requests
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
    identity = get_jwt_identity()
    claims   = {'username': get_jwt().get('username', '')}
    new_token = create_access_token(identity=identity, additional_claims=claims)
    return jsonify({'access_token': new_token})


@app.route('/api/me')
@jwt_required()
def me():
    return jsonify({'id': int(get_jwt_identity()), 'username': get_jwt().get('username', '')})


@app.route('/api/me/password', methods=['PUT'])
@jwt_required()
def change_password():
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
    uid  = int(get_jwt_identity())
    conn = get_db()
    row  = conn.execute('SELECT * FROM user_settings WHERE user_id=?', (uid,)).fetchone()
    conn.close()
    return jsonify({'calorie_goal': row['calorie_goal'] if row else 2000})


@app.route('/api/settings', methods=['PUT'])
@jwt_required()
def update_settings():
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
    uid  = int(get_jwt_identity())
    conn = get_db()
    r = conn.execute('SELECT COUNT(*) FROM reminders WHERE user_id=?', (uid,)).fetchone()[0]
    p = conn.execute('SELECT COUNT(*) FROM prescriptions WHERE user_id=?', (uid,)).fetchone()[0]
    n = conn.execute('SELECT COUNT(*) FROM nutrition_history WHERE user_id=?', (uid,)).fetchone()[0]
    # Yoga: count distinct days where user had taken a reminder (used as "active days" proxy)
    # and last active date
    streak_row = conn.execute(
        "SELECT COUNT(DISTINCT taken_at) as streak_days, MAX(taken_at) as last_active "
        "FROM reminder_taken_log WHERE user_id=? AND taken_at >= date('now','-7 days')",
        (uid,)
    ).fetchone()
    conn.close()
    return jsonify({
        'reminders':    r,
        'prescriptions': p,
        'nutrition':    n,
        'yoga_streak':  streak_row['streak_days'] if streak_row else 0,
        'last_active':  streak_row['last_active']  if streak_row else None,
    })

# ══════════════════════════════════════════════════════════════════════
#  REMINDERS (with edit + mark-as-taken)
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/reminders', methods=['GET'])
@jwt_required()
def get_reminders():
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
#  AI NUTRITION ANALYSIS — Groq (llama3-8b-8192, free tier)
#  Set GROQ_API_KEY in .env — get one free at https://console.groq.com
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/nutrition/analyze', methods=['POST'])
@jwt_required()
def nutrition_analyze():
    data  = request.get_json() or {}
    meal  = (data.get('meal') or '').strip()
    if not meal:
        return jsonify({'error': 'Please describe your meal'}), 400
    if not GROQ_API_KEY:
        return jsonify({'error': 'AI analysis not configured. Add GROQ_API_KEY to backend .env'}), 503

    prompt = (
        f"Estimate the nutritional values for this meal: \"{meal}\".\n"
        "Reply ONLY with valid JSON in exactly this format (no markdown, no explanation):\n"
        '{"name":"<meal name>","calories":<number>,"protein":<number>,"carbs":<number>,"fat":<number>}\n'
        "All numbers should be integers representing typical serving amounts. "
        "Do not include units inside the JSON values."
    )
    try:
        resp = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type':  'application/json',
            },
            json={
                'model':    'llama-3.3-70b-versatile',
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.2,
                'max_tokens':  200,
            },
            timeout=15
        )
        resp.raise_for_status()
        content = resp.json()['choices'][0]['message']['content'].strip()
        # Strip any accidental markdown code fence
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        result = json.loads(content)
        # Validate keys
        for k in ['name', 'calories', 'protein', 'carbs', 'fat']:
            if k not in result:
                raise ValueError(f'Missing key: {k}')
        return jsonify({'result': result})
    except json.JSONDecodeError:
        return jsonify({'error': 'AI returned an unexpected response. Try rephrasing.'}), 502
    except Exception as e:
        return jsonify({'error': f'AI analysis failed: {str(e)}'}), 502

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


@app.route('/api/yoga/poses', methods=['GET'])
@jwt_required()
def get_yoga_poses():
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
            exercises = resp.json()
            poses = []
            for i, ex in enumerate(exercises):
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
                return jsonify({'poses': poses})
        except Exception:
            pass

    local_path = os.path.join(BASE_DIR, 'static', 'data', 'yoga.json')
    try:
        with open(local_path) as f:
            data = json.load(f)
        for pose in data.get('poses', []):
            if isinstance(pose.get('steps'), str):
                pose['steps'] = [s.strip() for s in pose['steps'].split('\n') if s.strip()]
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({'error': 'Yoga data not found. Set RAPIDAPI_KEY in .env or add static/data/yoga.json'}), 404


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
