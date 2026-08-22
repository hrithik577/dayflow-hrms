import uvicorn
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir in sys.path:
    sys.path.remove(backend_dir)
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting Dayflow Backend API server on port {port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True, app_dir=backend_dir)
