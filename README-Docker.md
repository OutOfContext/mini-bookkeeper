# Restaurant Bookkeeper v1 - Docker Deployment

## Quick Start with Docker

### Method 1: Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at: **http://localhost:8080**

### Method 2: Using Docker directly

```bash
# Build the image
docker build -t restaurant-bookkeeper:latest .

# Run the container
docker run -d \
  --name restaurant-bookkeeper \
  -p 8080:80 \
  --restart unless-stopped \
  restaurant-bookkeeper:latest

# View logs
docker logs -f restaurant-bookkeeper

# Stop and remove
docker stop restaurant-bookkeeper
docker rm restaurant-bookkeeper
```

## Docker Image Details

### Optimization Features
- **Multi-stage build** for minimal image size
- **Alpine Linux** base images for security and size
- **Nginx** as production web server
- **Gzip compression** enabled
- **Static asset caching** with proper headers
- **Security headers** included
- **Health checks** configured

### Image Size
- Development dependencies: ~500MB (build stage)
- Production image: ~25MB (nginx + app)

### Performance Features
- Static asset caching (1 year for assets)
- Gzip compression for text files
- Optimized nginx configuration
- SPA routing support for React Router

## Environment Variables

The application uses IndexedDB for local storage, so no database configuration is needed.

## Health Check

The container includes a health check endpoint:
- **URL**: `/health`
- **Response**: `200 OK` with "healthy" text
- **Interval**: Every 30 seconds

## Production Deployment

### Using Docker Swarm
```bash
# Deploy as a service
docker service create \
  --name restaurant-bookkeeper \
  --publish 8080:80 \
  --replicas 2 \
  restaurant-bookkeeper:latest
```

### Using Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: restaurant-bookkeeper
spec:
  replicas: 2
  selector:
    matchLabels:
      app: restaurant-bookkeeper
  template:
    metadata:
      labels:
        app: restaurant-bookkeeper
    spec:
      containers:
      - name: bookkeeper
        image: restaurant-bookkeeper:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: restaurant-bookkeeper
spec:
  selector:
    app: restaurant-bookkeeper
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## Default Login

- **Username**: `admin`
- **Password**: `admin123`

## Troubleshooting

### Check container status
```bash
docker ps -a
```

### View container logs
```bash
docker logs restaurant-bookkeeper
```

### Access container shell
```bash
docker exec -it restaurant-bookkeeper /bin/sh
```

### Rebuild after changes
```bash
docker-compose build --no-cache
docker-compose up -d
```