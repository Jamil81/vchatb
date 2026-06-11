import json
import logging
import time
from typing import AsyncIterator

from .config import settings
from .context import build_system_prompt

logger = logging.getLogger(__name__)


async def chat_stream(
    session_id: str, user_message: str, db
) -> AsyncIterator[tuple[str, float]]:
    """Yields (token, ttft_ms). ttft_ms is only non-zero on the first token."""
    from .memory import get_history

    history = get_history(db, session_id)
    messages = [
        {"role": "system", "content": build_system_prompt(settings.profile)},
        *history,
        {"role": "user", "content": user_message},
    ]

    if settings.local_mode:
        async for token, ttft in _stream_ollama(messages):
            yield token, ttft
    else:
        async for token, ttft in _stream_claude(messages):
            yield token, ttft


async def summarize(history: list[dict]) -> str:
    """3-bullet summary of recent turns."""
    if not history:
        return ""

    messages = [
        {
            "role": "system",
            "content": "Summarize the conversation in exactly 3 bullet points. Be brief.",
        },
        {
            "role": "user",
            "content": "\n".join(
                f"{m['role']}: {m['content']}" for m in history[-8:]
            ),
        },
    ]

    parts: list[str] = []
    if settings.local_mode:
        async for token, _ in _stream_ollama(messages):
            parts.append(token)
    else:
        async for token, _ in _stream_claude(messages):
            parts.append(token)
    return "".join(parts)


async def _stream_ollama(messages: list) -> AsyncIterator[tuple[str, float]]:
    import httpx

    start = time.perf_counter()
    first = True

    # Generous timeout: Ollama cold-loads the model (~5 GB) on first request.
    async with httpx.AsyncClient(timeout=httpx.Timeout(180, connect=10)) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_base_url}/chat/completions",
            json={"model": settings.ollama_model, "messages": messages, "stream": True},
        ) as resp:
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:]
                if raw == "[DONE]":
                    break
                try:
                    chunk = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                token = (
                    chunk.get("choices", [{}])[0]
                    .get("delta", {})
                    .get("content", "")
                )
                if token:
                    if first:
                        ttft = (time.perf_counter() - start) * 1000
                        first = False
                        yield token, ttft
                    else:
                        yield token, 0.0


async def _stream_claude(messages: list) -> AsyncIterator[tuple[str, float]]:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    system = next(
        (m["content"] for m in messages if m["role"] == "system"),
        build_system_prompt(settings.profile),
    )
    chat_messages = [m for m in messages if m["role"] != "system"]

    start = time.perf_counter()
    first = True

    async with client.messages.stream(
        model=settings.claude_model,
        max_tokens=256,
        system=system,
        messages=chat_messages,
    ) as stream:
        async for text in stream.text_stream:
            if first:
                ttft = (time.perf_counter() - start) * 1000
                first = False
                yield text, ttft
            else:
                yield text, 0.0
