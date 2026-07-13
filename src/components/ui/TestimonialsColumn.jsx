import React from 'react';
import { motion } from 'motion/react';
import { getInitials } from '../../utils/helpers';

// Auto-scrolling column of testimonial cards — content is duplicated once
// so the -50% translateY loop reads as a seamless, infinite scroll.
export const TestimonialsColumn = ({ className = '', testimonials, duration = 10 }) => {
  return (
    <div className={className}>
      <motion.div
        animate={{ y: '-50%' }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, name, role }, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white border shadow-lg max-w-xs w-full"
                style={{ borderColor: 'var(--mist)', boxShadow: '0 20px 40px -20px rgba(27,176,206,0.18)' }}
              >
                <p className="text-[--ink-soft] text-sm leading-relaxed">{text}</p>
                <div className="flex items-center gap-3 mt-5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1bb0ce, #0f6f82)' }}
                  >
                    {getInitials(name)}
                  </div>
                  <div className="flex flex-col">
                    <div className="font-semibold tracking-tight leading-5 text-[#0a1628]">{name}</div>
                    <div className="leading-5 text-[--ink-soft] opacity-70 text-sm tracking-tight">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))]}
      </motion.div>
    </div>
  );
};
