"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface LatencyInfo {
  stt_ms: number;
  llm_ttft_ms: number;
  tts_ms: number;
  total_ms: number;
}

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

export function useVoiceChat(sessionId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAssistantMsg, setCurrentAssistantMsg] = useState("");
  const [summary, setSummary] = useState("");
  const [latency, setLatency] = useState<LatencyInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;

    const buffer = audioQueueRef.current.shift()!;
    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;

    try {
      const decoded = await ctx.decodeAudioData(buffer);
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };
      source.start();
    } catch (err) {
      console.error("Audio decode error:", err);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, []);

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000"}/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => setConnectionState("connected");
    ws.onclose = () => setConnectionState("disconnected");
    ws.onerror = () => setConnectionState("error");

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        audioQueueRef.current.push(event.data.slice(0));
        playNextInQueue();
        return;
      }

      const msg = JSON.parse(event.data as string);

      switch (msg.type) {
        case "transcript":
          addMessage("user", msg.text);
          setIsProcessing(true);
          setCurrentAssistantMsg("");
          break;

        case "token":
          setCurrentAssistantMsg((prev) => prev + msg.text);
          break;

        case "response_complete":
          setLatency(msg.latency);
          setCurrentAssistantMsg((prev) => {
            if (prev) addMessage("assistant", prev);
            return "";
          });
          setIsProcessing(false);
          break;

        case "summary":
          setSummary(msg.text);
          break;

        case "stt_empty":
          setIsProcessing(false);
          break;
      }
    };

    return () => ws.close();
  }, [sessionId, addMessage, playNextInQueue]);

  const startListening = useCallback(async () => {
    if (isListening || isProcessing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    } catch (err) {
      console.error("Mic access error:", err);
    }
  }, [isListening, isProcessing]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    wsRef.current?.send(JSON.stringify({ type: "end_of_speech" }));
    setIsListening(false);
  }, [isListening]);

  const requestSummary = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "request_summary" }));
  }, []);

  return {
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
  };
}
