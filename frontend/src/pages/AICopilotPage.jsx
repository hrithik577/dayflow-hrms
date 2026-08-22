import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, Database, CheckCircle2, ShieldAlert, Lock, Zap, 
  Mic, MicOff, Volume2, VolumeX, Radio, Cpu, FileSearch, HelpCircle, TrendingUp, Play
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const AICopilotPage = () => {
  const [activeTab, setActiveTab] = useState('copilot'); // 'copilot' | 'workflows'
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Welcome to Dayflow AI Copilot Workspace. I am connected directly to your workforce database with strict RBAC security guardrails. You can type or use Voice Contact Mode to talk with me!',
      sources: ['dayflow_database'],
      guardrail_status: 'ALLOWED'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [executingAction, setExecutingAction] = useState(null);

  // Workflow states
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [screeningResult, setScreeningResult] = useState(null);
  const [screeningLoading, setScreeningLoading] = useState(false);

  const [decisionType, setDecisionType] = useState('LEAVE_APPROVAL');
  const [decisionContext, setDecisionContext] = useState('');
  const [explanationResult, setExplanationResult] = useState(null);
  const [explainingLoading, setExplainingLoading] = useState(false);

  const [empIdPredict, setEmpIdPredict] = useState('101');
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const recognitionRef = useRef(null);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text to Speech
  const speakText = (text) => {
    if (!('speechSynthesis' in window) || !autoSpeak) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setPrompt('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

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

      if (autoSpeak && data.answer) {
        speakText(data.answer);
      }
    } catch (err) {
      const errorMsg = 'Error connecting to AI Copilot backend.';
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: errorMsg,
          guardrail_status: 'BLOCKED'
        }
      ]);
      if (autoSpeak) speakText(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleActionExecute = async (toolName, args = {}) => {
    setExecutingAction(toolName);
    try {
      const res = await api.post('/api/ai/action', {
        tool_name: toolName,
        arguments: args
      });
      alert(`✅ Action Executed Successfully!\nResult: ${JSON.stringify(res.data.result, null, 2)}`);
    } catch (err) {
      alert(`❌ Action Failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setExecutingAction(null);
    }
  };

  // Workflow Handlers
  const handleResumeScreening = async () => {
    if (!resumeText.trim()) return;
    setScreeningLoading(true);
    try {
      const res = await api.post('/api/ai/resume-screening', {
        resume_text: resumeText,
        job_description: jobDescription || "Full-Stack Engineer with Python, FastAPI, React, SQL expertise."
      });
      setScreeningResult(res.data);
    } catch (err) {
      alert("Failed to screen resume");
    } finally {
      setScreeningLoading(false);
    }
  };

  const handleExplainDecision = async () => {
    setExplainingLoading(true);
    try {
      const res = await api.post('/api/ai/explain-decision', {
        decision_type: decisionType,
        context_data: decisionContext ? { notes: decisionContext } : { leave_id: 1, employee_id: 101 }
      });
      setExplanationResult(res.data);
    } catch (err) {
      alert("Failed to generate explanation");
    } finally {
      setExplainingLoading(false);
    }
  };

  const handlePredictPerformance = async () => {
    setPredictLoading(true);
    try {
      const res = await api.get(`/api/ai/performance-prediction/${empIdPredict}`);
      setPredictionResult(res.data);
    } catch (err) {
      alert("Failed to fetch performance prediction");
    } finally {
      setPredictLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-blue-400 animate-pulse" />
            Dayflow AI Copilot & Voice Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-1">Grounded workforce intelligence, real-time voice contact, & explainable HR AI</p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'copilot'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Voice & Chat Copilot</span>
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'workflows'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI HR Workflows</span>
          </button>
        </div>
      </div>

      {activeTab === 'copilot' ? (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Controls Bar: Voice & Audio Settings */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleVoiceListen}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span>{isListening ? 'Listening... (Speak Now)' : 'Voice Input'}</span>
              </button>

              <button
                onClick={() => setVoiceModeActive(!voiceModeActive)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  voiceModeActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Radio className="w-4 h-4 text-amber-400" />
                <span>ChatGPT Voice Mode {voiceModeActive ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isSpeaking) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                  setAutoSpeak(!autoSpeak);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                {autoSpeak ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>Auto Read AI Response</span>
              </button>
              {isSpeaking && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse font-mono">
                  <Volume2 className="w-3.5 h-3.5" /> Speaking...
                </span>
              )}
            </div>
          </div>

          {/* Voice Mode Avatar Overlay if active */}
          {voiceModeActive && (
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border border-blue-500/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
              <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl transition-all duration-500 ${
                  isSpeaking ? 'scale-110 shadow-blue-500/50 animate-bounce' : isListening ? 'scale-110 shadow-rose-500/50 animate-pulse' : 'hover:scale-105'
                }`}>
                  <Bot className="w-12 h-12 text-white" />
                </div>
                {isListening && (
                  <div className="absolute -bottom-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    Listening
                  </div>
                )}
                {isSpeaking && (
                  <div className="absolute -bottom-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    Speaking
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Voice Contact Mode Active</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">Speak naturally into your microphone or click Voice Input to talk directly with Dayflow AI.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleVoiceListen}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isListening ? 'Stop Listening' : 'Talk Now'}</span>
                </button>
              </div>
            </div>
          )}

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
          <div className="flex-1 glass-panel rounded-2xl border border-slate-800 p-6 overflow-y-auto space-y-4 shadow-xl max-h-[450px]">
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
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1 text-slate-400 font-medium">
                          <Database className="w-3.5 h-3.5 text-blue-400" />
                          Sources: {m.sources ? m.sources.join(', ') : 'Database'}
                        </span>
                        <StatusBadge status={m.guardrail_status} />
                      </div>
                      {m.tool_used && (
                        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <p className="text-[11px] text-slate-400 font-mono">
                            Tool Executed: <strong className="text-purple-400">{m.tool_used}</strong>
                          </p>
                          <button
                            onClick={() => handleActionExecute(m.tool_used, {})}
                            disabled={executingAction === m.tool_used}
                            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px] flex items-center gap-1 transition-all"
                          >
                            <Play className="w-3 h-3" />
                            <span>Re-run Tool</span>
                          </button>
                        </div>
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
            <button
              type="button"
              onClick={toggleVoiceListen}
              className={`p-2.5 rounded-xl transition-all ${
                isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Dayflow AI Copilot (e.g. 'Who is absent today?', 'Show Engineering late trends')..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
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
      ) : (
        /* AI HR Workflows Tab */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Resume Screener */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-blue-400" />
                AI Resume Screener
              </h2>
              <p className="text-xs text-slate-400 mt-1">Screen candidates & match skills automatically</p>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Resume Text</label>
                  <textarea
                    rows={4}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste candidate resume text (skills, experience, education)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Job Description</label>
                  <input
                    type="text"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer (Python, React)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              {screeningResult && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Match Score:</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">{(screeningResult.match_score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-300">{screeningResult.summary}</p>
                </div>
              )}

              <button
                onClick={handleResumeScreening}
                disabled={screeningLoading || !resumeText.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{screeningLoading ? 'Screening...' : 'Screen Candidate'}</span>
              </button>
            </div>
          </div>

          {/* 2. Explainable AI Decision Explainer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                Explainable HR AI
              </h2>
              <p className="text-xs text-slate-400 mt-1">Audit & explain automated HR decisions with confidence breakdown</p>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Decision Type</label>
                  <select
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LEAVE_APPROVAL">Leave Approval Decision</option>
                    <option value="ATTENDANCE_ANOMALY">Attendance Anomaly Detection</option>
                    <option value="PAYROLL_CALCULATION">Payroll Calculation Audit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Context Notes (Optional)</label>
                  <textarea
                    rows={4}
                    value={decisionContext}
                    onChange={(e) => setDecisionContext(e.target.value)}
                    placeholder="Enter decision context or notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              {explanationResult && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 space-y-1 text-xs">
                  <p className="font-bold text-purple-300">{explanationResult.recommendation}</p>
                  <p className="text-slate-300 text-[11px]">{explanationResult.explanation}</p>
                </div>
              )}

              <button
                onClick={handleExplainDecision}
                disabled={explainingLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4" />
                <span>{explainingLoading ? 'Generating Explanation...' : 'Explain HR Decision'}</span>
              </button>
            </div>
          </div>

          {/* 3. Performance & Attrition Predictor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Performance Predictor
              </h2>
              <p className="text-xs text-slate-400 mt-1">Predict employee trajectory & retention risk score</p>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={empIdPredict}
                    onChange={(e) => setEmpIdPredict(e.target.value)}
                    placeholder="Enter Employee ID (e.g. 101)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              {predictionResult && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Predicted Score:</span>
                    <span className="font-bold text-emerald-400 font-mono">{(predictionResult.performance_score * 100).toFixed(0)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Retention Risk:</span>
                    <span className={`font-bold ${predictionResult.retention_risk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {predictionResult.retention_risk}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{predictionResult.recommendation}</p>
                </div>
              )}

              <button
                onClick={handlePredictPerformance}
                disabled={predictLoading || !empIdPredict}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{predictLoading ? 'Analyzing Model...' : 'Predict Performance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

