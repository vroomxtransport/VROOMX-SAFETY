import { useParams, Navigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { FiClock, FiArrowLeft, FiArrowRight, FiChevronRight } from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { BlogFooter } from '../components/blog';
import SEO from '../components/SEO';
import useForceLightMode from '../hooks/useForceLightMode';
import { featuredArticle, articles } from '../data/blogPosts';

// SECURITY: Configure DOMPurify with strict settings to minimize XSS risk
// Reused from ArticleModal.jsx with div/span added for styled article content
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 's',
    'a', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'figure', 'figcaption',
    'div', 'span'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'class',
    'loading', 'width', 'height'
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ADD_ATTR: ['target'],
  ADD_TAGS: [],
};

// Hook to add rel="noopener noreferrer" to external links, keep internal links in-page
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    if (href.startsWith('/') || href.startsWith('https://vroomxsafety.com')) {
      node.removeAttribute('target');
      node.removeAttribute('rel');
    } else {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }
});

const allPosts = [featuredArticle, ...articles];

const ArticlePage = () => {
  useForceLightMode();
  const { slug } = useParams();

  const postIndex = allPosts.findIndex(p => p.slug === slug);
  if (postIndex === -1) return <Navigate to="/blog" replace />;

  const post = allPosts[postIndex];
  const prevPost = postIndex > 0 ? allPosts[postIndex - 1] : null;
  const nextPost = postIndex < allPosts.length - 1 ? allPosts[postIndex + 1] : null;

  // Related articles: same category, exclude current, max 3
  const related = allPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>

      <PublicHeader activePage="blog" />

      <SEO
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        image={post.image}
        type="article"
        article={{ isoDate: post.isoDate, lastUpdatedIso: post.lastUpdatedIso }}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />

      <article className="relative z-10 pt-40 pb-12 px-6 md:px-16">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-zinc-500">
              <li><Link to="/" className="hover:text-cta-500 transition-colors">Home</Link></li>
              <li><FiChevronRight className="w-3 h-3" /></li>
              <li><Link to="/blog" className="hover:text-cta-500 transition-colors">Blog</Link></li>
              <li><FiChevronRight className="w-3 h-3" /></li>
              <li className="text-primary-500 font-medium truncate max-w-[300px]">{post.title}</li>
            </ol>
          </nav>

          {/* Hero Image */}
          {post.image && (
            <div className="h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
                width="800"
                height="600"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-[10px] uppercase tracking-wide">
                {post.tag}
              </span>
              <time dateTime={post.isoDate} className="text-zinc-500 text-sm font-mono">
                {post.date}
              </time>
              {post.lastUpdated && (
                <span className="text-zinc-400 text-sm">
                  · Updated {post.lastUpdated}
                </span>
              )}
              <span className="flex items-center gap-1 text-zinc-500 text-sm">
                <FiClock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-primary-500 mb-4 font-heading leading-tight">
              {post.title}
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed">{post.description}</p>
          </header>

          {/* Article Content - SECURITY: All HTML sanitized via DOMPurify with strict whitelist */}
          <div
            className="prose prose-slate max-w-none mb-16"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, sanitizeConfig) }}
          />

          {/* Prev/Next Navigation */}
          <nav className="flex flex-col sm:flex-row gap-4 mb-16 border-t border-[#E2E8F0] pt-8">
            {prevPost ? (
              <Link
                to={`/blog/${prevPost.slug}`}
                className="flex-1 group p-4 rounded-xl border border-[#E2E8F0] hover:border-cta-500/30 transition-colors"
              >
                <span className="text-xs text-zinc-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <FiArrowLeft className="w-3 h-3" /> Previous
                </span>
                <span className="text-primary-500 font-medium group-hover:text-cta-500 transition-colors line-clamp-1">
                  {prevPost.title}
                </span>
              </Link>
            ) : <div className="flex-1" />}
            {nextPost ? (
              <Link
                to={`/blog/${nextPost.slug}`}
                className="flex-1 group p-4 rounded-xl border border-[#E2E8F0] hover:border-cta-500/30 transition-colors text-right"
              >
                <span className="text-xs text-zinc-400 uppercase tracking-wide flex items-center justify-end gap-1 mb-1">
                  Next <FiArrowRight className="w-3 h-3" />
                </span>
                <span className="text-primary-500 font-medium group-hover:text-cta-500 transition-colors line-clamp-1">
                  {nextPost.title}
                </span>
              </Link>
            ) : <div className="flex-1" />}
          </nav>

          {/* Related Articles */}
          {related.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-primary-500 mb-6 font-heading">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map(r => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.slug}`}
                    className="group rounded-xl overflow-hidden border border-[#E2E8F0] hover:border-cta-500/30 hover:shadow-md transition-all"
                  >
                    {r.image && (
                      <div className="h-36 overflow-hidden">
                        <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width="400" height="300" />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="text-xs text-zinc-500 font-mono">{r.date}</span>
                      <h3 className="text-sm font-bold text-primary-500 group-hover:text-cta-500 transition-colors mt-1 line-clamp-2">{r.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Contextual CTA based on article category */}
          <section className="bg-primary-500 rounded-2xl p-8 md:p-12 text-center">
            {post.category === 'case-studies' ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-heading">Challenge Your Violations with AI</h2>
                <p className="text-white/80 mb-6 max-w-xl mx-auto">VroomX AI analyzes your violations and generates DataQ challenge letters automatically. Start saving on fines today.</p>
              </>
            ) : post.category === 'safety' ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-heading">Check Your CSA Score for Free</h2>
                <p className="text-white/80 mb-6 max-w-xl mx-auto">See all 7 BASIC scores instantly with AI-powered analysis and improvement recommendations. No signup required.</p>
                <Link
                  to="/csa-checker"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-500 font-bold rounded-lg transition-colors hover:bg-gray-100 mb-4"
                >
                  Free CSA Score Check
                  <FiArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-white/60 text-sm mb-4">or</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-heading">Stay Compliant, Stay Ahead</h2>
                <p className="text-white/80 mb-6 max-w-xl mx-auto">Track CSA scores, manage DQF files, catch expiring documents, and get AI-powered compliance help — all in one dashboard.</p>
              </>
            )}
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-cta-500 hover:bg-cta-600 text-white font-bold rounded-lg transition-colors"
            >
              Protect My Fleet
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </article>

      <BlogFooter />
    </div>
  );
};

export default ArticlePage;
