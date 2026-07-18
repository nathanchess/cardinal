"""Clear Redis and load card embeddings with linked metadata."""

from redis_store.store import CardRedis


def main() -> None:
    store = CardRedis()
    count = store.load_catalog()
    print(f"Loaded {count} cards into Redis")


if __name__ == "__main__":
    main()
