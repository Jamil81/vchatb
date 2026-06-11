import re
from pathlib import Path

_PROFILES_DIR = Path(__file__).resolve().parent.parent / "profiles"
_CACHE: dict[str, str] = {}


def _strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("---", 3)
        if end != -1:
            return text[end + 3:].lstrip()
    return text


def _strip_wiki_links(text: str) -> str:
    # [[link|display]] → display
    text = re.sub(r"\[\[([^|\]]+)\|([^\]]+)\]\]", r"\2", text)
    # [[link]] → link
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)
    return text


def build_system_prompt(profile: str) -> str:
    if profile in _CACHE:
        return _CACHE[profile]

    profile_dir = _PROFILES_DIR / profile
    parts: list[str] = []

    persona_path = profile_dir / "persona.md"
    if persona_path.exists():
        raw = persona_path.read_text(encoding="utf-8")
        parts.append(_strip_frontmatter(raw).strip())

    knowledge_dir = profile_dir / "knowledge"
    if knowledge_dir.exists():
        md_files = sorted(knowledge_dir.glob("*.md"))
        if md_files:
            parts.append("\n\n---\n\n## KNOWLEDGE BASE\n")
            for md_file in md_files:
                raw = md_file.read_text(encoding="utf-8")
                clean = _strip_wiki_links(_strip_frontmatter(raw)).strip()
                parts.append(f"\n### {md_file.stem.upper()}\n\n{clean}")

    result = "\n".join(parts)
    _CACHE[profile] = result
    return result
