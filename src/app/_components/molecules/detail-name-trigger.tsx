'use client';

import { useId, useState } from 'react';

interface DetailNameTriggerProps {
  ariaLabel: string;
  label: string;
  onClick: () => void;
}

export function DetailNameTrigger({
  ariaLabel,
  label,
  onClick,
}: DetailNameTriggerProps): React.ReactElement {
  const tooltipId = useId();
  const [isTooltipVisible, setTooltipVisible] = useState(false);

  const handleClick = (): void => {
    setTooltipVisible(false);
    onClick();
  };

  return (
    <span
      className="relative inline-flex min-w-0 max-w-full"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <button
        aria-describedby={tooltipId}
        aria-label={ariaLabel}
        className={[
          'max-w-full cursor-pointer truncate text-left font-medium text-slate-950',
          'hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-slate-400',
        ].join(' ')}
        onBlur={() => setTooltipVisible(false)}
        onClick={handleClick}
        onFocus={() => setTooltipVisible(true)}
        type="button"
      >
        {label}
      </button>
      <span
        className={[
          'pointer-events-none absolute left-0 top-full z-40 mt-1 whitespace-nowrap',
          'rounded bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md',
          'transition-opacity',
          isTooltipVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        id={tooltipId}
        role="tooltip"
      >
        Click to view details
      </span>
    </span>
  );
}
