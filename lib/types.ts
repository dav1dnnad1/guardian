export interface Deal {
  id: string; description: string; amount: number; currency: 'NGN' | 'GBP' | 'USD';
  counterparty: string; status: 'open' | 'pending' | 'completed' | 'problem'; notes: string; date: string;
}
export interface MoneyEntry {
  id: string; amount: number; currency: 'NGN' | 'GBP' | 'USD';
  type: 'income' | 'expense' | 'savings'; category: string; note: string; date: string;
}
export interface WorkoutLog {
  id: string; date: string; type: string; exercises: string; duration: number; notes: string; completed: boolean;
}
export interface MealLog {
  id: string; date: string; meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'; foods: string; calories: number; protein: number;
}
export interface StudySession {
  id: string; date: string; subject: string; duration: number; notes: string;
}
export interface PrayerLog {
  id: string; date: string; type: 'morning' | 'evening' | 'gratitude' | 'intercession'; verse: string; reflection: string;
}
export interface DailyPriority {
  id: string; date: string; task: string; done: boolean; category: 'faith' | 'money' | 'study' | 'gym' | 'deals' | 'personal';
}
export interface ChatMessage {
  role: 'user' | 'assistant'; content: string; timestamp: string;
}
export interface JournalEntry {
  id: string; date: string; content: string; mood: 'great' | 'good' | 'neutral' | 'hard' | 'rough';
}
export interface Habit {
  id: string; name: string; category: string; completedDates: string[]; targetDays: number[]; streak: number;
}
export interface TimetableBlock {
  id: string; time: string; label: string; category: string;
}
export interface AppPersonalisation {
  appName: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  avatarInitials: string;
  avatarBg: string;
  theme: 'light' | 'dark' | 'sepia' | 'custom';
}
export interface GuardianData {
  deals: Deal[]; money: MoneyEntry[]; workouts: WorkoutLog[]; meals: MealLog[];
  study: StudySession[]; prayer: PrayerLog[]; priorities: DailyPriority[]; chat: ChatMessage[];
  journal: JournalEntry[]; habits: Habit[];
  gymStreak: number; prayerStreak: number; totalSavingsGBP: number; savingsGoalGBP: number;
  currentWeightKg: number; targetWeightKg: number; lastUpdated: string;
  personalisation: AppPersonalisation;
}

export const DEFAULT_PERSONALISATION: AppPersonalisation = {
  appName: 'Guardian',
  accentColor: '#0f0f0f',
  bgColor: '#ffffff',
  textColor: '#0f0f0f',
  avatarInitials: 'G',
  avatarBg: '#0f0f0f',
  theme: 'light',
};

export const DEFAULT_DATA: GuardianData = {
  deals: [], money: [], workouts: [], meals: [], study: [], prayer: [],
  priorities: [], chat: [], journal: [], habits: [],
  gymStreak: 0, prayerStreak: 0, totalSavingsGBP: 0, savingsGoalGBP: 500,
  currentWeightKg: 80, targetWeightKg: 88, lastUpdated: new Date().toISOString(),
  personalisation: DEFAULT_PERSONALISATION,
};
