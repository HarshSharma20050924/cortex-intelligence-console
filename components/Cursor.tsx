
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCursor } from '../context/CursorContext';
import { useTheme } from '../context/ThemeContext';

export const Cursor: React.FC = () => {
  const { cursorType } = useCursor();
  const { theme } = useTheme();
  
  // Raw mouse position for instant response (Zero Latency)
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Smooth spring for the following ring
  const springConfig = { damping: 25, stiffness: 300, mass: 0.1 }; // Lighter mass for snappier feel
  const ringX = useSpring(mouseX, springConfig);
  const ringY = useSpring(mouseY, springConfig);

  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener('mousemove', moveMouse);
    return () => window.removeEventListener('mousemove', moveMouse);
  }, [mouseX, mouseY, isVisible]);

  if (!mounted || (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)) {
    return null;
  }

  // Ring variants
  const variants = {
    default: {
      height: 24,
      width: 24,
      borderWidth: '1px',
      opacity: 0.4,
      scale: 1,
    },
    button: {
      height: 48,
      width: 48,
      borderWidth: '1px',
      opacity: 1,
      scale: 1,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    text: {
      height: 24,
      width: 4, // Cursor bar shape
      borderWidth: '0px',
      opacity: 0.8,
      scale: 1,
      backgroundColor: theme === 'dark' ? '#fff' : '#000',
      borderRadius: '2px',
    }
  };

  const borderColor = theme === 'dark' ? '#a1a1aa' : '#52525b';

  return createPortal(
    <>
      {/* Primary Dot - Instant Follow - Z-Index 10001 to sit above Modal (9999) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10001] rounded-full"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: 6,
          height: 6,
          backgroundColor: theme === 'dark' ? '#fff' : '#000',
        }}
      />
      
      {/* Secondary Ring - Physics Follow - Z-Index 10000 */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10000] rounded-full flex items-center justify-center transition-colors duration-200"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          borderColor: borderColor,
        }}
        variants={variants}
        animate={cursorType}
        initial="default"
      />
    </>,
    document.body
  );
};
