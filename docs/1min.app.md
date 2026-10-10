---
type: Reference
title: API 1min.AI — Chat with AI
description: Documentation du point d'accès de conversation de 1min.AI, utilisé pour l'avis de l'IA sur le planning.
resource: https://api.1min.ai/api/chat-with-ai
tags: [reference, api, ia]
timestamp: 2026-10-06T00:00:00Z
---
# Chat with AI API

A unified chat endpoint that consolidates all AI chat interactions into a single, streamlined API.

> **Migration notice** — Legacy chat feature types (`CHAT_WITH_AI`, `CHAT_WITH_IMAGE`, `CHAT_WITH_PDF`, `CHAT_WITH_YOUTUBE_VIDEO`) are deprecated for the AI Feature API and legacy conversation creation. Use this Chat with AI API with the `UNIFY_CHAT_WITH_AI` type for all chat integrations.

## Overview

The Chat with AI API provides a dedicated endpoint for all chat-related interactions, replacing the need to use the general-purpose AI Feature API for chat. It supports both streaming and non-streaming modes, web search, image attachments, conversation history, brand voice, and memory features.

Key benefits over the legacy AI Feature API for chat:

- Dedicated chat endpoint with optimized streaming
- Structured prompt settings (web search, history, attachments) via a clean nested object
- Built-in support for AI memory across conversations
- Simplified request format

## Endpoints

| Mode | Method | URL |
|---|---|---|
| Streaming chat | `POST` | `https://api.1min.ai/api/chat-with-ai?isStreaming=true` |
| Non-streaming chat | `POST` | `https://api.1min.ai/api/chat-with-ai` |

## Authentication

All requests require authentication using an API key in the request header.

| Field | Value |
|---|---|
| `API-KEY` | `<api-key>` |
| `Content-Type` | `application/json` |

## Create a Conversation for History

If you want to maintain context across multiple messages, create a conversation first and then pass the returned `uuid` as `promptObject.conversationId` in Chat with AI requests.

Use `UNIFY_CHAT_WITH_AI` when creating chat conversations. Legacy chat conversation types are no longer supported for new conversation creation.

`POST https://api.1min.ai/api/conversations`

### Conversation Request Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `type` | string | ✔️ | Conversation type. Must be `UNIFY_CHAT_WITH_AI` |
| `title` | string | ✔️ | Conversation title |
| `model` | string | ✔️ | AI model used for the conversation |

### Example

```bash
curl -X POST "https://api.1min.ai/api/conversations" \
  -H "API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "type": "UNIFY_CHAT_WITH_AI",
  "title": "My AI Conversation",
  "model": "gpt-4o-mini"
}'
```

Use the returned `uuid` as `promptObject.conversationId` when calling the Chat with AI endpoint.

## Request Payload

### Required Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `type` | string | ✔️ | Feature type. Must be `UNIFY_CHAT_WITH_AI` |
| `model` | string | ✔️ | AI model to use |
| `promptObject` | object | ✔️ | Chat parameters (see below) |

### Optional Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `brandVoiceId` | string | - | Brand voice ID to apply a custom tone/style to the response |
| `metadata` | object | - | Additional metadata for the request |

### promptObject Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `prompt` | string | ✔️ | The user's message |
| `conversationId` | string | - | Conversation ID for multi-turn chat context |
| `settings` | object | - | Chat settings (see below) |
| `attachments` | object | - | File and image attachments (see below) |

### settings Object

| Parameter | Type | Required | Description |
|---|---|---|---|
| `webSearchSettings` | object | - | Web search configuration |
| `historySettings` | object | - | Conversation history configuration |
| `withMemories` | boolean | - | Enable AI memory across conversations (default: `false`) |

### webSearchSettings

| Parameter | Type | Default | Description |
|---|---|---|---|
| `webSearch` | boolean | `false` | Enable web search for grounding responses |
| `numOfSite` | number | `3` | Number of sites to search (when `webSearch` is true) |
| `maxWord` | number | `1000` | Maximum words from web search (when `webSearch` is true) |

### historySettings

| Parameter | Type | Default | Description |
|---|---|---|---|
| `isMixed` | boolean | `false` | Mix context from different AI models in conversation history |
| `historyMessageLimit` | number | `10` | Maximum number of history messages to include as context |

### attachments Object

| Parameter | Type | Default | Description |
|---|---|---|---|
| `images` | string[] | `[]` | Image URLs or asset keys from Asset API |
| `files` | string[] | `[]` | File IDs from Asset API |

## Available Models

### Alibaba

| Model ID | Name |
|---|---|
| `qwen3.7-plus` | Qwen 3.7 Plus - Alibaba Cloud |
| `qwen3.7-max` | Qwen 3.7 Max - Alibaba Cloud |
| `qwen3.7-flash` | Qwen 3.7 Flash - Alibaba Cloud |
| `qwen3.6-plus` | Qwen 3.6 Plus - Alibaba Cloud |
| `qwen3.6-max-preview` | Qwen 3.6 Max Preview - Alibaba Cloud |
| `qwen3.6-flash` | Qwen 3.6 Flash - Alibaba Cloud |
| `qwen3-vl-plus` | Qwen3 VL Plus - Alibaba Cloud |
| `qwen3-vl-flash` | Qwen3 VL Flash - Alibaba Cloud |
| `qwen3-vl-8b-thinking` | Qwen3 VL 8B Thinking |
| `qwen3-max` | Qwen3 Max - Alibaba Cloud |
| `qwen3-8b` | Qwen3 8B |
| `qwen-vl-plus` | Qwen VL Plus - Alibaba Cloud |
| `qwen-vl-max` | Qwen VL Max - Alibaba Cloud |
| `qwen-plus` | Qwen Plus - Alibaba Cloud |
| `qwen-max` | Qwen Max - Alibaba Cloud |
| `qwen-flash` | Qwen Flash - Alibaba Cloud |

### AWS Bedrock

| Model ID | Name |
|---|---|
| `us.anthropic.claude-sonnet-5` | Claude 5 Sonnet - AWS Bedrock US |
| `us.anthropic.claude-sonnet-4-6` | Claude 4.6 Sonnet - AWS Bedrock US |
| `us.anthropic.claude-sonnet-4-5-20250929-v1:0` | Claude 4.5 Sonnet - AWS Bedrock US |
| `us.anthropic.claude-opus-5-5` | Claude 5.5 Opus - AWS Bedrock US |
| `us.anthropic.claude-opus-5` | Claude 5 Opus - AWS Bedrock US |
| `us.anthropic.claude-opus-4-8` | Claude 4.8 Opus - AWS Bedrock US |
| `us.anthropic.claude-opus-4-7` | Claude 4.7 Opus - AWS Bedrock US |
| `us.anthropic.claude-opus-4-6-v1` | Claude 4.6 Opus - AWS Bedrock US |
| `us.anthropic.claude-opus-4-5-20251101-v1:0` | Claude 4.5 Opus - AWS Bedrock US |
| `us.anthropic.claude-haiku-4-5-20251001-v1:0` | Claude 4.5 Haiku - AWS Bedrock US |
| `us.anthropic.claude-fable-5-1` | Claude 5.1 Fable - AWS Bedrock US |
| `us.anthropic.claude-fable-5` | Claude 5 Fable - AWS Bedrock US |

### Cohere

| Model ID | Name |
|---|---|
| `command-r-08-2024` | Command R - Cohere |

### DeepSeek

| Model ID | Name |
|---|---|
| `deepseek-v4-pro` | DeepSeek V4 Pro |
| `deepseek-flash` | DeepSeek V4.1 Flash |

### GoogleAI

| Model ID | Name |
|---|---|
| `gemini-3.8-flash` | Gemini 3.8 Flash - GoogleAI |
| `gemini-3.7-flash` | Gemini 3.7 Flash - GoogleAI |
| `gemini-3.6-flash` | Gemini 3.6 Flash - GoogleAI |
| `gemini-3.5-flash` | Gemini 3.5 Flash - GoogleAI |
| `gemini-3.1-pro-preview` | Gemini 3.1 Pro - GoogleAI |
| `gemini-3.1-flash-lite-preview` | Gemini 3.1 Flash Lite - GoogleAI |
| `gemini-3-flash-preview` | Gemini 3 Flash - GoogleAI |
| `gemini-2.5-pro` | Gemini 2.5 Pro - GoogleAI |
| `gemini-2.5-flash` | Gemini 2.5 Flash - GoogleAI |

### Mistral

| Model ID | Name |
|---|---|
| `magistral-small-latest` | Magistral Small 1.2 - MistralAI |
| `magistral-medium-latest` | Magistral Medium 1.2 - MistralAI |
| `ministral-14b-latest` | Ministral 14B Latest - MistralAI |
| `open-mistral-nemo` | Mistral Open Nemo - MistralAI |
| `mistral-small-latest` | Mistral Small - MistralAI |
| `mistral-small-2603` | Mistral Small 4 - MistralAI |
| `mistral-medium-latest` | Mistral Medium 3.1 - MistralAI |
| `mistral-medium-3-5` | Mistral Medium 3.5 - MistralAI |
| `mistral-large-latest` | Mistral Large 2 - MistralAI |
| `mistral-large-2512` | Mistral Large 3 - MistralAI |

### OpenAI

| Model ID | Name |
|---|---|
| `gpt-5.3-codex` | GPT-5.3 Codex - OpenAI |
| `o3-mini` | GPT-o3 Mini - OpenAI |
| `gpt-6.1-sol` | GPT-6.1 Sol - OpenAI |
| `gpt-6-sol` | GPT-6 Sol - OpenAI |
| `gpt-6-luna` | GPT-6 Luna - OpenAI |
| `gpt-6-astra` | GPT-6 Astra - OpenAI |
| `gpt-5.6-terra` | GPT-5.6 Terra - OpenAI |
| `gpt-5.6-sol` | GPT-5.6 Sol - OpenAI |
| `gpt-5.6-luna` | GPT-5.6 Luna - OpenAI |
| `gpt-5.5-pro` | GPT-5.5 Pro - OpenAI |
| `gpt-5.5` | GPT-5.5 - OpenAI |
| `gpt-5.4-pro` | GPT-5.4 Pro - OpenAI |
| `gpt-5.4-nano` | GPT-5.4 Nano - OpenAI |
| `gpt-5.4-mini` | GPT-5.4 Mini - OpenAI |
| `gpt-5.4` | GPT-5.4 - OpenAI |
| `gpt-5.2-pro` | GPT-5.2 Pro - OpenAI |
| `gpt-5.2` | GPT-5.2 - OpenAI |
| `gpt-5.1` | GPT-5.1 - OpenAI |
| `gpt-5-nano` | GPT-5 Nano - OpenAI |
| `gpt-5-mini` | GPT-5 Mini - OpenAI |
| `gpt-5` | GPT-5 - OpenAI |
| `gpt-4o-mini` | GPT-4o Mini - OpenAI |
| `gpt-4o` | GPT-4o - OpenAI |
| `gpt-4.1-nano` | GPT-4.1 nano - OpenAI |
| `gpt-4.1-mini` | GPT-4.1 mini - OpenAI |
| `gpt-4.1` | GPT-4.1 - OpenAI |
| `gpt-4-turbo` | GPT-4 Turbo - OpenAI |
| `gpt-3.5-turbo` | GPT-3.5 - OpenAI |
| `o3-pro` | o3 Pro - OpenAI |
| `o3` | o3 - OpenAI |

### OpenRouter

| Model ID | Name |
|---|---|
| `moonshotai/kimi-k3` | Kimi K3 |
| `moonshotai/kimi-k2.7-code` | Kimi K2.7 Code |
| `moonshotai/kimi-k2.6` | Kimi K2.6 |
| `meta/muse-spark-1.3` | Muse Spark 1.3 |
| `meta/muse-spark-1.2` | Muse Spark 1.2 |
| `meta/muse-spark-1.1` | Muse Spark 1.1 |

### Perplexity

| Model ID | Name |
|---|---|
| `sonar-reasoning-pro` | Perplexity [reasoning pro] |
| `sonar-pro` | Perplexity [pro] |
| `sonar-deep-research` | Perplexity [deep research] |
| `sonar` | Perplexity |

### xAI

| Model ID | Name |
|---|---|
| `grok-4.7` | xAI - Grok 4.7 |
| `grok-4.6` | xAI - Grok 4.6 |
| `grok-4.5` | xAI - Grok 4.5 |
| `grok-4.3` | xAI - Grok 4.3 |

### Z.AI

| Model ID | Name |
|---|---|
| `glm-5.3` | GLM-5.3 - Z.AI |
| `glm-5.2` | GLM-5.2 - Z.AI |
| `glm-5.1` | GLM-5.1 - Z.AI |
| `glm-5` | GLM-5 - Z.AI |

### Extra

| Model ID | Name |
|---|---|
| `meta/meta-llama-3-70b-instruct` | LLaMA 3 70b - MetaAI |
| `meta/llama-4-scout-instruct` | LLaMA 4 Scout Instruct - MetaAI |
| `meta/llama-4-maverick-instruct` | LLaMA 4 Maverick Instruct - MetaAI |
| `openai/gpt-oss-20b` | GPT OSS 20b - OpenAI |
| `openai/gpt-oss-120b` | GPT OSS 120b - OpenAI |

## Example Requests

### Simple Chat (No Context)

```bash
curl -X POST "https://api.1min.ai/api/chat-with-ai?isStreaming=true" \
  -H "API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Tell me about artificial intelligence",
    "settings": {
      "webSearchSettings": {
        "webSearch": false
      }
    }
  }
}'
```

### Chat with Conversation History

Create a conversation first with [Create a Conversation for History](#create-a-conversation-for-history), then pass the returned `uuid` as `promptObject.conversationId`.

```js
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Can you elaborate on that?',
      conversationId: 'c5c5e1d4-76a9-46a6-bf6b-1ba843b838db',
      settings: {
        historySettings: {
          isMixed: false,
          historyMessageLimit: 10
        }
      }
    }
  })
})
```

### Chat with Web Search

```js
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'What are the latest developments in AI?',
      settings: {
        webSearchSettings: {
          webSearch: true,
          numOfSite: 3,
          maxWord: 1000
        }
      }
    }
  })
})
```

### Chat with Image Attachments

```js
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'What do you see in this image?',
      attachments: {
        images: ['development/images/2024_09_30_13_41_50_758_photo.png']
      }
    }
  })
})
```

### Chat with File Attachments

Upload files via the Asset API first, then pass the returned file IDs in `attachments.files`.

```js
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Summarize the key points from this document',
      attachments: {
        files: ['20ad0277-74df-4629-8c50-56a2549acbd7']
      }
    }
  })
})
```

### Chat with YouTube Video

Include a YouTube URL directly in your prompt. The AI will automatically detect the link, fetch the video transcript, and use it as context for the conversation. Up to 3 YouTube URLs are supported per request.

```js
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Summarize this video https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  })
})
```

### Non-Streaming Chat

```js
fetch('https://api.1min.ai/api/chat-with-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Explain quantum computing in simple terms'
    }
  })
})
```

## Streaming Response

For streaming requests (`?isStreaming=true`), the response is sent as Server-Sent Events (SSE).

### Event Types

| Event | Description |
|---|---|
| `content` | A chunk of the AI-generated response |
| `result` | Final AI record with full response data |
| `done` | Stream completed signal |
| `error` | Error occurred during processing |

### Streaming Event Format

```text
event: content
data: {"content": "Artificial intelligence is"}

event: content
data: {"content": " a branch of computer science..."}

event: result
data: {"aiRecord": { ... }}

event: done
data: {"message": "Stream completed"}
```

## Non-Streaming Response

### Success Response (200)

```json
{
  "aiRecord": {
    "uuid": "120qae97-d77d-468d-9d78-2e7c0b2bbb98",
    "userId": "75cz1a57-c969-47ac-9dc5-82941cdcfe57",
    "teamId": "595w4b41-dcc7-466f-8697-d4a919810b11",
    "teamUser": {
      "teamId": "595w4b41-dcc7-466f-8697-d4a919810b11",
      "userId": "75cz1a57-c969-47ac-9dc5-82941cdcfe57",
      "userName": "1minAI",
      "userAvatar": "https://lh3.googleusercontent.com/a/ACg8ocJxHeiuADdtp",
      "status": "ACTIVE",
      "role": "ADMIN",
      "creditLimit": 214748364,
      "usedCredit": 3086973,
      "createdAt": "2023-11-24T06:31:06.467Z",
      "createdBy": "SYSTEM",
      "updatedAt": "2024-09-29T09:17:08.210Z",
      "updatedBy": "SYSTEM"
    },
    "model": "gpt-4o-mini",
    "type": "UNIFY_CHAT_WITH_AI",
    "metadata": null,
    "rating": null,
    "feedback": null,
    "conversationId": null,
    "status": "SUCCESS",
    "createdAt": "2024-09-30T03:47:29.738Z",
    "aiRecordDetail": {
      "promptObject": {
        "prompt": "Explain quantum computing in simple terms",
        "linkContentList": [],
        "searchContentList": []
      },
      "resultObject": [
        "Quantum computing is a type of computing that uses quantum bits (qubits) instead of classical bits..."
      ]
    },
    "modelDetail": {
      "name": "gpt-4o-mini",
      "provider": "OPENAI"
    }
  }
}
```

### Response Fields

#### aiRecord Object

| Field | Type | Description |
|---|---|---|
| `uuid` | string | Unique identifier for the AI record |
| `userId` | string | User identifier |
| `teamId` | string | Team identifier |
| `teamUser` | object | Team user details and permissions |
| `model` | string | Model used for processing |
| `type` | string | Feature type (`UNIFY_CHAT_WITH_AI`) |
| `metadata` | object | Additional metadata (nullable) |
| `rating` | number | User rating for the result (nullable) |
| `feedback` | string | User feedback text (nullable) |
| `conversationId` | string | Associated conversation ID (nullable) |
| `status` | string | Processing status (`SUCCESS`, `FAILED`, etc.) |
| `createdAt` | string | Record creation timestamp (ISO 8601) |
| `aiRecordDetail` | object | Detailed request and response data (see below) |
| `modelDetail` | object | Model information (name, provider) |

#### aiRecordDetail Object

| Field | Type | Description |
|---|---|---|
| `promptObject` | object | Original request parameters (prompt, settings, etc.) |
| `resultObject` | string[] | AI-generated response content as a list of strings |

## Error Responses

### Bad Request (400)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required parameters or invalid format"
  }
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

### Validation Error (422)

```json
{
  "success": false,
  "error": {
    "code": "PROMPT_OBJECT_VALIDATION_FAILED",
    "message": "Invalid prompt object",
    "details": [
      {
        "field": "prompt",
        "message": "prompt must be a string"
      }
    ]
  }
}
```

### Rate Limited (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests"
  }
}
```

## Migration Guide

### Migrating from AI Feature API

If you are currently using the AI Feature API with `CHAT_WITH_AI`, `CHAT_WITH_IMAGE`, `CHAT_WITH_PDF`, or `CHAT_WITH_YOUTUBE_VIDEO` types, here's how to migrate.

Before (legacy — AI Feature API):

```json
{
  "type": "CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Hello!",
    "isMixed": false,
    "webSearch": true,
    "numOfSite": 3,
    "maxWord": 500
  }
}
```

After (new — Chat with AI API):

```json
{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Hello!",
    "settings": {
      "historySettings": {
        "isMixed": false
      },
      "webSearchSettings": {
        "webSearch": true,
        "numOfSite": 3,
        "maxWord": 500
      }
    }
  }
}
```

### Key Differences

| Aspect | Legacy (AI Feature API) | New (Chat with AI API) |
|---|---|---|
| Endpoint | `POST /api/features` | `POST /api/chat-with-ai` |
| Type | `CHAT_WITH_AI` / `CHAT_WITH_IMAGE` / `CHAT_WITH_PDF` / `CHAT_WITH_YOUTUBE_VIDEO` | `UNIFY_CHAT_WITH_AI` |
| Prompt structure | Flat `promptObject` with mixed params | Structured `promptObject` with nested `settings` |
| Image support | Separate `CHAT_WITH_IMAGE` type + `imageList` | Same type with `attachments.images` |
| Web search | Top-level `webSearch`, `numOfSite`, `maxWord` | Nested under `settings.webSearchSettings` |
| History config | Top-level `isMixed` | Nested under `settings.historySettings` |
| PDF/File support | Separate `CHAT_WITH_PDF` type + conversation | Same type with `attachments.files` |
| YouTube support | Separate `CHAT_WITH_YOUTUBE_VIDEO` type + conversation | Same type — just include YouTube URL in prompt |
| Memory | Not available | `settings.withMemories` for cross-conversation memory |
| Streaming events | Raw text stream | Structured SSE with `content`, `result`, `done` events |

### Conversation Type Changes

When creating conversations via [Create a Conversation for History](#create-a-conversation-for-history), use `UNIFY_CHAT_WITH_AI` as the type instead of `CHAT_WITH_AI`, `CHAT_WITH_IMAGE`, `CHAT_WITH_PDF`, or `CHAT_WITH_YOUTUBE_VIDEO`.
