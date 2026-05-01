import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SiteAssistant.css';
import { API_BASE_URL } from '../utils/apiBase';

function getMediaIdFromPath(pathname) {
  const match = String(pathname || '').match(/^\/media\/([^/]+)$/);
  return match?.[1] || '';
}

export default function SiteAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I can summarize movie descriptions, answer questions about VoidRift, and help you find features quickly.',
    },
  ]);

  const mediaId = useMemo(() => getMediaIdFromPath(location.pathname), [location.pathname]);

  const sendToAssistant = async (nextMessages) => {
    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: nextMessages,
        context: { path: location.pathname },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data?.reply || '';
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || sending) return;

    const nextMessages = [...messages, { role: 'user', content: value }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const reply = await sendToAssistant(nextMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || 'Sorry, I could not generate a response.' }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I could not connect right now: ${err.message}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const summarizeCurrentMedia = async () => {
    if (!mediaId || sending) return;
    setSending(true);
    try {
      const mediaRes = await fetch(`${API_BASE_URL}/media/${mediaId}`);
      if (!mediaRes.ok) throw new Error('Could not load current media');
      const mediaData = await mediaRes.json();
      const description = String(mediaData?.description || '').trim();
      if (!description) throw new Error('This media has no description yet');

      const prompt = `Please summarize this media description in 2 concise bullet points and include a 1-line "Should I watch this?" takeaway:\n\n${description}`;
      const nextMessages = [...messages, { role: 'user', content: prompt }];
      setMessages(nextMessages);
      const reply = await sendToAssistant(nextMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || 'No summary was returned.' }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `I could not summarize this page right now: ${err.message}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="site-assistant-root">
      {open && (
        <div className="site-assistant-panel" role="dialog" aria-label="Site assistant">
          <div className="site-assistant-header">
            <div>
              <h5 className="site-assistant-title">VoidRift Helper</h5>
              <p className="site-assistant-subtitle">GPT-powered support & summaries</p>
            </div>
            <button
              type="button"
              className="site-assistant-close"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <div className="site-assistant-tools">
            <button type="button" className="site-assistant-tool-btn" onClick={() => navigate('/find-users')}>
              Find Users help
            </button>
            {mediaId ? (
              <button type="button" className="site-assistant-tool-btn" onClick={summarizeCurrentMedia} disabled={sending}>
                Summarize this media
              </button>
            ) : null}
          </div>

          <div className="site-assistant-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`site-assistant-message ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <form className="site-assistant-input-row" onSubmit={handleSend}>
            <input
              type="text"
              className="site-assistant-input"
              value={input}
              maxLength={1200}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about features or paste text to summarize..."
              disabled={sending}
            />
            <button type="submit" className="site-assistant-send" disabled={sending || !input.trim()}>
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="site-assistant-fab"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open site assistant"
      >
        🤖
      </button>
    </div>
  );
}

