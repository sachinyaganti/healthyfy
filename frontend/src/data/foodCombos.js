// Simple built-in food combo catalog (non-medical; values are approximate).
// Users can log meals and/or pick combos to quickly fill the weekly planner.

export const FOOD_COMBOS = [
  // Breakfast
  { id: 'b1', mealType: 'Breakfast', name: 'Idli + sambar', calories: 300, protein: 10, carbs: 55, fat: 4, tags: ['veg', 'south'] },
  { id: 'b2', mealType: 'Breakfast', name: 'Poha with peanuts', calories: 350, protein: 9, carbs: 55, fat: 10, tags: ['veg'] },
  { id: 'b3', mealType: 'Breakfast', name: 'Oats with milk + banana', calories: 420, protein: 15, carbs: 70, fat: 9, tags: ['veg', 'high-fiber'] },
  { id: 'b4', mealType: 'Breakfast', name: 'Egg omelette (2) + toast', calories: 380, protein: 22, carbs: 28, fat: 18, tags: ['non-veg', 'high-protein'] },
  { id: 'b5', mealType: 'Breakfast', name: 'Greek yogurt + berries', calories: 260, protein: 18, carbs: 24, fat: 9, tags: ['veg', 'high-protein'] },

  // Lunch
  { id: 'l1', mealType: 'Lunch', name: 'Rice + dal + salad', calories: 520, protein: 18, carbs: 88, fat: 10, tags: ['veg', 'high-fiber'] },
  { id: 'l2', mealType: 'Lunch', name: 'Chapati (2) + paneer curry', calories: 600, protein: 28, carbs: 55, fat: 28, tags: ['veg', 'high-protein'] },
  { id: 'l3', mealType: 'Lunch', name: 'Chicken curry + rice', calories: 650, protein: 35, carbs: 70, fat: 25, tags: ['non-veg', 'high-protein'] },
  { id: 'l4', mealType: 'Lunch', name: 'Veg pulao + raita', calories: 580, protein: 16, carbs: 88, fat: 18, tags: ['veg'] },
  { id: 'l5', mealType: 'Lunch', name: 'Rajma + rice', calories: 620, protein: 22, carbs: 100, fat: 12, tags: ['veg', 'high-fiber'] },

  // Dinner
  { id: 'd1', mealType: 'Dinner', name: 'Grilled fish + veggies', calories: 480, protein: 35, carbs: 20, fat: 25, tags: ['non-veg', 'high-protein', 'low-carb'] },
  { id: 'd2', mealType: 'Dinner', name: 'Chapati (2) + mixed veg', calories: 520, protein: 15, carbs: 72, fat: 16, tags: ['veg'] },
  { id: 'd3', mealType: 'Dinner', name: 'Dal khichdi + curd', calories: 540, protein: 18, carbs: 78, fat: 16, tags: ['veg'] },
  { id: 'd4', mealType: 'Dinner', name: 'Paneer salad bowl', calories: 460, protein: 30, carbs: 22, fat: 28, tags: ['veg', 'high-protein', 'low-carb'] },
  { id: 'd5', mealType: 'Dinner', name: 'Chicken stir-fry + veggies', calories: 520, protein: 40, carbs: 18, fat: 26, tags: ['non-veg', 'high-protein', 'low-carb'] },

  // Snacks
  { id: 's1', mealType: 'Snack', name: 'Fruit + nuts (small)', calories: 260, protein: 6, carbs: 28, fat: 14, tags: ['veg'] },
  { id: 's2', mealType: 'Snack', name: 'Sprouts chaat', calories: 220, protein: 12, carbs: 28, fat: 6, tags: ['veg', 'high-protein'] },
  { id: 's3', mealType: 'Snack', name: 'Protein shake (milk-based)', calories: 300, protein: 25, carbs: 22, fat: 10, tags: ['veg', 'high-protein'] },
  { id: 's4', mealType: 'Snack', name: 'Roasted chana', calories: 200, protein: 10, carbs: 26, fat: 5, tags: ['veg', 'high-fiber'] },
  { id: 's5', mealType: 'Snack', name: 'Sandwich (veg)', calories: 350, protein: 12, carbs: 48, fat: 12, tags: ['veg'] },
]

export const FOOD_TAGS = [
  { id: 'veg', label: 'Veg' },
  { id: 'non-veg', label: 'Non-veg' },
  { id: 'high-protein', label: 'High protein' },
  { id: 'low-carb', label: 'Low carb' },
  { id: 'high-fiber', label: 'High fiber' },
]
