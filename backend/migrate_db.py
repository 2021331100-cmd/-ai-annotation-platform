"""
Database migration script for PostgreSQL
Creates all tables in the database
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from database import SQLALCHEMY_DATABASE_URL, Base
import models

def create_tables():
    """Create all tables in the database"""
    try:
        print("Connecting to database...")
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        print("✓ All tables created successfully!")
        
        # Verify tables were created
        with engine.connect() as conn:
            # Check if it's PostgreSQL or SQLite
            if 'postgresql' in SQLALCHEMY_DATABASE_URL:
                result = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """))
            else:  # SQLite
                result = conn.execute(text("""
                    SELECT name as table_name
                    FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                    ORDER BY name
                """))
            tables = result.fetchall()
            
            print(f"\n✓ Created {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
        
        return True
        
    except SQLAlchemyError as e:
        print(f"✗ Error creating tables: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration Script")
    print("=" * 60)
    success = create_tables()
    sys.exit(0 if success else 1)
