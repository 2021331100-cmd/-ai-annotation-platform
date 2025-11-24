"""
Simple script to query the SQLite database
Run with: python query_db.py
"""
import sqlite3
import sys

# Database path
DB_PATH = "annotation_platform.db"

def execute_query(query):
    """Execute a SQL query and display results"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(query)
        
        # Get column names
        columns = [description[0] for description in cursor.description] if cursor.description else []
        
        # Fetch results
        rows = cursor.fetchall()
        
        if columns:
            # Print column headers
            print("\n" + " | ".join(columns))
            print("-" * (len(" | ".join(columns))))
            
            # Print rows
            if rows:
                for row in rows:
                    print(" | ".join(str(val) for val in row))
                print(f"\nTotal rows: {len(rows)}")
            else:
                print("No rows found")
        else:
            print(f"Query executed successfully. Rows affected: {cursor.rowcount}")
        
        conn.commit()
        conn.close()
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")

def show_tables():
    """Show all tables in the database"""
    query = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    print("=== Available Tables ===")
    execute_query(query)

def show_table_structure(table_name):
    """Show structure of a specific table"""
    query = f"PRAGMA table_info({table_name});"
    print(f"\n=== Structure of table '{table_name}' ===")
    execute_query(query)

def main():
    print("=" * 60)
    print("SQLite Database Query Tool")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        # Execute query from command line
        query = " ".join(sys.argv[1:])
        print(f"\nExecuting: {query}\n")
        execute_query(query)
    else:
        # Interactive mode
        print("\nCommands:")
        print("  tables              - Show all tables")
        print("  structure <table>   - Show table structure")
        print("  users               - Show all users")
        print("  projects            - Show all projects")
        print("  datasets            - Show all datasets")
        print("  tasks               - Show all tasks")
        print("  annotations         - Show all annotations")
        print("  custom <SQL>        - Execute custom SQL query")
        print("  quit                - Exit")
        
        while True:
            print("\n" + "=" * 60)
            cmd = input("Enter command: ").strip().lower()
            
            if cmd == "quit":
                break
            elif cmd == "tables":
                show_tables()
            elif cmd.startswith("structure "):
                table_name = cmd.split()[1]
                show_table_structure(table_name)
            elif cmd == "users":
                execute_query("SELECT * FROM users;")
            elif cmd == "projects":
                execute_query("SELECT * FROM projects;")
            elif cmd == "datasets":
                execute_query("SELECT * FROM datasets;")
            elif cmd == "tasks":
                execute_query("SELECT * FROM tasks;")
            elif cmd == "annotations":
                execute_query("SELECT * FROM annotations;")
            elif cmd.startswith("custom "):
                query = cmd[7:]
                execute_query(query)
            else:
                print("Unknown command. Type 'quit' to exit.")

if __name__ == "__main__":
    main()
