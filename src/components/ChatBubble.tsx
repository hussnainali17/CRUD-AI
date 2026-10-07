import React from 'react';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
  onSuggestionClick?: (suggestion: string) => void;
}

export const ChatBubble: React.FC<Props> = ({ message, onSuggestionClick }) => {
  const isUser = message.sender === 'user';
  const isMissing = message.status === 'missing_fields';
  const isError = message.status === 'error';
  const isDone = message.status === 'done';

  return (
    <div className={`message-row ${isUser ? 'row-user' : 'row-ilm'}`}>
      {!isUser && (
        <div className="avatar-ilm">
          <Sparkles size={16} />
        </div>
      )}

      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-ilm'} ${isError ? 'bubble-error' : ''}`}>
        <p className="bubble-text">{message.text}</p>

        {/* Missing fields chips and helper */}
        {isMissing && message.missing && message.missing.length > 0 && (
          <div className="missing-box">
            <span className="missing-label">Missing required fields:</span>
            <div className="chip-row">
              {message.missing.map((field) => (
                <span key={field} className="chip-missing">
                  <AlertCircle size={12} />
                  <span>{field}</span>
                </span>
              ))}
            </div>
            <div className="missing-hint">
              <span>💡 Reply with: {message.missing.join(', ')}</span>
              {message.missing.includes('due_date') && onSuggestionClick && (
                <button
                  type="button"
                  className="suggestion-link"
                  onClick={() => onSuggestionClick('due this Friday')}
                >
                  (Click to use &apos;due this Friday&apos;)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Successful operation badge */}
        {isDone && message.crud && (
          <div className="done-badge">
            <CheckCircle size={14} className="text-green" />
            <span>{message.crud.toUpperCase()} SUCCESSFUL</span>
          </div>
        )}

        <span className="bubble-time">{message.timestamp}</span>
      </div>
    </div>
  );
};
