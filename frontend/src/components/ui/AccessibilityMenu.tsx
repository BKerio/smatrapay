import { useState, useEffect } from 'react';
import { useAccessibility } from '@/components/ui/AccessibilityContext';
import { useTheme } from '@/components/theme-provider';
import { 
  Accessibility, 
  RotateCcw, 
  X, 
  Type, 
  Link as LinkIcon, 
  ArrowUpDown, 
  ArrowLeftRight,
  Moon,
  Sun,
  Contrast,
  Droplet,
  MousePointer2,
  Eye,
  PauseCircle,
  Languages,
  Volume2,
  Mic,
  Keyboard,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const { state, dispatch, reset } = useAccessibility();
  const { theme, setTheme } = useTheme();
  
  // Reading mask state
  const [maskY, setMaskY] = useState(0);

  useEffect(() => {
    if (state.readingMask) {
      const handleMouseMove = (e: MouseEvent) => {
        setMaskY(e.clientY);
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [state.readingMask]);

  // Read page TTS
  const [isReading, setIsReading] = useState(false);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const toggleReadPage = () => {
    if (!synth) return;
    if (isReading) {
      synth.cancel();
      setIsReading(false);
    } else {
      const text = document.body.innerText;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsReading(false);
      synth.speak(utterance);
      setIsReading(true);
    }
  };

  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isOpen) setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isShortcutsOpen]);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const FeatureButton = ({ 
    active, 
    onClick, 
    icon: Icon, 
    label 
  }: { 
    active: boolean, 
    onClick: () => void, 
    icon: any, 
    label: string 
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        active 
          ? 'bg-[#0A1F44]/5 border-[#0A1F44] text-[#0A1F44] dark:bg-[#0A1F44]/20 dark:border-blue-400 dark:text-blue-300' 
          : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-[#0A1F44] dark:text-blue-300' : 'text-slate-400'}`} />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed z-[100] bottom-6 right-6 p-4 bg-[#0A1F44] text-white rounded-full shadow-2xl hover:bg-[#081b3b] transition-all hover:scale-110"
          aria-label="Open Accessibility Menu"
        >
          <Accessibility className="w-7 h-7" />
        </motion.button>
      )}

      {/* Reading Mask Overlay */}
      {state.readingMask && (
        <div 
          className="fixed inset-0 z-[999] pointer-events-none"
          style={{
            background: `
              linear-gradient(to bottom, 
                rgba(0,0,0,0.6) 0%, 
                rgba(0,0,0,0.6) ${maskY - 60}px, 
                transparent ${maskY - 60}px, 
                transparent ${maskY + 60}px, 
                rgba(0,0,0,0.6) ${maskY + 60}px, 
                rgba(0,0,0,0.6) 100%
              )
            `
          }}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed z-[1000] top-0 right-0 h-full w-[360px] bg-white dark:bg-slate-900 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-[#0A1F44] dark:text-blue-400">
                <div className="w-8 h-8 rounded-lg bg-[#0A1F44] flex items-center justify-center text-white">
                  <Accessibility className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Accessibility</h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { reset(); setTheme('light'); synth?.cancel(); setIsReading(false); }}
                  className="p-2 text-slate-400 hover:text-[#0A1F44] dark:hover:text-blue-400 transition-colors"
                  title="Reset Settings"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 custom-scrollbar">
              
              {/* CONTENT SCALING */}
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Content Scaling</h3>
                <div className="flex bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-1.5 border border-slate-100 dark:border-slate-800">
                  {[100, 110, 125, 150].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => dispatch({ scale })}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                        state.scale === scale 
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-[#0A1F44] dark:text-blue-300 border border-slate-100 dark:border-slate-600' 
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {scale}%
                    </button>
                  ))}
                </div>
              </section>

              {/* READABILITY */}
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Readability</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FeatureButton active={state.dyslexiaFont} onClick={() => dispatch({ dyslexiaFont: !state.dyslexiaFont })} icon={Type} label="Dyslexia Font" />
                  <FeatureButton active={state.highlightLinks} onClick={() => dispatch({ highlightLinks: !state.highlightLinks })} icon={LinkIcon} label="Highlight Links" />
                  <FeatureButton active={state.lineHeight} onClick={() => dispatch({ lineHeight: !state.lineHeight })} icon={ArrowUpDown} label="Line Height" />
                  <FeatureButton active={state.letterSpacing} onClick={() => dispatch({ letterSpacing: !state.letterSpacing })} icon={ArrowLeftRight} label="Letter Spacing" />
                </div>
              </section>

              {/* VISUALS */}
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Visuals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FeatureButton active={theme === 'dark'} onClick={toggleDarkMode} icon={Moon} label="Dark Mode" />
                  <FeatureButton active={state.highContrast} onClick={() => dispatch({ highContrast: !state.highContrast })} icon={Sun} label="High Contrast" />
                  <FeatureButton active={state.invertColors} onClick={() => dispatch({ invertColors: !state.invertColors })} icon={Contrast} label="Invert Colors" />
                  <FeatureButton active={state.grayscale} onClick={() => dispatch({ grayscale: !state.grayscale })} icon={Droplet} label="Grayscale" />
                </div>
              </section>

              {/* FOCUS & NAVIGATION */}
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Focus & Navigation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FeatureButton active={state.bigCursor} onClick={() => dispatch({ bigCursor: !state.bigCursor })} icon={MousePointer2} label="Big Cursor" />
                  <FeatureButton active={state.readingMask} onClick={() => dispatch({ readingMask: !state.readingMask })} icon={Eye} label="Reading Mask" />
                  <FeatureButton active={state.stopMotion} onClick={() => dispatch({ stopMotion: !state.stopMotion })} icon={PauseCircle} label="Stop Motion" />
                  <FeatureButton active={false} onClick={() => alert("Translation feature coming soon!")} icon={Languages} label="Translate" />
                </div>
              </section>

              {/* ASSISTANCE TOOLS */}
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Assistance Tools</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={toggleReadPage}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${
                      isReading 
                        ? 'bg-[#0A1F44]/5 border-[#0A1F44] text-[#0A1F44] dark:bg-[#0A1F44]/20' 
                        : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <Volume2 className={`w-8 h-8 mb-3 ${isReading ? 'text-[#0A1F44] animate-pulse' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Read Page</span>
                  </button>
                  <button
                    onClick={() => alert("Dictation feature coming soon!")}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Mic className="w-8 h-8 mb-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Dictation</span>
                  </button>
                </div>
              </section>

              {/* Shortcuts */}
              <button 
                onClick={() => setIsShortcutsOpen(true)}
                className="w-full flex flex-col items-center justify-center p-6 rounded-2xl border border-[#0A1F44]/20 bg-white hover:bg-[#0A1F44]/5 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all shadow-sm group"
              >
                <Keyboard className="w-8 h-8 mb-3 text-[#0A1F44] group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold tracking-tight">Shortcuts</span>
              </button>
            </div>

            {/* Custom Scrollbar Elements (Fake but matching image) */}
            <div className="absolute right-0 top-[88px] bottom-0 w-8 border-l border-slate-100 dark:border-slate-800 flex flex-col items-center py-2 bg-slate-50/30 dark:bg-slate-900/30">
               <ChevronUp className="w-4 h-4 text-slate-400 mb-1" />
               <div className="w-3 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full my-1">
                 <div className="w-full h-12 bg-slate-400 dark:bg-slate-600 rounded-full shadow-inner" />
               </div>
               <ChevronDown className="w-4 h-4 text-slate-400 mt-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts Modal */}
      <AnimatePresence>
        {isShortcutsOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(10,31,68,0.3)] w-full max-w-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0A1F44] flex items-center justify-center text-white">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
                </div>
                <button 
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                {[
                  { label: "Navigate Next", key: "Tab" },
                  { label: "Select/Action", key: "Enter" },
                  { label: "Close Menu", key: "Esc" },
                  { label: "Go Back", key: "Alt + Left" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                      {item.key}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </>
  );
};

export default AccessibilityMenu;
