import { useState, useRef, useEffect } from 'react';
import { FiSend, FiLoader } from 'react-icons/fi';

const ChatInput = ({ onSend, loading, suggestions = [] }) => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !loading) {
      onSend(message.trim());
      setMessage('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-700 text-primary-700 dark:text-primary-300 rounded-full
                         hover:bg-primary-100 dark:hover:bg-primary-600 transition-colors border border-primary-200 dark:border-primary-600
                         hover:border-primary-300 dark:hover:border-primary-500"
            >
              {suggestion.length > 50 ? `${suggestion.slice(0, 50)}...` : suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 bg-white dark:bg-primary-700 rounded-xl border border-primary-200 dark:border-primary-600
                        focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-100 dark:focus-within:ring-accent-500/20
                        transition-all p-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a compliance question..."
            disabled={loading}
            rows={1}
            className="flex-1 resize-none bg-transparent border-0 focus:ring-0 focus:outline-none
                       text-primary-800 dark:text-primary-200 placeholder-primary-400 text-sm py-2 px-2
                       disabled:opacity-50 max-h-[150px]"
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="flex items-center justify-center w-10 h-10 rounded-lg
                       bg-accent-500 text-white hover:bg-accent-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex-shrink-0"
          >
            {loading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Character hint */}
        <p className="text-xs text-primary-400 mt-1 px-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
};

export default ChatInput;
