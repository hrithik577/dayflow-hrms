import sys
import os

# Add root project directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.seeds.seed_data import seed_database

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
