export function Logo({
  size = 32,
  word = true,
  className = '',
}: {
  size?: number;
  word?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span className="relative flex shrink-0 items-center justify-center">
        <img
          src="/logo.svg"
          width={size}
          height={size}
          alt="catetkos logo"
          className="rounded-lg shadow-2xs"
        />
      </span>
      {word && (
        <span className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-tx leading-none">
            catet<span className="text-brand">kos</span>
          </span>
          <span className="text-[10px] font-semibold text-mut tracking-wider uppercase mt-0.5">
            Buku Kas Kos
          </span>
        </span>
      )}
    </span>
  );
}
