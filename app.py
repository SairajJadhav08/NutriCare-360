from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
from datetime import datetime
import uuid
import json
import requests

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database initialization
def init_db():
    conn = sqlite3.connect('nutricare360.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Reminders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            medicine TEXT NOT NULL,
            dosage TEXT NOT NULL,
            time TEXT NOT NULL,
            frequency TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Prescriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Nutrition history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS nutrition_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food_name TEXT NOT NULL,
            calories REAL NOT NULL,
            protein REAL NOT NULL,
            carbs REAL NOT NULL,
            fat REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Yoga poses table for caching
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS yoga_poses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pose_name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            image_url TEXT,
            steps TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect('nutricare360.db')
    conn.row_factory = sqlite3.Row
    return conn

# Authentication decorator
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if len(username) < 3 or len(password) < 6:
            flash('Username must be at least 3 characters and password at least 6 characters')
            return render_template('register.html')
        
        conn = get_db_connection()
        existing_user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
        
        if existing_user:
            flash('Username already exists')
            conn.close()
            return render_template('register.html')
        
        hashed_password = generate_password_hash(password)
        conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', 
                    (username, hashed_password))
        conn.commit()
        conn.close()
        
        flash('Registration successful! Please login.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully.', 'success')
    return redirect(url_for('login'))

@app.route('/toggle_theme')
def toggle_theme():
    if 'theme' in session and session['theme'] == 'dark':
        session['theme'] = 'light'
    else:
        session['theme'] = 'dark'
    
    # Redirect back to the referring page or dashboard
    return redirect(request.referrer or url_for('dashboard'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/reminders')
@login_required
def reminders():
    conn = get_db_connection()
    user_reminders = conn.execute(
        'SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC',
        (session['user_id'],)
    ).fetchall()
    conn.close()
    return render_template('reminders.html', reminders=user_reminders)

@app.route('/add_reminder', methods=['POST'])
@login_required
def add_reminder():
    medicine = request.form['medicine']
    dosage = request.form['dosage']
    time = request.form['time']
    frequency = request.form['frequency']
    
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO reminders (user_id, medicine, dosage, time, frequency) VALUES (?, ?, ?, ?, ?)',
        (session['user_id'], medicine, dosage, time, frequency)
    )
    conn.commit()
    conn.close()
    
    flash('Reminder added successfully!')
    return redirect(url_for('reminders'))

@app.route('/delete_reminder/<int:reminder_id>')
@login_required
def delete_reminder(reminder_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM reminders WHERE id = ? AND user_id = ?', 
                (reminder_id, session['user_id']))
    conn.commit()
    conn.close()
    
    flash('Reminder deleted successfully!')
    return redirect(url_for('reminders'))

@app.route('/api/dashboard-stats')
@login_required
def dashboard_stats():
    conn = get_db_connection()
    
    # Get reminders count
    reminders_count = conn.execute(
        'SELECT COUNT(*) FROM reminders WHERE user_id = ?',
        (session['user_id'],)
    ).fetchone()[0]
    
    # Get prescriptions count
    prescriptions_count = conn.execute(
        'SELECT COUNT(*) FROM prescriptions WHERE user_id = ?',
        (session['user_id'],)
    ).fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'reminders': reminders_count,
        'prescriptions': prescriptions_count
    })

@app.route('/prescriptions')
@login_required
def prescriptions():
    conn = get_db_connection()
    user_prescriptions = conn.execute(
        'SELECT * FROM prescriptions WHERE user_id = ? ORDER BY upload_date DESC',
        (session['user_id'],)
    ).fetchall()
    conn.close()
    return render_template('prescriptions.html', prescriptions=user_prescriptions)

@app.route('/upload_prescription', methods=['POST'])
@login_required
def upload_prescription():
    if 'prescription' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('prescriptions'))
    
    file = request.files['prescription']
    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('prescriptions'))
    
    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename)
        filename = str(uuid.uuid4()) + '.' + original_filename.rsplit('.', 1)[1].lower()
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO prescriptions (user_id, filename, original_filename) VALUES (?, ?, ?)',
            (session['user_id'], filename, original_filename)
        )
        conn.commit()
        conn.close()
        
        flash('Prescription uploaded successfully!', 'success')
    else:
        flash('Invalid file type. Please upload an image file.', 'error')
    
    return redirect(url_for('prescriptions'))

@app.route('/delete_prescription/<int:prescription_id>')
@login_required
def delete_prescription(prescription_id):
    conn = get_db_connection()
    
    # Get the prescription details to delete the file
    prescription = conn.execute(
        'SELECT filename FROM prescriptions WHERE id = ? AND user_id = ?',
        (prescription_id, session['user_id'])
    ).fetchone()
    
    if prescription:
        # Delete the physical file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], prescription['filename'])
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass  # File might already be deleted or in use
        
        # Delete the database record
        conn.execute(
            'DELETE FROM prescriptions WHERE id = ? AND user_id = ?',
            (prescription_id, session['user_id'])
        )
        conn.commit()
        flash('Prescription deleted successfully!', 'success')
    else:
        flash('Prescription not found or you do not have permission to delete it.', 'error')
    
    conn.close()
    return redirect(url_for('prescriptions'))

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Nutrition routes
@app.route('/nutrition')
@login_required
def nutrition():
    return render_template('nutrition.html')

@app.route('/nutrition/search', methods=['POST'])
@login_required
def nutrition_search():
    data = request.get_json()
    food_query = data.get('food', '').strip()
    use_api = data.get('use_api', False)
    
    if not food_query:
        return jsonify({'error': 'Please enter a food item'}), 400
    
    nutrition_data = None
    
    # Try API mode first if requested
    if use_api:
        try:
            api_key = 'YOUR_CALORIENINJAS_API_KEY'  # Replace with actual API key
            api_url = 'https://api.calorieninjas.com/v1/nutrition'
            headers = {'X-Api-Key': api_key}
            params = {'query': food_query}
            
            response = requests.get(api_url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                api_data = response.json()
                if api_data.get('items'):
                    # Convert API response to our format
                    nutrition_data = []
                    for item in api_data['items']:
                        nutrition_data.append({
                            'name': item.get('name', food_query),
                            'calories': round(item.get('calories', 0), 1),
                            'protein': round(item.get('protein_g', 0), 1),
                            'carbs': round(item.get('carbohydrates_total_g', 0), 1),
                            'fat': round(item.get('fat_total_g', 0), 1)
                        })
        except Exception as e:
            print(f"API request failed: {e}")
            # Fall back to local data
            pass
    
    # Use local JSON data if API failed or not requested
    if not nutrition_data:
        try:
            with open('static/data/nutrition.json', 'r') as f:
                local_data = json.load(f)
            
            # Search for matching foods in local data
            nutrition_data = []
            query_lower = food_query.lower()
            
            for food in local_data['foods']:
                if query_lower in food['name'].lower():
                    nutrition_data.append(food)
            
            # If no exact matches, try partial matches
            if not nutrition_data:
                for food in local_data['foods']:
                    food_words = food['name'].lower().split()
                    query_words = query_lower.split()
                    if any(word in food_words for word in query_words):
                        nutrition_data.append(food)
                        
        except Exception as e:
            print(f"Local data search failed: {e}")
            return jsonify({'error': 'Unable to search nutrition data'}), 500
    
    if not nutrition_data:
        return jsonify({'error': 'No nutrition data found for this food item'}), 404
    
    return jsonify({'results': nutrition_data})

@app.route('/nutrition/history')
@login_required
def nutrition_history():
    conn = get_db_connection()
    history = conn.execute(
        'SELECT * FROM nutrition_history WHERE user_id = ? ORDER BY created_at DESC',
        (session['user_id'],)
    ).fetchall()
    conn.close()
    
    # Convert to list of dictionaries for JSON response
    history_list = []
    for item in history:
        history_list.append({
            'id': item['id'],
            'food_name': item['food_name'],
            'calories': item['calories'],
            'protein': item['protein'],
            'carbs': item['carbs'],
            'fat': item['fat'],
            'created_at': item['created_at']
        })
    
    return jsonify({'history': history_list})

@app.route('/nutrition/save', methods=['POST'])
@login_required
def nutrition_save():
    data = request.get_json()
    
    required_fields = ['food_name', 'calories', 'protein', 'carbs', 'fat']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO nutrition_history (user_id, food_name, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?)',
        (session['user_id'], data['food_name'], data['calories'], data['protein'], data['carbs'], data['fat'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Nutrition data saved successfully'})

@app.route('/nutrition/history/<int:history_id>', methods=['DELETE'])
@login_required
def delete_nutrition_history(history_id):
    conn = get_db_connection()
    
    # Check if the history item belongs to the current user
    item = conn.execute(
        'SELECT id FROM nutrition_history WHERE id = ? AND user_id = ?',
        (history_id, session['user_id'])
    ).fetchone()
    
    if not item:
        conn.close()
        return jsonify({'error': 'History item not found or access denied'}), 404
    
    conn.execute(
        'DELETE FROM nutrition_history WHERE id = ? AND user_id = ?',
        (history_id, session['user_id'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'History item deleted successfully'})

# Yoga Routes
@app.route('/yoga')
@login_required
def yoga():
    return render_template('yoga.html')

@app.route('/yoga/poses', methods=['GET'])
@login_required
def get_yoga_poses():
    mode = request.args.get('mode', 'local')  # 'api' or 'local'
    
    if mode == 'api':
        try:
            # Try to fetch from Yogism API (placeholder - replace with actual API)
            # For now, we'll simulate API failure and fall back to local data
            raise Exception("API not available")
            
        except Exception as e:
            # Fall back to local JSON data
            try:
                with open('static/data/yoga.json', 'r') as f:
                    data = json.load(f)
                return jsonify(data)
            except FileNotFoundError:
                return jsonify({'error': 'Local yoga data not found'}), 404
    else:
        # Use local JSON data
        try:
            with open('static/data/yoga.json', 'r') as f:
                data = json.load(f)
            return jsonify(data)
        except FileNotFoundError:
            return jsonify({'error': 'Local yoga data not found'}), 404

@app.route('/yoga/save', methods=['POST'])
@login_required
def save_yoga_poses():
    data = request.get_json()
    
    if not data or 'poses' not in data:
        return jsonify({'error': 'No poses data provided'}), 400
    
    conn = get_db_connection()
    
    # Clear existing cached poses
    conn.execute('DELETE FROM yoga_poses')
    
    # Insert new poses
    for pose in data['poses']:
        conn.execute(
            'INSERT INTO yoga_poses (pose_name, category, description, image_url, steps) VALUES (?, ?, ?, ?, ?)',
            (pose.get('name', ''), pose.get('category', ''), pose.get('description', ''), 
             pose.get('image_url', ''), pose.get('steps', ''))
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Yoga poses cached successfully'})

@app.route('/yoga/history')
@login_required
def get_yoga_history():
    conn = get_db_connection()
    poses = conn.execute(
        'SELECT id, pose_name, category, description, image_url, steps, created_at FROM yoga_poses ORDER BY created_at DESC'
    ).fetchall()
    conn.close()
    
    poses_list = []
    for pose in poses:
        poses_list.append({
            'id': pose[0],
            'name': pose[1],
            'category': pose[2],
            'description': pose[3],
            'image_url': pose[4],
            'steps': pose[5],
            'created_at': pose[6]
        })
    
    return jsonify({'poses': poses_list})

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True)