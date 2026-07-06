// src/components/Logo.js
// Simple, clean wordmark used across the site — no external image dependency,
// so it renders instantly and costs nothing to host.

export default function Logo({ size = "md" }) {
  const sizes = {
    sm: { box: 24, text: "text-sm" },
    md: { box: 32, text: "text-lg" },
    lg: { box: 44, text: "text-2xl" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2">
      <svg
        width={s.box}
        height={s.box}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#111827" />
        <path
          d="M9 11h14M9 16h14M9 21h9"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className={`${s.text} font-semibold tracking-tight text-gray-900`}>
        Invoicer
      </span>
    </div>
  );
}
