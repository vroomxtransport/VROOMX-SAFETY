import { FiUser, FiCpu, FiCopy, FiCheck } from 'react-icons/fi';
import { useState } from 'react';

const ChatMessage = ({ message, isUser }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Turn URLs and **bold** into React elements
  const linkify = (text) => {
    const parts = text.split(/(https?:\/\/[^\s),]+|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.match(/^https?:\/\//)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
             className="text-accent-600 dark:text-accent-400 underline hover:text-accent-700 dark:hover:text-accent-300 break-all">
            {part}
          </a>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-zinc-800 dark:text-zinc-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Format markdown-like content
  const formatContent = (content) => {
    if (!content) return null;

    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((para, i) => {
      // Check for headers (##)
      if (para.startsWith('## ')) {
        return (
          <h3 key={i} className="font-semibold text-zinc-900 dark:text-zinc-100 mt-3 mb-2">
            {linkify(para.replace('## ', ''))}
          </h3>
        );
      }

      // Check for bold headers (**)
      if (para.startsWith('**') && para.includes('**:')) {
        const match = para.match(/\*\*(.+?)\*\*:?\s*([\s\S]*)/);
        if (match) {
          return (
            <div key={i} className="mt-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{match[1]}:</span>
              <span className="text-zinc-700 dark:text-zinc-300"> {linkify(match[2])}</span>
            </div>
          );
        }
      }

      // Check for bullet lists
      if (para.includes('\n- ') || para.startsWith('- ')) {
        const items = para.split('\n').filter(line => line.startsWith('- '));
        return (
          <ul key={i} className="list-disc list-inside space-y-1 mt-2 text-zinc-700 dark:text-zinc-300">
            {items.map((item, j) => (
              <li key={j}>{linkify(item.replace(/^- /, ''))}</li>
            ))}
          </ul>
        );
      }

      // Check for numbered lists
      if (/^\d+\.\s/.test(para)) {
        const items = para.split('\n').filter(line => /^\d+\.\s/.test(line));
        return (
          <ol key={i} className="list-decimal list-inside space-y-1 mt-2 text-zinc-700 dark:text-zinc-300">
            {items.map((item, j) => (
              <li key={j}>{linkify(item.replace(/^\d+\.\s/, ''))}</li>
            ))}
          </ol>
        );
      }

      // Regular paragraph
      return (
        <p key={i} className="text-zinc-700 dark:text-zinc-300 mt-2 first:mt-0">
          {linkify(para)}
        </p>
      );
    });
  };

  // Extract CFR citations for highlighting
  const highlightCitations = (content) => {
    if (!content) return content;
    const cfrPattern = /(49\s*CFR\s*[§Part]*\s*[\d]+(?:\.[\d]+)?(?:\([a-z0-9]+\))*)/gi;
    return content.replace(cfrPattern, '<span class="font-mono text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/20 px-1 rounded">$1</span>');
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-gradient-to-br from-accent-500 to-accent-600 text-white'
        }`}
      >
        {isUser ? <FiUser className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={`flex-1 max-w-[85%] ${
          isUser ? 'text-right' : ''
        }`}
      >
        <div
          className={`inline-block text-left rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-primary-700 border border-primary-200 dark:border-primary-600 rounded-tl-sm shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="text-white">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              {formatContent(message.content)}
            </div>
          )}
        </div>

        {/* Actions for AI responses */}
        {!isUser && (
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <FiCheck className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <FiCopy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>

            {/* Show CFR citations if present */}
            {message.cfrCitations && message.cfrCitations.length > 0 && (
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                | {message.cfrCitations.length} CFR reference{message.cfrCitations.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-zinc-600 dark:text-zinc-300 mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
