"use client";

import { useMemo } from "react";
import { useVoiceChat, type ConnectionState } from "@/hooks/useVoiceChat";
import { TranscriptPanel } from "./TranscriptPanel";
import { SummaryPanel } from "./SummaryPanel";
import { LatencyDisplay } from "./LatencyDisplay";

function ConnectionDot({ state }: { state: ConnectionState }) {
  const color = {
    connecting: "bg-yellow-500 animate-pulse",
    connected: "bg-green-500",
    disconnected: "bg-zinc-600",
    error: "bg-red-500",
  }[state];
  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}

interface Props {
  sessionId: string;
}

export function VoiceChat({ sessionId }: Props) {
  const {
    connectionState,
    isListening,
    isProcessing,
    messages,
    currentAssistantMsg,
    summary,
    latency,
    startListening,
    stopListening,
    requestSummary,
  } = useVoiceChat(sessionId);

  const micLabel = isListening ? "Release to send" : isProcessing ? "Processing..." : "Hold to speak";

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold tracking-tight">VChatBot</span>
          <ConnectionDot state={connectionState} />
          <span className="text-xs text-zinc-600 capitalize">{connectionState}</span>
        </div>
        {latency && <LatencyDisplay latency={latency} />}
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Transcript */}
        <main className="flex-1 overflow-hidden p-5">
          <TranscriptPanel
            messages={messages}
            currentAssistantMsg={currentAssistantMsg}
            isProcessing={isProcessing}
          />
        </main>

        {/* Summary sidebar */}
        <aside className="hidden lg:flex w-64 border-l border-zinc-800 p-5 overflow-hidden">
          <SummaryPanel summary={summary} onRefresh={requestSummary} />
        </aside>
      </div>

      {/* Mic button */}
      <footer className="flex flex-col items-center gap-3 py-6 border-t border-zinc-800">
        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onTouchStart={(e) => { e.preventDefault(); startListening(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
          disabled={connectionState !== "connected" || isProcessing}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 select-none
            ${
              isListening
                ? "bg-red-600 scale-110 shadow-lg shadow-red-900/50"
                : isProcessing
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 active:scale-95 cursor-pointer"
            }
            disabled:opacity-50`}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
          )}
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 16.93V20H9v2h6v-2h-2v-2.07A8.001 8.001 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
          </svg>
        </button>
        <span className="text-xs text-zinc-500">{micLabel}</span>
      </footer>
    </div>
  );
}
