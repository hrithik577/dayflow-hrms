import React, { useState } from 'react';
import { Bot, Send, ShieldAlert, CheckCircle2, Sparkles, X, Database, Lock } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from './StatusBadge';

export const AIChatDrawer = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Dayflow AI Copilot. Ask me about workforce metrics, absent staff, department attendance trends, or HR policy details.',
      sources: ['dayflow_analytics_engine'],
      guardrail_status: 'ALLOWED'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const presetQueries = [
    "Who is absent today?",
    "Show Engineering attendance trend",
    "Show pending leave requests",
    "Show everyone's salaries" // Triggers RBAC Guardrail Block test!
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai/query', { prompt: textToSend });
      const data = res.data;

      const aiMsg = {
        sender: 'ai',
        text: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        guardrail_status: data.guardrail_status,
        tool_used: data.tool_used,
        security_reason: data.security_reason
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Error processing AI query. Please verify backend state.',
          guardrail_status: 'BLOCKED'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Dayflow AI Copilot
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                    Grounded & Guarded
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Workforce Intelligence & Safe Action Assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-br-none shadow-md'
                      : m.guardrail_status === 'BLOCKED'
                      ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-bl-none'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* AI Metadata & Evidence Sources */}
                  {m.sender === 'ai' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/50 space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-slate-400 font-medium">
                          <Database className="w-3 h-3 text-blue-400" />
                          Sources: {m.sources ? m.sources.join(', ') : 'DB Metrics'}
                        </span>
                        {m.guardrail_status && (
                          <StatusBadge status={m.guardrail_status} />
                        )}
                      </div>
                      {m.confidence && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Confidence: {(m.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 animate-pulse">
                <Sparkles className="w-4 h-4" />
                Analyzing database & evaluating guardrails...
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="p-3 bg-slate-950/60 border-t border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Recommended Questions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {presetQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    q.includes('salaries')
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {q.includes('salaries') ? '🔒 ' + q : q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Dayflow AI Copilot..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
