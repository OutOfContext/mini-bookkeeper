from fastapi import FastAPI, HTTPException, Request
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import httpx

app = FastAPI(title="Restaurant Bookkeeping API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Node.js subprocess
node_process = None

# Node.js server is managed by supervisor, no need to start it here
@app.on_event("startup")
async def startup_event():
    print("✅ FastAPI proxy server started")

@app.on_event("shutdown")
async def shutdown_event():
    print("🔄 FastAPI proxy server shutting down")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration"""
    try:
        # Check if Node.js backend is responding
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8002/api/health", timeout=5.0)
            if response.status_code == 200:
                return {"status": "healthy", "services": {"fastapi": "ok", "nodejs": "ok"}}
            else:
                return {"status": "unhealthy", "services": {"fastapi": "ok", "nodejs": "error"}}
    except Exception as e:
        return {"status": "unhealthy", "services": {"fastapi": "ok", "nodejs": "error"}, "error": str(e)}

# Proxy all API calls to Node.js server
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_node(path: str, request: Request):
    """Proxy API calls to Node.js Express server"""
    try:
        async with httpx.AsyncClient() as client:
            # Forward the request to Node.js server
            url = f"http://localhost:8002/api/{path}"
            
            # Get request body if it exists
            body = None
            if request.method != "GET":
                body = await request.body()
            
            # Forward the request
            response = await client.request(
                method=request.method,
                url=url,
                headers=dict(request.headers),
                content=body,
                params=request.query_params
            )
            
            # Return the response with the correct status code
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "Restaurant Bookkeeping API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)