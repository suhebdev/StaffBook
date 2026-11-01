import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, X } from 'lucide-react';
import type { ReleaseInfo } from './useReleaseInfo';

interface ReleaseBadgeProps {
  release: ReleaseInfo | null;
  className?: string;
  showWhatsNew?: boolean;
}

export function ReleaseBadge({
  release,
  className = '',
  showWhatsNew = true,
}: ReleaseBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // If fetch failed, timed out, or no release info available, silently render nothing
  if (!release) return null;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-2 ${className}`}
    >
      {/* Version badge */}
      <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] text-[#047857] dark:text-[#6EE7B7] border border-[#10B981]/30">
        {release.version}
      </span>

      {/* What's new toggle (only shown if notes exist and showWhatsNew is true) */}
      {showWhatsNew && release.notes.length > 0 && (
        <div className="relative inline-flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
            aria-expanded={open}
            title="View what's new in this release"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226]"
          >
            <Sparkles className="w-3 h-3 text-[#B93A2B] dark:text-[#FF8278]" />
            <span>What's new</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Expandable What's new popover */}
          {open && (
            <div className="absolute top-full left-0 mt-1.5 z-50 w-72 sm:w-80 p-3.5 bg-white dark:bg-[#1A1D23] rounded-xl border border-[#E5E7EB] dark:border-[#2E323B] shadow-xl text-left">
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2E323B]">
                <div>
                  <div className="text-xs font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-1.5">
                    <span>StaffBook {release.version}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FEF2F2] dark:bg-[#2B1414] text-[#B91C1C] dark:text-[#F87171]">
                      Latest
                    </span>
                  </div>
                  {release.updatedAt && (
                    <div className="text-[10px] font-mono text-[#6B7280] dark:text-[#858A94] mt-0.5">
                      Released {release.updatedAt}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[#6B7280] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] p-0.5 rounded cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <ul className="mt-2.5 space-y-1.5 text-xs text-[#374151] dark:text-[#D1D5DB]">
                {release.notes.map((note, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 leading-relaxed"
                  >
                    <span className="text-[#059669] dark:text-[#34D399] shrink-0 mt-0.5">
                      •
                    </span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
