'use client';

interface Props {
  ogUrl: string;
  matchTitle: string;
}

export function ShareButton({ ogUrl, matchTitle }: Props) {
  function handleClick() {
    // Build absolute URL for the image
    const abs = ogUrl.startsWith('http')
      ? ogUrl
      : `${window.location.origin}${ogUrl}`;
    window.open(abs, '_blank', 'noopener');
  }

  return (
    <button
      onClick={handleClick}
      title={`Ver imagen para compartir: ${matchTitle}`}
      className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-[13px] font-mono text-[#9A9E9A] hover:text-[#F0F2F0] transition-all duration-150 cursor-pointer"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      Compartir
    </button>
  );
}
