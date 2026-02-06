import { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import { ArticleModal, ArticleCard, FeaturedArticle, BlogFooter } from '../components/blog';
import { categories, featuredArticle, articles } from '../data/blogPosts';
import useForceLightMode from '../hooks/useForceLightMode';

const Blog = () => {
  useForceLightMode();

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedArticle]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedArticle(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const filteredArticles = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>

      {/* Navigation */}
      <PublicHeader activePage="blog" />

      {/* Blog Hero */}
      <section className="relative z-10 pt-48 pb-12 px-6 md:px-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-xs uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cta-500 animate-pulse"></span>
            VroomX Safety Blog
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-primary-500 mb-6 font-heading">
            Compliance <span className="text-cta-500">Insights.</span>
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Expert advice on FMCSA regulations, audit preparation, and fleet safety trends.
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="relative z-10 py-12 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 border-b border-[#E2E8F0] pb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-cta-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] font-bold'
                    : 'bg-white border border-[#E2E8F0] hover:border-cta-500/50 text-zinc-600 hover:text-primary-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Featured Article */}
          <div className="mb-16">
            <FeaturedArticle
              article={featuredArticle}
              onClick={setSelectedArticle}
            />
          </div>

          {/* Article Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={setSelectedArticle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer Sections */}
      <BlogFooter />

      {/* Article Modal */}
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
};

export default Blog;
