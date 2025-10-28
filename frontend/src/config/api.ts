/**
 * API Configuration
 * Centralized API endpoint configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

export const API_ENDPOINTS = {
  MENU_TODAY: `${API_BASE_URL}/api/menu/today`,
  MENU_BY_DATE: (date: string) => `${API_BASE_URL}/api/menu/${date}`,
  FOOD_ITEM: (id: string) => `${API_BASE_URL}/api/food/${id}`,
  CHAT: `${API_BASE_URL}/api/chat`,
}

