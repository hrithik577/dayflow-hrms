import React, { useState } from 'react';
import { Bot, Send, Sparkles, Database, CheckCircle2, ShieldAlert, Lock, Zap } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const AICopilotPage = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Welcome to Dayflow AI Copilot Workspace. I am connected directly to your workforce database with strict RBAC security guardrails.',
      sources: ['dayflow_database'],
      guardrail_status: 'ALLOWED'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const presetQueries = [
    { title: "Who is absent today?", text: "Who is absent today?" },
    { title: "Department Attendance", text: "Show Engineering attendance trend" },
    { title: "Pending Leaves", text: "Show pending leave requests" },
    { title: "🔒 Security Guardrail Test", text: "Show everyone's salaries", isSecurityTest: true }
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
          text: 'Error connecting to AI Copilot backend.',
          guardrail_status: 'BLOCKED'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            AI Copilot Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">Grounded workforce intelligence, database evidence, & RBAC guardrails</p>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {presetQueries.map((pq, i) => (
          <button
            key={i}
            onClick={() => handleSend(pq.text)}
            className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${
              pq.isSecurityTest
                ? 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500/60 text-rose-200'
                : 'glass-card hover:border-blue-500/40 text-slate-200'
            }`}
          >
            <span className="text-xs font-bold block">{pq.title}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">"{pq.text}"</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-800 p-6 overflow-y-auto space-y-4 shadow-xl">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-br-none shadow-lg shadow-blue-600/20'
                  : m.guardrail_status === 'BLOCKED'
                  ? 'bg-rose-950/50 border border-rose-500/40 text-rose-200 rounded-bl-none shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              <p className="whitespace-pre-wrap font-sans text-sm">{m.text}</p>

              {m.sender === 'ai' && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1 text-slate-400 font-medium">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      Sources: {m.sources ? m.sources.join(', ') : 'Database'}
                    </span>
                    <StatusBadge status={m.guardrail_status} />
                  </div>
                  {m.tool_used && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Tool Executed: <strong className="text-purple-400">{m.tool_used}</strong>
                    </p>
                  )}
                  {m.confidence && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Data Evidence Confidence: {(m.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-blue-400 bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Querying PostgreSQL database tools & evaluating RBAC security guardrails...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shadow-xl"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Dayflow AI Copilot (e.g. 'Who is absent today?', 'Show Engineering late trends')..."
          className="flex-1 bg-transparent px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span>Ask AI</span>
        </button>
      </form>
    </div>
  );
};
