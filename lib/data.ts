export const DAILY_TIMETABLE = [
  { time: '06:00', label: 'Wake up + cold water', category: 'faith', icon: '🌅' },
  { time: '06:10', label: 'Morning prayer & Bible (15 min)', category: 'faith', icon: '🙏' },
  { time: '06:30', label: 'Gratitude journal — 3 things', category: 'faith', icon: '📖' },
  { time: '07:00', label: 'Workout — calisthenics or gym', category: 'gym', icon: '💪' },
  { time: '08:15', label: 'Shower + breakfast (protein first)', category: 'gym', icon: '🥚' },
  { time: '09:00', label: 'Deal follow-ups — message everyone open', category: 'money', icon: '💼' },
  { time: '10:00', label: 'Deep study block 1 — TryHackMe / AWS / CSC modules', category: 'study', icon: '🔐' },
  { time: '12:00', label: 'Lunch — high protein meal', category: 'gym', icon: '🍗' },
  { time: '12:30', label: 'Deep study block 2 — continue or switch subject', category: 'study', icon: '📚' },
  { time: '14:30', label: 'Build session — Plug. or Kaya (1 feature or fix)', category: 'personal', icon: '⚡' },
  { time: '16:00', label: 'Deal check-in round 2 + network message', category: 'money', icon: '📲' },
  { time: '17:00', label: 'Free time / walk / rest — no screens', category: 'personal', icon: '🌿' },
  { time: '18:30', label: 'Dinner — balanced meal, log calories', category: 'gym', icon: '🥗' },
  { time: '19:30', label: 'Evening study / Codewars / algorithm practice', category: 'study', icon: '🧩' },
  { time: '21:00', label: 'Evening prayer + devotional reading', category: 'faith', icon: '✝️' },
  { time: '21:30', label: 'Plan tomorrow — log Guardian, set 3 priorities', category: 'personal', icon: '🗒️' },
  { time: '22:00', label: 'Wind down — no social media after this', category: 'personal', icon: '🌙' },
  { time: '22:30', label: 'Sleep', category: 'faith', icon: '😴' },
];

export const WORKOUT_PROGRAMME = {
  monday: {
    name: 'Push — Chest & Shoulders',
    exercises: [
      { name: 'Push-ups (wide)', sets: 4, reps: '15-20', note: 'Chest focus' },
      { name: 'Diamond push-ups', sets: 3, reps: '12-15', note: 'Tricep focus' },
      { name: 'Pike push-ups', sets: 4, reps: '10-12', note: 'Shoulder press alternative' },
      { name: 'Decline push-ups', sets: 3, reps: '12-15', note: 'Upper chest' },
      { name: 'Shoulder circles & arm raises', sets: 3, reps: '15 each', note: 'Shoulder health' },
      { name: 'Plank', sets: 3, reps: '45 sec', note: 'Core stability' },
    ],
  },
  tuesday: {
    name: 'Pull — Back & Biceps',
    exercises: [
      { name: 'Pull-ups (or door frame rows)', sets: 4, reps: '8-12', note: 'Back width' },
      { name: 'Inverted rows (table)', sets: 4, reps: '12-15', note: 'Mid back' },
      { name: 'Towel bicep curls', sets: 3, reps: '12-15', note: 'Improvised curls' },
      { name: 'Reverse snow angel', sets: 3, reps: '15', note: 'Rear delts' },
      { name: 'Superman hold', sets: 3, reps: '20 sec', note: 'Lower back' },
      { name: 'Dead hang', sets: 3, reps: '20-30 sec', note: 'Grip + decompression' },
    ],
  },
  wednesday: {
    name: 'Legs & Core',
    exercises: [
      { name: 'Bulgarian split squats', sets: 4, reps: '12 each leg', note: 'Quad & glute focus' },
      { name: 'Jump squats', sets: 3, reps: '15', note: 'Power + calorie burn' },
      { name: 'Glute bridges', sets: 4, reps: '20', note: 'Posterior chain' },
      { name: 'Calf raises (single leg)', sets: 3, reps: '20 each', note: 'Ankle strength' },
      { name: 'Bicycle crunches', sets: 3, reps: '20 each side', note: 'Obliques' },
      { name: 'Leg raises', sets: 3, reps: '15', note: 'Lower abs' },
      { name: 'Plank variations', sets: 3, reps: '40 sec each', note: 'Full core' },
    ],
  },
  thursday: {
    name: 'Push — Power Day',
    exercises: [
      { name: 'Explosive push-ups (clap or fast)', sets: 4, reps: '10', note: 'Chest power' },
      { name: 'Archer push-ups', sets: 3, reps: '8 each side', note: 'Unilateral chest' },
      { name: 'Handstand wall hold', sets: 3, reps: '20-30 sec', note: 'Shoulder stability' },
      { name: 'Tricep dips (chair)', sets: 4, reps: '15-20', note: 'Tricep mass' },
      { name: 'Wall push-ups to failure', sets: 2, reps: 'AMRAP', note: 'Burnout' },
    ],
  },
  friday: {
    name: 'Full Body Circuit',
    exercises: [
      { name: 'Burpees', sets: 4, reps: '10', note: 'Full body' },
      { name: 'Mountain climbers', sets: 3, reps: '20 each leg', note: 'Core + cardio' },
      { name: 'Push-up to side plank', sets: 3, reps: '10 each side', note: 'Chest + obliques' },
      { name: 'Squat jumps', sets: 3, reps: '15', note: 'Legs + power' },
      { name: 'Hollow body hold', sets: 3, reps: '30 sec', note: 'Core strength' },
      { name: 'Sprint in place', sets: 4, reps: '30 sec', note: 'Cardio blast' },
    ],
  },
  saturday: {
    name: 'Active Recovery — Stretch & Mobility',
    exercises: [
      { name: 'Full body stretching routine', sets: 1, reps: '20 min', note: 'Muscle recovery' },
      { name: 'Yoga / mobility flow', sets: 1, reps: '15 min', note: 'Flexibility' },
      { name: 'Light walk (30 min)', sets: 1, reps: '30 min', note: 'Active recovery' },
      { name: 'Foam roll / self massage', sets: 1, reps: '10 min', note: 'Soreness relief' },
    ],
  },
  sunday: {
    name: 'Rest — Church + Recovery',
    exercises: [
      { name: 'Church / Worship', sets: 1, reps: 'Morning', note: 'Spiritual nourishment' },
      { name: 'Complete rest from training', sets: 1, reps: 'All day', note: 'Body needs this' },
      { name: 'Meal prep for the week', sets: 1, reps: '1 hour', note: 'Set yourself up' },
    ],
  },
};

export const STUDY_SCHEDULE = {
  monday: [
    { subject: 'TryHackMe', duration: 90, topic: 'Pre-Security / Jr Pen Tester path', resource: 'tryhackme.com' },
    { subject: 'CSC3632 System & Network Security', duration: 60, topic: 'Network fundamentals + OSI model', resource: 'Canvas + PortSwigger' },
  ],
  tuesday: [
    { subject: 'AWS Cloud Practitioner', duration: 90, topic: 'AWS modules — continue current chapter', resource: 'AWS Skill Builder (free)' },
    { subject: 'CSC3631 Cryptography', duration: 60, topic: 'Symmetric encryption, AES, block ciphers', resource: 'Dan Boneh Cryptography — Coursera (free audit)' },
  ],
  wednesday: [
    { subject: 'Python', duration: 90, topic: 'Codewars 8kyu → 7kyu problems (2 per session)', resource: 'codewars.com' },
    { subject: 'CSC2031 Review', duration: 60, topic: 'Security & Programming Paradigms review', resource: 'Canvas past materials' },
  ],
  thursday: [
    { subject: 'TryHackMe', duration: 90, topic: 'Continue path — 1 full room', resource: 'tryhackme.com' },
    { subject: 'CSC2032 Algorithms Review', duration: 60, topic: 'Sorting algorithms — implement in Python', resource: 'visualalgo.net' },
  ],
  friday: [
    { subject: 'AWS Cloud Practitioner', duration: 90, topic: 'AWS practice questions', resource: 'AWS Skill Builder' },
    { subject: 'CSC3632 / Dissertation Prep', duration: 60, topic: 'Security audit methodology — Plug. research', resource: 'OWASP Testing Guide' },
  ],
  saturday: [
    { subject: 'Build — Plug. or Kaya', duration: 120, topic: 'Fix 1 bug or build 1 feature', resource: 'GitHub + Claude' },
    { subject: 'JavaScript — understand your own code', duration: 60, topic: 'Open Plug. and explain every function', resource: 'javascript.info' },
  ],
  sunday: [
    { subject: 'Review week + plan next week', duration: 45, topic: 'What did I learn? What am I stuck on?', resource: 'Guardian notes' },
  ],
};

export const DAILY_VERSES = [
  { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
  { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
  { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
  { reference: 'Joshua 1:9', text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary.' },
  { reference: 'Matthew 6:33', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
  { reference: 'Proverbs 13:11', text: 'Dishonest money dwindles away, but whoever gathers money little by little makes it grow.' },
  { reference: '1 Corinthians 9:27', text: 'I strike a blow to my body and make it my slave so that after I have preached to others, I myself will not be disqualified for the prize.' },
  { reference: 'Proverbs 10:4', text: 'Lazy hands make for poverty, but diligent hands bring wealth.' },
  { reference: 'Ecclesiastes 9:10', text: 'Whatever your hand finds to do, do it with all your might.' },
  { reference: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.' },
  { reference: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.' },
  { reference: 'Proverbs 27:17', text: 'As iron sharpens iron, so one person sharpens another.' },
  { reference: 'Psalm 37:4', text: 'Take delight in the Lord, and he will give you the desires of your heart.' },
];

export const NUTRITION_TARGETS = {
  calories: 3200,
  protein: 160,
  carbs: 400,
  fat: 90,
  note: 'At 80kg targeting 88kg lean mass — eat in a moderate 300-400 calorie surplus. Protein is the priority — hit 160g every single day.',
};
