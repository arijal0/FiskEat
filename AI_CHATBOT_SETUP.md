# AI Chatbot Setup Guide

## Overview
The AI Chatbot feature has been successfully implemented using Google Gemini API. The chatbot helps users with menu questions, nutrition advice, and personalized diet suggestions.

## Installation

### Backend Setup

1. **Install Google Gemini dependency:**
   ```bash
   cd backend
   pip install google-generativeai==0.3.1
   ```

2. **The API key is already configured:**
   - The API key is set as a default value in `backend/app.py`
   - You can also set `GOOGLE_GEMINI_API_KEY` in your `.env` file if needed

3. **Run the backend:**
   ```bash
   python app.py
   ```

### Frontend Setup

The frontend components are already created. Just run:
```bash
cd frontend
npm run dev
```

## Features

### 1. ChatBot Component (`frontend/src/components/ChatBot.tsx`)
- Floating chat interface with gradient design
- Message history display
- Auto-scroll to latest message
- Loading indicator during API calls
- Reset chat history when closed

### 2. Menu Page Integration
- Floating "Ask AI Assistant" button (bottom-right)
- Chatbot opens when button is clicked
- Auto-opens chat when navigating from landing page with "Ask AI Assistant" button

### 3. Landing Page Integration
- "Ask AI Assistant" button next to "Explore Today's Menu"
- Navigates to menu page and auto-opens chatbot

### 4. Backend Chat Endpoint (`/api/chat`)
- POST endpoint that accepts `message` and optional `menuContext`
- Uses Google Gemini API for AI responses
- Provides context-aware responses based on current menu

## API Endpoint

**POST `/api/chat`**

Request body:
```json
{
  "message": "What's a good high-protein lunch option?",
  "menuContext": { /* current menu data */ }
}
```

Response:
```json
{
  "success": true,
  "response": "AI-generated response text"
}
```

## Usage

1. **From Landing Page:**
   - Click "Ask AI Assistant" button to navigate to menu page with chat auto-opened
   - Or click "Explore Today's Menu" and click the floating button

2. **From Menu Page:**
   - Click the floating "Ask AI Assistant" button (bottom-right corner)
   - Chatbot window will appear

3. **Ask questions like:**
   - "What's a good lunch option for weight loss?"
   - "Show me high-protein breakfast items"
   - "What vegan options are available today?"
   - "Compare the calories in different lunch items"
   - "I'm allergic to nuts, what should I avoid?"

## AI Capabilities

The chatbot can:
- Answer menu-specific questions using current menu data
- Suggest personalized diets (weight loss, high protein, low calorie, etc.)
- Provide nutrition analysis and comparisons
- Answer allergen questions
- Recommend healthy meal combinations
- Explain nutritional benefits

## Testing

1. Start backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Test the chatbot:
   - Navigate to landing page
   - Click "Ask AI Assistant"
   - Ask questions about the menu
   - Try different diet-related queries

## Troubleshooting

### Backend Error: "Import google.generativeai could not be resolved"
- Run: `pip install google-generativeai==0.3.1` in the backend directory

### Chat not responding
- Check if backend is running on port 5001
- Check browser console for errors
- Verify API key is valid

### Chat history not resetting
- Chat history resets each time the chat window is opened
- This is by design for simplicity

