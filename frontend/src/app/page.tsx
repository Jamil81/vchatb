import { VoiceChat } from "@/components/VoiceChat";

export default function Home() {
  const sessionId = `session-${Math.random().toString(36).slice(2, 10)}`;
  return <VoiceChat sessionId={sessionId} />;
}
