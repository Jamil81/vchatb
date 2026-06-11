"use client";

interface Props {
  summary: string;
  onRefresh: () => void;
}

export function SummaryPanel({ summary, onRefresh }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Summary
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {summary ? (
          <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        ) : (
          <p className="text-zinc-700 text-sm">
            Auto-updates every 4 turns.
          </p>
        )}
      </div>
    </div>
  );
}
