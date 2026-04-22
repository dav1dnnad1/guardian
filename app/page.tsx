'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, MessageCircle, Briefcase, DollarSign, Dumbbell, BookOpen, Heart, CheckSquare, Plus, Send, X, Trash2, Settings, GripVertical, Edit2, BookMarked, Repeat2 } from 'lucide-react';
import { GuardianData, DEFAULT_DATA, Deal, MoneyEntry, WorkoutLog, MealLog, StudySession, PrayerLog, DailyPriority, ChatMessage, JournalEntry, Habit, TimetableBlock, AppPersonalisation, DEFAULT_PERSONALISATION } from '@/lib/types';
import { DAILY_TIMETABLE, WORKOUT_PROGRAMME, STUDY_SCHEDULE, DAILY_VERSES, NUTRITION_TARGETS } from '@/lib/data';

// ── Storage ──────────────────────────────────────────────────────────────────
const SK = 'guardian_v3';
const OK = 'guardian_onboarded_v3';
const PK = 'guardian_profile_v3';

function load(): GuardianData {
  if (typeof window === 'undefined') return DEFAULT_DATA;
  try { const r = localStorage.getItem(SK); return r ? { ...DEFAULT_DATA, ...JSON.parse(r) } : DEFAULT_DATA; }
  catch { return DEFAULT_DATA; }
}
function save(d: GuardianData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SK, JSON.stringify({ ...d, lastUpdated: new Date().toISOString() }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }
function today() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
function getDayName() { return new Date().toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase() as keyof typeof WORKOUT_PROGRAMME; }
function getVerseOfDay() { return DAILY_VERSES[new Date().getDate() % DAILY_VERSES.length]; }
function getHour() { return new Date().getHours(); }
function getNow() { return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
function greeting() { const h = getHour(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

const LAWS = [
  { num: 1, title: 'Never outshine the master', body: 'Make those above you feel superior. Hide your talents until the moment is right.' },
  { num: 2, title: 'Never put too much trust in friends', body: 'Friends will betray you more quickly out of envy. Hire former enemies — they have more to prove.' },
  { num: 3, title: 'Conceal your intentions', body: 'Keep people off-balance. They cannot prepare a defence against what they cannot see.' },
  { num: 4, title: 'Always say less than necessary', body: 'When you say less you appear more powerful. The more you say the more ordinary you appear.' },
  { num: 5, title: 'Guard your reputation with your life', body: 'Reputation is the cornerstone of power. Make your reputation unassailable.' },
  { num: 6, title: 'Court attention at all costs', body: 'Everything is judged by its appearance. Stand out — make yourself a magnet for attention.' },
  { num: 9, title: 'Win through actions, never argument', body: 'Demonstrate what you mean rather than explaining it. Actions end arguments.' },
  { num: 10, title: 'Avoid the unhappy and unlucky', body: 'Emotional states are as infectious as diseases. Associate with the happy and fortunate.' },
  { num: 28, title: 'Enter action with boldness', body: 'If you are unsure of a course of action, do not attempt it. Boldness makes you seem destined for greatness.' },
  { num: 34, title: 'Be royal in your own fashion', body: 'Act like a king to be treated like one. The way you carry yourself determines how others see you.' },
  { num: 40, title: 'Despise the free lunch', body: 'What is offered for free is dangerous — it usually involves a trick or a hidden obligation.' },
  { num: 48, title: 'Assume formlessness', body: 'Accept that nothing is certain and no law is fixed. Adapt to the moment.' },
];
const QUOTES = [
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Do not wait to strike till the iron is hot, but make it hot by striking.', author: 'W. B. Yeats' },
  { text: 'Commit to the Lord whatever you do, and he will establish your plans.', author: 'Proverbs 16:3' },
  { text: 'He who is not courageous enough to take risks will accomplish nothing in life.', author: 'Muhammad Ali' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Unknown' },
];
const ANTI_VISIONS = [
  'Broke at 30. No options. Nothing built.',
  'Still waiting for the right time. The time never came.',
  'Watching others do what you said you would do.',
  'Scrolled 3 hours today. Built nothing.',
  'Your body gave up before your goals did.',
  'You had the idea. Someone else shipped it.',
];

function getLaw() { return LAWS[new Date().getDate() % LAWS.length]; }
function getQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }
function getAntiVision() { return ANTI_VISIONS[new Date().getDate() % ANTI_VISIONS.length]; }

interface UserProfile {
  name: string; areas: string[]; wakeTime: string; blockedTimes: string[];
  dayDescription: string; customTimetable: TimetableBlock[];
  notifEnabled: boolean; screenTimeGoalHours: number;
}
const DEFAULT_PROFILE: UserProfile = {
  name: '', areas: [], wakeTime: '06:00', blockedTimes: [],
  dayDescription: '', customTimetable: [],
  notifEnabled: false, screenTimeGoalHours: 3,
};

const AREAS = ['Faith & prayer','Gym & fitness','University study','Side business','Deals & money','Relationships','Mental health','Building a startup','Creative work','Reading'];

// ── Notifications ────────────────────────────────────────────────────────────
async function requestNotif() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}
function scheduleNotif(title: string, body: string, ms: number) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  setTimeout(() => new Notification(title, { body, icon: '/icon-192.png' }), ms);
}
function scheduleDailyReminders(profile: UserProfile) {
  if (!profile.notifEnabled) return;
  const now = new Date();
  [
    { h: 6, m: 0, t: 'Guardian · Morning', b: 'Prayer first. Then the day begins.' },
    { h: 9, m: 0, t: 'Guardian · Deals', b: 'Chase your open deals. Money is made in the morning.' },
    { h: 10, m: 0, t: 'Guardian · Study', b: 'Deep study block. Lock in.' },
    { h: 21, m: 0, t: 'Guardian · Evening', b: 'Time to pray and reflect.' },
    { h: 21, m: 30, t: 'Guardian · Wind down', b: 'Log your day. No social media after 22:00.' },
  ].forEach(r => {
    const t = new Date(now); t.setHours(r.h, r.m, 0, 0);
    if (t > now) scheduleNotif(r.t, r.b, t.getTime() - now.getTime());
  });
}

// ── Screen time ──────────────────────────────────────────────────────────────
function useScreenTime() {
  const start = useRef(Date.now());
  const [mins, setMins] = useState(0);
  useEffect(() => { const i = setInterval(() => setMins(Math.floor((Date.now() - start.current) / 60000)), 30000); return () => clearInterval(i); }, []);
  return mins;
}

// ── CSS theme injection ──────────────────────────────────────────────────────
function applyTheme(p: AppPersonalisation) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (p.theme === 'dark') {
    root.style.setProperty('--bg', '#0f0f0f');
    root.style.setProperty('--bg2', '#1a1a1a');
    root.style.setProperty('--bg3', '#242424');
    root.style.setProperty('--text', '#f5f4f0');
    root.style.setProperty('--muted', '#888888');
    root.style.setProperty('--faint', '#555555');
    root.style.setProperty('--border', 'rgba(255,255,255,0.07)');
    root.style.setProperty('--border-md', 'rgba(255,255,255,0.12)');
  } else if (p.theme === 'sepia') {
    root.style.setProperty('--bg', '#f8f4ee');
    root.style.setProperty('--bg2', '#f0ebe2');
    root.style.setProperty('--bg3', '#e8e0d4');
    root.style.setProperty('--text', '#2c1810');
    root.style.setProperty('--muted', '#7a6555');
    root.style.setProperty('--faint', '#b0a090');
    root.style.setProperty('--border', 'rgba(44,24,16,0.1)');
    root.style.setProperty('--border-md', 'rgba(44,24,16,0.18)');
  } else if (p.theme === 'custom') {
    root.style.setProperty('--bg', p.bgColor);
    root.style.setProperty('--text', p.textColor);
    root.style.setProperty('--bg2', p.bgColor + 'dd');
  } else {
    root.style.setProperty('--bg', '#ffffff');
    root.style.setProperty('--bg2', '#f9f9f8');
    root.style.setProperty('--bg3', '#f2f2f0');
    root.style.setProperty('--text', '#0f0f0f');
    root.style.setProperty('--muted', '#6b6b6b');
    root.style.setProperty('--faint', '#aaaaaa');
    root.style.setProperty('--border', 'rgba(0,0,0,0.07)');
    root.style.setProperty('--border-md', 'rgba(0,0,0,0.12)');
  }
  if (p.accentColor && p.theme !== 'light') {
    root.style.setProperty('--accent', p.accentColor);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════════════════════════════
function Onboarding({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({ ...DEFAULT_PROFILE });
  const [parsing, setParsing] = useState(false);
  const [built, setBuilt] = useState<TimetableBlock[]>([]);

  async function buildTimetable() {
    setParsing(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Parse this into a daily timetable. Return ONLY a JSON array. Each object must have: id (random 8-char string), time (HH:MM 24hr), label (short task), category (faith|gym|study|deals|money|personal|build). Wake time: ${profile.wakeTime}. Blocked: ${profile.blockedTimes.join(', ')}. Description: "${profile.dayDescription}". Return raw JSON array only. No markdown, no explanation.` }],
          context: {}, profile: { name: profile.name, areas: profile.areas },
        }),
      });
      const data = await res.json();
      const txt: string = data.message || '';
      const clean = txt.replace(/```[a-z]*\n?/g, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        const blocks = parsed.map((b: {id?: string; time: string; label: string; category: string}) => ({ id: b.id || uid(), time: b.time, label: b.label, category: b.category }));
        setBuilt(blocks);
        setProfile(p => ({ ...p, customTimetable: blocks }));
      }
    } catch {
      const blocks = DAILY_TIMETABLE.map(t => ({ id: uid(), time: t.time, label: t.label, category: t.category }));
      setBuilt(blocks);
      setProfile(p => ({ ...p, customTimetable: blocks }));
    }
    setParsing(false);
    setStep(4);
  }

  function next() {
    if (step === 2) { setStep(3); setTimeout(buildTimetable, 400); return; }
    if (step < 5) setStep(s => s + 1);
    else { localStorage.setItem(OK, 'true'); scheduleDailyReminders(profile); onComplete(profile); }
  }
  const canContinue = () => {
    if (step === 0) return profile.name.trim().length > 0;
    if (step === 1) return profile.areas.length > 0;
    if (step === 2) return profile.dayDescription.trim().length > 20;
    if (step === 3) return !parsing;
    return true;
  };

  const steps = ['Name','Areas','Your day','Building...','Review','Setup'];
  return (
    <div className="onboard-wrap">
      <div className="onboard-progress">
        {steps.map((_, i) => <div key={i} className={`onboard-dot${i <= step ? ' done' : ''}`} />)}
      </div>
      <div style={{ flex: 1 }}>
        {step === 0 && (
          <div className="anim-fade-up">
            <p className="section-label" style={{ marginBottom: 10 }}>1 of 6</p>
            <h1 className="serif" style={{ fontSize: 26, marginBottom: 8, lineHeight: 1.2 }}>What should Guardian call you?</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>Everything is stored on your device. Private by design.</p>
            <input className="g-input" style={{ fontSize: 15, marginBottom: 8 }} placeholder="Your first name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
        )}
        {step === 1 && (
          <div className="anim-fade-up">
            <p className="section-label" style={{ marginBottom: 10 }}>2 of 6</p>
            <h1 className="serif" style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.2 }}>What does your day contain?</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>Select all that apply. Guardian only shows the tabs you need.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {AREAS.map(a => <button key={a} className={`chip${profile.areas.includes(a) ? ' selected' : ''}`} onClick={() => setProfile(p => ({ ...p, areas: p.areas.includes(a) ? p.areas.filter(x => x !== a) : [...p.areas, a] }))}>{a}</button>)}
            </div>
            <p className="section-label">{profile.areas.length} selected</p>
          </div>
        )}
        {step === 2 && (
          <div className="anim-fade-up">
            <p className="section-label" style={{ marginBottom: 10 }}>3 of 6</p>
            <h1 className="serif" style={{ fontSize: 22, marginBottom: 8, lineHeight: 1.2 }}>Describe a typical day.</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>Write it how you&apos;d tell a friend. Include wake time, commitments, busy windows. Guardian builds your timetable from this.</p>
            <textarea className="g-input" rows={8} placeholder={`"I wake up at 6am. I pray first. Gym at 7. Uni lectures Monday to Thursday 10–1. Business and deals after that. Busy Friday after 4. Sunday is church."`} value={profile.dayDescription} onChange={e => setProfile(p => ({ ...p, dayDescription: e.target.value }))} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 11, color: 'var(--faint)' }}>More detail = better timetable.</p>
          </div>
        )}
        {step === 3 && (
          <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 40 }}>
            <div style={{ width: 48, height: 48, border: '1.5px solid var(--border-md)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <div className="pulse-dot" /><div className="pulse-dot d2" /><div className="pulse-dot d3" />
              </div>
            </div>
            <h2 className="serif" style={{ fontSize: 22, marginBottom: 10 }}>Building your timetable...</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>Guardian is reading your day and generating a personalised schedule.</p>
          </div>
        )}
        {step === 4 && (
          <div className="anim-fade-up">
            <p className="section-label" style={{ marginBottom: 10 }}>4 of 6 · review</p>
            <h1 className="serif" style={{ fontSize: 20, marginBottom: 6 }}>Here&apos;s what Guardian built.</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>You can edit any block by dragging or via chat later.</p>
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {built.slice(0, 12).map((b, i) => (
                <div key={b.id} className="time-row" style={{ animationDelay: `${i * 0.05}s` }}>
                  <span className="time-stamp">{b.time}</span>
                  <span className="time-label" style={{ color: 'var(--text)' }}>{b.label}</span>
                  <span className="tag">{b.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="anim-fade-up">
            <p className="section-label" style={{ marginBottom: 10 }}>5 of 6 · final setup</p>
            <h1 className="serif" style={{ fontSize: 22, marginBottom: 8, lineHeight: 1.2 }}>Almost ready, {profile.name}.</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>Set your daily screen time goal and decide on notifications.</p>
            <div className="card-filled" style={{ padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 13, marginBottom: 10 }}>Screen time goal per day</p>
              <input type="range" min={1} max={8} step={1} value={profile.screenTimeGoalHours} onChange={e => setProfile(p => ({ ...p, screenTimeGoalHours: Number(e.target.value) }))} style={{ width: '100%', marginBottom: 6 }} />
              <p className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{profile.screenTimeGoalHours} hour{profile.screenTimeGoalHours !== 1 ? 's' : ''} / day in Guardian</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={async () => { const ok = await requestNotif(); setProfile(p => ({ ...p, notifEnabled: ok })); }}>Enable reminders</button>
              <button className="btn-ghost" onClick={() => setProfile(p => ({ ...p, notifEnabled: false }))}>Skip</button>
            </div>
          </div>
        )}
      </div>
      {step !== 3 && (
        <div style={{ paddingTop: 16, display: 'flex', gap: 8 }}>
          {step > 0 && <button className="btn-ghost" onClick={() => setStep(s => s - 1)} style={{ minWidth: 80 }}>Back</button>}
          <button className="btn-primary" onClick={next} disabled={!canContinue()} style={{ flex: 1, opacity: canContinue() ? 1 : 0.4 }}>
            {step === 5 ? 'Enter Guardian' : step === 2 ? 'Build my timetable' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SPLASH
// ════════════════════════════════════════════════════════════════════════════
function Splash({ name, appName, onEnter }: { name: string; appName: string; onEnter: () => void }) {
  const law = getLaw(); const quote = getQuote(); const anti = getAntiVision();
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', padding: '48px 24px 32px' }}>
      <div className="anim-fade-up d1" style={{ marginBottom: 28 }}>
        <p className="section-label" style={{ marginBottom: 4 }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.15 }}>{greeting()}, {name}.</h1>
      </div>
      <div className="anim-fade-up d2 card" style={{ padding: 16, marginBottom: 18 }}>
        <p className="section-label" style={{ marginBottom: 8 }}>Law {law.num} of 48</p>
        <blockquote className="serif" style={{ fontSize: 16, lineHeight: 1.45, marginBottom: 10, fontStyle: 'italic' }}>&ldquo;{law.title}.&rdquo;</blockquote>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{law.body}</p>
        <div className="progress-track" style={{ marginTop: 10 }}>
          <div className="progress-fill" style={{ width: `${(law.num / 48) * 100}%` }} />
        </div>
      </div>
      <div className="anim-fade-up d3" style={{ marginBottom: 18 }}>
        <p className="section-label" style={{ marginBottom: 8 }}>Morning signal</p>
        <div style={{ borderLeft: '2px solid var(--text)', paddingLeft: 14 }}>
          <p className="serif" style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{quote.text}&rdquo;</p>
          <p className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6 }}>— {quote.author}</p>
        </div>
      </div>
      <div className="anim-fade-up d4 card" style={{ padding: 14, marginBottom: 'auto' }}>
        <p className="section-label" style={{ marginBottom: 8 }}>Anti-vision</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, fontStyle: 'italic' }}>{anti}</p>
      </div>
      <button className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 24 }} onClick={onEnter}>
        Enter {appName}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
const ALL_TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'money', label: 'Money', icon: DollarSign },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'faith', label: 'Faith', icon: Heart },
  { id: 'journal', label: 'Journal', icon: BookMarked },
  { id: 'habits', label: 'Habits', icon: Repeat2 },
  { id: 'day', label: 'My Day', icon: CheckSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function GuardianApp() {
  const [phase, setPhase] = useState<'loading'|'onboard'|'splash'|'app'>('loading');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [tab, setTab] = useState('home');
  const [data, setData] = useState<GuardianData>(DEFAULT_DATA);
  const sessionMins = useScreenTime();

  useEffect(() => {
    const onboarded = localStorage.getItem(OK);
    const sp = localStorage.getItem(PK);
    if (sp) {
      const parsed = JSON.parse(sp);
      setProfile(parsed);
      applyTheme(parsed.personalisation || DEFAULT_PERSONALISATION);
    }
    setData(load());
    setPhase(onboarded ? 'splash' : 'onboard');
  }, []);

  useEffect(() => {
    if (data.personalisation) applyTheme(data.personalisation);
  }, [data.personalisation]);

  const update = useCallback((patch: Partial<GuardianData>) => {
    setData(prev => { const next = { ...prev, ...patch }; save(next); return next; });
  }, []);

  function handleOnboard(p: UserProfile) {
    setProfile(p);
    localStorage.setItem(PK, JSON.stringify(p));
    setPhase('splash');
  }

  const timetable: TimetableBlock[] = profile.customTimetable.length > 0
    ? profile.customTimetable
    : DAILY_TIMETABLE.map(t => ({ id: uid(), time: t.time, label: t.label, category: t.category }));

  function updateTimetable(blocks: TimetableBlock[]) {
    const newProfile = { ...profile, customTimetable: blocks };
    setProfile(newProfile);
    localStorage.setItem(PK, JSON.stringify(newProfile));
  }

  // Screen time warning
  useEffect(() => {
    if (!profile.notifEnabled) return;
    const goal = profile.screenTimeGoalHours * 60;
    if (sessionMins === goal) {
      new Notification('Guardian · Screen time', { body: `${sessionMins} mins in Guardian. Go do the work.`, icon: '/icon-192.png' });
    }
  }, [sessionMins, profile.notifEnabled, profile.screenTimeGoalHours]);

  if (phase === 'loading') return null;
  if (phase === 'onboard') return <Onboarding onComplete={handleOnboard} />;

  const p = data.personalisation || DEFAULT_PERSONALISATION;
  if (phase === 'splash') return <Splash name={profile.name || 'there'} appName={p.appName} onEnter={() => setPhase('app')} />;

  const visibleTabs = ALL_TABS.filter(t => {
    if (['home','chat','day','settings'].includes(t.id)) return true;
    if (t.id === 'deals') return profile.areas.some(a => /deal|business|startup/i.test(a));
    if (t.id === 'money') return true;
    if (t.id === 'gym') return profile.areas.some(a => /gym|fit/i.test(a));
    if (t.id === 'study') return profile.areas.some(a => /study|uni|learn/i.test(a));
    if (t.id === 'faith') return profile.areas.some(a => /faith|prayer/i.test(a));
    if (t.id === 'journal') return profile.areas.some(a => /mental|journal|creative|reading/i.test(a));
    if (t.id === 'habits') return true;
    return false;
  });

  // Cap nav at 6 items — overflow goes to settings
  const navTabs = visibleTabs.filter(t => t.id !== 'settings').slice(0, 5);
  navTabs.push(ALL_TABS.find(t => t.id === 'settings')!);

  const xpTotal = data.gymStreak * 50 + data.prayerStreak * 30;
  const level = Math.floor(xpTotal / 500) + 1;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div className="pb-nav">
        {tab === 'home'     && <HomeTab data={data} profile={profile} setTab={setTab} timetable={timetable} sessionMins={sessionMins} level={level} xpTotal={xpTotal} />}
        {tab === 'chat'     && <ChatTab data={data} profile={profile} timetable={timetable} updateTimetable={updateTimetable} />}
        {tab === 'deals'    && <DealsTab data={data} update={update} />}
        {tab === 'money'    && <MoneyTab data={data} update={update} />}
        {tab === 'gym'      && <GymTab data={data} update={update} />}
        {tab === 'study'    && <StudyTab data={data} update={update} />}
        {tab === 'faith'    && <FaithTab data={data} update={update} />}
        {tab === 'journal'  && <JournalTab data={data} update={update} />}
        {tab === 'habits'   && <HabitsTab data={data} update={update} />}
        {tab === 'day'      && <MyDayTab data={data} update={update} profile={profile} timetable={timetable} updateTimetable={updateTimetable} />}
        {tab === 'settings' && <SettingsTab data={data} update={update} profile={profile} setProfile={setProfile} />}
      </div>
      <nav className="mobile-nav">
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {navTabs.map(t => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                <Icon size={18} strokeWidth={active ? 2 : 1.5} color={active ? 'var(--text)' : 'var(--faint)'} />
                <span className="mono" style={{ fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? 'var(--text)' : 'var(--faint)', fontWeight: active ? 500 : 400 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HOME
// ════════════════════════════════════════════════════════════════════════════
function HomeTab({ data, profile, setTab, timetable, sessionMins, level, xpTotal }: { data: GuardianData; profile: UserProfile; setTab: (t: string) => void; timetable: TimetableBlock[]; sessionMins: number; level: number; xpTotal: number }) {
  const verse = getVerseOfDay();
  const dayName = getDayName();
  const workout = WORKOUT_PROGRAMME[dayName];
  const openDeals = data.deals.filter(d => d.status === 'open' || d.status === 'pending');
  const todayPs = data.priorities.filter(p => p.date === today());
  const done = todayPs.filter(p => p.done).length;
  const now = getNow();
  const currentBlock = [...timetable].reverse().find(t => t.time <= now);
  const xpInLevel = xpTotal % 500;
  const goalMins = profile.screenTimeGoalHours * 60;
  const screenPct = Math.min(100, Math.round((sessionMins / (goalMins || 1)) * 100));
  const p = data.personalisation || DEFAULT_PERSONALISATION;

  return (
    <div style={{ padding: '24px 16px 8px' }}>
      <div className="anim-fade-up d1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 4 }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="serif" style={{ fontSize: 26, lineHeight: 1.1 }}>{greeting()}, {profile.name || 'there'}.</h1>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: p.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: p.theme === 'dark' || p.avatarBg === '#0f0f0f' ? '#fff' : '#fff', fontFamily: 'var(--font-body)' }}>{p.avatarInitials || (profile.name?.[0] || 'G').toUpperCase()}</span>
        </div>
      </div>

      <div className="anim-fade-up d2" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <p className="section-label">Level {level}</p>
          <p className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>{xpInLevel} / 500 xp</p>
        </div>
        <div className="xp-track"><div className="xp-fill" style={{ width: `${(xpInLevel / 500) * 100}%` }} /></div>
      </div>

      <div className="anim-fade-up d2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="stat-block"><p className="stat-num">{String(data.gymStreak).padStart(2,'0')}</p><p className="stat-label">Gym streak</p></div>
        <div className="stat-block"><p className="stat-num">{String(data.prayerStreak).padStart(2,'0')}</p><p className="stat-label">Prayer streak</p></div>
        <div className="stat-block"><p className="stat-num">{String(openDeals.length).padStart(2,'0')}</p><p className="stat-label">Open deals</p></div>
        <div className="stat-block"><p className="stat-num">£{data.totalSavingsGBP}</p><p className="stat-label">Saved</p></div>
      </div>

      {currentBlock && (
        <div className="anim-fade-up d3 card" style={{ padding: 14, marginBottom: 12 }}>
          <p className="section-label" style={{ marginBottom: 5 }}>Now · {now}</p>
          <p style={{ fontSize: 15, fontWeight: 500 }}>{currentBlock.label}</p>
          <p className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{currentBlock.category}</p>
        </div>
      )}

      <div className="anim-fade-up d3 card" style={{ padding: 14, marginBottom: 12 }}>
        <p className="section-label" style={{ marginBottom: 8 }}>Today&apos;s word</p>
        <p className="serif" style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 6 }}>&ldquo;{verse.text}&rdquo;</p>
        <p className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{verse.reference}</p>
      </div>

      {workout && (
        <div className="anim-fade-up d4 card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p className="section-label">Today&apos;s workout</p>
            <button onClick={() => setTab('gym')} className="btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}>View →</button>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{workout.name}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{workout.exercises.slice(0,3).map(e => e.name).join(' · ')}</p>
        </div>
      )}

      <div className="anim-fade-up d4 card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <p className="section-label">In-app · {sessionMins}m used</p>
          <p className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>{screenPct}%</p>
        </div>
        <div className="screen-time-bar"><div className="screen-time-fill" style={{ width: `${screenPct}%` }} /></div>
        <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 5 }}>Goal: {profile.screenTimeGoalHours}h · {screenPct > 80 ? 'Close to limit. Go do the work.' : 'On track.'}</p>
      </div>

      {todayPs.length > 0 && (
        <div className="anim-fade-up d5 card" style={{ padding: 14, marginBottom: 12 }}>
          <p className="section-label" style={{ marginBottom: 8 }}>Priorities · {done}/{todayPs.length}</p>
          <div className="progress-track" style={{ marginBottom: 8 }}><div className="progress-fill" style={{ width: `${todayPs.length ? (done/todayPs.length)*100 : 0}%` }} /></div>
          {todayPs.slice(0,3).map(pr => <p key={pr.id} style={{ fontSize: 12, color: pr.done ? 'var(--faint)' : 'var(--muted)', textDecoration: pr.done ? 'line-through' : 'none', padding: '2px 0' }}>{pr.done ? '✓ ' : '○ '}{pr.task}</p>)}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT — with timetable editing via chat
// ════════════════════════════════════════════════════════════════════════════
function ChatTab({ data, profile, timetable, updateTimetable }: { data: GuardianData; profile: UserProfile; timetable: TimetableBlock[]; updateTimetable: (b: TimetableBlock[]) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastEdit, setLastEdit] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send(override?: string) {
    const text = (override || input).trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const context = {
        gymStreak: data.gymStreak, prayerStreak: data.prayerStreak, savings: data.totalSavingsGBP,
        openDeals: data.deals.filter(d => d.status === 'open').length, todayPriorities: data.priorities.filter(p => p.date === today()),
        currentWeight: data.currentWeightKg, targetWeight: data.targetWeightKg, timetable,
      };
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), context, profile: { name: profile.name, areas: profile.areas } }) });
      const d = await res.json();
      if (d.timetableEdit) {
        const edit = d.timetableEdit;
        let updated = [...timetable];
        if (edit.action === 'add') {
          updated = [...updated, { id: uid(), time: edit.time, label: edit.label, category: edit.category }].sort((a, b) => a.time.localeCompare(b.time));
          setLastEdit(`Added "${edit.label}" at ${edit.time}`);
        } else if (edit.action === 'remove') {
          updated = updated.filter(b => !b.label.toLowerCase().includes(edit.label?.toLowerCase()));
          setLastEdit(`Removed "${edit.label}"`);
        } else if (edit.action === 'edit') {
          updated = updated.map(b => b.time === edit.time ? { ...b, label: edit.label, category: edit.category } : b);
          setLastEdit(`Updated ${edit.time} block`);
        }
        updateTimetable(updated);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: d.message || 'Try again.', timestamp: new Date().toISOString() }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue — check your API key in Vercel.', timestamp: new Date().toISOString() }]); }
    finally { setLoading(false); }
  }

  const starters = ['What should I focus on today?','Add a 15:00 block for reading','How are my deals looking?','Give me a scripture for today','Remove the 17:00 block','Am I on track with my goals?'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: 70 }}>
      <div style={{ padding: '24px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <p className="section-label" style={{ marginBottom: 3 }}>Guardian</p>
        <h2 className="serif" style={{ fontSize: 20 }}>What&apos;s on your mind?</h2>
        {lastEdit && <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4, fontStyle: 'italic' }}>✓ {lastEdit}</p>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>Guardian knows your context. Ask anything — or say things like <em>&ldquo;add a 15:00 block for reading&rdquo;</em> to edit your timetable by chat.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {starters.map(s => <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'border-color .1s' }}>{s}</button>)}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'bubble-user' : 'bubble-guardian'} style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
        ))}
        {loading && <div className="bubble-guardian" style={{ display: 'flex', gap: 5, padding: '14px 16px' }}><div className="pulse-dot" /><div className="pulse-dot d2" /><div className="pulse-dot d3" /></div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg)' }}>
        <input className="g-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask or say: add a block at 15:00 for..." style={{ flex: 1 }} />
        <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-primary" style={{ padding: '10px 14px', opacity: !input.trim() || loading ? 0.4 : 1 }}><Send size={15} /></button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MY DAY — with drag-to-reorder timetable
// ════════════════════════════════════════════════════════════════════════════
function MyDayTab({ data, update, profile, timetable, updateTimetable }: { data: GuardianData; update: (p: Partial<GuardianData>) => void; profile: UserProfile; timetable: TimetableBlock[]; updateTimetable: (b: TimetableBlock[]) => void }) {
  const [form, setForm] = useState({ task: '', category: 'personal' });
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ time: '', label: '', category: '' });
  const [addBlock, setAddBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ time: '', label: '', category: 'personal' });
  const todayPs = data.priorities.filter(p => p.date === today());
  const done = todayPs.filter(p => p.done).length;
  const now = getNow();
  const currentBlock = [...timetable].reverse().find(t => t.time <= now);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return;
    const updated = [...timetable];
    const dragged = updated.splice(dragItem.current, 1)[0];
    updated.splice(dragOver.current, 0, dragged);
    updateTimetable(updated);
    dragItem.current = null; dragOver.current = null;
  }

  function addP() { if (!form.task) return; const p: DailyPriority = { id: uid(), date: today(), task: form.task, done: false, category: form.category as DailyPriority['category'] }; update({ priorities: [...data.priorities, p] }); setForm({ task: '', category: 'personal' }); }
  function startEdit(b: TimetableBlock) { setEditingBlock(b.id); setEditForm({ time: b.time, label: b.label, category: b.category }); }
  function saveEdit() { if (!editingBlock) return; updateTimetable(timetable.map(b => b.id === editingBlock ? { ...b, ...editForm } : b)); setEditingBlock(null); }
  function deleteBlock(id: string) { updateTimetable(timetable.filter(b => b.id !== id)); }
  function addNewBlock() { if (!newBlock.time || !newBlock.label) return; const b: TimetableBlock = { id: uid(), ...newBlock }; updateTimetable([...timetable, b].sort((a, b) => a.time.localeCompare(b.time))); setNewBlock({ time: '', label: '', category: 'personal' }); setAddBlock(false); }

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <p className="section-label" style={{ marginBottom: 3 }}>My Day</p>
        <h2 className="serif" style={{ fontSize: 22 }}>{done}/{todayPs.length} done.</h2>
      </div>
      {currentBlock && <div className="card-filled" style={{ padding: 14, marginBottom: 14 }}><p className="section-label" style={{ marginBottom: 4 }}>Now · {now}</p><p style={{ fontSize: 15, fontWeight: 500 }}>{currentBlock.label}</p></div>}
      {todayPs.length > 0 && <div className="progress-track" style={{ marginBottom: 16 }}><div className="progress-fill" style={{ width: `${todayPs.length ? (done/todayPs.length)*100 : 0}%` }} /></div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="g-input" placeholder="Add a priority..." value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addP()} style={{ flex: 1 }} />
        <select className="g-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: 96 }}>
          <option value="faith">Faith</option><option value="money">Money</option><option value="study">Study</option><option value="gym">Gym</option><option value="deals">Deals</option><option value="personal">Personal</option>
        </select>
        <button className="btn-primary" onClick={addP} style={{ padding: '10px 14px' }}><Plus size={15} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {todayPs.map(p => (
          <div key={p.id} className="card" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: p.done ? 0.6 : 1 }}>
            <button onClick={() => update({ priorities: data.priorities.map(x => x.id === p.id ? { ...x, done: !x.done } : x) })} className="check-ring" style={{ background: p.done ? 'var(--text)' : 'transparent' }}>
              {p.done && <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3.5L4 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            </button>
            <p style={{ flex: 1, fontSize: 13, textDecoration: p.done ? 'line-through' : 'none', color: p.done ? 'var(--faint)' : 'var(--text)' }}>{p.task}</p>
            <button onClick={() => update({ priorities: data.priorities.filter(x => x.id !== p.id) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 4 }}><X size={13} /></button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p className="section-label">{profile.customTimetable.length > 0 ? 'Your timetable · drag to reorder' : 'Default timetable'}</p>
        <button className="btn-ghost" onClick={() => setAddBlock(!addBlock)} style={{ fontSize: 11, padding: '4px 10px' }}>+ Block</button>
      </div>

      {addBlock && (
        <div className="card-filled anim-pop" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="g-input" type="time" value={newBlock.time} onChange={e => setNewBlock(b => ({ ...b, time: e.target.value }))} style={{ flex: 1 }} />
              <select className="g-input" value={newBlock.category} onChange={e => setNewBlock(b => ({ ...b, category: e.target.value }))} style={{ flex: 1 }}>
                {['faith','gym','study','deals','money','personal','build'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input className="g-input" placeholder="Block label" value={newBlock.label} onChange={e => setNewBlock(b => ({ ...b, label: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={addNewBlock}>Add block</button>
              <button className="btn-ghost" onClick={() => setAddBlock(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {timetable.map((block, i) => {
          const isCurrent = currentBlock?.id === block.id;
          if (editingBlock === block.id) return (
            <div key={block.id} className="card-filled anim-pop" style={{ padding: 12, marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="g-input" type="time" value={editForm.time} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} style={{ flex: 1 }} />
                <select className="g-input" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ flex: 1 }}>
                  {['faith','gym','study','deals','money','personal','build'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input className="g-input" value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} style={{ marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={saveEdit}>Save</button>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditingBlock(null)}>Cancel</button>
                <button className="btn-ghost" style={{ fontSize: 12, color: '#cc3333', borderColor: 'rgba(200,50,50,0.2)' }} onClick={() => deleteBlock(block.id)}>Delete</button>
              </div>
            </div>
          );
          return (
            <div key={block.id} className={`time-row${isCurrent ? ' active' : ''}`}
              draggable onDragStart={() => { dragItem.current = i; }} onDragEnter={() => { dragOver.current = i; }} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
              style={{ cursor: 'grab', userSelect: 'none' }}>
              <GripVertical size={14} color="var(--faint)" style={{ flexShrink: 0 }} />
              <span className="time-stamp">{block.time}</span>
              <span className="time-label">{block.label}</span>
              <span className="tag" style={{ marginRight: 4 }}>{block.category}</span>
              <button onClick={() => startEdit(block)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--faint)', flexShrink: 0 }}><Edit2 size={12} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DEALS (compact)
// ════════════════════════════════════════════════════════════════════════════
function DealsTab({ data, update }: { data: GuardianData; update: (p: Partial<GuardianData>) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', currency: 'NGN', counterparty: '', status: 'open', notes: '' });
  function add() { if (!form.description || !form.counterparty) return; const d: Deal = { id: uid(), date: today(), description: form.description, amount: Number(form.amount)||0, currency: form.currency as Deal['currency'], counterparty: form.counterparty, status: form.status as Deal['status'], notes: form.notes }; update({ deals: [d, ...data.deals] }); setForm({ description: '', amount: '', currency: 'NGN', counterparty: '', status: 'open', notes: '' }); setAdding(false); }
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div><p className="section-label" style={{ marginBottom: 3 }}>Deals</p><h2 className="serif" style={{ fontSize: 22 }}>Track every deal.</h2></div>
        <button className="btn-primary" onClick={() => setAdding(!adding)} style={{ fontSize: 12, padding: '8px 14px' }}>{adding ? 'Cancel' : '+ New'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['Open', data.deals.filter(d => d.status==='open').length], ['Pending', data.deals.filter(d => d.status==='pending').length], ['Done', data.deals.filter(d => d.status==='completed').length]].map(([l,v]) => <div key={l as string} className="stat-block" style={{ textAlign: 'center' }}><p className="stat-num">{String(v).padStart(2,'0')}</p><p className="stat-label">{l as string}</p></div>)}
      </div>
      {adding && <div className="card-filled anim-pop" style={{ padding: 16, marginBottom: 16 }}><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><input className="g-input" placeholder="Description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} /><input className="g-input" placeholder="Counterparty" value={form.counterparty} onChange={e => setForm(f=>({...f,counterparty:e.target.value}))} /><div style={{ display:'flex',gap:8 }}><input className="g-input" placeholder="Amount" type="number" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} style={{flex:2}} /><select className="g-input" value={form.currency} onChange={e => setForm(f=>({...f,currency:e.target.value}))} style={{flex:1}}><option>NGN</option><option>GBP</option><option>USD</option></select></div><textarea className="g-input" placeholder="Notes" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={2} /><button className="btn-primary" onClick={add}>Log deal</button></div></div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.deals.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', paddingTop: 24 }}>No deals logged yet.</p>}
        {data.deals.map(deal => (
          <div key={deal.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div><p style={{ fontSize: 13, fontWeight: 500 }}>{deal.description}</p><p className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{deal.counterparty} · {fmtDate(deal.date)}</p></div>
              <p className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{deal.currency} {deal.amount.toLocaleString()}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['open','pending','completed','problem'] as const).map(s => <button key={s} onClick={() => update({ deals: data.deals.map(d => d.id===deal.id ? {...d,status:s} : d) })} className="btn-ghost" style={{ fontSize: 10, padding: '3px 9px', background: deal.status===s ? 'var(--text)' : undefined, color: deal.status===s ? 'var(--bg)' : undefined, borderColor: deal.status===s ? 'var(--text)' : undefined }}>{s}</button>)}
              <button onClick={() => update({ deals: data.deals.filter(d => d.id!==deal.id) })} className="btn-ghost" style={{ fontSize: 10, padding: '3px 9px', marginLeft: 'auto' }}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MONEY
// ════════════════════════════════════════════════════════════════════════════
function MoneyTab({ data, update }: { data: GuardianData; update: (p: Partial<GuardianData>) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ amount: '', currency: 'GBP', type: 'income', category: '', note: '' });
  const totalIn = data.money.filter(m => m.type==='income').reduce((s,m) => s+(m.currency==='GBP'?m.amount:m.amount/1800),0);
  const totalOut = data.money.filter(m => m.type==='expense').reduce((s,m) => s+(m.currency==='GBP'?m.amount:m.amount/1800),0);
  const pct = data.savingsGoalGBP > 0 ? Math.min(100, Math.round((data.totalSavingsGBP/data.savingsGoalGBP)*100)) : 0;
  function addEntry() { if (!form.amount) return; const e: MoneyEntry = { id: uid(), date: today(), amount: Number(form.amount), currency: form.currency as MoneyEntry['currency'], type: form.type as MoneyEntry['type'], category: form.category, note: form.note }; const ns = form.type==='savings' ? data.totalSavingsGBP+(form.currency==='GBP'?Number(form.amount):Number(form.amount)/1800) : data.totalSavingsGBP; update({ money: [e,...data.money], totalSavingsGBP: ns }); setForm({ amount:'',currency:'GBP',type:'income',category:'',note:'' }); setAdding(false); }
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div><p className="section-label" style={{ marginBottom: 3 }}>Money</p><h2 className="serif" style={{ fontSize: 22 }}>Track every pound.</h2></div>
        <button className="btn-primary" onClick={() => setAdding(!adding)} style={{ fontSize: 12, padding: '8px 14px' }}>{adding ? 'Cancel' : '+ Log'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="stat-block"><p className="stat-num" style={{ fontSize: 18 }}>£{Math.round(totalIn)}</p><p className="stat-label">Income</p></div>
        <div className="stat-block"><p className="stat-num" style={{ fontSize: 18 }}>£{Math.round(totalOut)}</p><p className="stat-label">Expenses</p></div>
      </div>
      <div className="card-filled" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><p className="section-label">Savings goal</p><p className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>£{data.totalSavingsGBP} / £{data.savingsGoalGBP}</p></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 5 }}>{pct}% reached</p>
        <input className="g-input" placeholder="Update goal (£)" type="number" style={{ marginTop: 10, fontSize: 12 }} onChange={e => { if (e.target.value) update({ savingsGoalGBP: Number(e.target.value) }); }} />
      </div>
      {adding && <div className="card-filled anim-pop" style={{ padding: 14, marginBottom: 14 }}><div style={{ display:'flex',flexDirection:'column',gap:8 }}><div style={{display:'flex',gap:8}}><input className="g-input" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{flex:2}} /><select className="g-input" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))} style={{flex:1}}><option>GBP</option><option>NGN</option><option>USD</option></select></div><select className="g-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="income">Income</option><option value="expense">Expense</option><option value="savings">Savings</option></select><input className="g-input" placeholder="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} /><input className="g-input" placeholder="Note" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} /><button className="btn-primary" onClick={addEntry}>Log entry</button></div></div>}
      {data.money.slice(0,15).map(e => <div key={e.id} className="card" style={{ padding:'11px 14px',display:'flex',justifyContent:'space-between',marginBottom:8 }}><div><p style={{fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.04em'}}>{e.type}</p><p className="mono" style={{fontSize:11,color:'var(--faint)',marginTop:2}}>{e.category||e.note||'—'} · {fmtDate(e.date)}</p></div><p className="mono" style={{fontSize:13,fontWeight:500}}>{e.currency} {e.amount.toLocaleString()}</p></div>)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GYM
// ════════════════════════════════════════════════════════════════════════════
function GymTab({ data, update }: { data: GuardianData; update: (p: Partial<GuardianData>) => void }) {
  const [logging, setLogging] = useState(false);
  const [form, setForm] = useState({ duration: '60', notes: '' });
  const dayName = getDayName();
  const workout = WORKOUT_PROGRAMME[dayName];
  const todayMeals = data.meals.filter(m => m.date === today());
  const protein = todayMeals.reduce((s,m) => s+m.protein, 0);
  const cals = todayMeals.reduce((s,m) => s+m.calories, 0);
  function logW() { const w: WorkoutLog = { id: uid(), date: today(), type: workout?.name||'workout', exercises: '', duration: Number(form.duration), notes: form.notes, completed: true }; update({ workouts: [w,...data.workouts], gymStreak: data.gymStreak+1 }); setLogging(false); }
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}><p className="section-label" style={{ marginBottom: 3 }}>Gym</p><h2 className="serif" style={{ fontSize: 22 }}>Target: {data.targetWeightKg}kg lean.</h2></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="stat-block"><p className="stat-num">{data.gymStreak}</p><p className="stat-label">Streak</p></div>
        <div className="stat-block"><p className="stat-num">{data.currentWeightKg}</p><p className="stat-label">Current kg</p></div>
        <div className="stat-block"><p className="stat-num">{data.targetWeightKg}</p><p className="stat-label">Target kg</p></div>
      </div>
      <input className="g-input" placeholder="Log weight (kg)" type="number" style={{ marginBottom: 12 }} onChange={e => { if (e.target.value) update({ currentWeightKg: Number(e.target.value) }); }} />
      <div className="card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div><p className="section-label" style={{ marginBottom: 2 }}>Today</p><p style={{ fontSize: 14, fontWeight: 500 }}>{workout?.name}</p></div>
          <button className="btn-primary" onClick={() => setLogging(!logging)} style={{ fontSize: 11, padding: '7px 12px' }}>{logging ? 'Cancel' : '✓ Done'}</button>
        </div>
        {workout?.exercises.map((e, i) => <div key={i} style={{ padding: '7px 0', borderBottom: i<workout.exercises.length-1 ? '1px solid var(--border)' : 'none' }}><div style={{ display:'flex',justifyContent:'space-between' }}><p style={{fontSize:12}}>{e.name}</p><p className="mono" style={{fontSize:12,color:'var(--muted)'}}>{e.sets}×{e.reps}</p></div></div>)}
        {logging && <div style={{ marginTop: 12, display:'flex',flexDirection:'column',gap:8 }}><input className="g-input" placeholder="Duration (mins)" type="number" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} /><textarea className="g-input" placeholder="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} /><button className="btn-primary" onClick={logW}>Mark complete +50 XP</button></div>}
      </div>
      <div className="card-filled" style={{ padding: 14 }}>
        <p className="section-label" style={{ marginBottom: 8 }}>Nutrition today</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}><p style={{fontSize:11,color:'var(--muted)'}}>Calories</p><p className="mono" style={{fontSize:11,color:'var(--muted)'}}>{cals}/{NUTRITION_TARGETS.calories}</p></div><div className="progress-track"><div className="progress-fill" style={{width:`${Math.min(100,(cals/NUTRITION_TARGETS.calories)*100)}%`}} /></div></div>
          <div style={{ flex: 1 }}><div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}><p style={{fontSize:11,color:'var(--muted)'}}>Protein</p><p className="mono" style={{fontSize:11,color:'var(--muted)'}}>{protein}g/{NUTRITION_TARGETS.protein}g</p></div><div className="progress-track"><div className="progress-fill" style={{width:`${Math.min(100,(protein/NUTRITION_TARGETS.protein)*100)}%`}} /></div></div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STUDY
// ════════════════════════════════════════════════════════════════════════════
function StudyTab({ data, update }: { data: GuardianData; update: (p: Partial<GuardianData>) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ subject: '', duration: '60', notes: '' });
  const dayName = getDayName();
  const todayS = STUDY_SCHEDULE[dayName as keyof typeof STUDY_SCHEDULE] || [];
  const totalH = data.study.reduce((s,e) => s+e.duration/60, 0).toFixed(1);
  function addS() { const s: StudySession = { id: uid(), date: today(), subject: form.subject, duration: Number(form.duration), notes: form.notes }; update({ study: [s,...data.study] }); setAdding(false); setForm({ subject:'',duration:'60',notes:'' }); }
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20 }}>
        <div><p className="section-label" style={{marginBottom:3}}>Study</p><h2 className="serif" style={{fontSize:22}}>{totalH}h logged.</h2></div>
        <button className="btn-primary" onClick={() => setAdding(!adding)} style={{fontSize:12,padding:'8px 14px'}}>{adding?'Cancel':'+ Log'}</button>
      </div>
      {todayS.length > 0 && <div className="card-filled" style={{padding:14,marginBottom:14}}><p className="section-label" style={{marginBottom:10}}>Today&apos;s plan</p>{todayS.map((s,i) => <div key={i} style={{padding:'8px 0',borderBottom:i<todayS.length-1?'1px solid var(--border)':'none'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><p style={{fontSize:13,fontWeight:500}}>{s.subject}</p><p className="mono" style={{fontSize:11,color:'var(--faint)'}}>{s.duration}min</p></div><p style={{fontSize:12,color:'var(--muted)'}}>{s.topic}</p></div>)}</div>}
      {adding && <div className="card-filled anim-pop" style={{padding:14,marginBottom:14}}><div style={{display:'flex',flexDirection:'column',gap:8}}><input className="g-input" placeholder="Subject / module" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} /><input className="g-input" placeholder="Duration (mins)" type="number" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} /><textarea className="g-input" placeholder="What did you cover?" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} /><button className="btn-primary" onClick={addS}>Log +20 XP</button></div></div>}
      {data.study.slice(0,8).map(s => <div key={s.id} className="card" style={{padding:'10px 14px',display:'flex',justifyContent:'space-between',marginBottom:8}}><div><p style={{fontSize:13}}>{s.subject}</p><p style={{fontSize:11,color:'var(--faint)',marginTop:2}}>{s.notes||fmtDate(s.date)}</p></div><p className="mono" style={{fontSize:12,color:'var(--muted)'}}>{s.duration}min</p></div>)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FAITH
// ════════════════════════════════════════════════════════════════════════════
function FaithTab({ data, update }: { data: GuardianData; update: (p: Partial<GuardianData>) => void }) {
  const [logging, setLogging] = useState(false);
  const [form, setForm] = useState({ type: 'morning', verse: '', reflection: '' });
  const verse = getVerseOfDay();
  const prayedToday = data.prayer.some(p => p.date === today());
  function logP() { const p: PrayerLog = { id: uid(), date: today(), type: form.type as PrayerLog['type'], verse: form.verse, reflection: form.reflection }; update({ prayer: [p,...data.prayer], prayerStreak: prayedToday?data.prayerStreak:data.prayerStreak+1 }); setLogging(false); }
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}><p className="section-label" style={{marginBottom:3}}>Faith</p><h2 className="serif" style={{fontSize:22}}>The root of everything.</h2></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
        <div className="stat-block"><p className="stat-num">{data.prayerStreak}</p><p className="stat-label">Prayer streak</p></div>
        <div className="stat-block"><p style={{fontSize:20,fontFamily:'var(--font-mono)'}}>{prayedToday?'✓':'—'}</p><p className="stat-label">{prayedToday?'Prayed today':'Not yet'}</p></div>
      </div>
      <div className="card" style={{padding:16,marginBottom:14}}><p className="section-label" style={{marginBottom:8}}>Verse of the day</p><p className="serif" style={{fontSize:14,fontStyle:'italic',lineHeight:1.6,marginBottom:6}}>&ldquo;{verse.text}&rdquo;</p><p className="mono" style={{fontSize:11,color:'var(--faint)'}}>{verse.reference}</p></div>
      <button className="btn-primary" onClick={() => setLogging(!logging)} style={{width:'100%',marginBottom:14}}>{logging?'Cancel':'+ Log prayer'}</button>
      {logging && <div className="card-filled anim-pop" style={{padding:14,marginBottom:14}}><div style={{display:'flex',flexDirection:'column',gap:8}}><select className="g-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="morning">Morning prayer</option><option value="evening">Evening prayer</option><option value="gratitude">Gratitude</option><option value="intercession">Intercession</option></select><input className="g-input" placeholder="Scripture (optional)" value={form.verse} onChange={e=>setForm(f=>({...f,verse:e.target.value}))} /><textarea className="g-input" placeholder="Your reflection..." value={form.reflection} onChange={e=>setForm(f=>({...f,reflection:e.target.value}))} rows={4} /><button className="btn-primary" onClick={logP}>Save +30 XP</button></div></div>}
      {data.prayer.slice(0,5).map(p => <div key={p.id} className="card" style={{padding:14,marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span className="tag">{p.type}</span><span className="mono" style={{fontSize:11,color:'var(--faint)'}}>{fmtDate(p.date)}</span></div>{p.verse&&<p className="mono" style={{fontSize:11,color:'var(--muted)',marginBottom:4}}>{p.verse}</p>}{p.reflection&&<p style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{p.reflection}</p>}</div>)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// JOURNAL
// ════════════════════════════════════════════════════════════════════════════
function JournalTab({ data, update }: { data: GuardianData; update: (p: Partial<GuardianData>) => void }) {
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ content: '', mood: 'good' });
  const moods = ['great','good','neutral','hard','rough'];
  function addEntry() { if (!form.content.trim()) return; const e: JournalEntry = { id: uid(), date: today(), content: form.content, mood: form.mood as JournalEntry['mood'] }; update({ journal: [e,...(data.journal||[])] }); setForm({ content:'',mood:'good' }); setWriting(false); }
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20 }}>
        <div><p className="section-label" style={{marginBottom:3}}>Journal</p><h2 className="serif" style={{fontSize:22}}>{(data.journal||[]).length} entries.</h2></div>
        <button className="btn-primary" onClick={() => setWriting(!writing)} style={{fontSize:12,padding:'8px 14px'}}>{writing?'Cancel':'+ Write'}</button>
      </div>
      {writing && (
        <div className="card-filled anim-pop" style={{padding:14,marginBottom:16}}>
          <p style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>How was today?</p>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            {moods.map(m => <button key={m} onClick={() => setForm(f=>({...f,mood:m}))} className="btn-ghost" style={{fontSize:11,padding:'4px 10px',flex:1,background:form.mood===m?'var(--text)':undefined,color:form.mood===m?'var(--bg)':undefined,borderColor:form.mood===m?'var(--text)':undefined}}>{m}</button>)}
          </div>
          <textarea className="g-input" rows={6} placeholder="Write anything. This is yours." value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} style={{marginBottom:8}} />
          <button className="btn-primary" style={{width:'100%'}} onClick={addEntry}>Save entry</button>
        </div>
      )}
      {(data.journal||[]).slice(0,10).map(e => (
        <div key={e.id} className="card" style={{padding:14,marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span className="tag">{e.mood}</span>
            <span className="mono" style={{fontSize:11,color:'var(--faint)'}}>{fmtDate(e.date)}</span>
          </div>
          <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.6}}>{e.content.slice(0,160)}{e.content.length>160?'…':''}</p>
        </div>
      ))}
      {(data.journal||[]).length===0 && <p style={{fontSize:13,color:'var(--muted)',textAlign:'center',paddingTop:24}}>No entries yet. Start writing.</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HABITS
// ════════════════════════════════════════════════════════════════════════════
function HabitsTab({ data, update }: { data: GuardianData; update: (p: Partial<GuardianData>) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'personal' });
  const habits: Habit[] = data.habits || [];
  function addHabit() { if (!form.name) return; const h: Habit = { id: uid(), name: form.name, category: form.category, completedDates: [], targetDays: [0,1,2,3,4,5,6], streak: 0 }; update({ habits: [...habits, h] }); setForm({ name:'',category:'personal' }); setAdding(false); }
  function toggleToday(id: string) {
    update({ habits: habits.map(h => {
      if (h.id !== id) return h;
      const hasToday = h.completedDates.includes(today());
      const newDates = hasToday ? h.completedDates.filter(d => d !== today()) : [...h.completedDates, today()];
      const newStreak = newDates.includes(today()) ? h.streak + 1 : Math.max(0, h.streak - 1);
      return { ...h, completedDates: newDates, streak: newStreak };
    }) });
  }
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20 }}>
        <div><p className="section-label" style={{marginBottom:3}}>Habits</p><h2 className="serif" style={{fontSize:22}}>{habits.length} tracked.</h2></div>
        <button className="btn-primary" onClick={() => setAdding(!adding)} style={{fontSize:12,padding:'8px 14px'}}>{adding?'Cancel':'+ New'}</button>
      </div>
      {adding && <div className="card-filled anim-pop" style={{padding:14,marginBottom:14}}><div style={{display:'flex',flexDirection:'column',gap:8}}><input className="g-input" placeholder="Habit name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /><select className="g-input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}><option value="faith">Faith</option><option value="gym">Gym</option><option value="study">Study</option><option value="personal">Personal</option><option value="money">Money</option></select><button className="btn-primary" onClick={addHabit}>Add habit</button></div></div>}
      {habits.length===0 && <p style={{fontSize:13,color:'var(--muted)',textAlign:'center',paddingTop:24}}>No habits yet. Build the streak.</p>}
      {habits.map(h => {
        const doneToday = h.completedDates.includes(today());
        const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10); });
        return (
          <div key={h.id} className="card" style={{padding:14,marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div><p style={{fontSize:14,fontWeight:500}}>{h.name}</p><p className="mono" style={{fontSize:10,color:'var(--faint)',marginTop:2}}>{h.streak} day streak · {h.category}</p></div>
              <button onClick={() => toggleToday(h.id)} className="check-ring" style={{background:doneToday?'var(--text)':'transparent',width:28,height:28}}>
                {doneToday && <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </button>
            </div>
            <div style={{display:'flex',gap:4}}>
              {last7.map(d => <div key={d} style={{flex:1,height:6,borderRadius:2,background:h.completedDates.includes(d)?'var(--text)':'var(--border)'}} />)}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
              <p className="mono" style={{fontSize:9,color:'var(--faint)'}}>7 days</p>
              <button onClick={() => update({habits:habits.filter(x=>x.id!==h.id)})} style={{background:'none',border:'none',cursor:'pointer',color:'var(--faint)',padding:0,fontSize:11}}>×</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS — app personalisation
// ════════════════════════════════════════════════════════════════════════════
function SettingsTab({ data, update, profile, setProfile }: { data: GuardianData; update: (p: Partial<GuardianData>) => void; profile: UserProfile; setProfile: (p: UserProfile) => void }) {
  const p = data.personalisation || DEFAULT_PERSONALISATION;
  const [form, setForm] = useState<AppPersonalisation>({ ...p });

  function save() {
    update({ personalisation: form });
    applyTheme(form);
  }
  function resetOnboarding() { localStorage.removeItem('guardian_onboarded_v3'); localStorage.removeItem('guardian_profile_v3'); window.location.reload(); }
  function clearData() { if (confirm('Delete all Guardian data? This cannot be undone.')) { localStorage.removeItem('guardian_v3'); window.location.reload(); } }

  const themes: Array<{id: AppPersonalisation['theme']; label: string}> = [
    { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'sepia', label: 'Sepia' },
  ];

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <p className="section-label" style={{ marginBottom: 3 }}>Settings</p>
        <h2 className="serif" style={{ fontSize: 22 }}>Make it yours.</h2>
      </div>

      <p className="section-label" style={{ marginBottom: 10 }}>App identity</p>
      <div className="card-filled" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>App name</p>
            <input className="g-input" value={form.appName} onChange={e => setForm(f => ({ ...f, appName: e.target.value }))} placeholder="Guardian" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Avatar letters</p>
              <input className="g-input" value={form.avatarInitials} onChange={e => setForm(f => ({ ...f, avatarInitials: e.target.value.slice(0,2).toUpperCase() }))} placeholder="G" maxLength={2} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Avatar colour</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={form.avatarBg} onChange={e => setForm(f => ({ ...f, avatarBg: e.target.value }))} style={{ width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                <div style={{ width: 36, height: 36, borderRadius: 8, background: form.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{form.avatarInitials || 'G'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="section-label" style={{ marginBottom: 10 }}>Theme</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {themes.map(t => (
          <button key={t.id} onClick={() => setForm(f => ({ ...f, theme: t.id }))} className="btn-ghost" style={{ padding: '10px 0', fontSize: 13, background: form.theme === t.id ? 'var(--text)' : undefined, color: form.theme === t.id ? 'var(--bg)' : undefined, borderColor: form.theme === t.id ? 'var(--text)' : undefined }}>
            {t.label}
          </button>
        ))}
      </div>

      <button className="btn-primary" style={{ width: '100%', marginBottom: 20 }} onClick={save}>Save changes</button>

      <div className="divider" style={{ marginBottom: 20 }} />

      <p className="section-label" style={{ marginBottom: 10 }}>Data & account</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn-ghost" style={{ width: '100%', textAlign: 'left' }} onClick={resetOnboarding}>Redo onboarding (rebuilds timetable)</button>
        <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', color: '#cc3333', borderColor: 'rgba(200,50,50,0.2)' }} onClick={clearData}>Delete all data</button>
      </div>

      <div className="divider" style={{ margin: '20px 0' }} />

      <p className="section-label" style={{ marginBottom: 10 }}>AI provider</p>
      <div className="card-filled" style={{ padding: 14 }}>
        <p style={{ fontSize: 13, marginBottom: 8 }}>Set in Vercel → Settings → Environment Variables</p>
        {[
          { v: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude)', url: 'console.anthropic.com' },
          { v: 'GEMINI_API_KEY', label: 'Google Gemini (free tier)', url: 'aistudio.google.com' },
          { v: 'GROQ_API_KEY', label: 'Groq (free, very fast)', url: 'console.groq.com' },
        ].map(r => (
          <div key={r.v} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 500 }}>{r.label}</p>
            <p className="mono" style={{ fontSize: 10, color: 'var(--faint)', marginTop: 2 }}>{r.v} · {r.url}</p>
          </div>
        ))}
        <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 10, lineHeight: 1.5 }}>Guardian tries Anthropic first. If no key, it falls back to Gemini, then Groq. Add any one key and chat will work.</p>
      </div>
    </div>
  );
}
