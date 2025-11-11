import { useState, useEffect, type KeyboardEvent } from 'react'
import { format, addDays } from 'date-fns'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import ChatBot from '../components/ChatBot'
import FoodDetailModal from '../components/FoodDetailModal'
import NutritionCalculator from '../components/NutritionCalculator'
import { loadSelectedItems, saveSelectedItems, clearSelections, loadNutritionGoals, getDefaultGoals, NutritionGoals } from '../utils/nutritionStorage'
import { API_ENDPOINTS } from '../config/api'

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
  isFlagged?: boolean
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
  activeMeal?: string | null
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
  const [flaggingItemId, setFlaggingItemId] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchMenu = async (date: Date) => {
    setLoading(true)
    setError(null)
    setActionFeedback(null)
    
    const dateStr = format(date, 'yyyy-MM-dd')
    
    try {
      const response = await axios.get(
        API_ENDPOINTS.MENU_BY_DATE(dateStr)
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
    } else {
      clearSelections()
    }
  }, [selectedItems])

  useEffect(() => {
    if (!actionFeedback) return
    const timeout = window.setTimeout(() => setActionFeedback(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [actionFeedback])

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

  const isViewingToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  const canFlagMeal = (mealName: string) => {
    if (!menuData?.activeMeal || !isViewingToday) {
      return false
    }
    return mealName.trim().toLowerCase() === menuData.activeMeal.trim().toLowerCase()
  }

  const handleToggleFlag = async (mealName: string, item: FoodItem) => {
    if (!menuData) return

    const mealIsActive = canFlagMeal(mealName)
    const desiredFlagState = !Boolean(item.isFlagged)

    if (!mealIsActive) {
      setActionFeedback({
        type: 'error',
        message: menuData.activeMeal
          ? `Flagging is only available during the ${menuData.activeMeal} period.`
          : 'Flagging is only available during the active meal period for today.',
      })
      return
    }

    setFlaggingItemId(item.id)
    setActionFeedback(null)

    try {
      const response = await axios.post(API_ENDPOINTS.FLAG_ITEM, {
        itemId: item.id,
        mealName,
        flag: desiredFlagState,
      })

      if (response.data?.success) {
        const isFlagged = Boolean(response.data.isFlagged)
        setMenuData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            meals: prev.meals.map(meal => {
              if (meal.name !== mealName) return meal
              return {
                ...meal,
                stations: meal.stations.map(station => ({
                  ...station,
                  items: station.items.map(menuItem =>
                    menuItem.id === item.id ? { ...menuItem, isFlagged } : menuItem
                  ),
                })),
              }
            }),
          }
        })

        if (isFlagged) {
          setSelectedItems(prev => prev.filter(selected => selected.id !== item.id))
        }

        setActionFeedback({
          type: 'success',
          message: response.data?.message || `Item ${isFlagged ? 'flagged' : 'unflagged'} for today.`,
        })
      } else {
        setActionFeedback({
          type: 'error',
          message: response.data?.message || 'Failed to update flag for this item.',
        })
      }
    } catch (err: unknown) {
      let message = 'Failed to update flag for this item.'
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || err.message || message
      }
      setActionFeedback({
        type: 'error',
        message,
      })
    } finally {
      setFlaggingItemId(null)
    }
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, itemId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedFoodId(itemId)
    }
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
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-3 lg:gap-4 justify-between">
          <div className="order-1 flex w-full justify-between gap-2 sm:order-none sm:w-auto sm:justify-start">
            <button
              onClick={() => handleDateChange(-7)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Previous week"
            >
              Prev Week
            </button>

            <button
              onClick={() => handleDateChange(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Previous day"
            >
              Prev Day
            </button>
          </div>

          <div className="order-2 flex-1 text-center sm:order-none">
            <div className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
            <button
              onClick={handleTodayClick}
              className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Go to today
            </button>
          </div>

          <div className="order-3 flex w-full justify-between gap-2 sm:order-none sm:w-auto sm:justify-end">
            <button
              onClick={() => handleDateChange(1)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Next day"
            >
              Next Day
            </button>

            <button
              onClick={() => handleDateChange(7)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Next week"
            >
              Next Week
            </button>
          </div>
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
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      {actionFeedback && (
        <div
          className={`${
            actionFeedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          } border px-4 py-3 rounded mb-4`}
          role="status"
          aria-live="polite"
        >
          {actionFeedback.message}
        </div>
      )}

      {menuData?.activeMeal && isViewingToday && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
          Flagging is enabled for the current {menuData.activeMeal} period. Items flagged here stay hidden for the rest of the day.
        </div>
      )}

      {!menuData?.activeMeal && isViewingToday && menuData && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          Flagging is currently unavailable. It opens during the active dining period.
        </div>
      )}

      {!loading && menuData && (
        <div className="space-y-4">
          {menuData.meals.map((meal, mealIndex) => (
            <div key={mealIndex} className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <button
                onClick={() => toggleMeal(mealIndex)}
                className="w-full bg-gray-50/60 px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between rounded-t-2xl"
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
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {station.items.map((item) => (
                              <div
                                key={item.id}
                                className={`relative flex h-full flex-col rounded-xl border bg-white/80 p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                  item.isFlagged
                                    ? 'border-red-300 bg-red-50/70 opacity-80'
                                    : 'border-gray-200 hover:border-blue-200 hover:shadow-lg'
                                }`}
                                role="button"
                                tabIndex={0}
                                aria-label={`View details for ${item.name}`}
                                onClick={() => setSelectedFoodId(item.id)}
                                onKeyDown={(event) => handleCardKeyDown(event, item.id)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                                    {item.description && (
                                      <p className="text-sm text-gray-600">{item.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleFlag(meal.name, item)
                                    }}
                                    disabled={!canFlagMeal(meal.name) || flaggingItemId === item.id}
                                    title={
                                      canFlagMeal(meal.name)
                                        ? item.isFlagged
                                          ? 'Unflag this item for today'
                                          : 'Flag this item as unavailable for today'
                                        : 'Flagging is only available during the active meal period.'
                                    }
                                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                                      item.isFlagged
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    } ${
                                      !canFlagMeal(meal.name) || flaggingItemId === item.id
                                        ? 'opacity-60 cursor-not-allowed'
                                        : ''
                                    }`}
                                  >
                                    {flaggingItemId === item.id
                                      ? 'Updating...'
                                      : item.isFlagged
                                      ? 'Flagged'
                                      : 'Flag Item'}
                                  </button>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {item.isVegetarian && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                      <span aria-hidden="true">🌱</span>
                                      Vegetarian
                                    </span>
                                  )}
                                  {item.isVegan && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-800">
                                      <span aria-hidden="true">🥦</span>
                                      Vegan
                                    </span>
                                  )}
                                </div>

                                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                                  <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                                    <span className="text-blue-600">{item.nutrition.calories} cal</span>
                                    <span className="text-gray-500">{item.nutrition.protein} g protein</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAddToCalculator(item)
                                    }}
                                    disabled={Boolean(item.isFlagged)}
                                    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                      item.isFlagged
                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700'
                                    }`}
                                    title={
                                      item.isFlagged
                                        ? 'Unavailable items cannot be added to the nutrition calculator.'
                                        : 'Add to nutrition calculator'
                                    }
                                  >
                                    <span aria-hidden="true">+</span>
                                    Add to calculator
                                  </button>
                                </div>

                                {item.isFlagged && (
                                  <div className="mt-3 pt-3 border-t border-red-200">
                                    <p className="text-xs font-semibold text-red-600">
                                      Flagged as unavailable for the {meal.name} period.
                                    </p>
                                  </div>
                                )}

                                {item.allergens && item.allergens.length > 0 && (
                                  <div className="mt-4 rounded-lg border border-yellow-100 bg-yellow-50/70 p-3">
                                    <p className="text-xs font-medium text-yellow-900">
                                      <span className="font-semibold">Allergens:</span> {item.allergens.join(', ')}
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

      {/* Floating Bulldog AI Button */}
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
            Ask Bulldog AI
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

