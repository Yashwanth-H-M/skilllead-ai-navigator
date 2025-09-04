import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Settings, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { useAuthStore, useProfileStore, useAnalysisStore, useChatStore, useSettingsStore } from '@/lib/stores';
import { chatWithAssistant } from '@/lib/openai';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const ChatPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { profile, profileType } = useProfileStore();
  const { analysis } = useAnalysisStore();
  const { messages, isStreaming, addMessage, updateLastMessage, setStreaming } = useChatStore();
  const { isKeyValid } = useSettingsStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isInitialized && analysis) {
      // Add welcome message
      addMessage({
        role: 'assistant',
        content: `Hello! I'm your AI career assistant. I've analyzed your profile and created a personalized career roadmap. I'm here to help you with:

• Clarifying your career plans and goals
• Answering questions about your recommended path
• Suggesting specific courses and resources
• Helping with interview preparation
• Adjusting timelines based on your constraints

What would you like to discuss about your career journey?`
      });
      setIsInitialized(true);
    }
  }, [analysis, isInitialized, addMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;
    
    if (!isKeyValid) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key in Settings to chat with the assistant.",
        variant: "destructive"
      });
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage
    });

    // Add assistant message placeholder
    addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true
    });

    setStreaming(true);

    try {
      const context = {
        profile: profile!,
        analysis,
        chatHistory: messages.map(m => ({ role: m.role, content: m.content }))
      };

      await chatWithAssistant(
        userMessage,
        context,
        (streamedContent) => {
          updateLastMessage(streamedContent);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage("I apologize, but I encountered an error. Please check your API key configuration and try again.");
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to get response from assistant.",
        variant: "destructive"
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "Help me refine my learning timeline",
    "What remote opportunities are available?", 
    "Suggest budget-friendly courses",
    "How do I prepare for interviews?",
    "What projects should I build?",
    "Help me switch to a different plan"
  ];

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    inputRef.current?.focus();
  };

  if (!analysis) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="glass max-w-md text-center">
            <CardContent className="pt-6">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Analysis Available</h2>
              <p className="text-muted-foreground mb-4">
                Please complete your career analysis first to chat with the AI assistant.
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backgroundIntensity="low">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">AI Career Assistant</h1>
                  <p className="text-sm text-muted-foreground">
                    Personalized guidance based on your analysis
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open('/settings', '_blank')}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex max-w-4xl w-full mx-auto">
          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`chat-message ${message.role} max-w-[80%]`}>
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-3 h-3 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                            {message.isStreaming && message.content === '' && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="p-4 border-t border-border/50">
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium">Quick Actions</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3 text-xs"
                        onClick={() => handleQuickAction(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border/50 bg-background/50">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your career path..."
                  disabled={isStreaming}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isStreaming}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {!isKeyValid && (
                <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded-md">
                  <p className="text-xs text-warning-foreground">
                    Configure your OpenAI API key in Settings to enable chat functionality.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;