import os
import json
import time
import uuid
from typing import List, Dict, Any
from backend.db.chroma import get_memory_collection

def add_memory_entry(account_id: str, rec: dict, decision: str, note: str | None = None):
    doc_text = rec.get("action_title", "")
    if not doc_text:
        return
        
    metadata = {
        "account_id": account_id,
        "decision": decision,
        "action_type": rec.get("action_type", ""),
        "note": note or "",
        "timestamp": time.time(),
        "action_title": doc_text
    }
    
    attempts = 0
    while attempts < 2:
        try:
            collection = get_memory_collection()
            collection.add(
                ids=[str(uuid.uuid4())],
                documents=[doc_text],
                metadatas=[metadata]
            )
            print(f"Memory Service: Successfully stored decision in ChromaDB memory on attempt {attempts + 1}.")
            break
        except Exception as e:
            attempts += 1
            print(f"Memory Service: ChromaDB write failed on attempt {attempts}: {e}")
            if attempts >= 2:
                print("Memory Service: Failed to write to ChromaDB memory after 2 attempts. Continuing (best-effort).")

def get_memory_entries(account_id: str) -> List[Dict[str, Any]]:
    try:
        collection = get_memory_collection()
        if collection.count() == 0:
            return []
            
        res = collection.get(
            where={"account_id": account_id}
        )
        
        entries = []
        if res and "metadatas" in res and res["metadatas"]:
            for meta in res["metadatas"]:
                entries.append({
                    "action_title": meta.get("action_title", ""),
                    "decision": meta.get("decision", ""),
                    "note": meta.get("note", ""),
                    "timestamp": meta.get("timestamp", 0.0),
                    "action_type": meta.get("action_type", "")
                })
        return entries
    except Exception as e:
        print(f"Memory Service: failed to read memory entries: {e}")
        return []

def query_similar_rejected_actions(account_id: str, action_title: str, limit: int = 5) -> List[Dict[str, Any]]:
    try:
        collection = get_memory_collection()
        if collection.count() == 0:
            return []
            
        res = collection.query(
            query_texts=[action_title],
            where={
                "$and": [
                    {"account_id": {"$eq": account_id}},
                    {"decision": {"$eq": "rejected"}}
                ]
            },
            n_results=limit
        )
        
        results = []
        if res and "documents" in res and res["documents"]:
            documents = res["documents"][0]
            metadatas = res["metadatas"][0]
            distances = res["distances"][0] if "distances" in res and res["distances"] else [0.0] * len(documents)
            
            for doc, meta, dist in zip(documents, metadatas, distances):
                # distance ranges from 0 to 2 for cosine distance in Chroma.
                # similarity can be approximated as: similarity = 1 - dist (or cosine similarity).
                # Let's compute a simple distance-based similarity score.
                similarity = 1.0 - float(dist)
                results.append({
                    "action_title": doc,
                    "decision": meta.get("decision"),
                    "note": meta.get("note"),
                    "distance": float(dist),
                    "similarity": similarity
                })
        return results
    except Exception as e:
        print(f"Memory Service: failed to query similar rejected actions: {e}")
        return []
