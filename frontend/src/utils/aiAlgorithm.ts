/**
 * aiAlgorithm.ts
 *
 * Client-side AI Pattern Detection (SDD Algorithm 1)
 */

export interface Reading {
  reading_id?: string | number;
  id?: string | number;
  patient_id?: string | number;
  datetime: string;
  value: number;
  category?: string;
  food_notes?: string;
  activity_notes?: string;
}

interface AnalyzeOptions {
  minOccurrences?: number;
  minPercent?: number;
}

interface ItemData {
  count: number;
  readings: Set<string>;
  times: Record<string, number>;
}

export interface Suggestion {
  trigger: string;
  occurrences: number;
  percent: number;
  timing: string;
  message: string;
}

export interface PatternData {
  totalAbnormal: number;
  itemMap: Record<string, ItemData>;
}

export interface AnalyzeResult {
  suggestions: Suggestion[];
  patternData: PatternData;
}

function splitAndNormalize(text?: string): string[] {
  if (!text) return [];
  return text
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function timeBucket(datetime: string): string {
  const hour = new Date(datetime).getHours();
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 19) return "afternoon";
  return "evening";
}

/**
 * analyzePatterns - main function
 */
export default function analyzePatterns(
  readings: Reading[] = [],
  opts: AnalyzeOptions = {}
): AnalyzeResult {
  const { minOccurrences = 3, minPercent = 0.4 } = opts;

  const abnormal = readings.filter(
    (r) => String(r.category || "").toLowerCase() === "abnormal"
  );

  if (abnormal.length < minOccurrences) {
    return {
      suggestions: [],
      patternData: { totalAbnormal: abnormal.length, itemMap: {} },
    };
  }

  const itemMap: Record<string, ItemData> = {};

  abnormal.forEach((r) => {
    const foods = splitAndNormalize(r.food_notes);
    const acts = splitAndNormalize(r.activity_notes);
    const items = [...foods, ...acts];

    const bucket = timeBucket(r.datetime);
    const readingId = r.reading_id ?? r.id ?? `${r.datetime}${r.value}`;

    items.forEach((item) => {
      if (!itemMap[item]) itemMap[item] = { count: 0, readings: new Set(), times: {} };
      const readingIdStr = String(readingId);
      if (!itemMap[item].readings.has(readingIdStr)) {
        itemMap[item].readings.add(readingIdStr);
        itemMap[item].count = itemMap[item].readings.size;
      }
      itemMap[item].times[bucket] = (itemMap[item].times[bucket] || 0) + 1;
    });
  });

  const suggestions: Suggestion[] = [];

  Object.entries(itemMap).forEach(([item, data]) => {
    const occurrences = data.count;
    const percent = occurrences / abnormal.length;

    if (occurrences >= minOccurrences && percent >= minPercent) {
      const timing = Object.entries(data.times).sort((a, b) => b[1] - a[1])[0]?.[0] || "various times";
      const strength = percent >= 0.7 ? "strong" : "moderate";
      const message =
        strength === "strong"
          ? `This item appears in ${Math.round(percent * 100)}% of abnormal readings — consider avoiding or significantly reducing it.`
          : `This item appears in ${Math.round(percent * 100)}% of abnormal readings — consider portion control or timing changes.`;

      suggestions.push({
        trigger: item,
        occurrences,
        percent: Number((percent * 100).toFixed(1)),
        timing,
        message,
      });
    }
  });

  suggestions.sort((a, b) => b.percent - a.percent);

  return { suggestions, patternData: { totalAbnormal: abnormal.length, itemMap } };
}
