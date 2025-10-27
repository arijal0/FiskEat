"""
Test suite for FiskEat Flask Backend API
Tests all endpoints with mocking to avoid real API calls during testing
"""
import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock
import json


# Sample mock menu data that mimics Sodexo API response
MOCK_MENU_DATA = [
    {
        'name': 'Breakfast',
        'groups': [
            {
                'name': 'Continental',
                'items': [
                    {
                        'menuItemId': '12345',
                        'formalName': 'Scrambled Eggs',
                        'description': 'Fresh scrambled eggs',
                        'ingredients': 'Eggs, milk, butter',
                        'allergens': [{'name': 'Eggs'}, {'name': 'Milk'}],
                        'isVegan': False,
                        'isVegetarian': True,
                        'calories': '250',
                        'protein': '15',
                        'fat': '20',
                        'carbohydrates': '5',
                        'sugar': '1',
                        'sodium': '400'
                    }
                ]
            }
        ]
    },
    {
        'name': 'Lunch',
        'groups': [
            {
                'name': 'Grill',
                'items': [
                    {
                        'menuItemId': '67890',
                        'formalName': 'Grilled Chicken Breast',
                        'description': 'Tender grilled chicken',
                        'ingredients': 'Chicken, olive oil, seasonings',
                        'allergens': [],
                        'isVegan': False,
                        'isVegetarian': False,
                        'calories': '300',
                        'protein': '35',
                        'fat': '10',
                        'carbohydrates': '2',
                        'sugar': '0',
                        'sodium': '500'
                    }
                ]
            }
        ]
    }
]


@pytest.fixture
def client():
    """Create a test client for the Flask app"""
    from app import app
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@patch('app.requests.get')
def test_home_endpoint(mock_get, client):
    """Test the home endpoint returns API information"""
    response = client.get('/')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'FiskEat API is running!'
    assert data['version'] == '2.0.0'
    assert 'endpoints' in data
    assert data['description'] == 'Dynamic menu fetching - no database required'


@patch('app.fetch_menu_from_sodexo')
def test_get_todays_menu_success(mock_fetch, client):
    """Test successful retrieval of today's menu"""
    # Mock the menu data
    mock_fetch.return_value = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'meals': [
            {
                'name': 'Breakfast',
                'stations': [
                    {
                        'name': 'Continental',
                        'items': [
                            {
                                'id': '12345',
                                'name': 'Scrambled Eggs',
                                'isVegan': False,
                                'isVegetarian': True
                            }
                        ]
                    }
                ]
            }
        ]
    }
    
    response = client.get('/api/menu/today')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'menu' in data
    assert 'date' in data


@patch('app.fetch_menu_from_sodexo')
def test_get_todays_menu_not_found(mock_fetch, client):
    """Test handling when menu is not available"""
    mock_fetch.return_value = None
    
    response = client.get('/api/menu/today')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data


@patch('app.fetch_menu_from_sodexo')
def test_get_menu_by_date_success(mock_fetch, client):
    """Test successful retrieval of menu for specific date"""
    test_date = '2025-01-15'
    mock_fetch.return_value = {
        'date': test_date,
        'meals': []
    }
    
    response = client.get(f'/api/menu/{test_date}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['date'] == test_date


@patch('app.fetch_menu_from_sodexo')
def test_get_menu_by_date_invalid_format(mock_fetch, client):
    """Test handling of invalid date format"""
    # Test with invalid date format
    response = client.get('/api/menu/invalid-date')
    
    assert response.status_code == 400 or response.status_code == 500
    data = json.loads(response.data)
    assert 'error' in data


@patch('app.fetch_menu_from_sodexo')
def test_get_menu_by_date_not_found(mock_fetch, client):
    """Test handling when menu is not found for date"""
    mock_fetch.return_value = None
    
    response = client.get('/api/menu/2025-12-31')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert 'No menu found' in data['error']


@patch('app.fetch_menu_from_sodexo')
def test_get_food_item_success(mock_fetch, client):
    """Test successful retrieval of food item"""
    item_id = '12345'
    mock_fetch.return_value = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'meals': [
            {
                'name': 'Breakfast',
                'stations': [
                    {
                        'name': 'Continental',
                        'items': [
                            {
                                'id': item_id,
                                'name': 'Scrambled Eggs',
                                'description': 'Fresh scrambled eggs',
                                'isVegan': False,
                                'isVegetarian': True
                            }
                        ]
                    }
                ]
            }
        ]
    }
    
    response = client.get(f'/api/food/{item_id}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['item_id'] == item_id
    assert 'food' in data


@patch('app.fetch_menu_from_sodexo')
def test_get_food_item_not_found(mock_fetch, client):
    """Test handling when food item is not found"""
    mock_fetch.return_value = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'meals': []
    }
    
    response = client.get('/api/food/nonexistent')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Food item not found' in data['error']


@patch('app.fetch_menu_from_sodexo')
def test_get_food_item_menu_unavailable(mock_fetch, client):
    """Test handling when menu is unavailable"""
    mock_fetch.return_value = None
    
    response = client.get('/api/food/12345')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Menu not available' in data['error']


def test_fetch_menu_function_with_mock():
    """Test the fetch_menu_from_sodexo function with mocked requests"""
    from app import fetch_menu_from_sodexo
    
    # Mock the requests.get call
    mock_response = MagicMock()
    mock_response.json.return_value = MOCK_MENU_DATA
    mock_response.raise_for_status = MagicMock()
    
    with patch('app.requests.get', return_value=mock_response):
        result = fetch_menu_from_sodexo('2025-01-15')
        
        assert result is not None
        assert result['date'] == '2025-01-15'
        assert len(result['meals']) == 2
        assert result['meals'][0]['name'] == 'Breakfast'
        assert len(result['meals'][0]['stations']) == 1


def test_fetch_menu_function_api_error():
    """Test the fetch_menu_from_sodexo function handles API errors"""
    from app import fetch_menu_from_sodexo
    import requests
    
    with patch('app.requests.get', side_effect=requests.exceptions.RequestException('API Error')):
        result = fetch_menu_from_sodexo('2025-01-15')
        
        assert result is None


def test_404_error_handler(client):
    """Test the custom 404 error handler"""
    response = client.get('/nonexistent-endpoint')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

