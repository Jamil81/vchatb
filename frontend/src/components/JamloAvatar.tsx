"use client";

interface Props {
  isListening: boolean;
  isProcessing: boolean;
}

export function JamloAvatar({ isListening, isProcessing }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4 border-b border-zinc-800">
      {/* Avatar ring — pulses when speaking */}
      <div
        className={`relative rounded-full p-0.5 transition-all duration-300 ${
          isListening
            ? "bg-gradient-to-br from-red-500 to-red-700"
            : isProcessing
            ? "bg-gradient-to-br from-blue-500 to-indigo-700 animate-pulse"
            : "bg-gradient-to-br from-zinc-600 to-zinc-800"
        }`}
      >
        {/* Outer glow when active */}
        {(isListening || isProcessing) && (
          <span
            className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
              isListening ? "bg-red-500" : "bg-blue-500"
            }`}
          />
        )}

        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-950">
          <img
            src="/avatar.jpeg"
            alt="Jamlo"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>

      {/* Name + status */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Jamlo</h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              isListening
                ? "bg-red-900/60 text-red-300"
                : isProcessing
                ? "bg-blue-900/60 text-blue-300"
                : "bg-zinc-800 text-zinc-500"
            }`}
          >
            {isListening ? "listening" : isProcessing ? "thinking..." : "ready"}
          </span>
        </div>

        {/* One-liner bio */}
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-[220px]">
          Jamil's AI — Senior Full Stack & AI Engineer
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">
          20+ yrs · Beirut · Direct. No fluff.
        </p>
      </div>

      {/* Trait chips */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-[260px]">
        {["Architect-first", "Full Stack", "AI Engineering", "Direct", "No BS"].map((trait) => (
          <span
            key={trait}
            className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-mono"
          >
            {trait}
          </span>
        ))}
      </div>
    </div>
  );
}
