import { ClockFont, ClockTimeAnimation } from '../types';

export const getClockFontFamilyClass = (font?: ClockFont): string => {
  switch (font) {
    case 'mono-cyber':
      return 'font-mono tracking-widest font-bold';
    case 'serif-luxury':
      return 'font-serif tracking-normal italic font-medium';
    case 'digital-led':
      return 'font-mono font-bold tracking-widest text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]';
    case 'rounded-futuristic':
      return 'font-sans font-extrabold tracking-tight';
    case 'condensed-bold':
      return 'font-sans font-black tracking-tighter uppercase';
    case 'sans-ultralight':
    default:
      return 'font-sans font-light tracking-tight';
  }
};

export const getClockMotionVariants = (anim?: ClockTimeAnimation) => {
  switch (anim) {
    case 'slide-up':
      return {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -14 },
        transition: { duration: 0.28, ease: 'easeOut' },
      };
    case 'flip':
      return {
        initial: { opacity: 0, rotateX: 90, scale: 0.9 },
        animate: { opacity: 1, rotateX: 0, scale: 1 },
        exit: { opacity: 0, rotateX: -90, scale: 0.9 },
        transition: { duration: 0.35, ease: 'easeInOut' },
      };
    case 'scale-pop':
      return {
        initial: { opacity: 0, scale: 0.75 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.25 },
        transition: { duration: 0.25, ease: [0.175, 0.885, 0.32, 1.275] },
      };
    case 'blur-shift':
      return {
        initial: { opacity: 0, filter: 'blur(8px)', scale: 0.96 },
        animate: { opacity: 1, filter: 'blur(0px)', scale: 1 },
        exit: { opacity: 0, filter: 'blur(8px)', scale: 1.04 },
        transition: { duration: 0.3, ease: 'easeOut' },
      };
    case 'fade':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      };
  }
};
