"use client";

import { useRef } from "react";
import { useVoiceChat, type ConnectionState } from "@/hooks/useVoiceChat";
import { TranscriptPanel } from "./TranscriptPanel";
import { SummaryPanel } from "./SummaryPanel";
import { LatencyDisplay } from "./LatencyDisplay";
import { JamloAvatar } from "./JamloAvatar";

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
  sessionId?: string;
}

export function VoiceChat({ sessionId: sessionIdProp }: Props) {
  const sessionIdRef = useRef(sessionIdProp ?? `session-${Math.random().toString(36).slice(2, 10)}`);
  const sessionId = sessionIdRef.current;
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

  const micLabel =
    connectionState !== "connected"
      ? connectionState === "connecting"
        ? "Connecting to backend..."
        : "Backend unavailable — restart uvicorn (see steps below)"
      : isListening
      ? "Release to send"
      : isProcessing
      ? "Processing..."
      : "Hold to speak";

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ConnectionDot state={connectionState} />
          <span className="text-xs text-zinc-600 capitalize">{connectionState}</span>
        </div>
        {latency && <LatencyDisplay latency={latency} />}
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — avatar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 overflow-hidden flex-shrink-0">
          <JamloAvatar isListening={isListening} isProcessing={isProcessing} />

          {/* Summary below avatar on large screens */}
          <div className="flex-1 p-4 overflow-hidden">
            <SummaryPanel summary={summary} onRefresh={requestSummary} />
          </div>
        </aside>

        {/* Main — transcript */}
        <main className="flex flex-col flex-1 overflow-hidden">
          {/* Mobile avatar strip */}
          <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-zinc-800">
            <div
              className={`relative rounded-full p-0.5 flex-shrink-0 ${
                isListening
                  ? "bg-gradient-to-br from-red-500 to-red-700"
                  : isProcessing
                  ? "bg-gradient-to-br from-blue-500 to-indigo-700"
                  : "bg-zinc-700"
              }`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-950">
                <img
                  src="/avatar.jpeg"
                  alt="Jamlo"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-zinc-100">Jamlo</span>
              <p className="text-xs text-zinc-500">Jamil's AI Avatar</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-5">
            <TranscriptPanel
              messages={messages}
              currentAssistantMsg={currentAssistantMsg}
              isProcessing={isProcessing}
            />
          </div>
        </main>
      </div>

      {/* Footer — mic button */}
      <footer className="flex flex-col items-center gap-3 py-5 border-t border-zinc-800">
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
