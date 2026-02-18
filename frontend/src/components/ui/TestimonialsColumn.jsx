import { motion } from "motion/react";

const TestimonialsColumn = ({ testimonials, className, duration, reverse }) => {
  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: reverse ? "0%" : "-50%" }}
        initial={{ translateY: reverse ? "-50%" : "0%" }}
        transition={{
          duration: duration || 15,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...testimonials, ...testimonials].map((testimonial, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg"
          >
            {/* Stars */}
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, j) => (
                <svg
                  key={j}
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <p className="text-gray-600 leading-relaxed mb-4 text-sm">
              &ldquo;{testimonial.text}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="font-bold text-gray-800 text-sm">
                  {testimonial.name}
                </div>
                <div className="text-xs text-gray-500">{testimonial.role}</div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default TestimonialsColumn;
