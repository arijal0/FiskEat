"""
FiskEat Flask Backend API
Main application file
"""
import os
import json
from datetime import datetime, time
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import google.generativeai as genai
from pathlib import Path
from threading import Lock

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
5.  **Be Proactive (if relevant):** If a user states a goal (e.g., "high protein"), and asks for one meal, suggest a complementary meal. For example, if they ask for a high-protein lunch, also suggest a high-protein dinner option.
6.  **Use Preferences:** Pay close attention to the user's dietary preferences and allergies provided in the prompt. Always filter your suggestions based on them.

**Good Example (for "high protein meal"):**
* **Lunch:** Balsamic Chicken Breast with a side of Lemony Chickpea Salad."

**Bad Example:**
"Hey there! That's a great goal. For a high-protein meal, I'd suggest the Balsamic Chicken Breast, which is a fantastic lean protein..."
"""

# Initialize model with system instruction
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=SYSTEM_PROMPT)


# Flagged items storage configuration
DATA_DIR = Path(__file__).resolve().parent / 'data'
FLAGGED_ITEMS_FILE = DATA_DIR / 'flagged_items.json'
FLAGGED_LOCK = Lock()

MEAL_WINDOWS = {
    'Breakfast': (time(6, 0), time(10, 30)),
    'Lunch': (time(10, 30), time(15, 0)),
    'Dinner': (time(16, 30), time(21, 0)),
}

MEAL_ALIASES = {
    'breakfast': 'Breakfast',
    'lunch': 'Lunch',
    'dinner': 'Dinner',
}


def ensure_data_dir():
    """Ensure the data directory and flagged items file exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not FLAGGED_ITEMS_FILE.exists():
        with FLAGGED_LOCK:
            FLAGGED_ITEMS_FILE.write_text(json.dumps({}), encoding='utf-8')


def load_flagged_items():
    """Load flagged items from disk, cleaning up stale entries."""
    ensure_data_dir()
    with FLAGGED_LOCK:
        try:
            with FLAGGED_ITEMS_FILE.open('r', encoding='utf-8') as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            data = {}

        stale_dates = []

        for date_key in list(data.keys()):
            try:
                date_obj = datetime.strptime(date_key, '%Y-%m-%d').date()
            except ValueError:
                stale_dates.append(date_key)
                continue

            if date_obj < datetime.now().date():
                stale_dates.append(date_key)

        for stale_date in stale_dates:
            data.pop(stale_date, None)

        if stale_dates:
            with FLAGGED_ITEMS_FILE.open('w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)

        return data


def save_flagged_items(data):
    """Persist flagged items to disk."""
    ensure_data_dir()
    with FLAGGED_LOCK:
        with FLAGGED_ITEMS_FILE.open('w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)


def normalize_meal_name(meal_name):
    if not meal_name:
        return None
    return MEAL_ALIASES.get(meal_name.strip().lower())


def is_time_in_range(start, end, current):
    if start <= end:
        return start <= current < end
    return start <= current or current < end


def get_current_meal_period():
    """Return the active meal name based on current local time."""
    now = datetime.now().time()
    for meal_name, (start, end) in MEAL_WINDOWS.items():
        if is_time_in_range(start, end, now):
            return meal_name
    return None


def is_meal_active(meal_name):
    normalized = normalize_meal_name(meal_name)
    if not normalized:
        return False
    return normalized == get_current_meal_period()


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
        
        flagged_data = load_flagged_items()
        date_flags = flagged_data.get(date_str, {})

        # Create the clean menu document
        menu_doc = {
            'date': date_str,
            'meals': [],
            'activeMeal': None
        }
        
        # Loop through all meals (Breakfast, Lunch, Dinner)
        for meal in raw_menu_data:
            new_meal = {
                'name': meal.get('name', ''),
                'stations': []
            }

            meal_normalized = normalize_meal_name(new_meal['name'])
            meal_flagged_ids = date_flags.get(meal_normalized, []) if meal_normalized else []
            meal_flagged_id_set = {str(flagged_id) for flagged_id in meal_flagged_ids}
            
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
                    is_flagged = str(menu_item_id) in meal_flagged_id_set

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
                        },
                        'isFlagged': is_flagged
                    })
                
                new_meal['stations'].append(new_station)
            
            menu_doc['meals'].append(new_meal)
        today_str = datetime.now().strftime('%Y-%m-%d')
        if date_str == today_str:
            menu_doc['activeMeal'] = get_current_meal_period()
        
        return menu_doc
        
    except requests.exceptions.RequestException as e:
        print(f"❌ API Request Error: {e}")
        return None
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        return None


def transform_history_for_gemini(history):
    """Converts the frontend's history format to the genai format."""
    gemini_history = []
    for msg in history:
        # Map 'assistant' role from frontend to 'model' for genai
        role = 'model' if msg.get('role') == 'assistant' else 'user'
        gemini_history.append({
            'role': role,
            'parts': [msg.get('content', '')]
        })
    return gemini_history


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
            'food_item': '/api/food/<item_id>',
            'flag_item': '/api/menu/flag',
            'chat': '/api/chat'
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


@app.route('/api/menu/flag', methods=['POST'])
def flag_menu_item():
    """Flag or unflag a menu item for the current day's active meal period."""
    try:
        payload = request.get_json(silent=True) or {}
        item_id = payload.get('itemId')
        meal_name = payload.get('mealName')
        raw_flag = payload.get('flag', True)
        requested_date = payload.get('date')

        if item_id is None or str(item_id).strip() == '':
            return jsonify({
                'error': 'Missing itemId',
                'message': 'itemId is required to flag a menu item.'
            }), 400

        if not meal_name:
            return jsonify({
                'error': 'Missing mealName',
                'message': 'mealName is required to flag a menu item.'
            }), 400

        normalized_meal = normalize_meal_name(meal_name)
        if normalized_meal is None:
            return jsonify({
                'error': 'Invalid mealName',
                'message': 'mealName must be Breakfast, Lunch, or Dinner.'
            }), 400

        today_str = datetime.now().strftime('%Y-%m-%d')
        target_date = requested_date or today_str

        if target_date != today_str:
            return jsonify({
                'error': 'Flagging restricted to today',
                'message': 'Items can only be flagged for today\'s menu.'
            }), 400

        if not is_meal_active(normalized_meal):
            return jsonify({
                'error': 'Flagging unavailable',
                'message': 'Flagging is only available during the active meal period.',
                'activeMeal': get_current_meal_period()
            }), 403

        should_flag = raw_flag
        if isinstance(raw_flag, str):
            should_flag = raw_flag.lower() not in {'false', '0', 'no'}
        else:
            should_flag = bool(raw_flag)

        flagged_data = load_flagged_items()
        day_flags = flagged_data.setdefault(today_str, {})
        meal_flags = set(str(flagged_id) for flagged_id in day_flags.get(normalized_meal, []))

        item_id_str = str(item_id)
        if should_flag:
            meal_flags.add(item_id_str)
        else:
            meal_flags.discard(item_id_str)

        if meal_flags:
            day_flags[normalized_meal] = sorted(meal_flags)
        else:
            day_flags.pop(normalized_meal, None)

        if not day_flags:
            flagged_data.pop(today_str, None)

        save_flagged_items(flagged_data)

        return jsonify({
            'success': True,
            'itemId': item_id_str,
            'mealName': normalized_meal,
            'date': today_str,
            'isFlagged': item_id_str in meal_flags,
            'message': f"Item {'flagged' if item_id_str in meal_flags else 'unflagged'} for {normalized_meal}."
        })

    except Exception as e:
        print(f"❌ Flag item error: {e}")
        return jsonify({
            'error': 'Failed to update item flag',
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
    """AI Chatbot endpoint using Google Gemini with conversation history"""
    try:
        data = request.get_json()
        history = data.get('history', [])
        menu_context = data.get('menuContext', None)
        user_preferences = data.get('userPreferences', None)  # New: Get preferences

        if not history:
            return jsonify({
                'error': 'No history provided',
                'message': 'The history array is required with at least one user message.'
            }), 400

        # Transform all but the last message (which is the new prompt)
        # for the chat session's history
        try:
            gemini_history = transform_history_for_gemini(history[:-1])
            new_user_message = history[-1].get('content', '')
        except IndexError:
            return jsonify({'error': 'Invalid history format'}), 400
        
        if not new_user_message:
            return jsonify({
                'error': 'No new message in history',
                'message': 'The last item in the history array must be a user message.'
            }), 400
        
        # Build the final prompt with all context
        final_prompt_string = f"User question: {new_user_message}\n"
        
        # --- New: Inject User Preferences ---
        if user_preferences:
            final_prompt_string += "\n--- MY DIETARY PREFERENCES (Remember these):\n"
            if user_preferences.get('diet'):
                final_prompt_string += f"- My Diet: {user_preferences['diet']}\n"
            if user_preferences.get('allergies'):
                allergies_list = ", ".join(user_preferences['allergies'])
                final_prompt_string += f"- My Allergies (Must Avoid): {allergies_list}\n"
            if user_preferences.get('goals'):
                final_prompt_string += f"- My Goals: {user_preferences['goals']}\n"
            final_prompt_string += "---\n"
        # --- End of Preference Injection ---

        # Inject menu context (same summarization logic as your old code)
        if menu_context:
            menu_summary = "\nHere is today's menu context:\n"
            for meal in menu_context.get('meals', []):
                menu_summary += f"\n**{meal['name']}**:\n"
                for station in meal.get('stations', []):
                    # Get item names, but only if they are not flagged
                    items = station.get('items', [])
                    item_names = [item['name'] for item in items if not item.get('isFlagged', False)]

                    if item_names:  # Only show station if it has unflagged items
                        # Show up to 5 items, add "and more" if truncated
                        display_items = item_names[:5]
                        suffix = "..." if len(item_names) > 5 else ""
                        menu_summary += f"- {station['name']}: {', '.join(display_items)}{suffix}\n"
            
            final_prompt_string += menu_summary
        else:
            final_prompt_string += "\nNo specific menu provided."
        
        # Start the chat session with the past history
        chat_session = model.start_chat(history=gemini_history)
        
        # Send the new, context-rich message
        response = chat_session.send_message(final_prompt_string)
        
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