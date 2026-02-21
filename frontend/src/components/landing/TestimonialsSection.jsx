import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiDollarSign,
  FiShield,
  FiTruck,
  FiArrowRight,
  FiXCircle,
  FiFileText,
  FiUsers,
} from "react-icons/fi";

// Animated counter that counts up from 0 to the target value
const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 1.5 }) => {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    const target = value;

    const animate = (now) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  // Reset animation when value changes (e.g. slider moves)
  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const target = value;
    const startValue = displayed;

    const animate = (now) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / 0.4, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(startValue + (target - startValue) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    // We intentionally only trigger this on value changes, not on displayed changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {displayed.toLocaleString()}
      {suffix}
    </span>
  );
};

const costItems = [
  {
    icon: FiXCircle,
    label: "1 Expired Medical Card",
    fine: 16340,
    source: "FMCSA civil penalty",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
  },
  {
    icon: FiTruck,
    label: "1 Driver Out-of-Service",
    fine: 1000,
    suffix: "/day",
    source: "Lost revenue per truck",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
  },
  {
    icon: FiFileText,
    label: "1 Failed Compliance Audit",
    fine: 7500,
    prefix: "$",
    source: "Average penalty + 48hrs management time",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
  },
];

const TestimonialsSection = () => {
  const [driverCount, setDriverCount] = useState(5);

  // Calculated values
  const annualRisk = Math.round(driverCount * 4600);
  const vroomxMonthlyCost = driverCount <= 1 ? 29 : driverCount <= 3 ? 79 : 149;
  const vroomxAnnualCost = vroomxMonthlyCost * 12;

  return (
    <section className="py-24 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <FiDollarSign className="w-4 h-4 text-cta-500" />
              <span className="text-sm font-medium text-gray-600">
                Compliance Cost Calculator
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-barlow-condensed font-extrabold text-gray-800 mb-4">
              The Real Cost of{" "}
              <span className="text-cta-500">Non-Compliance</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              FMCSA fines are not abstract. One missed document can cost more
              than a year of compliance software. See what's at stake for your
              fleet.
            </p>
          </motion.div>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Driver Input + Cost Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            {/* Driver Count Slider */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-barlow-condensed font-bold text-gray-800">
                    Your Fleet Size
                  </h3>
                  <p className="text-sm text-gray-500">
                    How many drivers do you manage?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={driverCount}
                  onChange={(e) => setDriverCount(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                  aria-label="Number of drivers"
                />
                <div className="min-w-[4rem] text-center">
                  <span className="text-2xl font-barlow-condensed font-extrabold text-primary-500">
                    {driverCount}
                  </span>
                  <span className="text-xs text-gray-400 block">
                    {driverCount === 1 ? "driver" : "drivers"}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Cards */}
            <div className="space-y-3">
              {costItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex items-center gap-4 bg-white rounded-xl border ${item.borderColor} p-4 shadow-sm`}
                >
                  <div
                    className={`w-10 h-10 ${item.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.source}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-barlow-condensed font-extrabold text-gray-800">
                      ${item.fine.toLocaleString()}
                    </span>
                    {item.suffix && (
                      <span className="text-sm text-gray-400">
                        {item.suffix}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              <p className="text-xs text-gray-400 mt-3 pl-1">
                Sources: FMCSA civil penalty schedule (49 CFR 386), industry
                averages for lost revenue and audit costs.
              </p>
            </div>
          </motion.div>

          {/* Right: Risk Summary + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Annual Risk Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-6">
                <FiAlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-barlow-condensed font-bold text-gray-800">
                  Your Annual Compliance Risk
                </h3>
              </div>

              <div className="text-center py-6 mb-6 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-red-600 font-medium mb-1">
                  Estimated exposure with {driverCount}{" "}
                  {driverCount === 1 ? "driver" : "drivers"}
                </p>
                <p className="text-5xl md:text-6xl font-barlow-condensed font-extrabold text-red-600">
                  <AnimatedCounter
                    value={annualRisk}
                    prefix="$"
                    duration={0.8}
                  />
                </p>
                <p className="text-sm text-red-400 mt-2">
                  per year in potential fines and lost revenue
                </p>
              </div>

              {/* Comparison */}
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FiShield className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-barlow-condensed font-bold text-emerald-800">
                    VroomX Protection
                  </h4>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-barlow-condensed font-extrabold text-emerald-700">
                    ${vroomxMonthlyCost}/mo
                  </span>
                  <span className="text-sm text-emerald-500">
                    (${vroomxAnnualCost.toLocaleString()}/yr)
                  </span>
                </div>
                <p className="text-sm text-emerald-600 mb-4">
                  vs{" "}
                  <span className="font-bold">
                    ${annualRisk.toLocaleString()}+
                  </span>{" "}
                  in potential compliance failures
                </p>

                {/* ROI bar */}
                <div className="relative h-4 bg-red-200 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${Math.max((vroomxAnnualCost / annualRisk) * 100, 2)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 font-semibold">
                    VroomX cost
                  </span>
                  <span className="text-red-500 font-semibold">
                    Compliance risk
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                to="/register"
                className="bg-cta-500 hover:bg-cta-600 px-10 py-4 rounded-full font-bold text-white text-lg inline-flex items-center gap-2 shadow-lg shadow-cta-500/30 transition-all hover:scale-105 w-full justify-center"
              >
                Protect My Fleet
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-gray-400 mt-3">
                7-day free trial. No credit card required.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
