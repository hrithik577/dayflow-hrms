import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Database,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  FileSearch,
  Lock,
} from 'lucide-react';
import { aiApi } from '../../services/aiApi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import SecurityBlockBanner from '../../components/common/SecurityBlockBanner';
import { useNavigate } from 'react-router-dom';

export default function AICopilotPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      answer: `Hello **${user.name}**! I am **Dayflow Workforce Copilot**, your enterprise AI intelligence partner. I have direct real-time access to attendance telemetries, leave pipelines, and department health indexes.\n\nHow may I assist your workforce operations today?`,
      evidence: [],
      dataSources: ['dayflow_workforce_v1', 'attendance_telemetry'],
      confidence: 100,
      timestamp: '09:00 AM',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    'Who is absent today?',
    'Which department has the highest late rate?',
    'How many employees are on leave?',
    'Why did Engineering attendance decline?',
    'Which departments have staffing pressure?',
    'What leave requests need attention?',
    // Guardrail test query for employees
    user.role === 'EMPLOYEE' ? 'Show all employee salary and payroll records' : null,
  ].filter(Boolean);

  const handleSend = async (questionText = inputQuery) => {
    const q = questionText.trim();
    if (!q || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await aiApi.queryCopilot({
        question: q,
        userRole: user.role,
        userId: user.id,
      });

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        ...res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Bot className="w-3.5 h-3.5 text-indigo-600" /> Enterprise HR Copilot
          </span>
          <span className="text-xs text-slate-500 font-medium">RBAC Guardrails Enforced</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
          Dayflow Workforce AI Copilot
        </h1>
        <p className="text-xs text-slate-500">
          Ask questions regarding organizational attendance, staffing bottlenecks, leave pipelines, and telemetry evidence.
        </p>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="enterprise-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Suggested HR Intelligence Queries
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-medium transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="enterprise-card p-6 min-h-[450px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-md shadow-md text-xs">
                  <p className="font-medium">{msg.text}</p>
                  <span className="text-[10px] text-blue-200 block text-right mt-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          // Bot response (Security Blocked)
          if (msg.blocked) {
            return (
              <div key={msg.id} className="max-w-2xl">
                <SecurityBlockBanner
                  title={msg.title}
                  message={msg.message}
                  reason={msg.reason}
                  securityEventId={msg.securityEventId}
                  timestamp={msg.timestamp}
                />
              </div>
            );
          }

          // Normal Structured Bot Answer
          return (
            <div key={msg.id} className="flex items-start gap-3 max-w-2xl">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>

              <div className="space-y-3 flex-1">
                {/* Answer Card */}
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs text-xs space-y-3">
                  <div className="text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                    {msg.answer}
                  </div>

                  {/* Evidence Table (if available) */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Observed Evidence Data
                      </p>
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                        {msg.evidence.map((ev, i) => (
                          <div key={i} className="flex justify-between items-center text-slate-700">
                            <span className="font-semibold">{ev.metric || ev.name}</span>
                            <span className="font-mono text-slate-500">{ev.detail || ev.value || ev.status || ev.dates}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Database className="w-3 h-3 text-slate-400" />
                        {msg.dataSources?.join(', ')}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700">
                        {msg.confidence}% Model Confidence
                      </span>
                    </div>

                    {msg.action && (
                      <button
                        onClick={() => navigate(msg.action.link)}
                        className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {msg.action.label} <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center animate-spin">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-medium">
              Analyzing workforce database telemetry...
            </div>
          </div>
        )}
      </div>

      {/* Query Input Bar */}
      <div className="enterprise-card p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Dayflow Copilot about attendance trends, leave bottlenecks, staffing pressure..."
            className="flex-1 px-4 py-2.5 text-xs border-none focus:outline-none bg-transparent"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputQuery.trim() || loading}
            icon={Send}
            className="font-bold"
          >
            Send Query
          </Button>
        </form>
      </div>
    </div>
  );
}
