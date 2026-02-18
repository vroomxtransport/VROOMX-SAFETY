import { motion } from "motion/react";
import TestimonialsColumn from "../ui/TestimonialsColumn";

const testimonials = [
  {
    text: "We were one violation away from FMCSA intervention. After 90 days with VroomX, we dropped 23 CSA points and passed a surprise DOT inspection with flying colors.",
    name: "Mike Rodriguez",
    role: "Fleet Owner - 12 Trucks",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "I used to spend 15+ hours a week on compliance paperwork. VroomX automated everything from DQ files to violation tracking. Now I spend that time actually growing my business.",
    name: "Sarah Johnson",
    role: "Safety Manager - 45 Trucks",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "The AI compliance assistant is incredible. I asked about a complex HOS regulation and got a clear, accurate answer in seconds. It's like having a compliance expert on call 24/7.",
    name: "David Thompson",
    role: "Owner-Operator",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "DataQ challenge filing used to take us days of research. VroomX's AI analyzes violations and generates challenge recommendations automatically. We've successfully overturned 12 violations.",
    name: "Angela Martinez",
    role: "Compliance Officer - 80 Trucks",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "Real-time FMCSA sync means I never get blindsided by a new violation. The moment something hits our record, I get an alert and can respond immediately.",
    name: "James Walker",
    role: "Operations Director - 35 Trucks",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "As a dispatcher, I need to know driver compliance status at a glance. The dashboard gives me everything - medical card expirations, CDL renewals, drug test schedules - all in one place.",
    name: "Lisa Chen",
    role: "Dispatcher - 60 Trucks",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "We went from a 'Conditional' FMCSA rating to 'Satisfactory' in under 6 months. VroomX identified every gap in our safety program and helped us close them systematically.",
    name: "Robert Davis",
    role: "Fleet Owner - 28 Trucks",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "The vehicle maintenance tracking alone saved us from two potential OOS violations. Automated reminders for inspections and service intervals keep our fleet road-ready.",
    name: "Patricia Nguyen",
    role: "Safety Manager - 22 Trucks",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  },
  {
    text: "I'm an owner-operator running solo. VroomX gives me the same compliance tools the big fleets have. My compliance score went from 62 to 94 in three months.",
    name: "Marcus Johnson",
    role: "Owner-Operator",
    image:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsSection = () => {
  return (
    <section className="py-24 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="text-sm font-medium text-gray-600">
                Testimonials
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-gray-800 mb-4">
              Trusted by <span className="text-cta-500">500+</span> Carriers
              Nationwide
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See why fleet owners and safety managers choose VroomX to protect
              their authority and stay ahead of FMCSA compliance.
            </p>
          </motion.div>
        </div>

        {/* Scrolling Columns */}
        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[750px] overflow-hidden">
          <TestimonialsColumn
            testimonials={firstColumn}
            duration={15}
            className="hidden lg:block"
          />
          <TestimonialsColumn
            testimonials={secondColumn}
            duration={19}
            reverse
            className="hidden md:block"
          />
          <TestimonialsColumn testimonials={thirdColumn} duration={17} />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
