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
- **Firebase Admin SDK** for Firestore database
- **Sodexo API** for menu data
- **Google Gemini API** for AI chatbot (planned)

### Frontend (Planned)
- **React** with modern hooks
- **Responsive design** for mobile-first experience

### Database
- **Google Firestore** (NoSQL)

## 📁 Project Structure

```
fiskeat/
├── backend/
│   ├── app.py                    # Main Flask application
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables (not in git)
│   ├── .env.example             # Example environment variables
│   ├── serviceAccountKey.json   # Firebase credentials (not in git)
│   └── scripts/
│       └── fetch_menu.py        # Daily menu fetcher script
├── frontend/                     # React app (to be created)
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Firebase project with Firestore enabled
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
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

5. **Add Firebase credentials**
   - Download your `serviceAccountKey.json` from Firebase Console
   - Place it in the `backend/` directory

6. **Fetch initial menu data**
   ```bash
   python scripts/fetch_menu.py
   ```

7. **Start the server**
   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5000`

## 📡 API Endpoints

### GET `/`
Health check endpoint

### GET `/api/menu/today`
Get today's menu

**Response:**
```json
{
  "success": true,
  "date": "2025-10-03",
  "menu": {
    "date": "2025-10-03",
    "meals": [...]
  }
}
```

### GET `/api/menu/<date>`
Get menu for a specific date (format: YYYY-MM-DD)

### GET `/api/food/<item_id>`
Get detailed information about a specific food item

### GET `/api/menu/available-dates`
Get list of all dates with available menus

## 🗄️ Database Schema

### Collection: `menus`
```javascript
{
  date: "2025-10-03",
  meals: [
    {
      name: "Breakfast",
      stations: [
        {
          name: "Grill",
          items: [
            {
              id: "12345",
              name: "Scrambled Eggs",
              isVegan: false,
              isVegetarian: true
            }
          ]
        }
      ]
    }
  ]
}
```

### Collection: `foodItems`
```javascript
{
  name: "Scrambled Eggs",
  description: "...",
  ingredients: "...",
  allergens: ["Eggs", "Milk"],
  isVegan: false,
  isVegetarian: true,
  nutrition: {
    calories: "140",
    protein: "12g",
    fat: "9g",
    carbohydrates: "2g",
    sugar: "1g",
    sodium: "180mg"
  }
}
```

## 📅 Development Timeline

- **Week 5** (Sep 18): ✅ Core Backend & Data Schema
- **Week 7** (Oct 2): 🔄 Functional Menu Display (In Progress)
- **Week 9** (Oct 16): Basic Chatbot Integration
- **Week 11** (Oct 30): Chatbot Refinement and UI Polish
- **Week 13** (Nov 13): Final Features and Testing
- **Week 16** (Dec 4): Final Presentation

## 🧪 Testing

Test the API using curl or a tool like Postman:

```bash
# Get today's menu
curl http://localhost:5000/api/menu/today

# Get specific date menu
curl http://localhost:5000/api/menu/2025-10-03

# Get available dates
curl http://localhost:5000/api/menu/available-dates
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