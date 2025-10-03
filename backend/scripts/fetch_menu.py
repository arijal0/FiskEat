"""
Fetch daily menu from Sodexo API and store in Firestore
This is the Python equivalent of your JavaScript code
"""
import os
import requests
from datetime import datetime
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from .env file
load_dotenv()

# Initialize Firebase (only once)
if not firebase_admin._apps:
    cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', './serviceAccountKey.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# Get Firestore database reference
db = firestore.client()


def fetch_and_save_menu(date_str=None):
    """
    Fetch menu from Sodexo API and save to Firestore
    
    Args:
        date_str: Date in YYYY-MM-DD format. If None, uses today's date.
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
        
        print(f"📅 Fetching menu for {date_str} from Sodexo API...")
        
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
            print("⚠️  No menu data found for today. Exiting.")
            return
        
        print("✅ Successfully fetched data. Now transforming...")
        
        # Create the clean menu document for 'menus' collection
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
                    
                    # Add simplified item to main menu document
                    new_station['items'].append({
                        'id': menu_item_id,
                        'name': item.get('formalName', ''),
                        'isVegan': item.get('isVegan', False),
                        'isVegetarian': item.get('isVegetarian', False)
                    })
                    
                    # Create detailed document for 'foodItems' collection
                    food_item_doc = {
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
                    }
                    
                    # Save detailed food item to 'foodItems' collection
                    food_item_ref = db.collection('foodItems').document(str(menu_item_id))
                    food_item_ref.set(food_item_doc, merge=True)
                
                new_meal['stations'].append(new_station)
            
            menu_doc['meals'].append(new_meal)
        
        print("💾 Transformation complete. Saving main menu to Firestore...")
        
        # Save main menu document to 'menus' collection
        menu_ref = db.collection('menus').document(date_str)
        menu_ref.set(menu_doc)
        
        print(f"🎉 SUCCESS! Menu for {date_str} has been saved to Firestore!")
        print(f"   - Saved to 'menus/{date_str}'")
        print(f"   - Updated {len([item for meal in menu_doc['meals'] for station in meal['stations'] for item in station['items']])} food items")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ API Request Error: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")


if __name__ == '__main__':
    # Run the function when script is executed directly
    print("🚀 Starting menu fetch script...")
    fetch_and_save_menu()
    print("✨ Script completed!")