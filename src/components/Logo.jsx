export default function Logo({ size = 32, word = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/logo.svg" width={size} height={size} alt="" />
      {word && (
        <span className="text-lg font-extrabold tracking-tight text-zinc-100">
          catet<span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">kos</span>
        </span>
      )}
    </span>
  );
}
