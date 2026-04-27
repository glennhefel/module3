import { Router } from 'express';

const router = Router();

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => message && typeof message === 'object')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content || '').trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-12);
}

function getAssistantProviderConfig() {
  const provider = String(process.env.AI_PROVIDER || 'openrouter').trim().toLowerCase();

  if (provider === 'openrouter') {
    return {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'openrouter/free',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      extraHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_SITE_NAME || 'VoidRift Assistant',
      },
      missingKeyMessage:
        'AI helper is not configured. Add OPENROUTER_API_KEY to backend environment settings.',
    };
  }

  return {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || process.env.GPT_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    extraHeaders: {},
    missingKeyMessage:
      'AI helper is not configured. Add OPENAI_API_KEY to backend environment settings.',
  };
}

router.post('/chat', async (req, res) => {
  try {
    const providerConfig = getAssistantProviderConfig();
    const { apiKey, model, endpoint, extraHeaders, missingKeyMessage } = providerConfig;

    if (!apiKey) {
      return res.status(503).json({
        error: missingKeyMessage,
      });
    }

    const { messages, context } = req.body || {};
    const sanitizedMessages = sanitizeMessages(messages);
    const pagePath = String(context?.path || '').trim();

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const systemMessage = {
      role: 'system',
      content:
        'You are VoidRift Assistant, an in-site helper for a movie/anime/TV discovery platform. ' +
        'Primary jobs: summarize movie/show descriptions clearly, answer site usage questions, and help users navigate features (profile, watchlist, reviews, discussions, find users, badges). ' +
        'Keep responses concise, friendly, and practical. Do not start replies with generic capability disclaimers. ' +
        'If a user asks for watchlist/review-specific help, give concrete step-by-step actions in the app and offer recommendations when useful. ' +
        'If exact personal data is not available in the message context, ask one short follow-up question instead of giving a long refusal. ' +
        'If details are unknown, state uncertainty briefly and avoid guessing. ' +
        `Current page path: ${pagePath || 'unknown'}.`,
    };

    const requestPayload = {
      model,
      temperature: 0.4,
      messages: [systemMessage, ...sanitizedMessages],
    };

    let upstreamResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify(requestPayload),
    });

    let data = await upstreamResponse.json().catch(() => ({}));

    // If OpenRouter reports the model has no endpoints, retry once on a safe router model.
    if (
      providerConfig.provider === 'openrouter' &&
      !upstreamResponse.ok &&
      String(data?.error?.message || '').toLowerCase().includes('no endpoints found')
    ) {
      requestPayload.model = 'openrouter/free';
      upstreamResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify(requestPayload),
      });
      data = await upstreamResponse.json().catch(() => ({}));
    }

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: data?.error?.message || 'Failed to fetch AI response',
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'AI response was empty' });
    }

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;

