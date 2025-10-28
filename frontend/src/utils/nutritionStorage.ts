import { FoodItem } from '../pages/MenuPage'

export interface NutritionGoals {
  calories: number
  protein: number
  fat: number
  carbohydrates: number
  sugar: number
  sodium: number
}

const SELECTIONS_KEY = 'nutrition-selections'
const GOALS_KEY = 'nutrition-goals'

export const saveSelectedItems = (items: FoodItem[]): void => {
  try {
    localStorage.setItem(SELECTIONS_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Error saving selected items:', error)
  }
}

export const loadSelectedItems = (): FoodItem[] => {
  try {
    const stored = localStorage.getItem(SELECTIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading selected items:', error)
    return []
  }
}

export const clearSelections = (): void => {
  try {
    localStorage.removeItem(SELECTIONS_KEY)
  } catch (error) {
    console.error('Error clearing selections:', error)
  }
}

export const saveNutritionGoals = (goals: NutritionGoals): void => {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
  } catch (error) {
    console.error('Error saving nutrition goals:', error)
  }
}

export const loadNutritionGoals = (): NutritionGoals | null => {
  try {
    const stored = localStorage.getItem(GOALS_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error loading nutrition goals:', error)
    return null
  }
}

export const getDefaultGoals = (): NutritionGoals => ({
  calories: 2000,
  protein: 50,
  fat: 65,
  carbohydrates: 300,
  sugar: 50,
  sodium: 2300,
})

