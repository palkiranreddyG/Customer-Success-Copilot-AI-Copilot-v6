import os
import time
from pathlib import Path
from typing import List, Dict, Any
from backend.config import settings
from backend.db.chroma import get_kb_collection, get_memory_collection

def get_file_recency(source_name: str) -> float:
    playbook_path = Path(settings.DB_PATH).parent / "data" / "playbooks" / source_name
    if playbook_path.exists():
        return playbook_path.stat().st_mtime
    return 0.0

def run_retrieval(cleaned_text: str, interaction_type: str, account_id: str = "") -> dict:
    if not cleaned_text or not cleaned_text.strip():
        return {
            "chunks": [],
            "warning": "Retrieval Agent: empty query string provided."
        }
        
    try:
        collection = get_kb_collection()
        count = collection.count()
        
        chunks = []
        
        # 1. Fetch from KB
        if count > 0:
            query_text = f"Interaction Type: {interaction_type}\nQuery: {cleaned_text}"
            results = collection.query(
                query_texts=[query_text],
                n_results=min(15, count)
            )
            
            if results and "documents" in results and results["documents"]:
                documents = results["documents"][0]
                metadatas = results["metadatas"][0]
                distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(documents)
                
                for doc, meta, dist in zip(documents, metadatas, distances):
                    source = meta.get("source", "unknown")
                    section = meta.get("section", "unknown")
                    recency = get_file_recency(source)
                    
                    chunks.append({
                        "text": doc,
                        "source": source,
                        "section": section,
                        "score": float(dist),
                        "recency": recency
                    })
        
        # 2. Fetch from per-account Memory Collection
        if account_id:
            try:
                mem_col = get_memory_collection()
                if mem_col.count() > 0:
                    query_text = f"Interaction Type: {interaction_type}\nQuery: {cleaned_text}"
                    mem_results = mem_col.query(
                        query_texts=[query_text],
                        where={"account_id": {"$eq": account_id}},
                        n_results=5
                    )
                    
                    if mem_results and "documents" in mem_results and mem_results["documents"]:
                        documents = mem_results["documents"][0]
                        metadatas = mem_results["metadatas"][0]
                        distances = mem_results["distances"][0] if "distances" in mem_results and mem_results["distances"] else [0.0] * len(documents)
                        
                        for doc, meta, dist in zip(documents, metadatas, distances):
                            decision = meta.get("decision", "unknown")
                            note = meta.get("note", "")
                            text = f"Memory: Action '{doc}' was {decision}."
                            if note:
                                text += f" Note: {note}"
                                
                            # Small recency-weighted boost: subtract 0.1 from distance (lower is better)
                            score = max(0.0, float(dist) - 0.1)
                            timestamp = meta.get("timestamp", 0.0)
                            
                            chunks.append({
                                "text": text,
                                "source": "memory",
                                "section": f"{decision.upper()} ACTION",
                                "score": score,
                                "recency": timestamp
                            })
            except Exception as me:
                print(f"Retrieval Agent: failed to retrieve from memory collection: {me}")
                
        if not chunks:
            return {
                "chunks": [],
                "warning": "Retrieval Agent: No relevant context found in KB or memory."
            }
            
        # Re-rank by recency (descending - higher modification time first), then score (ascending - lower distance is better)
        chunks.sort(key=lambda x: (-x["recency"], x["score"]))
        
        # Take the top 5
        top_5 = chunks[:5]
        
        # Format output as expected: [{text, source, section, score}]
        formatted_chunks = []
        for c in top_5:
            formatted_chunks.append({
                "text": c["text"],
                "source": c["source"],
                "section": c["section"],
                "score": c["score"]
            })
            
        return {
            "chunks": formatted_chunks
        }
        
    except Exception as e:
        print(f"Retrieval Agent error: {e}")
        return {
            "chunks": [],
            "warning": f"Retrieval Agent execution error: {str(e)}"
        }
