import { FiChevronDown } from 'react-icons/fi';
import useInView from '../../hooks/useInView';

const FAQSection = ({ faqData, openFaq, setOpenFaq }) => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [listRef, listInView] = useInView({ threshold: 0.1 });

  return (
    <section className="py-24 px-6 md:px-16 relative z-10 bg-white">
      <div className="max-w-3xl mx-auto">
        <div
          ref={headerRef}
          className={`text-center mb-12 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">// FAQ</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mt-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div ref={listRef} className="space-y-4">
          {faqData.map((faq, i) => (
            <div
              key={i}
              className={`bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-primary-500/30 transition-all duration-500 ${listInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: listInView ? `${i * 100}ms` : '0ms' }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-6 flex items-center justify-between text-left"
                aria-expanded={openFaq === i}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="font-bold text-primary-500 pr-4">{faq.question}</span>
                <FiChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <div
                id={`faq-answer-${i}`}
                className={`grid transition-all duration-300 ease-in-out ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-zinc-600 dark:text-zinc-200 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
