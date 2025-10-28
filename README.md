# FiskEat 🍽️

**GenAI-Powered Dining Assistant for Fisk University**

A full-stack web application that provides Fisk University students with easy access to daily dining hall menus, nutritional information, and AI-powered meal recommendations.

## 📋 Project Overview

FiskEat solves the problem of students not having digital access to campus dining information. The application fetches daily menu data from Sodexo's API and presents it through a clean, responsive interface with an integrated AI chatbot powered by Google Gemini.

**Course:** CSCI 310: Junior Seminar  
**Instructor:** Dr. Yu Zhang  
**Semester:** Fall 2025

## 🎯 Features

- **Daily Menu Display**: View today's breakfast, lunch, and dinner organized by dining stations
- **Nutritional Information**: Access detailed nutrition facts for each food item
- **AI Chatbot**: Get personalized meal suggestions and dietary advice using Google Gemini
- **Dietary Filters**: Filter menu items by vegetarian, vegan, and other preferences
- **Responsive Design**: Works seamlessly on mobile and desktop devices

## 🛠️ Tech Stack

### Backend
- **Python 3.x** with Flask
- **Sodexo API** for dynamic menu data fetching
- **pytest** for comprehensive testing
- **Google Gemini API** for AI chatbot (planned)

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Responsive design** for mobile-first experience

## 📁 Project Structure

```
fiskeat/
├── backend/
│   ├── app.py                    # Main Flask application
│   ├── test_app.py              # Comprehensive test suite
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables (not in git)
│   └── scripts/
│       └── fetch_menu.py        # Legacy script (no longer needed)
├── frontend/                     # React app
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Sodexo API access

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fiskeat/backend
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   SODEXO_API_KEY=your_api_key_here
   SODEXO_LOCATION_ID=73110001  # Optional, defaults to this value
   SODEXO_SITE_ID=22135          # Optional, defaults to this value
   PORT=5001                     # Optional, defaults to 5001
   FLASK_ENV=development         # Optional
   ```

5. **Start the server**
   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 📡 API Endpoints

### GET `/`
Health check endpoint

**Response:**
```json
{
  "message": "FiskEat API is running!",
  "version": "2.0.0",
  "description": "Dynamic menu fetching - no database required",
  "endpoints": {
    "menu_today": "/api/menu/today",
    "menu_by_date": "/api/menu/<date>",
    "food_item": "/api/food/<item_id>"
  }
}
```

### GET `/api/menu/today`
Get today's menu (fetched dynamically from Sodexo API)

**Response:**
```json
{
  "success": true,
  "date": "2025-10-03",
  "menu": {
    "date": "2025-10-03",
    "meals": [
      {
        "name": "Breakfast",
        "stations": [
          {
            "name": "Grill",
            "items": [
              {
                "id": "12345",
                "name": "Scrambled Eggs",
                "description": "Fresh scrambled eggs",
                "ingredients": "Eggs, milk, butter",
                "allergens": ["Eggs", "Milk"],
                "isVegan": false,
                "isVegetarian": true,
                "nutrition": {
                  "calories": "250",
                  "protein": "15",
                  "fat": "20",
                  "carbohydrates": "5",
                  "sugar": "1",
                  "sodium": "400"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### GET `/api/menu/<date>`
Get menu for a specific date (format: YYYY-MM-DD)

**Example:**
```bash
GET /api/menu/2025-10-15
```

### GET `/api/food/<item_id>`
Get detailed information about a specific food item from today's menu

**Example:**
```bash
GET /api/food/12345
```

## 🔄 Architecture

**No Database Required!** The application uses dynamic API calls to fetch menu data directly from Sodexo's API. This means:
- ✅ Always up-to-date menu information
- ✅ No database maintenance required
- ✅ Simpler architecture
- ✅ No data persistence needed

Each API request fetches the menu data fresh from Sodexo, transforms it into a clean format, and returns it to the client.

## 📅 Development Timeline

- **Week 5** (Sep 18): ✅ Core Backend & Data Schema
- **Week 7** (Oct 2): ✅ Functional Menu Display with React Frontend
- **Week 9** (Oct 16): Basic Chatbot Integration (Planned)
- **Week 11** (Oct 30): Chatbot Refinement and UI Polish (Planned)
- **Week 13** (Nov 13): Final Features and Testing (Planned)
- **Week 16** (Dec 4): Final Presentation (Planned)

## 🧪 Testing

### Running Tests

```bash
# Install test dependencies (already in requirements.txt)
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run with verbose output
pytest -v
```

### Manual Testing

Test the API using curl or a tool like Postman:

```bash
# Health check
curl http://localhost:5001/

# Get today's menu
curl http://localhost:5001/api/menu/today

# Get specific date menu
curl http://localhost:5001/api/menu/2025-10-03

# Get food item details
curl http://localhost:5001/api/food/12345
```

## 🤝 Contributing

This is a solo academic project, but feedback and suggestions are welcome!

## 📄 License

This project is created for academic purposes at Fisk University.

## 🙏 Acknowledgments

- Dr. Yu Zhang for project guidance
- Fisk University Sodexo staff for providing menu data access
- Firebase and Google Gemini for their excellent APIs

## 📞 Contact

For questions or issues, please contact the project maintainer.

---

**Built with ❤️ for the Fisk University community**