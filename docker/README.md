# Docker Deployment für Restaurant Bookkeeping App

## Überblick

Dieses Dockerfile erstellt einen Single-Container mit:
- **Frontend**: React App (statisch gebaut)
- **Backend**: Node.js/Express API 
- **Proxy**: Python FastAPI (Port 8001)
- **Process Manager**: Supervisor

## Build & Run

### Docker Build
```bash
# Build the container
docker build -t restaurant-bookkeeping .

# Build with specific tag
docker build -t restaurant-bookkeeping:v1.0.0 .
```

### Docker Run (Entwicklung)
```bash
docker run -p 8001:8001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/restaurant_db" \
  -e JWT_SECRET="your-secret-key" \
  restaurant-bookkeeping
```

### Docker Compose (Optional)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/restaurant_db
      - JWT_SECRET=your-secret-key
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=restaurant_db
      - POSTGRES_USER=restaurant_user
      - POSTGRES_PASSWORD=restaurant_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Umgebungsvariablen

### Erforderlich
- `DATABASE_URL`: PostgreSQL Verbindungsstring
- `JWT_SECRET`: Geheimer Schlüssel für JWT Token

### Optional
- `JWT_EXPIRES_IN`: Token-Laufzeit (Standard: "8h")
- `JWT_REFRESH_EXPIRES_IN`: Refresh-Token-Laufzeit (Standard: "7d")
- `NODE_ENV`: Umgebung (Standard: "production")
- `PORT`: Backend-Port (Standard: "8002")

## Kubernetes/Helm Deployment

1. **PostgreSQL bereitstellen** (über Helm Chart)
2. **Secrets erstellen**:
   ```bash
   kubectl create secret generic restaurant-app-secrets \
     --from-literal=database-url="postgresql://..." \
     --from-literal=jwt-secret="your-secret"
   ```

3. **App deployen** mit den Secrets als Umgebungsvariablen

## Automatische Initialisierung

Beim ersten Container-Start werden automatisch:
- **Database Migrations** ausgeführt
- **Default Users** erstellt (falls keine existieren):
  - Username: `admin` | Passwort: `password123`
  - Username: `manager` | Passwort: `password123`
- **Basic Menu Structure** angelegt (falls leer)

## Health Check

Der Container bietet einen Health-Check unter `/health`:
- Prüft FastAPI Proxy
- Prüft Node.js Backend
- Gibt JSON-Status zurück

## Service-Management

Supervisor verwaltet:
- **fastapi-proxy**: Port 8001 (extern)
- **node-backend**: Port 8002 (intern)

## Logs

Service-Logs sind verfügbar unter:
- `/var/log/supervisor/fastapi-proxy.out.log`
- `/var/log/supervisor/node-backend.out.log`
- `/var/log/supervisor/supervisord.log`

## Entwicklung

Für lokale Entwicklung empfehlen wir weiterhin die direkte Ausführung ohne Docker, da Hot-Reload verfügbar ist.