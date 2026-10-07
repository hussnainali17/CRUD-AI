/**
 * Type definitions for Ilm Web App.
 */

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  due_date: string;
  status: TaskStatus;
}

export type ResponseStatus = "missing_fields" | "done" | "error";

export interface ChatMessage {
  id: string;
  sender: "user" | "ilm";
  text: string;
  timestamp: string;
  status?: ResponseStatus;
  missing?: string[];
  crud?: string;
  result?: any;
}

export interface ChatResponse {
  thread_id: string;
  crud: string;
  status: ResponseStatus;
  missing: string[];
  message: string;
  result?: any;
}

export interface SettingsState {
  apiKey: string;
  model: string;
  backendUrl: string;
}
