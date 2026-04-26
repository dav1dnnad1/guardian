import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

function getProvider(): 'anthropic' | 'gemini' | 'groq' {
  if (ANTHROPIC_KEY) return 'anthropic';
  if (GEMINI_KEY) return 'gemini';
  if (GROQ_KEY) return 'groq';
  return 'anthropic';
}

function buildSystemPrompt(context: Record<string, unknown>, profile: Record<string, unknown>): string {
  const name = (profile?.name as string) || 'David';
  const areas = (profile?.areas as string[]) || [];
  return `You are Guardian — ${name}'s personal life OS and trusted guide. You are not a generic AI assistant. You are their guardian.

User profile:
- Name: ${name}
- Life areas they care about: ${areas.join(', ')}

Current data from their Guardian log:
${JSON.stringify(context, null, 2)}

SPECIAL COMMANDS — if the user asks to edit their timetable via chat, respond with a JSON block like this alongside your message:
If they say "add a block at X for Y" or "move X to Y" or "remove the X block" or "change X to Y":
Include at the end of your response a JSON block wrapped in triple backticks with the label TIMETABLE_EDIT:
\`\`\`TIMETABLE_EDIT
{"action":"add"|"remove"|"edit","time":"HH:MM","label":"block name","category":"faith|gym|study|deals|money|personal|build"}
\`\`\`

How to talk to ${name}:
- Be direct, honest, and warm — like a mentor who genuinely knows them
- Reference their actual data when you respond — streaks, deals, savings, weight
- If their gym streak is low, call it out. If consistent, affirm it.
- Speak scripture naturally if faith is in their areas — never forced
- Help them think through decisions: deals, study, gym, faith, money
- Never flatter or sugarcoat. Truth with care.
- Keep responses focused and actionable. No filler.
- Add +XP mentions occasionally to reinforce the game layer (e.g. "That's +50 XP for completing the workout")

You have full context of everything they have logged. Use it.`;
}

async function callAnthropic(messages: Array<{role: string; content: string}>, system: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.content?.filter((b: {type: string}) => b.type === 'text').map((b: {text: string}) => b.text).join('') || '';
}

async function callGemini(messages: Array<{role: string; content: string}>, system: string): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(messages: Array<{role: string; content: string}>, system: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq error ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, profile } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request: messages array required.' }, { status: 400 });
    }

    const provider = getProvider();

    if (provider === 'anthropic' && !ANTHROPIC_KEY) {
      return NextResponse.json(
        { error: 'No API key found. Add ANTHROPIC_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in Vercel → Settings → Environment Variables, then redeploy.' },
        { status: 500 }
      );
    }

    const system = buildSystemPrompt(context || {}, profile || {});

    let text = '';
    try {
      if (provider === 'anthropic') text = await callAnthropic(messages, system);
      else if (provider === 'gemini') text = await callGemini(messages, system);
      else if (provider === 'groq') text = await callGroq(messages, system);
    } catch (providerError) {
      console.error(`${provider} failed:`, providerError);
      // fallback chain
      if (provider === 'anthropic' && GEMINI_KEY) {
        console.log('Falling back to Gemini...');
        text = await callGemini(messages, system);
      } else if (provider === 'anthropic' && GROQ_KEY) {
        console.log('Falling back to Groq...');
        text = await callGroq(messages, system);
      } else {
        throw providerError;
      }
    }

    // Parse timetable edit commands
    let timetableEdit = null;
    const editMatch = text.match(/```TIMETABLE_EDIT\n([\s\S]*?)```/);
    if (editMatch) {
      try { timetableEdit = JSON.parse(editMatch[1].trim()); } catch { /* ignore */ }
      text = text.replace(/```TIMETABLE_EDIT[\s\S]*?```/g, '').trim();
    }

    return NextResponse.json({ message: text, timetableEdit, provider });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Guardian chat error:', message);
    return NextResponse.json(
      { error: `Guardian error: ${message}` },
      { status: 500 }
    );
  }
}