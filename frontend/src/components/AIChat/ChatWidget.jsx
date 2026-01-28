import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import api from '../../utils/api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch suggested questions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/ai/suggested-questions');
        if (response.data.success) {
          setSuggestions(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    fetchSuggestions();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message when chat opens (once per session)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: `Welcome back! I'm your VroomX Safety Compliance Assistant. I can help you with questions about:

- **Driver Qualifications** (49 CFR Part 391)
- **Drug & Alcohol Testing** (49 CFR Part 382)
- **Hours of Service** (49 CFR Part 395)
- **Vehicle Maintenance** (49 CFR Part 396)
- **CSA/SMS Scoring**
- **DataQ Challenges**

How can I help you today?`,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async (question) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      content: question,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.post('/ai/regulation-query', { question });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          content: response.data.data.answer,
          isUser: false,
          timestamp: new Date(),
          cfrCitations: response.data.data.cfrCitations,
          actionItems: response.data.data.actionItems
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        content: error.response?.data?.error || 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-accent-500 to-accent-600
                     text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50
                     flex items-center justify-center"
        >
          <FiMessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-primary-800 rounded-2xl shadow-2xl border border-primary-200 dark:border-primary-700
                      flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14'
              : 'bottom-6 right-6 w-96 h-[600px] max-h-[80vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-800 to-primary-900 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <FiMessageCircle className="w-4 h-4 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Compliance Assistant</h3>
                <p className="text-xs text-primary-300">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMinimized ? (
                  <FiMaximize2 className="w-4 h-4" />
                ) : (
                  <FiMinimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-primary-50/50 dark:bg-primary-900/50">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isUser={message.isUser}
                  />
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2 text-primary-500 dark:text-primary-400">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-800">
                <ChatInput
                  onSend={handleSend}
                  loading={loading}
                  suggestions={messages.length <= 1 ? suggestions : []}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
