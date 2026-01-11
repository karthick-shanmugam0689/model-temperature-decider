# Temperature Probability Visualizer

Explore how temperature affects LLM token probability distributions.

![Temperature Visualizer](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Rspack](https://img.shields.io/badge/Rspack-1.3-orange)

## Features

- **Multi-Provider Support**: OpenAI, Google Gemini, and Ollama (local)
- **Real-time Visualization**: Interactive bar chart showing token probabilities
- **Temperature Control**: Adjust temperature from 0 (deterministic) to 1 (creative)
- **Selected Token Display**: See which token the model actually chose

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- API keys for OpenAI and/or Google AI (optional: Ollama running locally)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file and add your API keys
cp .env.example .env
```

### Development

```bash
# Start development server on port 3001
pnpm dev
```

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Configuration

Create a `.env` file with your API keys:

```env
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

For Ollama, ensure it's running locally on port 11434 (default).

## Supported Models

### OpenAI
- GPT-5.2
- GPT-4o

### Google Gemini
- Gemini 2.5 Flash.

Unfortunately all other latest gemini models doesn't support log probabilities

### Ollama (Local)
- Any models you have installed locally

## How It Works

1. **Select a Provider & Model**: Choose from OpenAI, Gemini, or Ollama
2. **Enter a Prompt**: Type the text you want to continue
3. **Set Temperature**: Adjust how creative/deterministic the model should be
4. **Compute**: Click to see the probability distribution for the next token

Lower temperature → More deterministic (model picks highest probability token)
Higher temperature → More creative (model samples from flatter distribution)
