// Mock, anonymized community + condition support data (non-medical wellness only).
// IMPORTANT: No diagnosis, no treatment plans, no prescriptions, no real people.

export const CHRONIC_SUPPORT_DISCLAIMER =
  'This feature provides lifestyle and wellness support only and does not replace professional medical care.'

export const supportedChronicConditions = [
  {
    id: 'diabetes',
    label: 'Diabetes',
    overview:
      'Focus on steady routines, mindful meal timing, movement, and stress/sleep awareness. This app supports pattern tracking and lifestyle consistency only.',
  },
  {
    id: 'heart',
    label: 'Heart Conditions',
    overview:
      'Support daily habits such as gentle activity, stress management, and consistent rest. This app provides non-medical tracking for self-awareness.',
  },
  {
    id: 'asthma',
    label: 'Asthma',
    overview:
      'Build supportive routines around breathing comfort, environment awareness, and activity pacing. This app is for lifestyle tracking and reflection only.',
  },
  {
    id: 'arthritis',
    label: 'Arthritis',
    overview:
      'Lean on pacing, low-impact movement, and recovery-friendly routines. This app helps you log patterns and lifestyle notes without medical guidance.',
  },
  {
    id: 'kidney',
    label: 'Chronic Kidney Conditions',
    overview:
      'Support consistency with hydration awareness, sleep quality, and stress load notes. This app is not a medical tool and provides no treatment advice.',
  },
  {
    id: 'lung',
    label: 'Chronic Lung Conditions',
    overview:
      'Focus on environment awareness, gentle movement, and rest planning. This app offers lifestyle-only tracking for pattern awareness.',
  },
  {
    id: 'obesity',
    label: 'Obesity',
    overview:
      'Support long-term consistency with routines, movement, sleep, and mindful habits. This app focuses on wellness tracking, not medical recommendations.',
  },
  {
    id: 'neuro',
    label: 'Neurological Conditions',
    overview:
      'Support daily structure, fatigue pacing, and stress/sleep awareness. This app is designed for non-medical tracking and self-management habits.',
  },
]

export const chronicSupportGoals = [
  { id: 'min-discomfort', title: 'Minimize daily discomfort', desc: 'Track what affects your day-to-day comfort and adjust routines gently.' },
  { id: 'qol', title: 'Improve quality of life', desc: 'Build supportive habits that make daily life feel more manageable.' },
  { id: 'prevent-lifestyle', title: 'Prevent lifestyle complications', desc: 'Spot patterns early and strengthen consistent self-care habits.' },
  { id: 'consistency', title: 'Support long-term consistency', desc: 'Small steps that are repeatable are often the most sustainable.' },
  { id: 'empower', title: 'Empower self-management', desc: 'Use your own logs to learn what helps you feel steadier.' },
]

export const communityStories = [
  {
    id: 'story-a',
    anonName: 'Community Member A',
    conditionId: 'diabetes',
    conditionLabel: 'Diabetes',
    duration: 'Managing for 3+ years',
    focusAreas: ['Meal timing awareness', 'Daily walks', 'Sleep consistency'],
    status: 'Stable',
    quote: 'Small routines made my days feel more predictable.',
  },
  {
    id: 'story-b',
    anonName: 'Community Member B',
    conditionId: 'heart',
    conditionLabel: 'Heart Conditions',
    duration: 'Managing for 5+ years',
    focusAreas: ['Gentle movement', 'Stress check-ins', 'Hydration reminders'],
    status: 'Improved',
    quote: 'Consistency beats intensity for me.',
  },
  {
    id: 'story-c',
    anonName: 'Community Member C',
    conditionId: 'asthma',
    conditionLabel: 'Asthma',
    duration: 'Managing for 2+ years',
    focusAreas: ['Environment awareness', 'Warm-up pacing', 'Rest planning'],
    status: 'Stable',
    quote: 'Pacing my day helped me stay calm and steady.',
  },
  {
    id: 'story-d',
    anonName: 'Community Member D',
    conditionId: 'arthritis',
    conditionLabel: 'Arthritis',
    duration: 'Managing for 4+ years',
    focusAreas: ['Low-impact movement', 'Stretch breaks', 'Stress reduction'],
    status: 'Improved',
    quote: 'Gentle movement plus rest breaks keeps me going.',
  },
  {
    id: 'story-e',
    anonName: 'Community Member E',
    conditionId: 'kidney',
    conditionLabel: 'Chronic Kidney Conditions',
    duration: 'Managing for 3+ years',
    focusAreas: ['Daily routine notes', 'Sleep quality tracking', 'Mindful hydration'],
    status: 'Stable',
    quote: 'Tracking helped me notice what drains my energy.',
  },
  {
    id: 'story-f',
    anonName: 'Community Member F',
    conditionId: 'lung',
    conditionLabel: 'Chronic Lung Conditions',
    duration: 'Managing for 6+ years',
    focusAreas: ['Gentle pacing', 'Air quality awareness', 'Breathing comfort routines'],
    status: 'Improved',
    quote: 'I focus on what I can control: pacing and rest.',
  },
  {
    id: 'story-g',
    anonName: 'Community Member G',
    conditionId: 'obesity',
    conditionLabel: 'Obesity',
    duration: 'Managing for 2+ years',
    focusAreas: ['Routine meals', 'Step goals', 'Sleep schedule'],
    status: 'Improved',
    quote: 'I stopped chasing perfect days and started building repeatable ones.',
  },
  {
    id: 'story-h',
    anonName: 'Community Member H',
    conditionId: 'neuro',
    conditionLabel: 'Neurological Conditions',
    duration: 'Managing for 4+ years',
    focusAreas: ['Fatigue pacing', 'Stress boundaries', 'Symptom journaling'],
    status: 'Stable',
    quote: 'I plan recovery time like it’s a real appointment.',
  },
]
