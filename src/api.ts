/**
 * API client for interacting with the Ilm FastAPI backend from Web.
 */

import { ChatResponse, Task, TaskStatus } from "./types";
import { sanitizeApiKey, sanitizeModel } from "./storage";

function sanitizeUrl(baseUrl: string): string {
  let url = baseUrl.trim();
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `http://${url}`;
  }
  return url;
}

export async function sendChatMessage(
  baseUrl: string,
  prompt: string,
  apiKey: string,
  model: string,
  threadId?: string | null
): Promise<ChatResponse> {
  const root = sanitizeUrl(baseUrl);
  const endpoint = `${root}/chat`;

  const cleanedKey = sanitizeApiKey(apiKey);
  const cleanedModel = sanitizeModel(model);

  const payload: Record<string, any> = {
    prompt: prompt.trim(),
    api_key: cleanedKey,
    model: cleanedModel,
  };
  if (threadId) {
    payload.thread_id = threadId;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errDetail = `Server responded with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use default status message
      }
      throw new Error(errDetail);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. The LLM took too long to reply.");
    }
    const message = error.message || "Network error";
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      throw new Error(
        `Unable to reach backend at ${root}. Please ensure the FastAPI server is running on http://localhost:8000.`
      );
    }
    throw error;
  }
}

export async function testApiKey(
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanedKey = sanitizeApiKey(apiKey);
    const cleanedModel = sanitizeModel(model);
    if (!cleanedKey) {
      return { success: false, message: "API key cannot be empty." };
    }
    const res = await sendChatMessage(baseUrl, "Show all tasks", cleanedKey, cleanedModel);
    if (res.status === "error") {
      return { success: false, message: res.message };
    }
    return { success: true, message: `Connected! ${cleanedModel} responded successfully.` };
  } catch (err: any) {
    return { success: false, message: err.message || "Connection failed." };
  }
}

export async function fetchTasks(baseUrl: string): Promise<Task[]> {
  const root = sanitizeUrl(baseUrl);
  const endpoint = `${root}/tasks`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load tasks (status ${response.status})`);
    }

    const data: Task[] = await response.json();
    return data;
  } catch (error: any) {
    const message = error.message || "Network error";
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      throw new Error(`Cannot connect to backend at ${root}. Ensure server is running.`);
    }
    throw error;
  }
}

export async function updateTaskStatus(baseUrl: string, taskId: number, newStatus: TaskStatus): Promise<Task> {
  const root = sanitizeUrl(baseUrl);
  const endpoint = `${root}/tasks/${taskId}`;

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task ${taskId} (status ${response.status})`);
  }

  return await response.json();
}

export async function deleteTask(baseUrl: string, taskId: number): Promise<void> {
  const root = sanitizeUrl(baseUrl);
  const endpoint = `${root}/tasks/${taskId}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete task ${taskId} (status ${response.status})`);
  }
}
