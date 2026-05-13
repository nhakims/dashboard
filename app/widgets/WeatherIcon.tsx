export function WeatherIcon({ kind, className }: { kind: string; className?: string }) {
  const cls = `${className ?? "w-5 h-5"} fc-50`;
  switch (kind) {
    case "sun":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "partly":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 4a4 4 0 014 3.8A3 3 0 1117 14H8a4 4 0 01-.5-7.97A4 4 0 0112.5 4z" />
          <circle cx="7" cy="8.5" r="2.5" />
          <path strokeLinecap="round" d="M7 3v1M7 14v1M2 8.5h1M12 8.5h1" />
        </svg>
      );
    case "rain":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
          <path strokeLinecap="round" d="M8 20l-1 2M12 20l-1 2M16 20l-1 2" />
        </svg>
      );
    case "snow":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
          <path strokeLinecap="round" d="M8 21v2M12 21v2M16 21v2M7 22l2-1M7 22l2 1M11 22l2-1M11 22l2 1M15 22l2-1M15 22l2 1" />
        </svg>
      );
    case "storm":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 14l-2 3h3l-2 3" />
        </svg>
      );
    case "fog":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M3 12h18M5 16h14M7 8h10" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17a4 4 0 010-8 4.5 4.5 0 018.93-1A3.5 3.5 0 1120.5 17H6z" />
        </svg>
      );
  }
}
