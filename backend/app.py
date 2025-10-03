"""
FiskEat Flask Backend API
Main application file
"""
import os
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize Firebase
if not firebase_admin._apps:
    cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', './serviceAccountKey.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()


@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'FiskEat API is running!',
        'version': '1.0.0',
        'endpoints': {
            'menu_today': '/api/menu/today',
            'menu_by_date': '/api/menu/<date>',
            'food_item': '/api/food/<item_id>'
        }
    })


@app.route('/api/menu/today', methods=['GET'])
def get_todays_menu():
    """Get today's menu"""
    try:
        # Get today's date
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Fetch from Firestore
        menu_ref = db.collection('menus').document(today)
        menu_doc = menu_ref.get()
        
        if not menu_doc.exists:
            return jsonify({
                'error': 'No menu found for today',
                'date': today,
                'message': 'Menu may not have been fetched yet. Try running the fetch script.'
            }), 404
        
        menu_data = menu_doc.to_dict()
        return jsonify({
            'success': True,
            'date': today,
            'menu': menu_data
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch menu',
            'message': str(e)
        }), 500


@app.route('/api/menu/<date>', methods=['GET'])
def get_menu_by_date(date):
    """
    Get menu for a specific date
    Date format: YYYY-MM-DD
    """
    try:
        # Validate date format
        datetime.strptime(date, '%Y-%m-%d')
        
        # Fetch from Firestore
        menu_ref = db.collection('menus').document(date)
        menu_doc = menu_ref.get()
        
        if not menu_doc.exists:
            return jsonify({
                'error': 'No menu found for this date',
                'date': date
            }), 404
        
        menu_data = menu_doc.to_dict()
        return jsonify({
            'success': True,
            'date': date,
            'menu': menu_data
        })
        
    except ValueError:
        return jsonify({
            'error': 'Invalid date format',
            'message': 'Date must be in YYYY-MM-DD format'
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch menu',
            'message': str(e)
        }), 500


@app.route('/api/food/<item_id>', methods=['GET'])
def get_food_item(item_id):
    """Get detailed information about a specific food item"""
    try:
        # Fetch from Firestore
        food_ref = db.collection('foodItems').document(item_id)
        food_doc = food_ref.get()
        
        if not food_doc.exists:
            return jsonify({
                'error': 'Food item not found',
                'item_id': item_id
            }), 404
        
        food_data = food_doc.to_dict()
        return jsonify({
            'success': True,
            'item_id': item_id,
            'food': food_data
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch food item',
            'message': str(e)
        }), 500


@app.route('/api/menu/available-dates', methods=['GET'])
def get_available_dates():
    """Get list of dates that have menus available"""
    try:
        # Get all menu documents
        menus_ref = db.collection('menus')
        docs = menus_ref.stream()
        
        dates = [doc.id for doc in docs]
        dates.sort(reverse=True)  # Most recent first
        
        return jsonify({
            'success': True,
            'dates': dates,
            'count': len(dates)
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch available dates',
            'message': str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🚀 Starting FiskEat API server...")
    print(f"📍 Server running on http://localhost:{port}")
    print(f"🔧 Debug mode: {debug}")
    
    app.run(debug=debug, port=port, host='0.0.0.0')