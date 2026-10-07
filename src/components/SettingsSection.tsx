import React, { useState } from 'react';
import {
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
} from 'lucide-react';
import { SettingsState } from '../types';
import { MODEL_PRESETS, DEFAULT_API_BASE_URL } from '../config';
import { saveSettings, sanitizeApiKey, sanitizeModel } from '../storage';
import { testApiKey } from '../api';

interface Props {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

export const SettingsSection: React.FC<Props> = ({ settings, onSettingsChange }) => {
  const hasKey = Boolean(settings.apiKey && settings.apiKey.trim().length > 0);
  const [isOpen, setIsOpen] = useState(!hasKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Key testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFieldChange = (field: keyof SettingsState, value: string) => {
    let nextValue = value;
    if (field === 'model') {
      nextValue = sanitizeModel(value);
    } else if (field === 'apiKey') {
      nextValue = sanitizeApiKey(value);
    }
    const updated = { ...settings, [field]: nextValue };
    onSettingsChange(updated);
    saveSettings(updated);
    setTestResult(null);
  };

  const handleManualSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestKey = async () => {
    if (!settings.apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const result = await testApiKey(settings.backendUrl, settings.apiKey, settings.model);
    setIsTesting(false);
    setTestResult(result);
  };

  return (
    <div className="settings-card">
      <button
        type="button"
        className="settings-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="settings-header-left">
          <Settings size={18} className="text-blue" />
          <span className="settings-title">Configuration & LLM API Key</span>
          <span className={`badge ${hasKey ? 'badge-success' : 'badge-warning'}`}>
            {hasKey ? 'Key Configured' : 'Key Required'}
          </span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="settings-body">
          {/* Backend URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="backendUrl">Backend API Base URL</label>
            <div className="input-group">
              <input
                id="backendUrl"
                type="text"
                className="form-input"
                value={settings.backendUrl}
                onChange={(e) => handleFieldChange('backendUrl', e.target.value)}
                placeholder="https://choosy-commute-decent.ngrok-free.dev"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleFieldChange('backendUrl', DEFAULT_API_BASE_URL)}
                title="Reset to default"
              >
                <RotateCcw size={14} />
                <span>Default</span>
              </button>
            </div>
            <p className="form-hint">Backend URL: <code>https://choosy-commute-decent.ngrok-free.dev</code></p>
          </div>

          {/* Model Presets & Input */}
          <div className="form-group">
            <label className="form-label">LLM Model (LiteLLM Format)</label>
            <div className="preset-buttons">
              {MODEL_PRESETS.map((preset) => {
                const isSelected = settings.model === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    className={`preset-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleFieldChange('model', preset.value)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              className="form-input"
              value={settings.model}
              onChange={(e) => handleFieldChange('model', e.target.value)}
              placeholder="gemini/gemini-3.5-flash-lite, openai/gpt-4o-mini, etc."
            />
            <p className="form-hint">
              Format: <code>provider/model-name</code>. Google Gemini uses <code>gemini/gemini-3.5-flash-lite</code>.
            </p>
          </div>

          {/* API Key */}
          <div className="form-group">
            <label className="form-label" htmlFor="apiKey">Provider API Key (Gemini, Grok/xAI, OpenAI)</label>
            <div className="input-group">
              <input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                className="form-input"
                value={settings.apiKey}
                onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                placeholder="Paste your Gemini or OpenAI API Key here"
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="form-hint">
              Stored securely in browser localStorage and sent per-request. Auto-saved immediately.
            </p>
          </div>

          {/* Test connection alert */}
          {testResult && (
            <div className={testResult.success ? 'alert-success' : 'alert-error'}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="settings-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleTestKey}
              disabled={isTesting || !hasKey}
            >
              {isTesting ? <Loader2 size={15} className="spinner" /> : <Zap size={15} />}
              <span>{isTesting ? 'Testing connection...' : 'Test API Key'}</span>
            </button>

            <button type="button" className="btn-primary" onClick={handleManualSave}>
              <Save size={16} />
              <span>{saved ? 'Saved!' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
