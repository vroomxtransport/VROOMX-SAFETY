import { useState, useRef, useEffect } from 'react';
import {
  FiMessageCircle, FiSend, FiLoader, FiBook, FiUsers, FiClock,
  FiTruck, FiDroplet, FiShield, FiHelpCircle, FiChevronRight
} from 'react-icons/fi';
import ChatMessage from '../components/AIChat/ChatMessage';
import api from '../utils/api';

const TOPIC_CARDS = [
  {
    icon: FiUsers,
    title: 'Driver Qualifications',
    description: '49 CFR Part 391',
    questions: [
      'What documents are required in a Driver Qualification File?',
      'How often do I need to run MVRs on my drivers?',
      'What is required for a driver road test?'
    ]
  },
  {
    icon: FiDroplet,
    title: 'Drug & Alcohol Testing',
    description: '49 CFR Part 382',
    questions: [
      'What is the random drug testing rate for DOT?',
      'When is a post-accident drug test required?',
      'How long must drug test records be retained?'
    ]
  },
  {
    icon: FiClock,
    title: 'Hours of Service',
    description: '49 CFR Part 395',
    questions: [
      'What are the HOS rules for property-carrying drivers?',
      'How does the 34-hour restart work?',
      'What is the short-haul exemption?'
    ]
  },
  {
    icon: FiTruck,
    title: 'Vehicle Maintenance',
    description: '49 CFR Part 396',
    questions: [
      'How often are annual inspections required?',
      'What must be included in a DVIR?',
      'How long must maintenance records be kept?'
    ]
  },
  {
    icon: FiShield,
    title: 'CSA & SMS Scoring',
    description: 'Safety Measurement System',
    questions: [
      'How are CSA percentiles calculated?',
      'What are the BASIC intervention thresholds?',
      'How do I file a DataQ challenge?'
    ]
  },
  {
    icon: FiHelpCircle,
    title: 'General Compliance',
    description: 'FMCSA Regulations',
    questions: [
      'What triggers a DOT compliance review?',
      'How long must records be retained?',
      'What are the penalties for compliance violations?'
    ]
  }
];

const RegulationAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [expandedTopic, setExpandedTopic] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (question) => {
    const questionText = question || inputValue.trim();
    if (!questionText || loading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      content: questionText,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.post('/ai/regulation-query', { question: questionText });

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600
                          flex items-center justify-center text-white shadow-lg">
            <FiMessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Regulation Assistant</h1>
            <p className="text-primary-600 dark:text-zinc-300 font-medium">AI-powered FMCSA compliance help</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topic cards - left side */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-primary-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
            Quick Topics
          </h2>

          {TOPIC_CARDS.map((topic, index) => {
            const Icon = topic.icon;
            const isExpanded = expandedTopic === index;

            return (
              <div
                key={index}
                className={`bg-white dark:bg-zinc-800 rounded-xl border transition-all duration-300 cursor-pointer group ${
                  isExpanded
                    ? 'border-accent-400 dark:border-accent-500 shadow-lg shadow-accent-500/10 dark:shadow-accent-500/20'
                    : 'border-primary-200 dark:border-zinc-700 hover:border-accent-300 dark:hover:border-accent-500/50 hover:shadow-md hover:shadow-accent-500/5 dark:hover:shadow-accent-500/10 hover:-translate-y-0.5'
                }`}
              >
                <button
                  onClick={() => setExpandedTopic(isExpanded ? null : index)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isExpanded
                      ? 'bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 scale-110'
                      : 'bg-primary-100 dark:bg-zinc-700 text-primary-600 dark:text-zinc-300 group-hover:bg-accent-50 dark:group-hover:bg-accent-500/10 group-hover:text-accent-600 dark:group-hover:text-accent-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-800 dark:text-white group-hover:text-accent-700 dark:group-hover:text-accent-300 transition-colors">{topic.title}</h3>
                    <p className="text-sm text-primary-600 dark:text-zinc-400 font-medium">{topic.description}</p>
                  </div>
                  <FiChevronRight
                    className={`w-5 h-5 text-primary-400 dark:text-zinc-500 transition-all duration-300 group-hover:text-accent-500 dark:group-hover:text-accent-400 ${
                      isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 animate-fade-in">
                    {topic.questions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        disabled={loading}
                        className="w-full text-left text-sm p-3 rounded-lg text-primary-700 dark:text-zinc-300 font-medium
                                   bg-primary-50/50 dark:bg-zinc-700/50 border border-transparent
                                   hover:bg-accent-50 dark:hover:bg-accent-500/15 hover:text-accent-700 dark:hover:text-accent-300
                                   hover:border-accent-200 dark:hover:border-accent-500/30 hover:pl-4
                                   transition-all duration-200
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chat area - right side */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-primary-200 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-[700px]">
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-primary-100 dark:border-zinc-700 bg-primary-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  AI Assistant Online
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-primary-50/30 dark:bg-zinc-900/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-500/20 dark:to-accent-600/20
                                  flex items-center justify-center mb-4">
                    <FiBook className="w-8 h-8 text-accent-600 dark:text-accent-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-2">
                    Ask about FMCSA regulations
                  </h3>
                  <p className="text-primary-600 dark:text-zinc-400 max-w-md font-medium">
                    I can help with questions about driver qualifications, drug testing,
                    hours of service, vehicle maintenance, and CSA scoring.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => handleSend('What documents are required in a DQF?')}
                      disabled={loading}
                      className="text-sm px-5 py-2.5 bg-white dark:bg-zinc-700 border border-primary-200 dark:border-zinc-600 rounded-full
                                 text-primary-700 dark:text-zinc-200 font-medium
                                 hover:border-accent-400 dark:hover:border-accent-500 hover:text-accent-600 dark:hover:text-accent-400
                                 hover:shadow-md hover:shadow-accent-500/10 dark:hover:shadow-accent-500/20 hover:-translate-y-0.5
                                 transition-all duration-200 disabled:opacity-50"
                    >
                      DQF requirements
                    </button>
                    <button
                      onClick={() => handleSend('How do CSA percentiles work?')}
                      disabled={loading}
                      className="text-sm px-5 py-2.5 bg-white dark:bg-zinc-700 border border-primary-200 dark:border-zinc-600 rounded-full
                                 text-primary-700 dark:text-zinc-200 font-medium
                                 hover:border-accent-400 dark:hover:border-accent-500 hover:text-accent-600 dark:hover:text-accent-400
                                 hover:shadow-md hover:shadow-accent-500/10 dark:hover:shadow-accent-500/20 hover:-translate-y-0.5
                                 transition-all duration-200 disabled:opacity-50"
                    >
                      CSA scoring
                    </button>
                    <button
                      onClick={() => handleSend('What are the HOS rules?')}
                      disabled={loading}
                      className="text-sm px-5 py-2.5 bg-white dark:bg-zinc-700 border border-primary-200 dark:border-zinc-600 rounded-full
                                 text-primary-700 dark:text-zinc-200 font-medium
                                 hover:border-accent-400 dark:hover:border-accent-500 hover:text-accent-600 dark:hover:text-accent-400
                                 hover:shadow-md hover:shadow-accent-500/10 dark:hover:shadow-accent-500/20 hover:-translate-y-0.5
                                 transition-all duration-200 disabled:opacity-50"
                    >
                      Hours of Service
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                        <span className="w-2 h-2 bg-primary-400 dark:bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-primary-400 dark:bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-primary-400 dark:bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm">Researching regulations...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-primary-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a compliance question..."
                    disabled={loading}
                    rows={1}
                    className="w-full resize-none rounded-xl border border-primary-200 dark:border-zinc-600 px-4 py-3
                               focus:border-accent-400 dark:focus:border-accent-500 focus:ring-2 focus:ring-accent-100 dark:focus:ring-accent-500/20
                               bg-white dark:bg-zinc-700 text-primary-800 dark:text-white placeholder-primary-400 dark:placeholder-zinc-400 text-sm
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || loading}
                  className="flex items-center justify-center w-12 h-12 rounded-xl
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
              <p className="text-xs text-primary-500 dark:text-zinc-400 mt-2 px-1 font-medium">
                Press Enter to send. AI responses are for informational purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulationAssistant;
