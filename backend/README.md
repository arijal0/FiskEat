# FiskEat Backend API

Dynamic menu fetching API for Fisk University dining services.

## 🎯 Current Progress

✅ **Version 2.0 - Dynamic Menu Fetching**
- No database required - fetches directly from Sodexo API
- Simplified architecture with only 4 dependencies
- Comprehensive test suite with pytest
- All endpoints working and tested

## 📂 Files

### Core Files
- `app.py` - Main Flask application with all endpoints
- `test_app.py` - Comprehensive test suite
- `requirements.txt` - Minimal dependencies (Flask, CORS, requests, pytest)

### Legacy Files
- `scripts/fetch_menu.py` - No longer needed (was for Firebase storage)

## 🚀 Quick Start

### Installation

```bash
# Activate virtual environment (if not already active)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Setup

Create a `.env` file in the `backend/` directory:

```env
SODEXO_API_KEY=your_api_key_here
SODEXO_LOCATION_ID=73110001  # Optional
SODEXO_SITE_ID=22135          # Optional
PORT=5001                     # Optional
FLASK_ENV=development         # Optional
```

### Running the Server

```bash
python app.py
```

The API will be available at `http://localhost:5001`

## 🧪 Testing

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

### Run Specific Test

```bash
pytest test_app.py::test_get_todays_menu_success -v
```

### Test Coverage

The test suite includes:
- ✅ Home endpoint testing
- ✅ Today's menu endpoint (success and failure cases)
- ✅ Menu by date endpoint (valid/invalid dates)
- ✅ Food item lookup (found/not found cases)
- ✅ API error handling
- ✅ Mock data testing
- ✅ Custom error handlers

## 📡 API Endpoints

### `GET /`
Health check and API information

### `GET /api/menu/today`
Fetches today's menu from Sodexo API

### `GET /api/menu/<date>`
Fetches menu for specific date (YYYY-MM-DD format)

### `GET /api/food/<item_id>`
Searches today's menu for specific food item details

## 🔧 Development

### Architecture

**Dynamic Fetching Model:**
- Each API request calls Sodexo API directly
- No caching or database storage
- Always returns fresh, up-to-date data
- Simple and maintainable code

### Adding New Endpoints

1. Define the route in `app.py`
2. Optionally add helper functions
3. Add tests in `test_app.py`
4. Run tests: `pytest`

### Dependencies

- `Flask` - Web framework
- `flask-cors` - CORS support for frontend
- `python-dotenv` - Environment variable management
- `requests` - HTTP requests to Sodexo API
- `pytest` - Testing framework
- `pytest-cov` - Test coverage reporting

## 📝 Notes

- The `fetch_menu.py` script is no longer needed since we fetch dynamically
- No Firebase credentials required
- No database setup or maintenance needed
- Data is always fresh from Sodexo API

## 🐛 Troubleshooting

**Import Error for pytest:**
```bash
pip install pytest pytest-cov
```

**Cannot connect to Sodexo API:**
- Check your `SODEXO_API_KEY` in `.env`
- Verify network connectivity
- Check API endpoint availability

**Port already in use:**
```bash
# Change PORT in .env file
PORT=5002
```

---

**Version:** 2.0.0  
**Last Updated:** January 2025

