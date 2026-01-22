import { FiArrowRight } from 'react-icons/fi';

const ArticleCard = ({ article, onClick }) => {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col border border-[#E2E8F0] shadow-md hover:shadow-lg hover:border-cta-500/30 group cursor-pointer transition-all duration-300"
      onClick={() => onClick(article)}
    >
      <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-500 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/30 to-transparent group-hover:from-cta-500/30 transition-colors duration-300" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-primary-500 font-mono uppercase font-bold">
          {article.tag}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-[#94A3B8] font-mono">{article.date}</span>
          <span className="text-xs text-[#CBD5E1]">•</span>
          <span className="text-xs text-[#94A3B8]">{article.readTime}</span>
        </div>
        <h3 className="text-xl font-bold text-primary-500 mb-3 group-hover:text-cta-500 transition-colors font-heading">
          {article.title}
        </h3>
        <p className="text-sm text-[#475569] mb-4 flex-1">{article.description}</p>
        <span className="text-sm text-cta-500 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          Read Article
          <FiArrowRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};

export default ArticleCard;
