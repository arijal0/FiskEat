import { FoodItem } from '../pages/MenuPage'

export interface NutritionTotals {
  calories: number
  protein: number
  fat: number
  carbohydrates: number
  sugar: number
  sodium: number
}

const parseNutritionValue = (value: string | number): number => {
  if (typeof value === 'number') return value
  if (value === 'N/A') return 0
  
  // Remove any units and parse
  const cleaned = value.toString().replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

export const calculateTotals = (items: FoodItem[]): NutritionTotals => {
  return items.reduce(
    (totals, item) => {
      const nutrition = item.nutrition
      return {
        calories: totals.calories + parseNutritionValue(nutrition.calories),
        protein: totals.protein + parseNutritionValue(nutrition.protein),
        fat: totals.fat + parseNutritionValue(nutrition.fat),
        carbohydrates: totals.carbohydrates + parseNutritionValue(nutrition.carbohydrates),
        sugar: totals.sugar + parseNutritionValue(nutrition.sugar),
        sodium: totals.sodium + parseNutritionValue(nutrition.sodium),
      }
    },
    {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      sugar: 0,
      sodium: 0,
    }
  )
}

export const calculatePercentage = (current: number, goal: number): number => {
  if (goal === 0) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}

export const getProgressColor = (percentage: number): string => {
  if (percentage < 80) return 'bg-green-500'
  if (percentage < 100) return 'bg-yellow-500'
  return 'bg-red-500'
}

