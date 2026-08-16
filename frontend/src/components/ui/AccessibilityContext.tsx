import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccessibilityState = {
  scale: number;
  dyslexiaFont: boolean;
  highlightLinks: boolean;
  lineHeight: boolean;
  letterSpacing: boolean;
  highContrast: boolean;
  invertColors: boolean;
  grayscale: boolean;
  bigCursor: boolean;
  readingMask: boolean;
  stopMotion: boolean;
};

const initialState: AccessibilityState = {
  scale: 100,
  dyslexiaFont: false,
  highlightLinks: false,
  lineHeight: false,
  letterSpacing: false,
  highContrast: false,
  invertColors: false,
  grayscale: false,
  bigCursor: false,
  readingMask: false,
  stopMotion: false,
};

type AccessibilityContextType = {
  state: AccessibilityState;
  dispatch: React.Dispatch<Partial<AccessibilityState>>;
  reset: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AccessibilityState>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return { ...initialState, ...JSON.parse(saved) };
      } catch (e) {
        return initialState;
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(state));
  }, [state]);

  const dispatch = (update: Partial<AccessibilityState>) => {
    setState((prev) => ({ ...prev, ...update }));
  };

  const reset = () => {
    setState(initialState);
  };

  useEffect(() => {
    const html = document.documentElement;
    
    // Content Scaling
    html.style.fontSize = `${state.scale}%`;
    
    // Toggles
    const classes = {
      'a11y-dyslexia-font': state.dyslexiaFont,
      'a11y-highlight-links': state.highlightLinks,
      'a11y-line-height': state.lineHeight,
      'a11y-letter-spacing': state.letterSpacing,
      'a11y-high-contrast': state.highContrast,
      'a11y-invert-colors': state.invertColors,
      'a11y-grayscale': state.grayscale,
      'a11y-big-cursor': state.bigCursor,
      'a11y-stop-motion': state.stopMotion,
    };

    Object.entries(classes).forEach(([className, active]) => {
      if (active) html.classList.add(className);
      else html.classList.remove(className);
    });
  }, [state]);

  return (
    <AccessibilityContext.Provider value={{ state, dispatch, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
