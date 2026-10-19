import { NextRequest, NextResponse } from "next/server";
import { ANIMALS, MOODS, AGE_GROUPS, AGE_CONFIG, GROQ_MODEL, STORY_LENGTHS } from "@/lib/constants";
import { buildGroqPrompt, validateStoryStructure } from "@/lib/safety";

// Simple in-memory rate limiter per IP
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 8; // per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000);
    return { allowed: false, retryAfter };
  }
  entry.count++;
  return { allowed: true };
}

function validateInput(body: any): { valid: boolean; error?: string; data?: any } {
  const { childName, animal, mood, ageGroup, storyLength } = body || {};

  if (typeof childName !== "string" || !childName.trim()) {
    return { valid: false, error: "Child name is required" };
  }
  const name = childName.trim();
  if (name.length > 20) return { valid: false, error: "Name max 20 characters" };
  if (!/^[A-Za-z\s\-']+$/.test(name)) return { valid: false, error: "Name allows letters, spaces, hyphens and apostrophes only" };

  if (!ANIMALS.includes(animal)) return { valid: false, error: "Invalid animal" };
  if (!MOODS.includes(mood)) return { valid: false, error: "Invalid mood" };
  if (!AGE_GROUPS.includes(ageGroup)) return { valid: false, error: "Invalid age group" };

  let lengthId: string | undefined = undefined;
  if (storyLength !== undefined) {
    const found = STORY_LENGTHS.find((l) => l.id === storyLength);
    if (!found) return { valid: false, error: "Invalid story length" };
    lengthId = found.id;
  }

  return { valid: true, data: { childName: name, animal, mood, ageGroup, storyLength: lengthId } };
}

async function callGroq(prompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const model = GROQ_MODEL;
  const isGptOss = model.startsWith("openai/gpt-oss");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const body: any = {
      model,
      messages: [
        { role: "system", content: "You are a kind bedtime story writer for children. Output valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    };

    if (isGptOss) {
      body.reasoning_effort = "low";
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Groq error ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from Groq");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON from Groq");
      }
    }

    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many stories, please wait a bit.", retryAfter: rate.retryAfter }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { childName, animal, mood, ageGroup, storyLength } = validation.data;
    
    // Determine expected scenes: use storyLength if provided, else age config
    let expectedScenes = AGE_CONFIG[ageGroup as keyof typeof AGE_CONFIG].scenes;
    if (storyLength) {
      const len = STORY_LENGTHS.find((l) => l.id === storyLength);
      if (len) expectedScenes = len.scenes;
    }

    const prompt = buildGroqPrompt({ childName, animal, mood, ageGroup, storyLength }, expectedScenes);

    let attempt = 0;
    let lastError: any = null;

    while (attempt < 2) {
      try {
        const storyJson = await callGroq(prompt);
        const check = validateStoryStructure(storyJson, expectedScenes);
        if (!check.valid) {
          throw new Error(`Validation failed: ${check.reason}`);
        }
        return NextResponse.json({
          id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: storyJson.title,
          scenes: storyJson.scenes,
        });
      } catch (e: any) {
        lastError = e;
        attempt++;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    console.error("Groq failed after retries", lastError);
    return NextResponse.json({ error: "Story writer is sleepy, try offline template", offlineFallback: true }, { status: 502 });
  } catch (e: any) {
    console.error("API error", e);
    return NextResponse.json({ error: "Something went wrong, try offline story", offlineFallback: true }, { status: 500 });
  }
}
