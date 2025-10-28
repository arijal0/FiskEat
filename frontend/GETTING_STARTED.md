# Getting Started with FiskEat Frontend

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Backend (in a separate terminal)

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

The backend should be running on `http://localhost:5001`

### 3. Start the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

The frontend provides:

- **📅 Date Navigation**: Easily navigate between days and weeks to view different dates
- **🍽️ Meal Organization**: View breakfast, lunch, and dinner organized by stations
- **📊 Nutrition Info**: See calories and protein content for each item
- **🥗 Dietary Indicators**: Visual badges for vegetarian (V) and vegan (VE) options
- **⚠️ Allergen Information**: View allergen details for safe dining

## Design Inspiration

This frontend is inspired by the official Sodexo dining hall website for Fisk University. The design features:

- Clean, modern interface
- Responsive layout for mobile and desktop
- Easy-to-read menu organization
- Quick date navigation
- Professional color scheme matching the university branding

## Development

### Running in Development Mode

```bash
npm run dev
```

The app will hot-reload when you make changes.

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Tech Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **date-fns**: Date manipulation utilities

