"""
Semantic chunker — splits documents into overlapping chunks
while respecting sentence boundaries.
"""
from __future__ import annotations
import re
from typing import List
from dataclasses import dataclass


@dataclass
class Chunk:
    content: str
    chunk_index: int
    token_count: int
    metadata: dict


def _approximate_tokens(text: str) -> int:
    """Rough 1 token ≈ 4 chars estimate."""
    return max(1, len(text) // 4)


def _split_sentences(text: str) -> List[str]:
    """Split on sentence boundaries."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if s.strip()]


def chunk_text(
    text: str,
    chunk_size: int = 512,      # target tokens per chunk
    overlap: int = 64,           # overlap tokens between chunks
    metadata: dict | None = None,
) -> List[Chunk]:
    """
    Split `text` into overlapping chunks of ~chunk_size tokens.
    Preserves sentence boundaries.
    """
    if not text or not text.strip():
        return []

    sentences = _split_sentences(text)
    chunks: List[Chunk] = []
    current_sentences: List[str] = []
    current_tokens = 0
    chunk_index = 0

    # Overlap buffer — sentences we carry over
    overlap_sentences: List[str] = []

    for sentence in sentences:
        sentence_tokens = _approximate_tokens(sentence)

        # If adding this sentence exceeds chunk_size → flush
        if current_tokens + sentence_tokens > chunk_size and current_sentences:
            chunk_content = " ".join(current_sentences)
            chunks.append(
                Chunk(
                    content=chunk_content,
                    chunk_index=chunk_index,
                    token_count=_approximate_tokens(chunk_content),
                    metadata=metadata or {},
                )
            )
            chunk_index += 1

            # Build overlap — keep last N tokens worth of sentences
            overlap_sentences = []
            overlap_tokens = 0
            for s in reversed(current_sentences):
                st = _approximate_tokens(s)
                if overlap_tokens + st > overlap:
                    break
                overlap_sentences.insert(0, s)
                overlap_tokens += st

            current_sentences = overlap_sentences[:]
            current_tokens = sum(_approximate_tokens(s) for s in current_sentences)

        current_sentences.append(sentence)
        current_tokens += sentence_tokens

    # Final chunk
    if current_sentences:
        chunk_content = " ".join(current_sentences)
        chunks.append(
            Chunk(
                content=chunk_content,
                chunk_index=chunk_index,
                token_count=_approximate_tokens(chunk_content),
                metadata=metadata or {},
            )
        )

    return chunks
