/**
 * reportGenerator.ts
 *
 * Implements a simplified version of the SDD Algorithm 2 (Report Generation).
 * Accepts:
 *   - { periodType, startDate, endDate, readings, analyses }
 *
 * readings: array of all readings (with patient info: name, healthcare_number)
 * analyses: array of AI analyses (from AIPatternAnalyzer) - optional
 *
 * Returns a JSON report object.
 */

import type { PatternData } from "./aiAlgorithm";

export interface PatientReading {
  reading_id?: string | number;
  patient_id?: string | number;
  patient_name?: string;
  name?: string;
  healthcare_number?: string | null;
  hcn?: string | null;
  value: number;
  datetime?: string;
  category?: string;
  food_notes?: string;
  activity_notes?: string;
  symptoms?: string;
}

export interface AIAnalysis {
  patient_id?: string | number;
  pattern_data?: PatternData;
  patternData?: PatternData;
}

export interface PatientStats {
  patient_id: string | number;
  name: string;
  healthcare_number: string | null;
  average: number;
  highest: number;
  lowest: number;
  count: number;
}

export interface TopTrigger {
  trigger: string;
  occurrences: number;
  patientCount: number;
  impact: number;
}

export interface Report {
  periodType: "Monthly" | "Yearly" | string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  totalActivePatients: number;
  totalReadings: number;
  overallAverage: number;
  overallHighest: number | null;
  overallLowest: number | null;
  patientStats: PatientStats[];
  topTriggers: TopTrigger[];
}

interface GenerateReportParams {
  periodType: "Monthly" | "Yearly" | string;
  startDate: string;
  endDate: string;
  readings?: PatientReading[];
  analyses?: AIAnalysis[];
}

export function generateReport({
  periodType,
  startDate,
  endDate,
  readings = [],
  analyses = [],
}: GenerateReportParams): Report {
  // Group readings by patient_id
  const byPatient: Record<string, { name: string; healthcare_number: string | null; readings: PatientReading[] }> = {};

  readings.forEach((r) => {
    const pid = r.patient_id ?? "unknown";
    if (!byPatient[pid]) {
      byPatient[pid] = {
        name: r.patient_name ?? r.name ?? "Unknown",
        healthcare_number: r.healthcare_number ?? r.hcn ?? null,
        readings: [],
      };
    }
    byPatient[pid].readings.push(r);
  });

  // Calculate patient stats
  const patientStats: PatientStats[] = Object.entries(byPatient).map(([pid, data]) => {
    const vals = data.readings.map((x) => x.value);
    const avg = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1);
    const highest = Math.max(...vals);
    const lowest = Math.min(...vals);
    return {
      patient_id: pid,
      name: data.name,
      healthcare_number: data.healthcare_number,
      average: Number(avg.toFixed(2)),
      highest,
      lowest,
      count: data.readings.length,
    };
  });

  // Aggregate top triggers
  const triggerMap: Record<string, { occurrences: number; patients: Set<string | number> }> = {};
  analyses.forEach((a) => {
    const patternData = a.pattern_data ?? a.patternData;
    const itemMap =
      patternData && typeof patternData === "object" && "itemMap" in patternData && patternData.itemMap
        ? patternData.itemMap
        : {};
    Object.entries(itemMap).forEach(([item, meta]: [string, any]) => {
      const occurrences = meta.count ?? meta.occurrences ?? 0;
      if (!triggerMap[item]) triggerMap[item] = { occurrences: 0, patients: new Set() };
      triggerMap[item].occurrences += occurrences;
      if (a.patient_id) triggerMap[item].patients.add(a.patient_id);
    });
  });

  const triggerList: TopTrigger[] = Object.entries(triggerMap)
    .map(([item, val]) => ({
      trigger: item,
      occurrences: val.occurrences,
      patientCount: val.patients.size,
      impact: val.occurrences * val.patients.size,
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 10);

  // Clinic-wide stats
  const totalReadings = readings.length;
  const overallAvg =
    patientStats.length > 0 ? patientStats.reduce((s, p) => s + p.average, 0) / patientStats.length : 0;
  const overallHighest = readings.length > 0 ? Math.max(...readings.map((r) => r.value)) : null;
  const overallLowest = readings.length > 0 ? Math.min(...readings.map((r) => r.value)) : null;

  return {
    periodType,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    totalActivePatients: patientStats.length,
    totalReadings,
    overallAverage: Number(overallAvg.toFixed(2)),
    overallHighest,
    overallLowest,
    patientStats,
    topTriggers: triggerList,
  };
}

export default { generateReport };
