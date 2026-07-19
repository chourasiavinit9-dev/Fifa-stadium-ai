"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { sanitizeText } from "../lib/validators";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface HistoryItem {
  role: "user" | "model";
  parts: [{ text: string }];
}

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  text: "Hi! I'm FIFAiq, your FIFA World Cup 2026 AI assistant powered by Gemini. Ask me about scores, navigation, crowd levels, transport, or anything about today's matches! I respond in your language. 🏆",
  timestamp: new Date(),
};

const QUICK_CHIPS = [
  "Today's scores 📊",
  "Least crowded gate 🚪",
  "Where is Gate A? 🗺️",
  "Semi-final schedule 📅",
  "Top goalscorers ⚽",
  "Nearest food court 🍔",
  "Transport to stadium 🚌",
  "¿Dónde está la salida? 🚪",
  "最近のゴール ⚽",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-3">
      <div className="w-9 h-9 rounded-full bg-[#0f172a] border border-[#00ff9d]/20 flex items-center justify-center text-base flex-shrink-0">
        🏆
      </div>
      <div
        role="status"
        aria-label="Assistant is typing"
        className="bg-[#0f172a] border border-[#1e2a1e] rounded-2xl rounded-tl-none px-4 py-3"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-[#00ff9d] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex items-end gap-3 mb-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-[#0f172a] border border-[#00ff9d]/20 flex items-center justify-center text-base flex-shrink-0">
          🏆
        </div>
      )}
      <div className="max-w-[78%]">
        <div
          className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-[#1a3a2a] border border-[#00ff9d]/20 rounded-tr-none text-[#e6f1ec]"
              : "bg-[#0f172a] border border-[#1e2a1e] rounded-tl-none text-[#e6f1ec]"
          }`}
        >
          {m.text}
        </div>
        <p className={`text-[10px] text-[#4c5f57] mt-0.5 ${isUser ? "text-right" : "text-left"}`}>
          {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = useCallback(
    async (overrideText?: string) => {
      const raw = overrideText ?? inputValue;
      const text = sanitizeText(raw).trim();
      if (!text || isLoading) return;

      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        timestamp: new Date(),
      };
      setMessages((p) => [...p, userMsg]);
      setIsLoading(true);

      const newHistory: HistoryItem[] = [
        ...history,
        { role: "user", parts: [{ text }] },
      ].slice(-6) as HistoryItem[];

      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: newHistory }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { response: string };
        const aiText = data.response;

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: aiText,
          timestamp: new Date(),
        };
        setMessages((p) => [...p, aiMsg]);
        setHistory([
          ...newHistory,
          { role: "model", parts: [{ text: aiText }] },
        ].slice(-6) as HistoryItem[]);
      } catch {
        setMessages((p) => [
          ...p,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Connection issue. Try again or check the stadium info board near Gate 2.",
            timestamp: new Date(),
          },
        ]);
      }
      setIsLoading(false);
    },
    [inputValue, isLoading, history]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px";
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] border border-[#00ff9d]/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#00ff9d]/10 bg-[#0f172a]/50">
        <h3 className="text-sm font-semibold text-white">FIFAiq Assistant</h3>
        <p className="text-[10px] text-[#4c5f57]">Powered by Gemini · Multilingual</p>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        className="flex-1 overflow-y-auto px-4 py-4 min-h-[300px] max-h-[480px]"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips — only when no conversation yet */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => send(chip)}
              className="text-[11px] px-3 py-1.5 bg-[#0f172a] border border-[#00ff9d]/20 text-[#7f9a8e] rounded-full hover:border-[#00ff9d]/50 hover:text-[#00ff9d] transition-all min-h-[36px]"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-[#00ff9d]/10 bg-[#0f172a]/30">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              maxLength={500}
              dir="auto"
              aria-label="Message FIFAiq assistant. Press Enter to send, Shift+Enter for new line."
              placeholder="Ask in any language... / Pregunta en cualquier idioma..."
              disabled={isLoading}
              className="w-full bg-[#020617] border border-[#00ff9d]/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4c5f57] outline-none focus:border-[#00ff9d]/40 resize-none overflow-hidden disabled:opacity-50"
              style={{ lineHeight: 1.5 }}
            />
          </div>
          <button
            onClick={() => send()}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
            className="px-4 py-2.5 bg-[#00ff9d]/15 border border-[#00ff9d]/40 text-[#00ff9d] rounded-xl text-sm font-semibold hover:bg-[#00ff9d]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] flex-shrink-0"
          >
            Send
          </button>
        </div>
        <div aria-live="polite" className="text-[10px] text-[#4c5f57] mt-1 text-right">
          {inputValue.length}/500
        </div>
      </div>
    </div>
  );
}
