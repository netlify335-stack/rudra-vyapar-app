"use client";

import { useState, useRef, useEffect } from "react";
// custom chat implementation
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Image as ImageIcon, XCircle, GripHorizontal } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

interface RudraChatProps {
  storeName: string;
  alerts: any;
}

export function RudraChat({ storeName, alerts }: RudraChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && (!attachments || attachments.length === 0)) return;
    
    const userMsgId = Date.now().toString();
    const userMessage: any = { id: userMsgId, role: "user", content: input };
    
    // Add images if present
    if (attachments && attachments.length > 0) {
      const experimental_attachments = await Promise.all(
        Array.from(attachments).map(async (file) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          return {
            url: base64,
            contentType: file.type,
          };
        })
      );
      userMessage.experimental_attachments = experimental_attachments;
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachments(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            experimental_attachments: m.experimental_attachments,
          })),
          storeName,
          alerts
        })
      });

      const assistantMsgId = Date.now().toString() + "_ai";

      if (!response.ok) {
        // Show error as a chat message instead of blank
        const errText = await response.text().catch(() => "Unknown error");
        setMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: `⚠️ Error: ${response.status === 429 ? "Rate limit hit. Thoda wait karo aur phir try karo!" : "Kuch gadbad ho gayi, phir se try karo."}` }]);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "⚠️ No response received. Please try again." }]);
        return;
      }
      
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);
      
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        fullText += text;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.id === assistantMsgId) {
            return [...prev.slice(0, -1), { ...last, content: last.content + text }];
          }
          return prev;
        });
      }

      // If stream ended but no text was received, show fallback
      if (!fullText.trim()) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.id === assistantMsgId && !last.content.trim()) {
            return [...prev.slice(0, -1), { ...last, content: "⚠️ Koi response nahi mila. Phir se try karo!" }];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
      const errMsgId = Date.now().toString() + "_err";
      setMessages(prev => [...prev, { id: errMsgId, role: "assistant", content: "⚠️ Network error. Internet check karo aur phir se try karo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-50" ref={constraintsRef}>
        {/* Floating Button */}
        {!isOpen && (
          <motion.button
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="pointer-events-auto absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 touch-none"
          >
            <Sparkles className="absolute top-2 right-2 h-3 w-3 animate-pulse" />
            <Bot className="h-6 w-6" />
          </motion.button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <motion.div 
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            dragElastic={0}
            dragMomentum={false}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto absolute bottom-6 right-6 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl sm:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white cursor-grab active:cursor-grabbing touch-none" onPointerDown={(e) => dragControls.start(e)}>
              <div className="flex items-center gap-2">
                <GripHorizontal className="h-5 w-5 opacity-50 mr-1" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-none text-white">Rudra AI</h3>
                <span className="text-xs text-white/80">Smart Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 space-y-3">
                <Bot className="h-12 w-12 text-slate-300" />
                <p className="text-sm">Namaste! Main Rudra AI hoon.<br/>Vyapar me koi help chahiye?</p>
              </div>
            )}
            
            {messages.map((m) => (
              <div
                key={m.id}
                className={`mb-4 flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-orange-500 text-white rounded-br-none"
                      : "bg-white border text-slate-700 rounded-bl-none"
                  }`}
                >
                  {m.content}
                  {(m as any).experimental_attachments?.map((attachment: any, index: number) => (
                    attachment.contentType?.startsWith('image/') && (
                      <img
                        key={`${m.id}-${index}`}
                        src={attachment.url}
                        alt="attachment"
                        className="mt-2 max-w-full rounded-lg border object-cover"
                      />
                    )
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mb-4 flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border bg-white px-4 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-xs text-slate-500">Rudra soch raha hai...</span>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleFormSubmit}
            className="border-t bg-white p-3"
          >
            {/* Attachment Previews */}
            {attachments && attachments.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {Array.from(attachments).map((file, i) => (
                  <div key={i} className="relative h-12 w-12 shrink-0 rounded-lg border bg-slate-100 overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] text-slate-400">FILE</div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAttachments(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute right-0 top-0 rounded-full bg-white/80 p-0.5"
                    >
                      <XCircle className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 rounded-xl border bg-slate-50 p-1 shadow-inner focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setAttachments(e.target.files);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                value={input}
                onChange={handleInputChange}
                placeholder="Message Rudra AI..."
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !attachments)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400">
              Powered by Google Gemini
            </div>
          </form>
          </motion.div>
        )}
      </div>
    </>
  );
}
