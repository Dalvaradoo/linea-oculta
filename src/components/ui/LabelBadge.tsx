import { Label } from '@/lib/contracts/pick';

const STYLES: Record<Label, string> = {
  VALUE: 'bg-[#00E062]/10 text-[#00E062] border border-[#00E062]/30',
  LEAN:  'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30',
  FAIR:  'bg-[#787878]/10 text-[#787878] border border-[#787878]/30',
  AVOID: 'bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/30',
};

export function LabelBadge({ label }: { label: Label }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium tracking-wide ${STYLES[label]}`}>
      {label}
    </span>
  );
}
