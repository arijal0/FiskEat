"""
FiskEat Flask Backend API
Main application file
"""
import os
import json
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure Google Gemini API
api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
if not api_key:
    raise ValueError("GOOGLE_GEMINI_API_KEY not found in environment variables")
genai.configure(api_key=api_key)

# Define system prompt for concise, direct responses
SYSTEM_PROMPT = """You are a fast and helpful AI assistant for Fisk University's Spence Food Hall.
Your #1 priority is to give **concise, scannable, and direct answers**. Students are busy and want to know what to get.

**RULES:**
1.  **Be Direct:** Get straight to the answer. Do NOT use conversational fillers like "Hey there!", "Absolutely!", or "That's a super smart goal!".
2.  **Use Bullet Points:** Always use lists for meal plans or food items.
3.  **Be Specific, Not Wordy:** Just list the food. Don't add long explanations about *why* it's a good choice unless asked.
4.  **No Generic Advice:** Do NOT give general health tips (like "drink water" or "portion control"). Stick only to the menu items.

**Good Example (for "high protein meal"):**
* **Lunch:** Balsamic Chicken Breast with a side of Lemony Chickpea Salad."

**Bad Example:**
"Hey there! That's a great goal. For a high-protein meal, I'd suggest the Balsamic Chicken Breast, which is a fantastic lean protein..."
"""

# Initialize model with system instruction
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=SYSTEM_PROMPT)


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
                    
                    # Helper function to strip units from nutrition values
                    def strip_unit(value):
                        if isinstance(value, str):
                            # Remove all units - order matters: mg before g to avoid leaving 'm'
                            import re
                            # Remove mg, kg, g in that order to handle all cases
                            value = re.sub(r'\s*mg\s*', '', value)
                            value = re.sub(r'\s*kg\s*', '', value)
                            value = re.sub(r'\s*g\s*', '', value)
                            return value.strip()
                        return value
                    
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
                            'protein': strip_unit(item.get('protein', 'N/A')),
                            'fat': strip_unit(item.get('fat', 'N/A')),
                            'carbohydrates': strip_unit(item.get('carbohydrates', 'N/A')),
                            'sugar': strip_unit(item.get('sugar', 'N/A')),
                            'sodium': strip_unit(item.get('sodium', 'N/A'))
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


@app.route('/api/chat', methods=['POST'])
def chat():
    """AI Chatbot endpoint using Google Gemini"""
    try:
        user_message = request.json.get('message', '')
        menu_context = request.json.get('menuContext', None)
        
        if not user_message:
            return jsonify({
                'error': 'No message provided',
                'message': 'Please provide a message'
            }), 400
        
        # Build the user prompt with menu context
        full_prompt = f"User question: {user_message}\n"
        
        if menu_context:
            menu_summary = "\nHere is today's menu context:\n"
            for meal in menu_context.get('meals', []):
                menu_summary += f"\n{meal['name']}:\n"
                for station in meal.get('stations', []):
                    item_names = [item['name'] for item in station.get('items', [])]
                    menu_summary += f"- {station['name']}: {', '.join(item_names[:5])}\n"
            
            full_prompt += menu_summary
        else:
            full_prompt += "\nNo specific menu provided."
        
        # Call Gemini API
        # Since system_instruction is set at model initialization, we only pass the user message
        response = model.generate_content(full_prompt)
        
        return jsonify({
            'success': True,
            'response': response.text
        })
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return jsonify({
            'error': 'Failed to process chat message',
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