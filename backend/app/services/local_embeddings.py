from __future__ import annotations

import hashlib
import math
import re
from collections import Counter


TOKEN_PATTERN = re.compile(r"[A-Za-z_][A-Za-z0-9_]*|\d+|[^\sA-Za-z0-9_]")


class LocalHashEmbeddings:
    """Deterministic offline fallback used when the free embedding quota is hit.

    It is a signed feature-hashing bag-of-tokens model. It is not as semantic as
    Gemini embeddings, but it keeps indexing and retrieval available with zero
    cost and no network dependency.
    """

    def __init__(self, dimensions: int = 768) -> None:
        self.dimensions = dimensions

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_query(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = self._tokens(text)
        if not tokens:
            return vector

        counts = Counter(tokens)
        for token, count in counts.items():
            self._add_feature(vector, token, 1.0 + math.log(count))
            if "_" in token:
                for part in token.split("_"):
                    if part:
                        self._add_feature(vector, part, 0.5)

        norm = math.sqrt(sum(value * value for value in vector))
        if norm > 0:
            vector = [value / norm for value in vector]
        return vector

    def _add_feature(self, vector: list[float], token: str, weight: float) -> None:
        digest = hashlib.blake2b(token.lower().encode("utf-8"), digest_size=8).digest()
        index = int.from_bytes(digest[:4], "little") % self.dimensions
        sign = 1.0 if digest[4] & 1 else -1.0
        vector[index] += sign * weight

    @staticmethod
    def _tokens(text: str) -> list[str]:
        tokens: list[str] = []
        for match in TOKEN_PATTERN.findall(text.lower()):
            tokens.append(match)
            if len(match) > 6 and match.isalnum():
                tokens.extend(match[index : index + 4] for index in range(len(match) - 3))
        return tokens
