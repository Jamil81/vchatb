import type { LatencyInfo } from "@/hooks/useVoiceChat";

interface Props {
  latency: LatencyInfo | null;
}

export function LatencyDisplay({ latency }: Props) {
  if (!latency) return null;

  const badge = (label: string, ms: number, warn: number) => (
    <span
      key={label}
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono ${
        ms > warn ? "bg-yellow-900/60 text-yellow-300" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{ms}ms</span>
    </span>
  );

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {badge("STT", latency.stt_ms, 800)}
      {badge("LLM", latency.llm_ttft_ms, 500)}
      {badge("TTS", latency.tts_ms, 300)}
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono bg-zinc-700 text-zinc-200">
        <span className="text-zinc-400">total</span>
        {latency.total_ms}ms
      </span>
    </div>
  );
}
