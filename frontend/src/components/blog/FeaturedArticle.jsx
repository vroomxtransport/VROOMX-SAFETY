import { FiArrowRight } from 'react-icons/fi';

const FeaturedArticle = ({ article, onClick }) => {
  return (
    <div
      className="bg-white rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:border-cta-500/30 group relative cursor-pointer transition-all duration-300"
      onClick={() => onClick(article)}
    >
      <div className="grid md:grid-cols-2 gap-0">
        <div className="h-64 md:h-auto min-h-[300px] relative overflow-hidden">
          {article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/40 to-transparent group-hover:from-cta-500/30 transition-colors duration-500" />
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-[10px] uppercase tracking-wide">Featured</span>
            <span className="text-zinc-500 text-xs font-mono">{article.date}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-500 mb-4 leading-tight group-hover:text-cta-500 transition-colors font-heading">
            {article.title}
          </h2>
          <p className="text-zinc-600 mb-8 leading-relaxed">
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
