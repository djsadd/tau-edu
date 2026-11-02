export function Crest({ className = "h-11 w-11", inverse = false }: { className?: string; inverse?: boolean }) {
  const fg = inverse ? "#fff" : "#800020";
  const bg = inverse ? "#800020" : "#fff";
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden="true">
      <path d="M24 1 46 7v22c0 13-9.6 21.6-22 26C11.6 50.6 2 42 2 29V7L24 1Z" fill={fg} />
      <path d="M24 5.5 42 10.4V29c0 10.6-7.6 17.8-18 21.8C13.6 46.8 6 39.6 6 29V10.4L24 5.5Z" fill="none" stroke={bg} strokeWidth="1" opacity="0.6" />
      <path d="M13 17.5c1.4-2.2 3-3 5.4-3H36v4.6h-8.4V33c0 2.6 1 3.7 3 3.7 1.3 0 2.5-.4 3.6-1.2l1.3 3.1c-2 1.7-4.3 2.5-6.9 2.5-4.6 0-7-2.6-7-7.3V19.1h-3c-1.9 0-3 .7-4 2.2L13 17.5Z" fill={bg} />
    </svg>
  );
}
