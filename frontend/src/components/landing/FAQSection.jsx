import { FiChevronDown } from 'react-icons/fi';

const FAQSection = ({ faqData, openFaq, setOpenFaq }) => {
  return (
    <section className="py-24 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">// FAQ</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mt-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-primary-500/30 transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <span className="font-bold text-primary-500 pr-4">{faq.question}</span>
                <FiChevronDown className={`w-5 h-5 text-[#475569] transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-[#475569] leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
