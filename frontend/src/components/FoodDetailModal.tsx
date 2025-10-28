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

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading details...</p>
          </div>
        )}

        {error && (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && foodDetail && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{foodDetail.name}</h2>
                {foodDetail.description && (
                  <p className="text-gray-600 text-lg">{foodDetail.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dietary badges */}
            <div className="flex gap-2 mb-6">
              {foodDetail.isVegetarian && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Vegetarian
                </span>
              )}
              {foodDetail.isVegan && (
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                  Vegan
                </span>
              )}
            </div>

            {/* Nutrition Information */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Nutrition Facts</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Calories</div>
                  <div className="text-2xl font-bold text-blue-600">{foodDetail.nutrition.calories}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Protein</div>
                  <div className="text-2xl font-bold text-gray-900">{foodDetail.nutrition.protein} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Fat</div>
                  <div className="text-2xl font-bold text-gray-900">{foodDetail.nutrition.fat} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Carbs</div>
                  <div className="text-2xl font-bold text-gray-900">{foodDetail.nutrition.carbohydrates} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Sugar</div>
                  <div className="text-2xl font-bold text-gray-900">{foodDetail.nutrition.sugar} g</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Sodium</div>
                  <div className="text-2xl font-bold text-gray-900">{foodDetail.nutrition.sodium} mg</div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {foodDetail.ingredients && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingredients</h3>
                <p className="text-gray-700">{foodDetail.ingredients}</p>
              </div>
            )}

            {/* Allergens */}
            {foodDetail.allergens && foodDetail.allergens.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Allergen Information</h3>
                <div className="flex flex-wrap gap-2">
                  {foodDetail.allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodDetailModal

