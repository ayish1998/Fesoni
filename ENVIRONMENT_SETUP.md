# Environment Setup Guide

## Quick Start

1. Copy the example environment files:
   ```bash
   cp .env.example .env
   cp .env.docker.example .env.docker
   ```

2. Update the `.env` file with your actual API keys and configuration values.

## Required API Keys

### OpenAI
- Get your API key from: https://platform.openai.com/api-keys
- Set `VITE_OPENAI_API_KEY` in your `.env` file

### RapidAPI (for Amazon data)
- Sign up at: https://rapidapi.com/
- Subscribe to the Amazon data service
- Set `VITE_RAPIDAPI_KEY` in your `.env` file

### Foxit Document APIs
- Get your API key from: https://developers.foxit.com/
- Set `VITE_FOXIT_API_KEY` in your `.env` file

### Kong API Gateway
- Configure your Kong instance
- Set `VITE_KONG_GATEWAY_URL` and `VITE_KONG_API_KEY`

### LavinMQ (Message Queue)
- Set up your LavinMQ instance or use CloudAMQP
- Configure the connection details in your `.env` file

## Security Notes

- Never commit `.env` or `.env.docker` files to version control
- Keep your API keys secure and rotate them regularly
- Use different keys for development and production environments

## Docker Development

For Docker development, use the `.env.docker` file which points to local services running in containers.