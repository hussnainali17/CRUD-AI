/**
 * Browser local storage wrapper for web application settings.
 */

import { DEFAULT_API_BASE_URL, MODEL_PRESETS, STORAGE_KEYS } from "./config";
import { SettingsState } from "./types";

export function sanitizeModel(model: string): string {
  let m = (model || "").trim();
  if (!m) return MODEL_PRESETS[0].value;

  // Clean leading prefix
  if (m.startsWith("gemini/models/")) {
    m = "gemini/" + m.slice("gemini/models/".length);
  } else if (m.startsWith("models/")) {
    m = "gemini/" + m.slice("models/".length);
  } else if (!m.includes("/")) {
    if (m.startsWith("gemini")) m = `gemini/${m}`;
    else if (m.startsWith("gpt-")) m = `openai/${m}`;
    else if (m.startsWith("grok")) m = `xai/${m}`;
    else if (m.startsWith("claude")) m = `anthropic/${m}`;
  }

  // Auto-upgrade deprecated Google Gemini models to supported versions
  if (
    m === "gemini/gemini-1.5-flash" ||
    m === "gemini/gemini-1.5-flash-latest" ||
    m === "gemini/gemini-2.5-flash-lite"
  ) {
    m = "gemini/gemini-3.5-flash-lite";
  }

  return m;
}

export function sanitizeApiKey(key: string): string {
  let cleaned = (key || "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.startsWith("API_KEY=")) {
    cleaned = cleaned.slice("API_KEY=".length).trim();
  }
  if (cleaned.startsWith("Bearer ")) {
    cleaned = cleaned.slice("Bearer ".length).trim();
  }
  return cleaned;
}

export function getStoredItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStoredItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

export function loadSettings(): SettingsState {
  const rawKey = getStoredItem(STORAGE_KEYS.API_KEY) || "";
  const apiKey = sanitizeApiKey(rawKey);

  const rawModel = getStoredItem(STORAGE_KEYS.MODEL) || MODEL_PRESETS[0].value;
  const model = sanitizeModel(rawModel);

  let backendUrl = getStoredItem(STORAGE_KEYS.BACKEND_URL);
  if (
    !backendUrl ||
    backendUrl.includes("localhost") ||
    backendUrl.includes("127.0.0.1") ||
    backendUrl.includes("16.192.57.235")
  ) {
    backendUrl = DEFAULT_API_BASE_URL;
    setStoredItem(STORAGE_KEYS.BACKEND_URL, backendUrl);
  }

  // Persist updated values so outdated models are permanently updated
  setStoredItem(STORAGE_KEYS.MODEL, model);
  if (apiKey) setStoredItem(STORAGE_KEYS.API_KEY, apiKey);

  return { apiKey, model, backendUrl };
}

export function saveSettings(settings: SettingsState): void {
  const cleanedKey = sanitizeApiKey(settings.apiKey);
  const cleanedModel = sanitizeModel(settings.model);
  setStoredItem(STORAGE_KEYS.API_KEY, cleanedKey);
  setStoredItem(STORAGE_KEYS.MODEL, cleanedModel);
  setStoredItem(STORAGE_KEYS.BACKEND_URL, settings.backendUrl);
}
