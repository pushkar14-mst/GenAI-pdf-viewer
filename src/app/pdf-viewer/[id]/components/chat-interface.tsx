"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  Highlighter,
  Navigation,
  Eye,
} from "lucide-react";
import type { PDFDisplayRef } from "./pdf-display";

interface ChatInterfaceProps {
  pdfId: string;
  pdfDisplayRef: React.RefObject<PDFDisplayRef | null>;
  onHighlightRequest?: (highlights: Record<string, unknown>[]) => void;
  onPageNavigate?: (page: number) => void;
  onAnnotationControl?: (action: string, data?: unknown) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  pageReference?: number;
  annotations?: Record<string, unknown>[];
  pdfControls?: Record<string, unknown>[];
}

export function ChatInterface({
  pdfId,
  pdfDisplayRef,
  onHighlightRequest,
  onPageNavigate,
  onAnnotationControl,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    loadExistingChats();
  }, [pdfId]);

  const loadExistingChats = async () => {
    try {
      setIsLoading(true);
      const chatsResponse = await fetch(`/api/pdf/${pdfId}/chats`);
      if (!chatsResponse.ok) throw new Error("Failed to fetch chats");

      const chatsData = await chatsResponse.json();

      if (chatsData.chats && chatsData.chats.length > 0) {
        const mostRecentChat = chatsData.chats[0];
        setChatId(mostRecentChat.id);

        const chatResponse = await fetch(`/api/chat/${mostRecentChat.id}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          const loadedMessages: Message[] = chatData.chat.messages.map(
            (msg: Record<string, unknown>) => ({
              id: msg.id as string,
              role: (msg.role as string).toLowerCase(),
              content: msg.content as string,
              timestamp: new Date(msg.timestamp as string),
              annotations: msg.annotations
                ? JSON.parse(msg.annotations as string)
                : [],
            })
          );
          setMessages(loadedMessages);
        }
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Hi! I'm your **AI Tutor** with PDF control capabilities! 🎓

I can:
- 📖 Answer questions about your document
- 🎯 **Highlight specific text** as we discuss
- 📍 **Navigate to relevant pages** 
- 🔍 **Create visual annotations**
- 💡 Provide context-aware explanations

Try asking me something like:
- "What's the main argument on page 3?"
- "Highlight the key findings and navigate to them"
- "Show me the methodology section with highlights"  
- "Find and highlight the word 'conclusion' in this document"
- "Navigate to page 2 and highlight any important terms"

**🎯 I can actually control the PDF!** Watch as I:
- ✨ Find and highlight exact text on the pages
- 📍 Navigate to specific pages automatically  
- 🎨 Show visual annotations with explanations

**Test it:** Try saying "highlight the word 'the' on this page" to see the highlighting in action!

Let's explore this document together!`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load existing chats:", error);
      setMessages([
        {
          id: "welcome-error",
          role: "assistant",
          content:
            "Welcome! I'm ready to help you understand this PDF with enhanced annotation capabilities!",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setIsSending(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          pdfId,
          chatId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      if (data.chatId && data.chatId !== chatId) {
        setChatId(data.chatId);
      }

      const aiMessage: Message = {
        id: data.aiMessage.id,
        role: "assistant",
        content: data.aiMessage.content,
        timestamp: new Date(data.aiMessage.timestamp),
        annotations: data.aiMessage.annotations || [],
        pdfControls: data.pdfControls || [],
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Process AI commands for PDF control and highlighting
      processAICommands(
        data.aiMessage.annotations || [],
        data.pdfControls || []
      );

      if (data.createdAnnotations && data.createdAnnotations.length > 0) {
        onHighlightRequest?.(data.createdAnnotations);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const processAICommands = useCallback(
    (
      annotations: Record<string, unknown>[],
      pdfControls: Record<string, unknown>[]
    ) => {
      pdfControls?.forEach((control) => {
        if (control.action === "navigate" && control.page) {
          onPageNavigate?.(control.page as number);
        } else if (control.action === "clear") {
          pdfDisplayRef.current?.clearHighlights();
        }
      });

      annotations?.forEach((annotation) => {
        if (annotation.action === "highlight" && annotation.text) {
          pdfDisplayRef.current?.addHighlight(
            annotation.text as string,
            (annotation.page as number) || 1,
            (annotation.color as string) || "#ffff00",
            (annotation.comment as string) || ""
          );
        }
      });
    },
    [onPageNavigate, pdfDisplayRef]
  );

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      summarize:
        "Please provide a summary of this document with key highlights",
      explain:
        "Explain the main concepts in this document with visual annotations",
      quiz: "Create a quiz based on this document and highlight relevant sections",
      navigate:
        "Guide me through the document structure and important sections",
    };

    setNewMessage(
      actionMessages[action as keyof typeof actionMessages] || action
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Bot className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">AI Tutor</h2>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="text-xs text-green-600 bg-green-50"
              >
                <Eye className="w-3 h-3 mr-1" />
                PDF Control
              </Badge>
              <Badge
                variant="outline"
                className="text-xs text-blue-600 bg-blue-50"
              >
                <Highlighter className="w-3 h-3 mr-1" />
                Annotations
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="space-y-4 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="space-y-4 text-center">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <p className="text-sm text-gray-500">Loading chat...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\*(.*?)\*/g, "<em>$1</em>")
                            .replace(
                              /`(.*?)`/g,
                              "<code class='bg-black/10 px-1 py-0.5 rounded text-xs'>$1</code>"
                            ),
                        }}
                      />

                      <div className="mt-2 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Show annotation indicators */}
                    {message.annotations && message.annotations.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Highlighter className="w-3 h-3" />
                        <span>
                          {message.annotations.length} annotation(s) added
                        </span>
                      </div>
                    )}

                    {/* Show PDF control indicators */}
                    {message.pdfControls && message.pdfControls.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Navigation className="w-3 h-3" />
                        <span>PDF controls applied</span>
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-green-100">
                        <User className="w-4 h-4 text-green-600" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction("summarize")}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Summarize & Highlight
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction("explain")}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Explain & Annotate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction("navigate")}
            >
              <Navigation className="w-3 h-3 mr-1" />
              Guide Me
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder="Ask me anything about the PDF - I can highlight and navigate for you!"
                className="min-h-[40px] pr-10 resize-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending || isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={toggleRecording}
                disabled={isSending || isLoading}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            🎯 AI with PDF annotation & navigation capabilities
          </p>
        </div>
      </div>
    </div>
  );
}
