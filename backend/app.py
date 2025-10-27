"""
FiskEat Flask Backend API
Main application file
"""
import os
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend


def fetch_menu_from_sodexo(date_str=None):
    """
    Fetch menu from Sodexo API and transform it into a clean format
    
    Args:
        date_str: Date in YYYY-MM-DD format. If None, uses today's date.
    
    Returns:
        Transformed menu data dictionary or None if error
    """
    try:
        # Get configuration from environment variables
        api_key = os.getenv('SODEXO_API_KEY')
        location_id = os.getenv('SODEXO_LOCATION_ID', '73110001')
        site_id = os.getenv('SODEXO_SITE_ID', '22135')
        
        # Get today's date if not provided
        if date_str is None:
            today = datetime.now()
            date_str = today.strftime('%Y-%m-%d')
        
        # Build the API URL
        url = f"https://api-prd.sodexomyway.net/v0.2/data/menu/{location_id}/{site_id}"
        
        # Make the API request
        response = requests.get(
            url,
            params={'date': date_str},
            headers={'API-Key': api_key}
        )
        
        # Check if request was successful
        response.raise_for_status()
        raw_menu_data = response.json()
        
        if not raw_menu_data:
            return None
        
        # Create the clean menu document
        menu_doc = {
            'date': date_str,
            'meals': []
        }
        
        # Loop through all meals (Breakfast, Lunch, Dinner)
        for meal in raw_menu_data:
            new_meal = {
                'name': meal.get('name', ''),
                'stations': []
            }
            
            # Loop through all stations (Grill, Savory, Deli, etc.)
            for station in meal.get('groups', []):
                new_station = {
                    'name': station.get('name', ''),
                    'items': []
                }
                
                # Loop through all food items at this station
                for item in station.get('items', []):
                    menu_item_id = item.get('menuItemId')
                    
                    # Add item with detailed information
                    new_station['items'].append({
                        'id': menu_item_id,
                        'name': item.get('formalName', ''),
                        'description': item.get('description', ''),
                        'ingredients': item.get('ingredients', ''),
                        'allergens': [allergen.get('name', '') for allergen in item.get('allergens', [])],
                        'isVegan': item.get('isVegan', False),
                        'isVegetarian': item.get('isVegetarian', False),
                        'nutrition': {
                            'calories': item.get('calories', 'N/A'),
                            'protein': item.get('protein', 'N/A'),
                            'fat': item.get('fat', 'N/A'),
                            'carbohydrates': item.get('carbohydrates', 'N/A'),
                            'sugar': item.get('sugar', 'N/A'),
                            'sodium': item.get('sodium', 'N/A')
                        }
                    })
                
                new_meal['stations'].append(new_station)
            
            menu_doc['meals'].append(new_meal)
        
        return menu_doc
        
    except requests.exceptions.RequestException as e:
        print(f"❌ API Request Error: {e}")
        return None
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        return None


@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'FiskEat API is running!',
        'version': '2.0.0',
        'description': 'Dynamic menu fetching - no database required',
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
        
        # Fetch menu dynamically from Sodexo API
        menu_data = fetch_menu_from_sodexo(today)
        
        if menu_data is None:
            return jsonify({
                'error': 'No menu found for today',
                'date': today,
                'message': 'Menu may not be available for this date.'
            }), 404
        
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
        
        # Fetch menu dynamically from Sodexo API
        menu_data = fetch_menu_from_sodexo(date)
        
        if menu_data is None:
            return jsonify({
                'error': 'No menu found for this date',
                'date': date
            }), 404
        
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
        # Get today's menu to search for the item
        today = datetime.now().strftime('%Y-%m-%d')
        menu_data = fetch_menu_from_sodexo(today)
        
        if menu_data is None:
            return jsonify({
                'error': 'Menu not available',
                'message': 'Cannot fetch food item - menu is not available'
            }), 404
        
        # Search for the item in the menu
        food_item = None
        for meal in menu_data.get('meals', []):
            for station in meal.get('stations', []):
                for item in station.get('items', []):
                    if str(item.get('id')) == str(item_id):
                        food_item = item
                        break
                if food_item:
                    break
            if food_item:
                break
        
        if food_item is None:
            return jsonify({
                'error': 'Food item not found',
                'item_id': item_id,
                'message': 'Item not found in today\'s menu'
            }), 404
        
        return jsonify({
            'success': True,
            'item_id': item_id,
            'food': food_item
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch food item',
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