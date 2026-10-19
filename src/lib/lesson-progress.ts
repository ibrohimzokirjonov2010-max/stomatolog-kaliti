/** Watched share of each lesson on this device (0–100), written by the video player. */
const KEY = "sk-lesson-progress-v1";

export function readLessonProgress(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveLessonProgress(id: string, percent: number) {
  try {
    const all = readLessonProgress();
    const next = Math.max(0, Math.min(100, Math.round(percent)));
    if (all[id] === next) return;
    all[id] = next;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}
