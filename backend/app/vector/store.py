from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import faiss
import numpy as np


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

        self.index = faiss.IndexFlatIP(dim)
        self._chunks: list[DocChunk] = []

        if self.index_path.exists() and self.meta_path.exists():
            self._load()

    def _load(self) -> None:
        self.index = faiss.read_index(str(self.index_path))
        meta = json.loads(self.meta_path.read_text(encoding="utf-8"))
        self._chunks = [DocChunk(**c) for c in meta.get("chunks", [])]

    def _save(self) -> None:
        faiss.write_index(self.index, str(self.index_path))
        payload = {"chunks": [c.__dict__ for c in self._chunks]}
        self.meta_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def add_documents(self, chunks: Iterable[DocChunk]) -> int:
        new_chunks = list(chunks)
        if not new_chunks:
            return 0

        vecs = np.stack([_stable_hash_embedding(c.text, self.dim) for c in new_chunks]).astype(np.float32)
        self.index.add(vecs)
        self._chunks.extend(new_chunks)
        self._save()
        return len(new_chunks)

    def search(self, query: str, k: int = 5) -> list[DocChunk]:
        if self.index.ntotal == 0:
            return []
        q = _stable_hash_embedding(query, self.dim).astype(np.float32)
        scores, idx = self.index.search(np.expand_dims(q, 0), k)
        result: list[DocChunk] = []
        for i in idx[0]:
            if i < 0 or i >= len(self._chunks):
                continue
            result.append(self._chunks[i])
        return result
