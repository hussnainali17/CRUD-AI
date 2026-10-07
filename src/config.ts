/**
 * Configuration defaults for Ilm Web App.
 */

// In the browser, localhost:8000 connects directly to FastAPI backend
export const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const MODEL_PRESETS = [
  { label: "Gemini 3.5 Flash Lite", value: "gemini/gemini-3.5-flash-lite", provider: "Gemini" },
  { label: "Gemini 2.5 Flash", value: "gemini/gemini-2.5-flash", provider: "Gemini" },
  { label: "Grok 2", value: "xai/grok-2", provider: "xAI" },
  { label: "GPT-4o Mini", value: "openai/gpt-4o-mini", provider: "OpenAI" },
];

export const STORAGE_KEYS = {
  API_KEY: "ilm_web_user_api_key",
  MODEL: "ilm_web_selected_model",
  BACKEND_URL: "ilm_web_backend_url",
  THREAD_ID: "ilm_web_thread_id",
};
