export function Logo({ size = 32, word = true, className = '' }: { size?: number; word?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/logo.svg" width={size} height={size} alt="" />
      {word && <span className="text-lg font-semibold tracking-tight text-tx">catet<span className="text-brand">kos</span></span>}
    </span>
  );
}
