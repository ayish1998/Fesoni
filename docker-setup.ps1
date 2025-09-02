# Fesoni Docker Setup Script
Write-Host "🚀 Setting up Fesoni with Docker..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Copy environment file
if (Test-Path ".env.docker") {
    Copy-Item ".env.docker" ".env"
    Write-Host "✅ Environment file configured" -ForegroundColor Green
} else {
    Write-Host "❌ .env.docker file not found" -ForegroundColor Red
    exit 1
}

# Build and start services
Write-Host "🔧 Building and starting Docker services..." -ForegroundColor Yellow
docker-compose up -d --build

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

$services = @(
    @{Name="Kong API Gateway"; URL="http://localhost:8001"; Port=8001},
    @{Name="LavinMQ Management"; URL="http://localhost:15672"; Port=15672},
    @{Name="Redis"; URL="localhost"; Port=6379},
    @{Name="Fesoni App"; URL="http://localhost:5173"; Port=5173}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 5 -UseBasicParsing
        Write-Host "✅ $($service.Name) is running on port $($service.Port)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $($service.Name) might still be starting on port $($service.Port)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Fesoni Docker setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   • Fesoni App: http://localhost:5173" -ForegroundColor White
Write-Host "   • Kong Admin: http://localhost:8001" -ForegroundColor White
Write-Host "   • Kong Manager: http://localhost:8002" -ForegroundColor White
Write-Host "   • LavinMQ Management: http://localhost:15672" -ForegroundColor White
Write-Host "   • Mock OpenAI API: http://localhost:3001" -ForegroundColor White
Write-Host "   • Mock Amazon API: http://localhost:3002" -ForegroundColor White
Write-Host "   • Mock Foxit API: http://localhost:3003" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "   • View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   • Stop services: docker-compose down" -ForegroundColor White
Write-Host "   • Restart services: docker-compose restart" -ForegroundColor White
Write-Host "   • View running containers: docker-compose ps" -ForegroundColor White