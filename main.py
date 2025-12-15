"""
Taiga Integration API - Main Application
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes import taiga_routes, favorites_routes
from app.database import init_db
import os

app = FastAPI(
    title="Taiga Bulk Task Manager API",
    description="API para gerenciamento em massa de tarefas no Taiga",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Include routers
app.include_router(taiga_routes.router, prefix="/api", tags=["taiga"])
app.include_router(favorites_routes.router, prefix="/api", tags=["favorites"])

# Serve static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "taiga-integration"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("APP_PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
