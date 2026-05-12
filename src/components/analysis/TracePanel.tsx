'use client';

import { useState } from 'react';
import { CalculationTrace } from '@/lib/contracts/analysis';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-[#1E1E1E] last:border-0">
      <span className="text-[#787878] text-xs">{label}</span>
      <span className="font-mono text-xs text-[#F2F2F2] tabular-nums">{value}</span>
    </div>
  );
}

export function TracePanel({ trace, selection }: { trace: CalculationTrace; selection: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#141414] hover:bg-[#1A1A1A] transition-colors cursor-pointer text-left"
        aria-expanded={open}
      >
        <span className="text-[12px] font-mono text-[#787878] uppercase tracking-widest">
          Trace — {selection}
        </span>
        <span className="font-mono text-[#404040] text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-3 bg-[#0D0D0D] space-y-4 text-xs">
          <div>
            <div className="text-[12px] text-[#404040] uppercase tracking-wider mb-2">Fortalezas</div>
            <Row label="Ataque Local" value={trace.homeAttackStrength.toFixed(4)} />
            <Row label="Defensa Local" value={trace.homeDefenseStrength.toFixed(4)} />
            <Row label="Ataque Visitante" value={trace.awayAttackStrength.toFixed(4)} />
            <Row label="Defensa Visitante" value={trace.awayDefenseStrength.toFixed(4)} />
          </div>
          <div>
            <div className="text-[12px] text-[#404040] uppercase tracking-wider mb-2">Goles Esperados</div>
            <Row label="λ Local" value={trace.lambdaHome.toFixed(4)} />
            <Row label="λ Visitante" value={trace.lambdaAway.toFixed(4)} />
          </div>
          <div>
            <div className="text-[12px] text-[#404040] uppercase tracking-wider mb-2">Probabilidades del Modelo</div>
            <Row label="Local" value={`${(trace.derivedProbabilities.home * 100).toFixed(2)}%`} />
            <Row label="Empate" value={`${(trace.derivedProbabilities.draw * 100).toFixed(2)}%`} />
            <Row label="Visitante" value={`${(trace.derivedProbabilities.away * 100).toFixed(2)}%`} />
            <Row label="Ambos Anotan (Sí)" value={`${(trace.derivedProbabilities.bttsYes * 100).toFixed(2)}%`} />
            <Row label="Over 2.5" value={`${(trace.derivedProbabilities.over25 * 100).toFixed(2)}%`} />
          </div>
          <div>
            <div className="text-[12px] text-[#404040] uppercase tracking-wider mb-2">Fuentes</div>
            <Row label="Cuotas" value={trace.oddsSource} />
            <Row label="Estadísticas" value={trace.statsSource} />
            <Row label="Partidos usados" value={`Local: ${trace.gamesUsed.home} · Visitante: ${trace.gamesUsed.away}`} />
          </div>
        </div>
      )}
    </div>
  );
}
