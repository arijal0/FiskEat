# FiskEat Frontend

React frontend for the FiskEat dining hall menu application.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on port 5001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Features

- **Date Picker**: Navigate between different dates to view menus
- **Meal Display**: View breakfast, lunch, and dinner menus organized by stations
- **Nutritional Information**: See calories and nutrition facts for each item
- **Dietary Indicators**: Visual indicators for vegetarian and vegan options
- **Allergen Information**: View allergen details for each menu item

## Architecture

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **date-fns**: Date manipulation utilities

