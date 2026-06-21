"use client";
import { useState } from "react";

export default function AssistantPage() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Xin chào! Hỏi tôi về trạng thái ứng viên (vd: \"Linh Tran đang ở đâu?\") hoặc quy trình tuyển dụng." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const question = input;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/chatbot", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setLoading(false);
    setMessages((m) => [...m, { role: "bot", text: data.answer || data.error || "Có lỗi xảy ra." }]);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">AI HR Assistant</h1>
      <div className="card h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span className={`inline-block rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
              }`}>{m.text}</span>
            </div>
          ))}
          {loading && <p className="text-xs text-slate-400">Đang trả lời...</p>}
        </div>
        <div className="flex gap-2 mt-3">
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Nhập câu hỏi..." />
          <button className="btn-primary" onClick={send} disabled={loading}>Gửi</button>
        </div>
      </div>
    </div>
  );
}
