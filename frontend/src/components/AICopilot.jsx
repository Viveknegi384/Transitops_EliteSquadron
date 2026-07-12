'use client';
import React, { useState } from 'react';
import { apiCall } from '../utils/api';

export default function AICopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your TransitOps AI Assistant. Ask me anything about fleet status, driver compliance, or operational costs!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiCall('/ai/copilot', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      });
      setMessages((prev) => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Copilot button */}
      <button className="ai-copilot-btn" onClick={() => setOpen(!open)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        AI Copilot
      </button>

      {/* Chat drawer */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 86, right: 24, width: 380, height: 460,
          zIndex: 100, display: 'flex', flexDirection: 'column',
          background: '#0d1526',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(245,158,11,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>TransitOps AI Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'rgba(255,255,255,0.06)',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  maxWidth: '85%',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#e2e8f0',
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ color: '#64748b', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vehicles, drivers..."
              className="input-field"
              style={{ fontSize: 13, padding: '8px 12px' }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }}
              disabled={loading}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
