import os
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from backend.config import settings
from backend.db.chroma import get_kb_collection

# Import pypdf for PDF processing
try:
    import pypdf
except ImportError:
    pypdf = None

router = APIRouter(prefix="/api/v1/kb", tags=["Knowledge Base"])

PLAYBOOKS_DIR = Path(settings.DB_PATH).parent / "data" / "playbooks"
os.makedirs(PLAYBOOKS_DIR, exist_ok=True)

def read_docx(file_path: Path) -> str:
    """Extract text from a DOCX file using python standard zipfile and xml libraries."""
    try:
        with zipfile.ZipFile(file_path) as docx:
            tree = ET.fromstring(docx.read('word/document.xml'))
            # Iterate through XML finding paragraph paragraphs
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                text = ''.join(
                    node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text
                )
                if text:
                    paragraphs.append(text)
            return '\n\n'.join(paragraphs)
    except Exception as e:
        raise ValueError(f"Failed to read DOCX XML: {e}")

def read_pdf(file_path: Path) -> str:
    """Extract text from a PDF file using pypdf."""
    if not pypdf:
        raise ValueError("pypdf package is not installed. Unable to parse PDF.")
    try:
        reader = pypdf.PdfReader(file_path)
        pages_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
        return '\n\n'.join(pages_text)
    except Exception as e:
        raise ValueError(f"Failed to read PDF: {e}")

def chunk_text_content(text: str, filename: str) -> list[dict]:
    """Split text into chunks of ~512 tokens (approx 380 words) with overlapping words."""
    doc_type = "playbook"
    lines = text.split("\n")
    current_section = "General"
    paragraphs = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            current_section = stripped.lstrip("#").strip()
            continue
        paragraphs.append((current_section, stripped))
        
    chunks = []
    current_chunk_words = []
    current_chunk_section = "General"
    
    target_words = 380
    overlap_words = 38
    
    for section, para in paragraphs:
        para_words = para.split()
        if not para_words:
            continue
            
        current_len = len(current_chunk_words) + len(para_words)
        
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
            overlap = current_chunk_words[-overlap_words:] if len(current_chunk_words) >= overlap_words else current_chunk_words
            current_chunk_words = list(overlap) + para_words
            current_chunk_section = section
        else:
            current_chunk_words.extend(para_words)
            if current_chunk_section == "General":
                current_chunk_section = section
                
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

@router.get("/playbooks")
async def list_playbooks():
    """List all playbook files in the playbooks directory and report status."""
    playbooks = []
    if not PLAYBOOKS_DIR.exists():
        return []
        
    collection = get_kb_collection()
    
    for item in PLAYBOOKS_DIR.iterdir():
        if item.is_file() and item.suffix.lower() in ('.md', '.txt', '.pdf', '.docx'):
            # Count indexed chunks in ChromaDB
            try:
                results = collection.get(where={"source": item.name})
                chunk_count = len(results.get("ids", []))
            except Exception:
                chunk_count = 0
                
            playbooks.append({
                "name": item.name,
                "size_bytes": item.stat().st_size,
                "suffix": item.suffix,
                "chunk_count": chunk_count,
                "indexed": chunk_count > 0
            })
    return playbooks

@router.get("/playbooks/{filename}")
async def get_playbook_content(filename: str):
    """Retrieve full content/sections of a playbook."""
    file_path = PLAYBOOKS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Playbook file not found")
        
    suffix = file_path.suffix.lower()
    content = ""
    try:
        if suffix in ('.md', '.txt'):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        elif suffix == '.pdf':
            content = read_pdf(file_path)
        elif suffix == '.docx':
            content = read_docx(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
        
    # Get sections and preview of chunks
    collection = get_kb_collection()
    try:
        results = collection.get(where={"source": filename})
        chunks = [
            {"id": cid, "text": doc, "section": meta.get("section", "General")}
            for cid, doc, meta in zip(results.get("ids", []), results.get("documents", []), results.get("metadatas", []))
        ]
    except Exception:
        chunks = []
        
    return {
        "name": filename,
        "content": content,
        "chunks": chunks
    }

@router.post("/upload")
async def upload_playbook(file: UploadFile = File(...)):
    """Upload a Markdown, Text, PDF, or DOCX playbook. Chunk, embed and insert into ChromaDB."""
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ('.md', '.txt', '.pdf', '.docx'):
        raise HTTPException(status_code=400, detail="Only .md, .txt, .pdf, and .docx formats are supported.")
        
    file_path = PLAYBOOKS_DIR / file.filename
    
    # Save the file first
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    # Extract text content
    try:
        if suffix in ('.md', '.txt'):
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        elif suffix == '.pdf':
            text = read_pdf(file_path)
        elif suffix == '.docx':
            text = read_docx(file_path)
        else:
            text = ""
    except Exception as e:
        # Cleanup file if text extraction fails
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Text extraction failed: {str(e)}")
        
    if not text.strip():
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="Extracted text is empty. File cannot be indexed.")
        
    # Chunk the text
    chunks = chunk_text_content(text, file.filename)
    
    # Ingest chunks into ChromaDB
    collection = get_kb_collection()
    
    ids = []
    documents = []
    metadatas = []
    
    # Generate unique IDs for each chunk based on stem
    stem = Path(file.filename).stem
    for idx, chunk in enumerate(chunks):
        ids.append(f"uploaded_{stem}_chunk_{idx}")
        documents.append(chunk["text"])
        metadatas.append(chunk["metadata"])
        
    try:
        # Delete existing chunks for this file if any
        existing_results = collection.get(where={"source": file.filename})
        if existing_results and existing_results["ids"]:
            collection.delete(ids=existing_results["ids"])
            
        if ids:
            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChromaDB indexing failed: {str(e)}")
        
    return {
        "status": "success",
        "filename": file.filename,
        "chunks_indexed": len(ids)
    }

@router.delete("/playbooks/{filename}")
async def delete_playbook(filename: str):
    """Delete a playbook file and clean its corresponding entries from ChromaDB."""
    file_path = PLAYBOOKS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Playbook file not found")
        
    # Delete from file system
    try:
        os.remove(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
        
    # Delete from ChromaDB
    collection = get_kb_collection()
    try:
        results = collection.get(where={"source": filename})
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
    except Exception as e:
        print(f"Warning: Failed to delete chunks from ChromaDB: {e}")
        
    return {"status": "success", "filename": filename}
