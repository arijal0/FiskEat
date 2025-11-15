import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'
import { FoodItem as FoodDetail } from '../pages/MenuPage'

interface FoodDetailModalProps {
  itemId: string | null
  onClose: () => void
}

function FoodDetailModal({ itemId, onClose }: FoodDetailModalProps) {
  const [foodDetail, setFoodDetail] = useState<FoodDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (itemId) {
      fetchFoodDetail(itemId)
    }
  }, [itemId])

  const fetchFoodDetail = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(API_ENDPOINTS.FOOD_ITEM(id))
      
      if (response.data.success) {
        setFoodDetail(response.data.food)
      } else {
        setError('Food item not found')
      }
    } catch (err) {
      console.error('Error fetching food detail:', err)
      setError('Failed to load food details')
    } finally {
      setLoading(false)
    }
  }

  if (!itemId) return null

  const modalTitleId = `food-detail-title-${itemId}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="p-12 text-center" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading details...</p>
          </div>
        )}

        {error && (
          <div className="p-12 text-center" role="alert">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && foodDetail && (
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h2 id={modalTitleId} className="text-3xl font-bold text-gray-900 dark:text-white">
                  {foodDetail.name}
                </h2>
                {foodDetail.description && (
                  <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{foodDetail.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {foodDetail.isFlagged && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                This item has been flagged as unavailable for today.
              </div>
            )}

            {/* Dietary badges */}
            <div className="mb-8 flex flex-wrap gap-2">
              {foodDetail.isVegetarian && (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300">
                  <span aria-hidden="true">🌱</span>
                  Vegetarian
                </span>
              )}
              {foodDetail.isVegan && (
                <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 dark:bg-teal-900/30 px-3 py-1 text-sm font-medium text-teal-800 dark:text-teal-300">
                  <span aria-hidden="true">🥦</span>
                  Vegan
                </span>
              )}
            </div>

            {/* Nutrition Information */}
            <div className="mb-8 rounded-2xl bg-gray-50 dark:bg-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nutrition Facts</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Calories</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{foodDetail.nutrition.calories}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Protein</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{foodDetail.nutrition.protein} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fat</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{foodDetail.nutrition.fat} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carbs</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{foodDetail.nutrition.carbohydrates} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sugar</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{foodDetail.nutrition.sugar} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sodium</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{foodDetail.nutrition.sodium} mg</div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {foodDetail.ingredients && (
              <div className="mb-8 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700 px-6 py-5">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ingredients</h3>
                <p className="mt-3 leading-relaxed text-gray-700 dark:text-gray-300">{foodDetail.ingredients}</p>
              </div>
            )}

            {/* Allergens */}
            {foodDetail.allergens && foodDetail.allergens.length > 0 && (
              <div className="rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Allergen Information</h3>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="List of allergens">
                  {foodDetail.allergens.map((allergen, index) => (
                    <li
                      key={index}
                      className="rounded-full bg-yellow-100 dark:bg-yellow-900/50 px-3 py-1 text-sm font-medium text-yellow-800 dark:text-yellow-300"
                    >
                      {allergen}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodDetailModal

