
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatWidget from './components/ChatWidget';
import LauncherIcon from './components/LauncherIcon';
import { Message } from './types';
import { WELCOME_MESSAGE } from './constants';
import { getBigbradeResponse, initializeChat } from './services/geminiService';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const hasSentWelcomeMessage = useRef(false);

  useEffect(() => {
    initializeChat();
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await getBigbradeResponse(text);
      const modelMessage: Message = { role: 'model', content: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error getting response from Gemini:", error);
      const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !hasSentWelcomeMessage.current) {
      const welcomeTimeout = setTimeout(() => {
        setIsTyping(true);
        const welcomeMessage: Message = { role: 'model', content: WELCOME_MESSAGE };
        setTimeout(() => {
          setMessages([welcomeMessage]);
          setIsTyping(false);
          hasSentWelcomeMessage.current = true;
        }, 1500);
      }, 1000);

      return () => clearTimeout(welcomeTimeout);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="font-sans antialiased">
      <LauncherIcon isOpen={isOpen} onClick={toggleChat} />
      <ChatWidget
        isOpen={isOpen}
        onClose={toggleChat}
        messages={messages}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default App;
