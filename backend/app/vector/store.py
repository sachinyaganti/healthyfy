from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np

try:
    import faiss  # type: ignore

    _HAS_FAISS = True
except Exception:  # pragma: no cover
    faiss = None
    _HAS_FAISS = False


@dataclass
class DocChunk:
    id: str
    text: str
    meta: dict


def _stable_hash_embedding(text: str, dim: int = 384) -> np.ndarray:
    """Deterministic local embedding fallback.

    This is NOT a semantic model; it exists to keep the system fully runnable
    without external embedding services.
    """

    # Character trigram hashing into a dense vector.
    v = np.zeros((dim,), dtype=np.float32)
    t = (text or "").lower()
    if len(t) < 3:
        return v
    for i in range(len(t) - 2):
        tri = t[i : i + 3]
        h = (ord(tri[0]) * 31 + ord(tri[1]) * 17 + ord(tri[2]) * 13) % dim
        v[h] += 1.0
    # Normalize
    norm = np.linalg.norm(v)
    if norm > 0:
        v /= norm
    return v


class FaissVectorStore:
    def __init__(self, dim: int = 384, data_dir: str | Path = "./data"):
        self.dim = dim
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.data_dir / "healthyfy.faiss"
        self.meta_path = self.data_dir / "healthyfy.meta.json"

        # Used when FAISS isn't available (e.g., Windows local dev).
        self._embeddings_path = self.data_dir / "healthyfy.embeddings.npy"
        self._embeddings: np.ndarray | None = None

        if _HAS_FAISS:
            self.index = faiss.IndexFlatIP(dim)
        else:
            # Keep API parity with FAISS's IndexFlatIP for startup checks (index.ntotal)
            class _DummyIndex:
                def __init__(self) -> None:
                    self.ntotal = 0

            self.index = _DummyIndex()
        self._chunks: list[DocChunk] = []

        if self.meta_path.exists() and (self.index_path.exists() or (not _HAS_FAISS)):
            self._load()

    def _load(self) -> None:
        meta = json.loads(self.meta_path.read_text(encoding="utf-8"))
        self._chunks = [DocChunk(**c) for c in meta.get("chunks", [])]

        if _HAS_FAISS:
            if self.index_path.exists():
                self.index = faiss.read_index(str(self.index_path))
        else:
            # Load cached embeddings when present; otherwise regenerate (deterministic).
            if self._embeddings_path.exists():
                self._embeddings = np.load(self._embeddings_path)
            else:
                if self._chunks:
                    self._embeddings = np.stack(
                        [_stable_hash_embedding(c.text, self.dim) for c in self._chunks]
                    ).astype(np.float32)
                else:
                    self._embeddings = np.zeros((0, self.dim), dtype=np.float32)
            self.index.ntotal = int(self._embeddings.shape[0])

    def _save(self) -> None:
        payload = {"chunks": [c.__dict__ for c in self._chunks]}
        self.meta_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

        if _HAS_FAISS:
            faiss.write_index(self.index, str(self.index_path))
        else:
            # Cache embeddings for faster startup, but we can always regenerate.
            if self._embeddings is None:
                if self._chunks:
                    self._embeddings = np.stack(
                        [_stable_hash_embedding(c.text, self.dim) for c in self._chunks]
                    ).astype(np.float32)
                else:
                    self._embeddings = np.zeros((0, self.dim), dtype=np.float32)
            np.save(self._embeddings_path, self._embeddings)

    def add_documents(self, chunks: Iterable[DocChunk]) -> int:
        new_chunks = list(chunks)
        if not new_chunks:
            return 0

        vecs = np.stack([_stable_hash_embedding(c.text, self.dim) for c in new_chunks]).astype(np.float32)
        if _HAS_FAISS:
            self.index.add(vecs)
        else:
            if self._embeddings is None:
                self._embeddings = np.zeros((0, self.dim), dtype=np.float32)
            self._embeddings = np.vstack([self._embeddings, vecs])
            self.index.ntotal = int(self._embeddings.shape[0])
        self._chunks.extend(new_chunks)
        self._save()
        return len(new_chunks)

    def search(self, query: str, k: int = 5) -> list[DocChunk]:
        if self.index.ntotal == 0:
            return []
        q = _stable_hash_embedding(query, self.dim).astype(np.float32)

        if _HAS_FAISS:
            scores, idx = self.index.search(np.expand_dims(q, 0), k)
            result: list[DocChunk] = []
            for i in idx[0]:
                if i < 0 or i >= len(self._chunks):
                    continue
                result.append(self._chunks[i])
            return result

        if self._embeddings is None:
            self._embeddings = np.stack(
                [_stable_hash_embedding(c.text, self.dim) for c in self._chunks]
            ).astype(np.float32)
            self.index.ntotal = int(self._embeddings.shape[0])

        sims = self._embeddings @ q
        top_idx = np.argsort(-sims)[:k]
        return [self._chunks[int(i)] for i in top_idx if 0 <= int(i) < len(self._chunks)]
