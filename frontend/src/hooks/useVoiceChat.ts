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

function wsSend(ws: WebSocket | null, data: string | Blob) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(data);
  }
}

export function useVoiceChat(sessionId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  // Accumulated outside React state: state updaters must stay pure (Strict
  // Mode runs them twice, which previously duplicated finished messages).
  const assistantMsgRef = useRef("");

  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAssistantMsg, setCurrentAssistantMsg] = useState("");
  const [summary, setSummary] = useState("");
  const [latency, setLatency] = useState<LatencyInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessageRef = useRef((role: "user" | "assistant", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  });

  const playNextInQueueRef = useRef(async () => {
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
        playNextInQueueRef.current();
      };
      source.start();
    } catch (err) {
      console.error("Audio decode error:", err);
      isPlayingRef.current = false;
      playNextInQueueRef.current();
    }
  });

  useEffect(() => {
    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (!active) return;

      const existing = wsRef.current;
      if (
        existing &&
        (existing.readyState === WebSocket.CONNECTING ||
          existing.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000"}/ws/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;
      setConnectionState("connecting");

      const connectTimeout = window.setTimeout(() => {
        if (active && wsRef.current === ws && ws.readyState !== WebSocket.OPEN) {
          console.error("WebSocket connection timed out:", wsUrl);
          ws.close();
          setConnectionState("error");
        }
      }, 5000);

      ws.onopen = () => {
        window.clearTimeout(connectTimeout);
        if (active && wsRef.current === ws) setConnectionState("connected");
      };

      ws.onclose = () => {
        window.clearTimeout(connectTimeout);
        if (!active || wsRef.current !== ws) return;
        wsRef.current = null;
        setConnectionState("disconnected");
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        if (active && wsRef.current === ws) setConnectionState("error");
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          audioQueueRef.current.push(event.data.slice(0));
          playNextInQueueRef.current();
          return;
        }

        const msg = JSON.parse(event.data as string);

        switch (msg.type) {
          case "transcript":
            addMessageRef.current("user", msg.text);
            setIsProcessing(true);
            assistantMsgRef.current = "";
            setCurrentAssistantMsg("");
            break;

          case "token":
            assistantMsgRef.current += msg.text;
            setCurrentAssistantMsg(assistantMsgRef.current);
            break;

          case "response_complete":
            setLatency(msg.latency);
            if (assistantMsgRef.current) {
              addMessageRef.current("assistant", assistantMsgRef.current);
              assistantMsgRef.current = "";
            }
            setCurrentAssistantMsg("");
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
    };

    connect();

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [sessionId]);

  const startListening = useCallback(async () => {
    if (isListening || isProcessing) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          wsSend(wsRef.current, e.data);
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
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isListening) return;

    setIsListening(false);
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      wsSend(wsRef.current, JSON.stringify({ type: "end_of_speech" }));
    };
    recorder.stop();
  }, [isListening]);

  const requestSummary = useCallback(() => {
    wsSend(wsRef.current, JSON.stringify({ type: "request_summary" }));
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
