# 🐳 Fesoni Docker Setup Guide

This guide will help you run Fesoni with all its enterprise services using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM available for Docker
- Ports 5173, 8000-8002, 15672, 6379, 3001-3003 available

### 1. Run the Setup Script
```powershell
.\docker-setup.ps1
```

### 2. Manual Setup (Alternative)
If you prefer manual setup:

```powershell
# Copy environment file
Copy-Item .env.docker .env

# Start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

## 📋 Services Included

| Service | Port | Description | URL |
|---------|------|-------------|-----|
| **Fesoni App** | 5173 | Main React application | http://localhost:5173 |
| **Kong Gateway** | 8000 | API Gateway proxy | http://localhost:8000 |
| **Kong Admin** | 8001 | Kong administration | http://localhost:8001 |
| **Kong Manager** | 8002 | Kong web interface | http://localhost:8002 |
| **LavinMQ** | 15672 | Message queue management | http://localhost:15672 |
| **Redis** | 6379 | Caching service | localhost:6379 |
| **Mock OpenAI** | 3001 | Development API mock | http://localhost:3001 |
| **Mock Amazon** | 3002 | Development API mock | http://localhost:3002 |
| **Mock Foxit** | 3003 | Development API mock | http://localhost:3003 |

## 🔧 Configuration

### Environment Variables
Edit `.env` file to configure:
- API keys (OpenAI, RapidAPI, Foxit)
- Service URLs
- Development settings

### Kong API Gateway
Access Kong Manager at http://localhost:8002 to:
- Configure API routes
- Set up rate limiting
- Monitor API traffic
- Manage authentication

### LavinMQ Message Queue
Access LavinMQ Management at http://localhost:15672:
- Username: `fesoni`
- Password: `fesonipass`

## 🛠️ Development Commands

```powershell
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f fesoni-app
docker-compose logs -f kong
docker-compose logs -f lavinmq

# Restart a specific service
docker-compose restart fesoni-app

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

## 🔍 Troubleshooting

### Service Won't Start
```powershell
# Check if ports are in use
netstat -an | findstr "5173\|8000\|8001\|8002\|15672\|6379"

# Check Docker logs
docker-compose logs [service-name]
```

### Reset Everything
```powershell
# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove Docker images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

### Performance Issues
- Increase Docker Desktop memory allocation (Settings > Resources)
- Close unnecessary applications
- Use `docker system prune` to clean up unused resources

## 🎯 Testing the Setup

1. **Fesoni App**: Visit http://localhost:5173
2. **Kong Health**: `curl http://localhost:8001/status`
3. **LavinMQ**: Visit http://localhost:15672
4. **Mock APIs**: 
   - `curl http://localhost:3001/chat.json`
   - `curl http://localhost:3002/search.json`
   - `curl http://localhost:3003/generate.json`

## 🔐 Production Deployment

For production, update:
1. Change default passwords in `docker-compose.yml`
2. Use real API keys in `.env`
3. Configure SSL certificates
4. Set up proper networking and security groups
5. Use `docker-compose.prod.yml` for production overrides

## 📚 Additional Resources

- [Kong Documentation](https://docs.konghq.com/)
- [LavinMQ Documentation](https://lavinmq.com/documentation)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Fesoni Architecture Guide](./README.md)