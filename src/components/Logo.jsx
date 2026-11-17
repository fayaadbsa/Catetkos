export default function Logo({ size = 32, word = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/logo.svg" width={size} height={size} alt="" />
      {word && (
        <span className="text-lg font-extrabold tracking-tight text-tx">
          catet<span className="text-primary">kos</span>
        </span>
      )}
    </span>
  );
}
