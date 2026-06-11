"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/useVoiceChat";

interface Props {
  messages: ChatMessage[];
  currentAssistantMsg: string;
  isProcessing: boolean;
}

export function TranscriptPanel({ messages, currentAssistantMsg, isProcessing }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentAssistantMsg]);

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full pr-1">
      {messages.length === 0 && !isProcessing && (
        <p className="text-zinc-600 text-sm text-center mt-8">
          Hold the mic button and speak.
        </p>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {currentAssistantMsg && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-zinc-800 text-zinc-100">
            {currentAssistantMsg}
            <span className="inline-block w-1 h-3.5 ml-0.5 bg-zinc-400 animate-pulse align-middle" />
          </div>
        </div>
      )}

      {isProcessing && !currentAssistantMsg && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-zinc-800">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
