export const learningPaths = [
  {
    slug: "foundation",
    name: "Foundation",
    description: "Understand patterns, triggers, and the role of your environment.",
    lessons: [
      { slug: "habits-and-patterns", title: "Habits and behavioural patterns", duration: "8 min read", summary: "A practical introduction to noticing repeated cues and responses." },
      { slug: "identify-triggers", title: "Identifying your triggers", duration: "6 min read", summary: "Map the situations, feelings, and routines that can shape a habit." },
      { slug: "environment-audit", title: "A gentle environment audit", duration: "5 min read", summary: "Look for small changes that can make your daily environment more supportive." },
    ],
  },
  {
    slug: "action",
    name: "Action",
    description: "Explore routines that support focus, sleep, and healthier use of technology.",
    lessons: [
      { slug: "sleep-routines", title: "Building a steadier sleep routine", duration: "7 min read", summary: "Simple ways to make evenings more predictable and restful." },
      { slug: "screen-boundaries", title: "Setting screen-time boundaries", duration: "6 min read", summary: "Choose practical boundaries that fit your own devices and schedule." },
      { slug: "movement-breaks", title: "Movement breaks for your day", duration: "4 min read", summary: "Use comfortable movement as one option for changing context." },
    ],
  },
  {
    slug: "mastery",
    name: "Mastery",
    description: "Build sustainable habits, emotional skills, and supportive relationships over time.",
    lessons: [
      { slug: "managing-setbacks", title: "Responding to setbacks", duration: "7 min read", summary: "Reflect without judgement and choose one manageable next step." },
      { slug: "emotional-regulation", title: "Practising emotional regulation", duration: "8 min read", summary: "A starting point for noticing emotions and responding with intention." },
      { slug: "supportive-relationships", title: "Nurturing supportive relationships", duration: "5 min read", summary: "Consider what respectful, useful support can look like for you." },
    ],
  },
] as const;

export function getLesson(category: string, slug: string) {
  const path = learningPaths.find((item) => item.slug === category);
  const lesson = path?.lessons.find((item) => item.slug === slug);
  return path && lesson ? { path, lesson } : null;
}

export function getYouTubeId(value: string): string | null {
  try {
    const url = new URL(value);
    const validId = (id: string | null) => id && /^[\w-]{11}$/.test(id) ? id : null;
    if (url.protocol !== "https:") return null;
    if (url.hostname === "youtu.be") return validId(url.pathname.slice(1));
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      if (url.pathname === "/watch") return validId(url.searchParams.get("v"));
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)$/);
      return validId(match?.[1] ?? null);
    }
  } catch {
    return null;
  }
  return null;
}

export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}
