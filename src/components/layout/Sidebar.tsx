'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NormalizedFixture } from '@/lib/contracts/fixture';
import { Competition } from '@/lib/contracts/pick';

const LEAGUES: { key: Competition; label: string }[] = [
  { key: 'LIGA_MX', label: 'Liga MX'            },
  { key: 'WC_2026', label: 'Copa del Mundo 2026' },
];

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-MX', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function MatchItem({ fixture, active }: { fixture: NormalizedFixture; active: boolean }) {
  return (
    <Link
      href={`/match/${fixture.id}`}
      className={`block px-3 py-3 rounded-lg transition-all duration-150 cursor-pointer ${
        active ? 'glass' : 'hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {fixture.homeTeam.logo ? (
          <Image src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} width={16} height={16} className="object-contain flex-shrink-0 opacity-90" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-[#2E302E] flex-shrink-0" />
        )}
        <span className="text-[19px] text-[#D0D4D0] truncate leading-tight">{fixture.homeTeam.name}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {fixture.awayTeam.logo ? (
          <Image src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} width={16} height={16} className="object-contain flex-shrink-0 opacity-90" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-[#2E302E] flex-shrink-0" />
        )}
        <span className="text-[19px] text-[#D0D4D0] truncate leading-tight">{fixture.awayTeam.name}</span>
      </div>
      <div className="text-[19px] font-mono text-[#6B6F6B]">{formatTime(fixture.kickoff)}</div>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const currentId = pathname.startsWith('/match/') ? pathname.split('/match/')[1] : null;

  const [activeLeague, setActiveLeague] = useState<Competition>('LIGA_MX');
  const [fixtures, setFixtures] = useState<NormalizedFixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fixtures?competition=${activeLeague}`)
      .then((r) => r.json())
      .then((json) => setFixtures(json.data ?? []))
      .catch(() => setFixtures([]))
      .finally(() => setLoading(false));
  }, [activeLeague]);

  return (
    <aside className="flex flex-col h-full border-r border-white/[0.07] backdrop-blur-sm" style={{ background: 'rgba(7,9,15,0.6)' }}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <div className="w-6 h-6 flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <ellipse cx="12" cy="6" rx="8" ry="3" fill="#00E062" opacity="0.12" />
              <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#00E062" strokeWidth="1.2" fill="none" />
              <line x1="4" y1="6" x2="4" y2="18" stroke="#00E062" strokeWidth="1.2" />
              <line x1="20" y1="6" x2="20" y2="18" stroke="#00E062" strokeWidth="1.2" />
              <line x1="4" y1="12" x2="20" y2="12" stroke="#00E062" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
              <ellipse cx="12" cy="18" rx="8" ry="3" fill="#00E062" opacity="0.04" />
              <ellipse cx="12" cy="18" rx="8" ry="3" stroke="#00E062" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
          <span className="text-[18px] font-mono font-bold tracking-tight text-chrome-green">LÍNEA OCULTA</span>
        </Link>
      </div>

      {/* League tabs */}
      <div className="px-3 pt-4 pb-2">
        <div className="text-[13px] font-mono text-[#6B6F6B] uppercase tracking-widest mb-2.5">Competencia</div>
        <div className="flex flex-col gap-1">
          {LEAGUES.map((l) => (
            <button
              key={l.key}
              onClick={() => setActiveLeague(l.key)}
              className={`text-left px-3 py-2.5 rounded-md text-[19px] font-mono transition-all duration-150 cursor-pointer ${
                activeLeague === l.key
                  ? 'glass text-[#F0F2F0]'
                  : 'text-[#9A9E9A] hover:text-[#D0D4D0] hover:bg-white/[0.04]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="text-[13px] font-mono text-[#6B6F6B] uppercase tracking-widest px-1 py-3">
          Próximos partidos
        </div>
        {loading ? (
          <div className="space-y-2 px-1">
            {[1,2,3].map((i) => (
              <div key={i} className="h-18 rounded-lg bg-[#161816] animate-pulse" style={{ height: '72px' }} />
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <p className="text-[18px] font-mono text-[#6B6F6B] px-1 leading-relaxed">
            No hay partidos próximos.
          </p>
        ) : (
          <div className="space-y-0.5">
            {fixtures.map((f) => (
              <MatchItem key={f.id} fixture={f} active={f.id === currentId} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
