#!/bin/bash

# Build script for Restaurant Bookkeeper Docker image

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="restaurant-bookkeeper"
TAG=${1:-latest}
CONTAINER_NAME="restaurant-bookkeeper"

echo -e "${BLUE}🐳 Building Restaurant Bookkeeper Docker Image${NC}"
echo -e "${YELLOW}Image: ${IMAGE_NAME}:${TAG}${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Stop and remove existing container if running
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
    docker stop ${CONTAINER_NAME} >/dev/null 2>&1 || true
    echo -e "${YELLOW}🗑️  Removing existing container...${NC}"
    docker rm ${CONTAINER_NAME} >/dev/null 2>&1 || true
fi

# Build the image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${TAG} .

# Check build success
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    
    # Show image info
    echo ""
    echo -e "${BLUE}📊 Image Information:${NC}"
    docker images ${IMAGE_NAME}:${TAG} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    echo ""
    echo -e "${GREEN}🚀 To run the container:${NC}"
    echo -e "${YELLOW}docker run -d --name ${CONTAINER_NAME} -p 8080:80 ${IMAGE_NAME}:${TAG}${NC}"
    echo ""
    echo -e "${GREEN}🐙 Or use Docker Compose:${NC}"
    echo -e "${YELLOW}docker-compose up -d${NC}"
    echo ""
    echo -e "${GREEN}🌐 Access the application at: http://localhost:8080${NC}"
    
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi