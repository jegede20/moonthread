import { Animal, Mood, AgeGroup } from "./constants";
import { Story } from "./storyTypes";

type TemplateBeat = (name: string, animal: Animal) => { text: string; description: string };

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

export function generateOfflineStory(input: { childName: string; animal: Animal; mood: Mood; ageGroup: AgeGroup }): Story {
  const { childName, animal, mood, ageGroup } = input;
  const animalDesc = ANIMALS_FRIENDLY[animal];
  const opener = pick(MOOD_OPENERS[mood]);
  const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  let scenes: { text: string; description: string }[] = [];

  if (ageGroup === "2-4") {
    scenes = [
      makeScene(`${opener}. ${childName} saw ${animalDesc}. Hello, said ${childName}.`, `soft hill with moon and ${animal} sitting`),
      makeScene(`${childName} and ${animal} walked slow. They saw stars. Twinkle, twinkle, said the stars.`, `starry sky with hills and flowers`),
      makeScene(`${childName} yawned. ${animal} yawned too. Goodnight moon. Goodnight stars. Time to sleep, cozy and warm.`, `moon over hill, ${animal} curled sleepy, night sky`),
    ];
  } else if (ageGroup === "5-7") {
    const s1 = pick(SETTINGS);
    scenes = [
      makeScene(`${opener} ${s1}. ${childName} held hands with ${animalDesc}. The moon was bright and kind.`, `night hill with moon, ${animal} and child holding hands`),
      makeScene(`${childName} found a smooth stone that felt warm. ${animal} sniffed it gently. "For you," said ${childName}.`, `meadow with flowers and pond, ${animal} curious`),
      makeScene(`A soft cloud floated by like a sheep. ${childName} giggled. ${animal} wiggled its ears. The night smelled like warm earth.`, `clouds and stars over hills, ${animal} playful`),
      makeScene(`They sat on the hill and listened. Crickets sang a lullaby. The wind hummed low. ${childName} felt safe and brave.`, `hill top with moon and stars, ${animal} sitting close`),
      makeScene(`${childName} yawned a big soft yawn. ${animal} curled close. The moon tucked them in with silver light. Goodnight, sleepy world. Time to dream.`, `moonlit hill, ${animal} sleeping curled, stars twinkling`),
    ];
  } else {
    const s1 = pick(SETTINGS);
    const s2 = pick(SETTINGS);
    scenes = [
      makeScene(`${opener} ${s1}. ${childName} and ${animalDesc} stepped into the silver night. The air was cool and sweet, and the moon followed them like a lantern.`, `wide night meadow with moon, hills layered`),
      makeScene(`${childName} discovered a circle of soft flowers that glowed faintly. ${animal} touched one gently with its nose. "They are night flowers," whispered ${childName}.`, `flower meadow at night with pond, ${animal} near flowers`),
      makeScene(`A family of fireflies rose, blinking hello. ${childName} counted them quietly. One, two, three. ${animal} watched, eyes round and kind. The meadow felt like a secret.`, `forest edge with fireflies, stars, ${animal} watching`),
      makeScene(`They climbed the little hill where the wind was soft. From there they could see the whole valley sleeping. ${childName} felt a small, warm brave feeling, like holding a star.`, `hill top view, moon large, layered hills, ${animal} beside child`),
      makeScene(`${childName} and ${animal} shared a story of their own, about clouds that were really sleepy whales. They laughed a soft, sleepy laugh. The night listened kindly.`, `clouds drifting over moon, hill silhouette, ${animal} cuddled`),
      makeScene(`The moon yawned and stretched its thread across the sky. ${childName} yawned too. ${animal} curled into a warm circle. "Goodnight, moon. Goodnight, stars. Goodnight, cozy earth." And they drifted into dreams, safe and warm.`, `moon over hill, thread across sky, ${animal} sleeping, stars`),
    ];
  }

  // Apply mood tweaks to text
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
  };
}

export function generateOfflineStoryFromTemplate(input: { childName: string; animal: Animal; mood: Mood; ageGroup: AgeGroup }): Story {
  return generateOfflineStory(input);
}
