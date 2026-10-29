'use client';

import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to bright mode' : 'Switch to dark mode'}
      title={isDark ? 'Bright mode' : 'Dark mode'}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full',
        'border border-white/10 bg-white/5 backdrop-blur-sm',
        'text-white/70 transition-colors hover:text-white hover:border-white/25',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/60',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.7 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-cyan-300" />
          ) : (
            <Sun className="h-4 w-4 text-cyan-600" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
