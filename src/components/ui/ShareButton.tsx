'use client';

import { useState } from 'react';

interface Props {
  fixtureId: string;
  title: string;
}

export function ShareButton({ fixtureId, title }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'shared'>('idle');

  async function handleShare() {
    const url = `${window.location.origin}/match/${fixtureId}`;

    // Web Share API — funciona en móvil
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        setState('shared');
        setTimeout(() => setState('idle'), 2000);
        return;
      } catch {}
    }

    // Fallback: copiar al portapapeles
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {}
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-[13px] font-mono text-[#9A9E9A] hover:text-[#F0F2F0] transition-all duration-150 cursor-pointer"
    >
      {state === 'idle' && (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Compartir
        </>
      )}
      {state === 'copied' && (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E062" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-[#00E062]">Link copiado</span>
        </>
      )}
      {state === 'shared' && (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E062" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-[#00E062]">Compartido</span>
        </>
      )}
    </button>
  );
}
