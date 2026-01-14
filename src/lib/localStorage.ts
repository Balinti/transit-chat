'use client';

import { LocalStorageData, AnonCommute, AlertPrefs, AnonReport } from '@/types';

const STORAGE_KEY = 'transit_pulse_data';

function generateAnonId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getDefaultData(): LocalStorageData {
  return {
    anon_id: generateAnonId(),
    anon_commutes: [],
    anon_alert_prefs: { enabled: true, categories: ['DELAY', 'SUSPENSION'] },
    anon_reports: [],
    meaningful_action_done: false,
  };
}

export function getLocalData(): LocalStorageData {
  if (typeof window === 'undefined') {
    return getDefaultData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as LocalStorageData;
      // Ensure anon_id exists
      if (!data.anon_id) {
        data.anon_id = generateAnonId();
        saveLocalData(data);
      }
      return data;
    }
  } catch {
    // Invalid JSON, reset
  }

  const defaultData = getDefaultData();
  saveLocalData(defaultData);
  return defaultData;
}

export function saveLocalData(data: LocalStorageData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked
  }
}

export function getAnonId(): string {
  return getLocalData().anon_id;
}

export function getAnonCommutes(): AnonCommute[] {
  return getLocalData().anon_commutes;
}

export function saveAnonCommute(commute: AnonCommute): void {
  const data = getLocalData();
  const existing = data.anon_commutes.findIndex((c) => c.id === commute.id);
  if (existing >= 0) {
    data.anon_commutes[existing] = commute;
  } else {
    data.anon_commutes.push(commute);
  }
  data.meaningful_action_done = true;
  saveLocalData(data);
}

export function deleteAnonCommute(id: string): void {
  const data = getLocalData();
  data.anon_commutes = data.anon_commutes.filter((c) => c.id !== id);
  saveLocalData(data);
}

export function getAlertPrefs(): AlertPrefs {
  return getLocalData().anon_alert_prefs;
}

export function saveAlertPrefs(prefs: AlertPrefs): void {
  const data = getLocalData();
  data.anon_alert_prefs = prefs;
  saveLocalData(data);
}

export function addAnonReport(report: AnonReport): void {
  const data = getLocalData();
  data.anon_reports.push(report);
  // Keep only last 50 reports
  if (data.anon_reports.length > 50) {
    data.anon_reports = data.anon_reports.slice(-50);
  }
  data.meaningful_action_done = true;
  saveLocalData(data);
}

export function getAnonReports(): AnonReport[] {
  return getLocalData().anon_reports;
}

export function hasMeaningfulAction(): boolean {
  return getLocalData().meaningful_action_done;
}

export function setMeaningfulAction(): void {
  const data = getLocalData();
  data.meaningful_action_done = true;
  saveLocalData(data);
}

export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getDataForMigration(): {
  anon_id: string;
  commutes: AnonCommute[];
  reports: AnonReport[];
} {
  const data = getLocalData();
  return {
    anon_id: data.anon_id,
    commutes: data.anon_commutes,
    reports: data.anon_reports,
  };
}
