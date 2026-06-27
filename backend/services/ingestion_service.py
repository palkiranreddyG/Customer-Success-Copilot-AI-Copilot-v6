import os
from pathlib import Path
from backend.db.chroma import get_kb_collection

def chunk_markdown_file(filepath: Path) -> list[dict]:
    """
    Split markdown playbooks at paragraph boundaries.
    Maintains sections, aims for ~512 tokens (word count based estimation)
    and overlays last ~50 tokens.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    filename = filepath.name
    doc_type = "playbook"
    
    # Parse by line to detect headers and group content
    lines = content.split("\n")
    current_section = "General"
    paragraphs = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            # Update current section title, cleaning up heading Markdown markers
            current_section = stripped.lstrip("#").strip()
            continue
        paragraphs.append((current_section, stripped))
        
    chunks = []
    current_chunk_words = []
    current_chunk_section = "General"
    
    # Word count heuristics: ~512 tokens ≈ 384 words (using standard 0.75 ratio)
    # 50-token overlap ≈ 38 words.
    target_words = 380
    overlap_words = 38
    
    for section, para in paragraphs:
        para_words = para.split()
        if not para_words:
            continue
            
        current_len = len(current_chunk_words) + len(para_words)
        
        # If adding this paragraph exceeds our token limit, we close the current chunk
        if current_len > target_words and len(current_chunk_words) > 0:
            chunk_text = " ".join(current_chunk_words)
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "source": filename,
                    "source_doc": filename,
                    "section": current_chunk_section,
                    "section_title": current_chunk_section,
                    "doc_type": doc_type
                }
            })
            # Carry over overlap
            overlap = current_chunk_words[-overlap_words:] if len(current_chunk_words) >= overlap_words else current_chunk_words
            current_chunk_words = list(overlap) + para_words
            current_chunk_section = section
        else:
            current_chunk_words.extend(para_words)
            if current_chunk_section == "General":
                current_chunk_section = section
                
    # Append the last chunk
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "text": chunk_text,
            "metadata": {
                "source": filename,
                "source_doc": filename,
                "section": current_chunk_section,
                "section_title": current_chunk_section,
                "doc_type": doc_type
            }
        })
        
    return chunks

def ingest_playbooks(playbooks_dir: Path, force: bool = False) -> tuple[int, int]:
    """
    Ingests all markdown files from the playbooks directory into ChromaDB.
    Returns a tuple of (number of documents processed, number of chunks ingested).
    """
    collection = get_kb_collection()
    
    if force:
        # Delete existing entries in the collection if force=True
        # To do this safely, we can delete by filtering or just get all and delete
        try:
            results = collection.get()
            if results and results["ids"]:
                collection.delete(ids=results["ids"])
                print("ChromaDB: Cleared collection org_demo_kb for fresh re-seed.")
        except Exception as e:
            print(f"ChromaDB: Error clearing collection: {e}")
            
    # Process playbooks directory
    doc_count = 0
    total_chunks = 0
    
    if not playbooks_dir.exists():
        print(f"Error: Playbooks directory {playbooks_dir} does not exist.")
        return 0, 0
        
    for filepath in playbooks_dir.glob("*.md"):
        chunks = chunk_markdown_file(filepath)
        doc_count += 1
        
        ids = []
        documents = []
        metadatas = []
        
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{filepath.stem}_chunk_{idx}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            metadatas.append(chunk["metadata"])
            
        if ids:
            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            total_chunks += len(ids)
            
    return doc_count, total_chunks
