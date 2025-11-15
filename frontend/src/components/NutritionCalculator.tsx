import { useState, useEffect } from 'react'
import { FoodItem } from '../pages/MenuPage'
import { calculateTotals, calculatePercentage, getProgressColor, NutritionTotals } from '../utils/nutritionCalculator'
import { NutritionGoals, saveSelectedItems } from '../utils/nutritionStorage'
import NutritionGoalsModal from './NutritionGoalsModal'

interface NutritionCalculatorProps {
  isOpen: boolean
  onClose: () => void
  selectedItems: FoodItem[]
  onRemoveItem: (index: number) => void
  onClearAll: () => void
  goals: NutritionGoals
  onGoalsChange: (goals: NutritionGoals) => void
}

function NutritionCalculator({
  isOpen,
  onClose,
  selectedItems,
  onRemoveItem,
  onClearAll,
  goals,
  onGoalsChange,
}: NutritionCalculatorProps) {
  const [showGoalsModal, setShowGoalsModal] = useState(false)

  useEffect(() => {
    if (isOpen) {
      saveSelectedItems(selectedItems)
    }
  }, [selectedItems, isOpen])

  if (!isOpen) return null

  const totals: NutritionTotals = calculateTotals(selectedItems)

  const renderProgressBar = (label: string, current: number, goal: number, unit: string, isLast = false) => {
    const percentage = calculatePercentage(current, goal)
    const color = getProgressColor(percentage)

    return (
      <div className={!isLast ? 'mb-4' : ''}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {current.toFixed(0)} / {goal} {unit}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage}% of goal</div>
      </div>
    )
  }

  return (
    <>
      <NutritionGoalsModal
        isOpen={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        currentGoals={goals}
        onSave={onGoalsChange}
      />
      <div
        className="fixed bottom-20 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Nutrition Calculator</h3>
            <p className="text-xs text-white/80">{selectedItems.length} items selected</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Total Calories */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totals.calories.toFixed(0)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Calories</div>
          </div>

          {/* Selected Items */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Selected Items</h4>
            {selectedItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No items selected</p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2"
                  >
                    <span className="text-sm text-gray-900 dark:text-white truncate flex-1">{item.name}</span>
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nutrition Breakdown */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Nutrition Breakdown</h4>
            {renderProgressBar('Calories', totals.calories, goals.calories, 'cal')}
            {renderProgressBar('Protein', totals.protein, goals.protein, 'g')}
            {renderProgressBar('Fat', totals.fat, goals.fat, 'g')}
            {renderProgressBar('Carbs', totals.carbohydrates, goals.carbohydrates, 'g')}
            {renderProgressBar('Sugar', totals.sugar, goals.sugar, 'g')}
            {renderProgressBar('Sodium', totals.sodium, goals.sodium, 'mg', true)}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2">
          <button
            onClick={() => setShowGoalsModal(true)}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Set Goals
          </button>
          <button
            onClick={onClearAll}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Clear All
          </button>
        </div>
      </div>
    </>
  )
}

export default NutritionCalculator

