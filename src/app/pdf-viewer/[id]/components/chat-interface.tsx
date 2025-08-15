"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  FileText,
  MessageSquare,
} from "lucide-react";

interface ChatInterfaceProps {
  pdfId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  pageReference?: number;
  annotations?: {
    type: "highlight" | "circle";
    coordinates: { x: number; y: number; width: number; height: number };
  }[];
}

export function ChatInterface({ pdfId }: ChatInterfaceProps) {
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

  // Load existing chats when component mounts
  useEffect(() => {
    loadExistingChats();
  }, [pdfId]);

  const loadExistingChats = async () => {
    try {
      setIsLoading(true);

      // First, get all chats for this PDF
      const chatsResponse = await fetch(`/api/pdf/${pdfId}/chats`);
      if (!chatsResponse.ok) {
        throw new Error("Failed to fetch chats");
      }

      const chatsData = await chatsResponse.json();

      if (chatsData.chats && chatsData.chats.length > 0) {
        // Load the most recent chat
        const mostRecentChat = chatsData.chats[0];
        setChatId(mostRecentChat.id);

        // Get the full chat history
        const chatResponse = await fetch(`/api/chat/${mostRecentChat.id}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();

          const loadedMessages: Message[] = chatData.chat.messages.map(
            (msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            })
          );

          setMessages(loadedMessages);
        }
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi! I'm your AI tutor. I'm ready to help you understand this PDF document. Ask me anything about the content, and I can provide explanations and insights!",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load existing chats:", error);
      // Fallback to welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi! I'm your AI tutor. I'm ready to help you understand this PDF document. Ask me anything about the content, and I can provide explanations and insights!",
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
      content: newMessage.trim(),
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

      // Update chatId if this is a new chat or first message
      if (data.chatId && data.chatId !== chatId) {
        setChatId(data.chatId);
      }

      const aiMessage: Message = {
        id: data.aiMessage.id,
        role: "assistant",
        content: data.aiMessage.content,
        timestamp: new Date(data.aiMessage.timestamp),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I encountered an error while processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-100">
              <Bot className="w-5 h-5 text-blue-600" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">AI Tutor</h3>
            <p className="text-sm text-gray-500">Ready to help you learn</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="space-y-4 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="space-y-4 text-center">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">Loading chat history...</p>
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
                      <AvatarFallback className="bg-blue-100">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>

                    {message.pageReference && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="w-3 h-3 opacity-70" />
                        <span className="text-xs opacity-70">
                          Reference: Page {message.pageReference}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
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
                    <AvatarFallback className="bg-blue-100">
                      <Bot className="w-4 h-4 text-blue-600" />
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

      <div className="border-t border-gray-200 p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Summarize
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Explain this section
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Quiz me
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about this document..."
                className="min-h-[80px] resize-none pr-12"
                disabled={isSending}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={toggleRecording}
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
              disabled={!newMessage.trim() || isSending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
