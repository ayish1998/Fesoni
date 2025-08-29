# Fesoni - Your AI Shopping Assistant

Fesoni is an AI-powered shopping assistant that understands your aesthetic preferences and finds matching products from Amazon. Built with enterprise-grade APIs for scalable, professional performance.

## Features

- **Voice-Enabled Chat**: Describe your style naturally using voice or text
- **AI Aesthetic Analysis**: Powered by OpenAI GPT-4 for intelligent style understanding
- **Product Discovery**: Find Amazon products that match your vibe via RapidAPI
- **Personalized Style Guides**: Generate beautiful PDF lookbooks with Foxit APIs
- **Enterprise Architecture**: Kong API Gateway, LavinMQ queues, real-time processing

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **AI**: OpenAI GPT-4 for aesthetic analysis
- **E-commerce**: Amazon Product API via RapidAPI
- **API Management**: Kong Gateway for routing and rate limiting
- **Message Queue**: LavinMQ for async processing
- **Document Generation**: Foxit APIs for PDF creation
- **Voice**: Web Speech API for voice input/output

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your API keys:
   - OpenAI API key
   - RapidAPI key for Amazon products
   - Kong Gateway credentials
   - LavinMQ connection details
   - Foxit Document API key

4. Start the development server: `npm run dev`

## API Keys Required

- **OpenAI**: For aesthetic analysis and product descriptions
- **RapidAPI**: For Amazon product search
- **Kong**: For API gateway management
- **LavinMQ**: For message queue processing
- **Foxit**: For PDF style guide generation

## Usage

1. Describe your aesthetic using natural language
2. Use voice input for hands-free interaction
3. Browse curated products that match your style
4. Download personalized style guides as PDFs
5. Monitor system performance in real-time

## Example Prompts

- "I love dark academia with vintage elements"
- "Minimalist Scandinavian vibes with warm wood"
- "Cottagecore aesthetic with earthy, natural tones"
- "Modern industrial with cozy accents"

Built with enterprise-grade reliability for seamless aesthetic-based shopping experiences.