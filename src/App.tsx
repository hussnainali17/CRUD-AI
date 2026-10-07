import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  ListTodo,
  Send,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { SettingsSection } from './components/SettingsSection';
import { TaskCard } from './components/TaskCard';
import { ChatBubble } from './components/ChatBubble';
import { loadSettings } from './storage';
import { sendChatMessage, fetchTasks, updateTaskStatus, deleteTask } from './api';
import { ChatMessage, SettingsState, Task, TaskStatus } from './types';
import { DEFAULT_API_BASE_URL, MODEL_PRESETS } from './config';

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat');

  const [settings, setSettings] = useState<SettingsState>({
    apiKey: '',
    model: MODEL_PRESETS[0].value,
    backendUrl: DEFAULT_API_BASE_URL,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ilm',
      text: "Hello! I am Ilm, your AI task assistant. You can tell me to create, view, update, or delete tasks in plain English. For example: 'Add a task to submit CC assignment' or 'Show all my tasks'.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    loadAllTasks(stored.backendUrl);
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const loadAllTasks = async (url?: string) => {
    try {
      setTasksError(null);
      const data = await fetchTasks(url || settings.backendUrl);
      setTasks(data);
    } catch (err: any) {
      setTasksError(err.message || 'Failed to fetch tasks');
    }
  };

  const handleRefreshTasks = async () => {
    setIsRefreshing(true);
    await loadAllTasks();
    setIsRefreshing(false);
  };

  const handleNewThread = () => {
    setCurrentThreadId(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'ilm',
        text: 'Started a fresh conversation thread. What would you like to do?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputPrompt).trim();
    if (!text || isLoading) return;

    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      alert(
        "API Key Required: Please expand the 'Configuration & LLM API Key' section and enter your provider API key."
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        settings.backendUrl,
        text,
        settings.apiKey,
        settings.model,
        currentThreadId
      );

      if (response.thread_id) {
        setCurrentThreadId(response.thread_id);
      }

      const aiMessage: ChatMessage = {
        id: `ilm-${Date.now()}`,
        sender: 'ilm',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: response.status,
        missing: response.missing,
        crud: response.crud,
        result: response.result,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Automatically refresh tasks tab after create, update, or delete
      if (response.status === 'done' && ['create', 'update', 'delete'].includes(response.crud)) {
        loadAllTasks();
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ilm',
        text: `Error: ${err.message || 'An unexpected error occurred.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleTaskStatus = async (task: Task, nextStatus: TaskStatus) => {
    try {
      await updateTaskStatus(settings.backendUrl, task.id, nextStatus);
      await loadAllTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm(`Are you sure you want to delete task #${taskId}?`)) {
      try {
        await deleteTask(settings.backendUrl, taskId);
        await loadAllTasks();
      } catch (err: any) {
        alert(err.message || 'Failed to delete task');
      }
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.status === taskFilter;
  });

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <Sparkles className="brand-icon" size={24} />
          <div>
            <h1 className="brand-title">Ilm Assistant</h1>
            <span className="brand-subtitle">Natural-Language Task Agent</span>
          </div>
        </div>

        <div className="navbar-actions">
          {activeTab === 'chat' && (
            <button type="button" className="btn-secondary" onClick={handleNewThread}>
              <RotateCcw size={15} />
              <span>New Conversation</span>
            </button>
          )}

          <div className="tab-pill">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={16} />
              <span>Chat</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('tasks');
                loadAllTasks();
              }}
            >
              <ListTodo size={16} />
              <span>Tasks ({tasks.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* Collapsible Settings */}
          <SettingsSection settings={settings} onSettingsChange={setSettings} />

          {/* Chat Tab View */}
          {activeTab === 'chat' && (
            <div className="chat-card">
              <div className="messages-container">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    onSuggestionClick={(suggestion) => handleSendMessage(suggestion)}
                  />
                ))}
                {isLoading && (
                  <div className="message-row row-ilm">
                    <div className="avatar-ilm">
                      <Sparkles size={16} />
                    </div>
                    <div className="bubble bubble-ilm loading-bubble">
                      <Loader2 size={16} className="spinner" />
                      <span>Ilm is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="prompt-suggestions">
                <span className="suggestions-title">Try asking:</span>
                <button
                  type="button"
                  className="chip-suggestion"
                  onClick={() => handleSendMessage('Add a task to submit CC assignment')}
                >
                  &quot;Add a task to submit CC assignment&quot;
                </button>
                <button
                  type="button"
                  className="chip-suggestion"
                  onClick={() => handleSendMessage('Show all my tasks')}
                >
                  &quot;Show all my tasks&quot;
                </button>
                <button
                  type="button"
                  className="chip-suggestion"
                  onClick={() => handleSendMessage('Mark task 1 as done')}
                >
                  &quot;Mark task 1 as done&quot;
                </button>
              </div>

              {/* Chat Input Box */}
              <div className="chat-input-bar">
                <textarea
                  className="prompt-textarea"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Ilm in natural language (e.g. 'Add a task to submit CC assignment', 'due this Friday')... Press Enter to send"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="btn-send"
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isLoading}
                  title="Send message"
                >
                  {isLoading ? <Loader2 size={18} className="spinner" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Tasks Tab View */}
          {activeTab === 'tasks' && (
            <div className="tasks-container">
              {/* Tasks Subheader */}
              <div className="tasks-toolbar">
                <div className="filter-group">
                  {(['all', 'todo', 'in_progress', 'done'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`filter-btn ${taskFilter === filter ? 'active' : ''}`}
                      onClick={() => setTaskFilter(filter)}
                    >
                      {filter === 'all'
                        ? 'All'
                        : filter === 'in_progress'
                        ? 'In Progress'
                        : filter.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRefreshTasks}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={15} className={isRefreshing ? 'spinner' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Error Banner */}
              {tasksError && (
                <div className="alert-error">
                  <AlertCircle size={18} />
                  <span>{tasksError}</span>
                  <button type="button" className="btn-sm" onClick={() => loadAllTasks()}>
                    Retry
                  </button>
                </div>
              )}

              {/* Task Cards List */}
              {filteredTasks.length === 0 ? (
                <div className="empty-tasks">
                  <ListTodo size={48} className="text-muted" />
                  <h3>No tasks found</h3>
                  <p>Switch to the Chat tab to create a task using natural language!</p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setActiveTab('chat')}
                  >
                    Go to Chat
                  </button>
                </div>
              ) : (
                <div className="tasks-grid">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleStatus={handleToggleTaskStatus}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
export default App;
