import { FiArrowRight } from 'react-icons/fi';

const FeaturedArticle = ({ article, onClick }) => {
  return (
    <div
      className="bg-white rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:border-cta-500/30 group relative cursor-pointer transition-all duration-300"
      onClick={() => onClick(article)}
    >
      <div className="grid md:grid-cols-2 gap-0">
        <div className="h-64 md:h-auto bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/40 to-primary-400/40 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-[10px] uppercase tracking-wide">Featured</span>
            <span className="text-zinc-400 dark:text-zinc-400 text-xs font-mono">{article.date}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-500 mb-4 leading-tight group-hover:text-cta-500 transition-colors font-heading">
            {article.title}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 mb-8 leading-relaxed">
            {article.description}
          </p>
          <span className="inline-flex items-center gap-2 text-cta-500 font-bold group-hover:gap-3 transition-all">
            Read Full Article
            <FiArrowRight className="w-5 h-5" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeaturedArticle;
