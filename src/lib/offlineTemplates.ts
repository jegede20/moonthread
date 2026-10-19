import { Animal, Mood, AgeGroup, StoryLengthId, STORY_LENGTHS } from "./constants";
import { Story } from "./storyTypes";

const ANIMALS_FRIENDLY: Record<Animal, string> = {
  Fox: "the little fox with a fluffy tail",
  Bunny: "the soft bunny with pink ears",
  Frog: "the friendly frog with a big smile",
  Owl: "the sleepy owl with round eyes",
  Bear: "the cuddly bear with a warm hug",
  Dino: "the tiny dino with little spikes",
};

const MOOD_OPENERS: Record<Mood, string[]> = {
  Calm: ["The night was soft and quiet", "Moonlight fell like warm milk", "A gentle breeze whispered"],
  Silly: ["The moon giggled a little giggle", "A star did a tiny wobble", "The night felt bouncy and fun"],
  Brave: ["The night felt kind and safe", "A little light showed the way", "The stars cheered softly"],
  Sleepy: ["The world was yawning", "Stars blinked slowly", "The night tucked itself in"],
  Adventurous: ["A little path twinkled", "The hill hummed a hello", "Moonlight drew a soft map"],
};

const SETTINGS = ["on a soft hill under the moon", "by a quiet pond", "at the edge of a sleepy meadow", "under a twinkling sky", "near a cozy hollow", "beside a field of soft flowers"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeScene(text: string, description: string) {
  return { text, description };
}

const EXTRA_BEATS: Record<AgeGroup, string[]> = {
  "2-4": [
    "They found a soft leaf. It felt nice.",
    "They hugged. Warm and cozy.",
    "A star winked. Hello star.",
    "They sniffed flowers. Sweet smell.",
  ],
  "5-7": [
    "They found a feather that glowed faintly. It felt like holding a tiny moon. They placed it gently on a stone.",
    "A little breeze brought the smell of pine. The hills hummed a quiet song. They listened together.",
    "They drew a heart in the soft earth with a stick. The moon made it silver. They smiled.",
    "A firefly landed near them, blinking hello. They whispered hello back, feeling safe and warm.",
  ],
  "8-10": [
    "They discovered a hollow log that smelled of warm wood and moss. Inside, a family of tiny beetles slept, curled like commas. They watched kindly and left them dreaming.",
    "The wind carried a distant lullaby from the valley, where another child was also being tucked in. The night felt connected and kind.",
    "They found a smooth river stone with a white stripe, like the moon's thread. They decided it was a treasure to keep by the bed.",
    "A soft owl hooted from a nearby branch, not scary, just sleepy. It blinked slowly, as if saying goodnight.",
  ],
};

export function generateOfflineStory(input: { childName: string; animal: Animal; mood: Mood; ageGroup: AgeGroup; storyLength?: StoryLengthId }): Story {
  const { childName, animal, mood, ageGroup, storyLength } = input;
  const animalDesc = ANIMALS_FRIENDLY[animal];
  const opener = pick(MOOD_OPENERS[mood]);
  const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  let targetScenes: number | undefined = STORY_LENGTHS.find((l) => l.id === storyLength)?.scenes;
  if (targetScenes === undefined) {
    // fallback to age config
    const ageMap: Record<AgeGroup, number> = { "2-4": 3, "5-7": 5, "8-10": 6 };
    targetScenes = ageMap[ageGroup];
  }
  const finalTarget = targetScenes as number;

  let scenes: { text: string; description: string }[] = [];

  if (ageGroup === "2-4") {
    const base = [
      makeScene(`${opener}. ${childName} saw ${animalDesc}. Hello, said ${childName}.`, `soft hill with moon and ${animal} sitting`),
      makeScene(`${childName} and ${animal} walked slow. They saw stars. Twinkle, twinkle, said the stars.`, `starry sky with hills and flowers`),
      makeScene(`${childName} yawned. ${animal} yawned too. Goodnight moon. Goodnight stars. Time to sleep, cozy and warm.`, `moon over hill, ${animal} curled sleepy, night sky`),
    ];
    scenes = extendScenes(base, finalTarget, ageGroup, childName, animal);
  } else if (ageGroup === "5-7") {
    const s1 = pick(SETTINGS);
    const base = [
      makeScene(`${opener} ${s1}. ${childName} held hands with ${animalDesc}. The moon was bright and kind.`, `night hill with moon, ${animal} and child holding hands`),
      makeScene(`${childName} found a smooth stone that felt warm. ${animal} sniffed it gently. "For you," said ${childName}.`, `meadow with flowers and pond, ${animal} curious`),
      makeScene(`A soft cloud floated by like a sheep. ${childName} giggled. ${animal} wiggled its ears. The night smelled like warm earth.`, `clouds and stars over hills, ${animal} playful`),
      makeScene(`They sat on the hill and listened. Crickets sang a lullaby. The wind hummed low. ${childName} felt safe and brave.`, `hill top with moon and stars, ${animal} sitting close`),
      makeScene(`${childName} yawned a big soft yawn. ${animal} curled close. The moon tucked them in with silver light. Goodnight, sleepy world. Time to dream.`, `moonlit hill, ${animal} sleeping curled, stars twinkling`),
    ];
    scenes = extendScenes(base, finalTarget, ageGroup, childName, animal);
  } else {
    const s1 = pick(SETTINGS);
    const base = [
      makeScene(`${opener} ${s1}. ${childName} and ${animalDesc} stepped into the silver night. The air was cool and sweet, and the moon followed them like a lantern.`, `wide night meadow with moon, hills layered`),
      makeScene(`${childName} discovered a circle of soft flowers that glowed faintly. ${animal} touched one gently with its nose. "They are night flowers," whispered ${childName}.`, `flower meadow at night with pond, ${animal} near flowers`),
      makeScene(`A family of fireflies rose, blinking hello. ${childName} counted them quietly. One, two, three. ${animal} watched, eyes round and kind. The meadow felt like a secret.`, `forest edge with fireflies, stars, ${animal} watching`),
      makeScene(`They climbed the little hill where the wind was soft. From there they could see the whole valley sleeping. ${childName} felt a small, warm brave feeling, like holding a star.`, `hill top view, moon large, layered hills, ${animal} beside child`),
      makeScene(`${childName} and ${animal} shared a story of their own, about clouds that were really sleepy whales. They laughed a soft, sleepy laugh. The night listened kindly.`, `clouds drifting over moon, hill silhouette, ${animal} cuddled`),
      makeScene(`The moon yawned and stretched its thread across the sky. ${childName} yawned too. ${animal} curled into a warm circle. "Goodnight, moon. Goodnight, stars. Goodnight, cozy earth." And they drifted into dreams, safe and warm.`, `moon over hill, thread across sky, ${animal} sleeping, stars`),
    ];
    scenes = extendScenes(base, finalTarget, ageGroup, childName, animal);
  }

  if (mood === "Silly") {
    scenes = scenes.map((s, i) => {
      if (i === 1) return { ...s, text: s.text.replace(".", " with a little wiggle.") };
      return s;
    });
  }

  const titles: Record<Mood, string[]> = {
    Calm: ["The Quiet Moon Night", "Stars and Soft Hills", "A Calm Night Walk"],
    Silly: ["The Giggly Moon", "Wobble Stars", "A Silly Night Parade"],
    Brave: ["A Brave Little Night", "The Kind Moon Light", "Stars Cheer Softly"],
    Sleepy: ["Sleepy Moon Song", "Yawn of Stars", "Goodnight Hill"],
    Adventurous: ["The Little Night Path", "Moonlit Treasure", "Star Map Adventure"],
  };

  const title = pick(titles[mood]);

  return {
    id,
    title,
    childName,
    animal,
    mood,
    ageGroup,
    scenes,
    createdAt: Date.now(),
    isOffline: true,
    storyLength,
  };
}

function extendScenes(base: { text: string; description: string }[], target: number, age: AgeGroup, name: string, animal: Animal) {
  if (base.length >= target) return base.slice(0, target);
  const extras = [...EXTRA_BEATS[age]];
  const result = [...base];
  // Insert extras before last scene (which should stay sleepy ending)
  const last = result.pop()!;
  while (result.length < target - 1 && extras.length > 0) {
    const t = extras.shift()!;
    // Replace placeholders
    const text = t.replace(/\{name\}/g, name).replace(/\{animal\}/g, animal);
    result.push(makeScene(text, `night meadow with ${animal} and stars, gentle`));
  }
  result.push(last);
  // If still short, duplicate middle with variation
  while (result.length < target) {
    const mid = result[Math.floor(result.length / 2)];
    result.splice(result.length - 1, 0, { ...mid });
  }
  return result.slice(0, target);
}

export function generateOfflineStoryFromTemplate(input: { childName: string; animal: Animal; mood: Mood; ageGroup: AgeGroup; storyLength?: StoryLengthId }): Story {
  return generateOfflineStory(input);
}
