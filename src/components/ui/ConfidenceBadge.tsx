import { ConfidenceLevel } from '@/lib/contracts/pick';

const DOTS: Record<ConfidenceLevel, string> = {
  HIGH:   '●●●',
  MEDIUM: '●●○',
  LOW:    '●○○',
};

const COLORS: Record<ConfidenceLevel, string> = {
  HIGH:   'text-[#F2F2F2]',
  MEDIUM: 'text-[#A0A0A0]',
  LOW:    'text-[#505050]',
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={`font-mono text-xs tracking-widest ${COLORS[level]}`} title={`Confianza: ${level}`}>
      {DOTS[level]}
    </span>
  );
}
