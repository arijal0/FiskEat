import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import ChatBot from '../components/ChatBot'
import FoodDetailModal from '../components/FoodDetailModal'
import NutritionCalculator from '../components/NutritionCalculator'
import { loadSelectedItems, saveSelectedItems, clearSelections, loadNutritionGoals, getDefaultGoals, NutritionGoals } from '../utils/nutritionStorage'

export interface Nutrition {
  calories: string | number
  protein: string | number
  fat: string | number
  carbohydrates: string | number
  sugar: string | number
  sodium: string | number
}

export interface FoodItem {
  id: string
  name: string
  description: string
  ingredients: string
  allergens: string[]
  isVegan: boolean
  isVegetarian: boolean
  nutrition: Nutrition
}

interface Station {
  name: string
  items: FoodItem[]
}

interface Meal {
  name: string
  stations: Station[]
}

interface MenuData {
  date: string
  meals: Meal[]
}

function MenuPage() {
  const location = useLocation()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set([0, 1, 2])) // Expand first 3 meals by default
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>([])
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>(getDefaultGoals())

  const fetchMenu = async (date: Date) => {
    setLoading(true)
    setError(null)
    
    const dateStr = format(date, 'yyyy-MM-dd')
    
    try {
      const response = await axios.get(
        `http://localhost:5001/api/menu/${dateStr}`
      )
      
      if (response.data.success) {
        setMenuData(response.data.menu)
      } else {
        setError('No menu found for this date')
      }
    } catch (err) {
      console.error('Error fetching menu:', err)
      setError('Failed to fetch menu. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu(selectedDate)
  }, [selectedDate])

  // Auto-open chat if navigating from landing page
  useEffect(() => {
    if (location.state?.openChat) {
      setIsChatOpen(true)
    }
  }, [location.state])

  // Load saved selections and goals
  useEffect(() => {
    const savedItems = loadSelectedItems()
    const savedGoals = loadNutritionGoals()
    if (savedItems.length > 0) {
      setSelectedItems(savedItems)
    }
    if (savedGoals) {
      setNutritionGoals(savedGoals)
    }
  }, [])

  // Save selections whenever they change
  useEffect(() => {
    if (selectedItems.length > 0) {
      saveSelectedItems(selectedItems)
    }
  }, [selectedItems])

  const handleDateChange = (days: number) => {
    setSelectedDate(addDays(selectedDate, days))
  }

  const handleTodayClick = () => {
    setSelectedDate(new Date())
  }

  const handleAddToCalculator = (item: FoodItem) => {
    setSelectedItems(prev => [...prev, item])
  }

  const handleRemoveFromCalculator = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearCalculator = () => {
    setSelectedItems([])
    clearSelections()
  }

  const toggleMeal = (mealIndex: number) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mealIndex)) {
        newSet.delete(mealIndex)
      } else {
        newSet.add(mealIndex)
      }
      return newSet
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title and Location */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Spence Food Hall
        </h1>
        <p className="text-gray-600">
          Adam K. Spence Hall | <span className="text-blue-600">(615) 329-8791</span>
        </p>
      </div>

      {/* Date Picker */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleDateChange(-7)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Previous week"
          >
            ← Week
          </button>
          
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Previous day"
          >
            ← Day
          </button>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
            <button
              onClick={handleTodayClick}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              Go to today
            </button>
          </div>

          <button
            onClick={() => handleDateChange(1)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Next day"
          >
            Day →
          </button>

          <button
            onClick={() => handleDateChange(7)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Next week"
          >
            Week →
          </button>
        </div>
      </div>

      {/* Menu Content */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && menuData && (
        <div className="space-y-4">
          {menuData.meals.map((meal, mealIndex) => (
            <div key={mealIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleMeal(mealIndex)}
                className="w-full bg-gray-100 px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <h2 className="text-2xl font-bold text-gray-900">{meal.name}</h2>
                <svg
                  className={`w-6 h-6 text-gray-600 transition-transform ${
                    expandedMeals.has(mealIndex) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              {expandedMeals.has(mealIndex) && (
              <div className="p-6">
                {meal.stations.length === 0 ? (
                  <p className="text-gray-500">No menu available for this meal period.</p>
                ) : (
                  <div className="space-y-6">
                    {meal.stations.map((station, stationIndex) => (
                      <div key={stationIndex}>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                          {station.name}
                        </h3>
                        
                        {station.items.length === 0 ? (
                          <p className="text-gray-500 italic">No items available at this station.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {station.items.map((item) => (
                              <div
                                key={item.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setSelectedFoodId(item.id)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                  <div className="flex gap-2">
                                    {item.isVegetarian && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        V
                                      </span>
                                    )}
                                    {item.isVegan && (
                                      <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
                                        VE
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                )}
                                
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                  <span className="text-sm font-semibold text-blue-600">
                                    {item.nutrition.calories} cal
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-gray-500">
                                      {item.nutrition.protein}g protein
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddToCalculator(item)
                                      }}
                                      className="w-6 h-6 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex items-center justify-center text-xs font-bold"
                                      title="Add to nutrition calculator"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                
                                {item.allergens && item.allergens.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">
                                      <strong>Allergens:</strong> {item.allergens.join(', ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Nutrition Calculator Button */}
      {!isCalculatorOpen && (
        <button
          onClick={() => setIsCalculatorOpen(true)}
          className="fixed bottom-6 left-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 z-40 group"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            {selectedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {selectedItems.length}
              </span>
            )}
          </div>
          <span className="font-semibold hidden md:block group-hover:scale-105 transition-transform">
            Calculator
          </span>
        </button>
      )}

      {/* Floating AI Assistant Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 z-40 group"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
          <span className="font-semibold hidden md:block group-hover:scale-105 transition-transform">
            Ask AI Assistant
          </span>
        </button>
      )}

      {/* ChatBot Component */}
      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        menuContext={menuData}
      />

      {/* Nutrition Calculator */}
      <NutritionCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        selectedItems={selectedItems}
        onRemoveItem={handleRemoveFromCalculator}
        onClearAll={handleClearCalculator}
        goals={nutritionGoals}
        onGoalsChange={setNutritionGoals}
      />

      {/* Food Detail Modal */}
      <FoodDetailModal
        itemId={selectedFoodId}
        onClose={() => setSelectedFoodId(null)}
      />
    </div>
  )
}

export default MenuPage

