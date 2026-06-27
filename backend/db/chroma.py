import os
import json
import hashlib
from pathlib import Path
import numpy as np
import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from backend.config import settings

CACHE_FILE = Path(settings.CHROMA_PATH).parent / "embeddings_cache.json"

class DynamicEmbeddingFunction(EmbeddingFunction):
    def __init__(self):
        self.provider = "mock"
        self.client = None
        self.cache = {}
        
        # Load Cache from disk
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    self.cache = json.load(f)
                print(f"ChromaDB: Loaded {len(self.cache)} cached embeddings from disk.")
            except Exception as e:
                print(f"ChromaDB: Error loading embedding cache: {e}")

        # Read API Keys from settings/environment
        gemini_key = settings.GEMINI_API_KEY
        openai_key = settings.OPENAI_API_KEY
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                self.provider = "gemini"
                print("ChromaDB: Initialized Gemini Embedding Function.")
            except ImportError:
                print("ChromaDB: google-generativeai package missing, skipping Gemini fallback.")
                
        if self.provider == "mock" and openai_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=openai_key)
                self.provider = "openai"
                print("ChromaDB: Initialized OpenAI Embedding Function.")
            except ImportError:
                print("ChromaDB: openai package missing, skipping OpenAI fallback.")
                
        if self.provider == "mock":
            try:
                from sentence_transformers import SentenceTransformer
                self.client = SentenceTransformer("all-MiniLM-L6-v2")
                self.provider = "local"
                print("ChromaDB: Initialized Local SentenceTransformer (all-MiniLM-L6-v2).")
            except ImportError:
                print("ChromaDB: sentence-transformers not found. Using Mock token-hash embedding as ultimate fallback.")

    def save_cache(self):
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.cache, f)
            print(f"ChromaDB: Saved embedding cache ({len(self.cache)} items) to disk.")
        except Exception as e:
            print(f"ChromaDB: Error saving embedding cache to disk: {e}")

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        uncached_texts = []
        uncached_indices = []

        for idx, text in enumerate(input):
            if text in self.cache:
                embeddings.append(self.cache[text])
            else:
                # Placeholder for ordering
                embeddings.append(None)
                uncached_texts.append(text)
                uncached_indices.append(idx)

        if uncached_texts:
            new_embeddings = []
            if self.provider == "gemini":
                import google.generativeai as genai
                for text in uncached_texts:
                    try:
                        result = genai.embed_content(
                            model="models/embedding-001",
                            content=text,
                            task_type="retrieval_document"
                        )
                        new_embeddings.append(result['embedding'])
                    except Exception as e:
                        print(f"Gemini embedding failed: {e}. Falling back to deterministic hash.")
                        new_embeddings.append(self._mock_embedding(text))
                        
            elif self.provider == "openai":
                try:
                    response = self.client.embeddings.create(
                        input=uncached_texts,
                        model="text-embedding-3-small"
                    )
                    new_embeddings = [data.embedding for data in response.data]
                except Exception as e:
                    print(f"OpenAI embedding failed: {e}. Falling back to deterministic hash.")
                    new_embeddings = [self._mock_embedding(text) for text in uncached_texts]
                
            elif self.provider == "local":
                try:
                    res = self.client.encode(uncached_texts)
                    new_embeddings = res.tolist()
                except Exception as e:
                    print(f"Local embedding failed: {e}. Falling back to deterministic hash.")
                    new_embeddings = [self._mock_embedding(text) for text in uncached_texts]
                
            else:
                new_embeddings = [self._mock_embedding(text) for text in uncached_texts]

            # Populate cache and main list
            for idx, text, emb in zip(uncached_indices, uncached_texts, new_embeddings):
                self.cache[text] = emb
                embeddings[idx] = emb
            
            # Save updated cache to disk
            self.save_cache()

        return embeddings

    def _mock_embedding(self, text: str) -> list[float]:
        dim = 384
        vec = np.zeros(dim)
        h = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16)
        np.random.seed(h & 0xFFFFFFFF)
        vec = np.random.randn(dim)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

def get_chroma_client():
    os.makedirs(settings.CHROMA_PATH, exist_ok=True)
    return chromadb.PersistentClient(path=settings.CHROMA_PATH)

def get_kb_collection():
    client = get_chroma_client()
    embedding_func = DynamicEmbeddingFunction()
    return client.get_or_create_collection(
        name="org_demo_kb",
        embedding_function=embedding_func
    )

def get_memory_collection():
    client = get_chroma_client()
    embedding_func = DynamicEmbeddingFunction()
    return client.get_or_create_collection(
        name="org_demo_memory",
        embedding_function=embedding_func
    )
