/**
 * CalorixLogo — reusable brand logo component.
 * Uses the custom green apple & leaf shape from the favicon,
 * rendered inline for crisp scaling.
 */
export default function CalorixLogo({ size = 32, showText = true, textClass = '' }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Icon mark */}
      <div
        className="relative flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #12266e 0%, #1e3a8a 100%)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          style={{ width: size * 0.65, height: size * 0.65 }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Leaf */}
          <path
            d="M12 5c0-1.5 1.5-2.5 3-2.5"
            stroke="#34d399"
            strokeWidth="2"
          />
          {/* Apple Core / Flame */}
          <path
            d="M12 5c-1.66 0-3 1.34-3 3 0 2 2 4.5 3 5.5 1-1 3-3.5 3-5.5 0-1.66-1.34-3-3-3z"
            fill="#10b981"
            stroke="#10b981"
            strokeLinejoin="round"
          />
        </svg>
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-xl opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #10b981 0%, transparent 80%)',
          }}
        />
      </div>

      {/* Wordmark */}
      {showText && (
        <span
          className={`font-bold tracking-tight ${textClass}`}
          style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
          Calorix
        </span>
      )}
    </div>
  );
}
