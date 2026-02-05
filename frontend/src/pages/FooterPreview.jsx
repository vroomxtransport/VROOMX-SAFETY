import { useState } from 'react';
import FooterDesign1 from '../components/landing/footer-mockups/FooterDesign1';
import FooterDesign2 from '../components/landing/footer-mockups/FooterDesign2';
import FooterDesign3 from '../components/landing/footer-mockups/FooterDesign3';
import FooterDesign4 from '../components/landing/footer-mockups/FooterDesign4';

const designs = [
  { id: 1, name: 'Corporate Trust', description: 'Dark navy gradient, newsletter signup, trust badges, social icons — premium authority feel', Component: FooterDesign1 },
  { id: 2, name: 'Modern Minimal', description: 'Light white background, centered layout, horizontal links with dot separators — Apple-inspired clean', Component: FooterDesign2 },
  { id: 3, name: 'Bold CTA', description: 'Split design: orange CTA banner on top + navy footer below — conversion-focused', Component: FooterDesign3 },
  { id: 4, name: 'Glass Card', description: 'Glassmorphism floating card with decorative orbs — matching the features section style', Component: FooterDesign4 },
];

const FooterPreview = () => {
  const [activeDesign, setActiveDesign] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-heading font-bold text-gray-800">Footer Design Preview</h1>
          <p className="text-gray-500 text-sm mt-1">Click a design card or scroll down to see all 4 mockups</p>
        </div>
        {/* Quick nav pills */}
        <div className="max-w-7xl mx-auto px-6 pb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => { setActiveDesign(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeDesign === null ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Show All
          </button>
          {designs.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setActiveDesign(d.id);
                document.getElementById(`design-${d.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeDesign === d.id ? 'bg-cta-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              #{d.id} — {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Design Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {designs.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setActiveDesign(d.id);
                document.getElementById(`design-${d.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${activeDesign === d.id ? 'border-cta-500 bg-cta-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                  {d.id}
                </span>
                <h3 className="text-lg font-bold text-gray-800">{d.name}</h3>
              </div>
              <p className="text-gray-500 text-sm">{d.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Rendered Footers */}
      {designs.filter(d => activeDesign === null || activeDesign === d.id).map((d) => (
        <div key={d.id} id={`design-${d.id}`} className="mb-16">
          {/* Label */}
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-cta-500 to-cta-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">
                {d.id}
              </span>
              <div>
                <h2 className="text-xl font-heading font-bold text-gray-800">Design {d.id}: {d.name}</h2>
                <p className="text-gray-400 text-sm">{d.description}</p>
              </div>
            </div>
          </div>
          {/* Footer render */}
          <d.Component />
        </div>
      ))}
    </div>
  );
};

export default FooterPreview;
