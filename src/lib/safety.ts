// Kid-safe check: blocklist + structure validation

const BLOCKLIST = [
  "scary", "scare", "monster", "ghost", "blood", "kill", "die", "death", "murder", "gun", "knife", "weapon",
  "fight", "war", "hate", "angry", "violent", "violence", "hurt", "pain", "cry", "crying", "sad", "lonely",
  "afraid", "fear", "terror", "nightmare", "devil", "demon", "witch", "zombie", "vampire", "scream", "shout",
  "punish", "abuse", "steal", "drunk", "alcohol", "drug", "suicide", "kidnap"
];

export function containsBlockedWords(text: string): { blocked: boolean; word?: string } {
  const lower = text.toLowerCase();
  for (const w of BLOCKLIST) {
    // Use word boundary check for short words to avoid false positives
    const pattern = new RegExp(`\\b${w}\\b`, "i");
    if (pattern.test(lower)) {
      return { blocked: true, word: w };
    }
  }
  return { blocked: false };
}

export function validateStoryStructure(story: any, expectedScenes: number): { valid: boolean; reason?: string } {
  if (!story || typeof story !== "object") return { valid: false, reason: "Not an object" };
  if (!story.title || typeof story.title !== "string" || story.title.length > 80) return { valid: false, reason: "Invalid title" };
  if (!Array.isArray(story.scenes)) return { valid: false, reason: "Scenes not array" };
  if (story.scenes.length !== expectedScenes) return { valid: false, reason: `Expected ${expectedScenes} scenes, got ${story.scenes.length}` };
  for (let i = 0; i < story.scenes.length; i++) {
    const s = story.scenes[i];
    if (!s.text || typeof s.text !== "string" || s.text.length < 10 || s.text.length > 600) {
      return { valid: false, reason: `Scene ${i} text invalid` };
    }
    if (!s.description || typeof s.description !== "string" || s.description.length > 200) {
      return { valid: false, reason: `Scene ${i} description invalid` };
    }
    const check = containsBlockedWords(s.text);
    if (check.blocked) {
      return { valid: false, reason: `Blocked word in scene ${i}: ${check.word}` };
    }
  }
  // Last scene should be sleepy / calm ending
  const lastText = story.scenes[story.scenes.length - 1]?.text?.toLowerCase() || "";
  const sleepyWords = ["sleep", "sleepy", "dream", "yawn", "cozy", "snuggle", "goodnight", "night", "rest"];
  const hasSleepyEnding = sleepyWords.some(w => lastText.includes(w));
  if (!hasSleepyEnding) {
    // Not strictly failing, but warn - we allow but prompt should ensure
    // return { valid: false, reason: "Last scene should be sleepy ending" };
  }
  return { valid: true };
}

export function buildGroqPrompt(input: { childName: string; animal: Animal; mood: Mood; ageGroup: AgeGroup }, expectedScenes: number) {
  const { childName, animal, mood, ageGroup } = input as any;

  const ageInstructions: Record<string, string> = {
    "2-4": `AGE 2-4: Write 3 scenes only. Each scene: 1-2 very short simple sentences (max 15 words per sentence). Use very simple words, gentle repetition, warm and cozy. Example: "${childName} saw a star. The star twinkled."`,
    "5-7": `AGE 5-7: Write 5 scenes. Each scene: 2-3 simple sentences (max 20 words per sentence). Simple vocabulary, warm, gentle adventure.`,
    "8-10": `AGE 8-10: Write 6 scenes. Each scene: 2-4 sentences, slightly richer vocabulary but still gentle and calm, warm storytelling.`
  };

  const moodInstructions: Record<string, string> = {
    Calm: "MOOD Calm: slow, peaceful, soft breezes, quiet night, gentle breathing, soothing tone.",
    Silly: "MOOD Silly: playful giggles, funny little wobbles and soft silly sounds, but never scary or loud, still gentle for bedtime.",
    Brave: "MOOD Brave: gentle courage, small kind acts, helping friends, feeling safe and proud, never scary.",
    Sleepy: "MOOD Sleepy: very drowsy, yawns, soft whispers, stars blinking sleepily, cozy blankets.",
    Adventurous: "MOOD Adventurous: tiny gentle explorations, discovering a flower or a smooth stone, always safe and close to home."
  };

  return `
You are a kind bedtime story writer for children. Write a gentle, cozy bedtime story.

RULES - MUST FOLLOW:
- Child hero name: ${childName}
- Companion: a friendly ${animal}
- Mood: ${mood}
- ${ageInstructions[ageGroup]}
- ${moodInstructions[mood]}
- The child ${childName} is always the hero, with ${animal} as companion.
- NO scary, violent, sad, or upsetting content. No monsters, ghosts, fighting, weapons, death, or danger.
- Every scene must be warm, safe, and positive.
- The story must end with a calm, sleepy, cozy goodnight, with ${childName} feeling safe and sleepy.
- Use age-appropriate language for ${ageGroup}.
- Include gentle sensory details: soft moonlight, warm breeze, twinkling stars.
- Keep it inclusive and kind.

OUTPUT FORMAT - MUST BE VALID JSON ONLY, NO EXTRA TEXT:
{
  "title": "A short sweet title (max 6 words)",
  "scenes": [
    { "text": "Story text for scene 1...", "description": "night sky with moon and hills, ${animal} sitting with ${childName}" },
    ...
  ]
}

For description: keep it short (under 15 words), mention setting like: hill, forest edge, pond, meadow, starry sky, with moon, stars, clouds, flowers, etc. Use simple setting keywords.

Return ONLY JSON.
`.trim();
}

import { Animal, Mood, AgeGroup } from "./constants";
