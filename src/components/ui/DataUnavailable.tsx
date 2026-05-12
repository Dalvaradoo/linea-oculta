export function DataUnavailable({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#141414] border border-[#2A2A2A] text-[#787878] text-xs font-mono">
      <span className="text-[#404040]">—</span>
      {message}
    </div>
  );
}
