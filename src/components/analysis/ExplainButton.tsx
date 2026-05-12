'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  fixtureId: string;
  market: string;
  selection: string;
}

export function ExplainButton({ fixtureId, market, selection }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [explanation, setExplanation] = useState<string | null>(null);

  async function handleExplain() {
    if (state === 'done' || state === 'loading') return;
    setState('loading');

    try {
      const url = `/api/analysis/${fixtureId}/explain?market=${encodeURIComponent(market)}&selection=${encodeURIComponent(selection)}`;
      const res = await fetch(url);
      const json = await res.json();
      const text = json.data?.explanation ?? null;
      setExplanation(text);
      setState(text ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="mt-2">
      {state === 'idle' && (
        <button
          onClick={handleExplain}
          className="text-[10px] font-mono text-[#404040] hover:text-[#787878] transition-colors cursor-pointer underline underline-offset-2"
        >
          explicar
        </button>
      )}

      {state === 'loading' && (
        <span className="text-[10px] font-mono text-[#404040] animate-pulse">
          analizando...
        </span>
      )}

      {state === 'error' && (
        <span className="text-[10px] font-mono text-[#404040]">
          explicación no disponible
        </span>
      )}

      <AnimatePresence>
        {state === 'done' && explanation && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-[#787878] leading-relaxed mt-1 max-w-prose"
          >
            {explanation}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
