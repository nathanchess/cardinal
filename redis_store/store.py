"""Redis card store with RediSearch vector KNN and cosine fallback."""

from __future__ import annotations

import json
import math
import os
import struct
from pathlib import Path

import redis
from dotenv import load_dotenv

CARD_PREFIX = "card:"
CARD_KEY = "card:{id}"
CARD_IDS_KEY = "cards:ids"
INDEX_NAME = "idx:cards"
ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "credit_cards.json"
EMBEDDINGS_PATH = ROOT / "data" / "card_embeddings.json"


def floats_to_bytes(values: list[float]) -> bytes:
    return struct.pack(f"<{len(values)}f", *values)


def bytes_to_floats(payload: bytes) -> list[float]:
    count = len(payload) // 4
    return list(struct.unpack(f"<{count}f", payload))


def cosine_similarity(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    return dot / (left_norm * right_norm)


class CardRedis:
    def __init__(self) -> None:
        load_dotenv(ROOT / ".env.local")
        load_dotenv()
        self.client = redis.Redis(
            host=os.environ["REDIS_HOST"],
            port=int(os.environ["REDIS_PORT"]),
            username=os.environ["REDIS_USERNAME"],
            password=os.environ["REDIS_PASSWORD"],
            decode_responses=False,
        )
        self.vector_dims: int | None = None

    def clear(self) -> None:
        self.client.flushdb()

    def set(self, key: str, value: object) -> None:
        self.client.set(key, json.dumps(value).encode("utf-8"))

    def get(self, key: str) -> object | None:
        raw = self.client.get(key)
        return None if raw is None else json.loads(raw)

    def put_card(
        self,
        card_id: str,
        embedding: list[float],
        metadata: dict,
        *,
        embedding_text: str,
        model: str,
    ) -> None:
        self.vector_dims = len(embedding)
        key = CARD_KEY.format(id=card_id)
        self.client.hset(
            key,
            mapping={
                "id": card_id,
                "name": metadata["name"],
                "issuer": metadata["issuer"],
                "model": model,
                "embedding_text": embedding_text,
                "embedding": floats_to_bytes(embedding),
                "metadata_json": json.dumps(metadata, ensure_ascii=False),
            },
        )
        self.client.sadd(CARD_IDS_KEY, card_id)

    def get_card(self, card_id: str) -> dict | None:
        raw = self.client.hgetall(CARD_KEY.format(id=card_id))
        if not raw:
            return None
        return {
            "id": raw[b"id"].decode("utf-8"),
            "name": raw[b"name"].decode("utf-8"),
            "issuer": raw[b"issuer"].decode("utf-8"),
            "model": raw[b"model"].decode("utf-8"),
            "embedding_text": raw[b"embedding_text"].decode("utf-8"),
            "embedding": bytes_to_floats(raw[b"embedding"]),
            "metadata": json.loads(raw[b"metadata_json"]),
        }

    def list_card_ids(self) -> list[str]:
        return sorted(value.decode("utf-8") for value in self.client.smembers(CARD_IDS_KEY))

    def ensure_vector_index(self, dims: int) -> None:
        try:
            self.client.execute_command("FT.INFO", INDEX_NAME)
            return
        except redis.ResponseError:
            pass
        self.client.execute_command(
            "FT.CREATE",
            INDEX_NAME,
            "ON",
            "HASH",
            "PREFIX",
            "1",
            CARD_PREFIX,
            "SCHEMA",
            "id",
            "TAG",
            "name",
            "TEXT",
            "issuer",
            "TAG",
            "embedding_text",
            "TEXT",
            "embedding",
            "VECTOR",
            "FLAT",
            "6",
            "TYPE",
            "FLOAT32",
            "DIM",
            str(dims),
            "DISTANCE_METRIC",
            "COSINE",
            "metadata_json",
            "TEXT",
        )

    def knn_search(self, query_embedding: list[float], k: int = 10) -> list[dict]:
        try:
            result = self.client.execute_command(
                "FT.SEARCH",
                INDEX_NAME,
                f"*=>[KNN {k} @embedding $vec AS score]",
                "PARAMS",
                "2",
                "vec",
                floats_to_bytes(query_embedding),
                "SORTBY",
                "score",
                "RETURN",
                "5",
                "id",
                "name",
                "issuer",
                "score",
                "metadata_json",
                "DIALECT",
                "2",
            )
            return self._parse_search_result(result)
        except redis.ResponseError:
            return self.cosine_search(query_embedding, k=k)

    def cosine_search(self, query_embedding: list[float], k: int = 10) -> list[dict]:
        scored = []
        for card_id in self.list_card_ids():
            card = self.get_card(card_id)
            score = cosine_similarity(query_embedding, card["embedding"])
            scored.append(
                {
                    "id": card["id"],
                    "name": card["name"],
                    "issuer": card["issuer"],
                    "score": score,
                    "metadata": card["metadata"],
                }
            )
        scored.sort(key=lambda item: item["score"], reverse=True)
        return scored[:k]

    def _decode(self, value: bytes | str) -> str:
        return value.decode("utf-8") if isinstance(value, bytes) else value

    def _parse_search_result(self, result: list | dict) -> list[dict]:
        if isinstance(result, dict):
            rows = result.get(b"results") or result.get("results") or []
            hits = []
            for row in rows:
                raw_attrs = row.get(b"extra_attributes") or row.get("extra_attributes") or {}
                attrs = {self._decode(key): value for key, value in raw_attrs.items()}
                hits.append(
                    {
                        "id": self._decode(attrs["id"]),
                        "name": self._decode(attrs["name"]),
                        "issuer": self._decode(attrs["issuer"]),
                        "score": 1.0 - float(self._decode(attrs["score"])),
                        "metadata": json.loads(self._decode(attrs["metadata_json"])),
                    }
                )
            return hits

        hits = []
        rows = result[1:]
        for index in range(0, len(rows), 2):
            fields = rows[index + 1]
            attrs = {
                self._decode(fields[i]): fields[i + 1]
                for i in range(0, len(fields), 2)
            }
            hits.append(
                {
                    "id": self._decode(attrs["id"]),
                    "name": self._decode(attrs["name"]),
                    "issuer": self._decode(attrs["issuer"]),
                    "score": 1.0 - float(self._decode(attrs["score"])),
                    "metadata": json.loads(self._decode(attrs["metadata_json"])),
                }
            )
        return hits

    def load_catalog(
        self,
        catalog_path: Path = CATALOG_PATH,
        embeddings_path: Path = EMBEDDINGS_PATH,
    ) -> int:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        embeddings = json.loads(embeddings_path.read_text(encoding="utf-8"))
        cards_by_id = {card["id"]: card for card in catalog["cards"]}
        model = embeddings["model"]
        dims = embeddings["dimensions"]

        self.clear()
        for item in embeddings["cards"]:
            card_id = item["id"]
            self.put_card(
                card_id,
                item["embedding"],
                cards_by_id[card_id],
                embedding_text=item["embedding_text"],
                model=model,
            )
        self.ensure_vector_index(dims)
        return len(embeddings["cards"])
