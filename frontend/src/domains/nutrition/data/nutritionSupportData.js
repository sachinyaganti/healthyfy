// Mock nutrition support hub data (non-medical wellness only).
// IMPORTANT: No medical/disease claims, no weight-loss promises, no real people.

export const NUTRITION_SUPPORT_DISCLAIMER =
  'This feature provides general nutrition guidance for wellness purposes only and does not replace professional dietary or medical advice.'

export const dietaryPreferences = [
  { id: 'all', label: 'All' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'eggetarian', label: 'Eggetarian' },
  { id: 'non-vegetarian', label: 'Non-Vegetarian' },
  { id: 'balanced', label: 'Balanced Diet' },
  { id: 'high-fiber', label: 'High-Fiber Focus' },
  { id: 'plant-focused', label: 'Plant-Focused' },
]

export const mealInspirationCards = [
  {
    id: 'm1',
    name: 'Balanced Lunch',
    mealType: 'Lunch',
    foodGroups: ['Grains', 'Vegetables', 'Protein'],
    bestTime: 'Midday',
    preferences: ['balanced', 'vegetarian', 'plant-focused'],
    example: 'Rice/chapati + dal/beans + salad',
  },
  {
    id: 'm2',
    name: 'Plant-Powered Breakfast',
    mealType: 'Breakfast',
    foodGroups: ['Whole grains', 'Fruit', 'Healthy fats'],
    bestTime: 'Morning',
    preferences: ['vegan', 'plant-focused', 'high-fiber'],
    example: 'Oats + banana + nuts/seeds',
  },
  {
    id: 'm3',
    name: 'Protein-Inclusive Dinner',
    mealType: 'Dinner',
    foodGroups: ['Protein', 'Vegetables'],
    bestTime: 'Evening',
    preferences: ['balanced', 'non-vegetarian', 'eggetarian', 'vegetarian'],
    example: 'Paneer/tofu/eggs/chicken + veggies',
  },
  {
    id: 'm4',
    name: 'High-Fiber Snack',
    mealType: 'Snack',
    foodGroups: ['Legumes', 'Vegetables'],
    bestTime: 'Mid-afternoon',
    preferences: ['high-fiber', 'vegetarian', 'vegan', 'plant-focused'],
    example: 'Sprouts chaat or roasted chana',
  },
  {
    id: 'm5',
    name: 'Hydration-Friendly Pair',
    mealType: 'Snack',
    foodGroups: ['Hydration', 'Minerals'],
    bestTime: 'Anytime',
    preferences: ['balanced', 'vegetarian', 'vegan', 'plant-focused'],
    example: 'Water + fruit (e.g., orange/watermelon)',
  },
]

export const communityFoodHabits = [
  {
    id: 'cfa',
    anonName: 'Community Member A',
    preferenceId: 'balanced',
    preferenceLabel: 'Balanced Diet',
    habit: 'Regular meal timing',
    benefit: 'More steady daily energy',
    quote: 'Keeping meal times consistent helped my week feel smoother.',
  },
  {
    id: 'cfb',
    anonName: 'Community Member B',
    preferenceId: 'vegetarian',
    preferenceLabel: 'Vegetarian',
    habit: 'Add vegetables to every main meal',
    benefit: 'Better routine consistency',
    quote: 'I keep it simple: one extra veggie serving each meal.',
  },
  {
    id: 'cfc',
    anonName: 'Community Member C',
    preferenceId: 'vegan',
    preferenceLabel: 'Vegan',
    habit: 'Water check-ins',
    benefit: 'Improved daily follow-through',
    quote: 'Small water reminders made me more consistent.',
  },
  {
    id: 'cfd',
    anonName: 'Community Member D',
    preferenceId: 'high-fiber',
    preferenceLabel: 'High-Fiber Focus',
    habit: 'Fiber-first snacks',
    benefit: 'More predictable habits',
    quote: 'When I plan my snacks, the rest of the day goes better.',
  },
  {
    id: 'cfe',
    anonName: 'Community Member E',
    preferenceId: 'plant-focused',
    preferenceLabel: 'Plant-Focused',
    habit: 'Prep ingredients once per week',
    benefit: 'Easier meal decisions',
    quote: 'Having basics ready reduces decision fatigue for me.',
  },
  {
    id: 'cff',
    anonName: 'Community Member F',
    preferenceId: 'eggetarian',
    preferenceLabel: 'Eggetarian',
    habit: 'Protein at breakfast',
    benefit: 'Better morning consistency',
    quote: 'A simple breakfast makes the rest of my day easier.',
  },
  {
    id: 'cfg',
    anonName: 'Community Member G',
    preferenceId: 'non-vegetarian',
    preferenceLabel: 'Non-Vegetarian',
    habit: 'Balanced plate habit',
    benefit: 'More structured meals',
    quote: 'I aim for protein + veggies first, then carbs as needed.',
  },
]
