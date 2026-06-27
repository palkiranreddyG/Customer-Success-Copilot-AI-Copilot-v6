import argparse
import sys
from pathlib import Path

# Add backend directory to path if needed to allow running script directly
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.config import settings
from backend.services.ingestion_service import ingest_playbooks

def main():
    parser = argparse.ArgumentParser(description="Seed ChromaDB with Playbook Markdowns.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-seed by clearing existing ChromaDB collection first."
    )
    args = parser.parse_args()
    
    playbooks_dir = Path(settings.DB_PATH).parent / "data" / "playbooks"
    
    print(f"Seeding playbooks from: {playbooks_dir}")
    doc_count, chunk_count = ingest_playbooks(playbooks_dir, force=args.force)
    
    print(f"{doc_count} docs, {chunk_count} chunks ingested.")

if __name__ == "__main__":
    main()
