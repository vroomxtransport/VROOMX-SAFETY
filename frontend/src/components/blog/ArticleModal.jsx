import { Link } from 'react-router-dom';
import { FiX, FiClock, FiArrowRight } from 'react-icons/fi';

const ArticleModal = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-primary-500/20 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl my-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:text-primary-500 hover:bg-[#E2E8F0] transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Article Header */}
        <div className="p-8 md:p-12 border-b border-[#E2E8F0]">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-[10px] uppercase tracking-wide">
              {article.tag}
            </span>
            <span className="flex items-center gap-2 text-[#94A3B8] text-sm">
              <FiClock className="w-4 h-4" />
              {article.readTime}
            </span>
            <span className="text-[#94A3B8] text-sm font-mono">{article.date}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-500 mb-4 font-heading leading-tight">
            {article.title}
          </h1>
          <p className="text-lg text-[#475569]">{article.description}</p>
        </div>

        {/* Article Content */}
        <div
          className="p-8 md:p-12 prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Article Footer */}
        <div className="p-8 md:p-12 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[#475569] mb-2">Want to stay compliant?</p>
              <p className="text-primary-500 font-medium">Start your free trial of VroomX Safety today.</p>
            </div>
            <Link
              to="/register"
              className="btn-glow px-8 py-3 rounded-lg font-bold text-white text-sm inline-flex items-center gap-2"
              onClick={onClose}
            >
              Get Started Free
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
