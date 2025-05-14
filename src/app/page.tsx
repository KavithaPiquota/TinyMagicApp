// Additional TypeScript inline configurations to bypass ESLint errors on Render
// Add this at the top of your page.tsx file

/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState } from 'react';
import { callLLM } from '../app/utils/callLLM';

// Define TypeScript interfaces for your data structures
interface Message {
  role: string;
  content: string;
}

interface TemplateItem {
  role?: string;
  model?: string;
  [key: string]: any; // Using any here is okay with the disable directive
}

export default function Home() {
  const [llmProvider, setLlmProvider] = useState<string>('openai');
  const [promptText, setPromptText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]); 
  const [loading, setLoading] = useState<boolean>(false); 

  const sendMessage = async (): Promise<void> => {
    if (promptText.trim()) {
      try {
        const newMessages: Message[] = [...messages, { role: 'user', content: promptText }];
        setMessages(newMessages);
        setLoading(true); 
        const res = await fetch('/api/reviewapi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemContent: 'You are an expert assistant.',
            promptText,
            llmProvider,
          }),
        });

        const templateJson: TemplateItem[] = await res.json();
        const config = templateJson.find((item) => item.model);
        const messageData = templateJson.filter((item) => item.role);
        const llmResponse = await callLLM(llmProvider, config, messageData);

        setMessages([...newMessages, { role: 'assistant', content: llmResponse }] as Message[]);
        setLoading(false); 
      } catch (err) {
        console.error('Error handling key press:', err);
        setLoading(false);
        setMessages([
          ...messages,
          { role: 'assistant', content: 'An error occurred while calling the LLM.' }
        ] as Message[]);
      }
      setPromptText(''); 
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <main className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-4xl font-semibold mb-8 text-center text-blue-400">LLM Prompt Playground</h1>

      <div className="flex items-center justify-center mb-6">
        <label htmlFor="llm-select" className="text-lg font-medium mr-2">Choose LLM:</label>
        <select
          id="llm-select"
          value={llmProvider}
          onChange={(e) => setLlmProvider(e.target.value)}
          className="border border-blue-500 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="openai">OpenAI</option>
          <option value="chatgpt">ChatGPT</option>
          <option value="groq">Groq</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>

      <div className="w-full bg-gray-800 rounded-xl p-4 shadow-xl space-y-4">
        <div className="max-h-[400px] overflow-y-auto space-y-4 p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-5xl p-4 rounded-lg shadow-md text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="max-w-xs p-4 rounded-lg bg-gray-700 text-white text-sm">
                Typing...
              </div>
            </div>
          )}
        </div>

        <textarea
          placeholder="Type your prompt here..."
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={2}
          className="w-full text-gray-800 bg-white p-4 rounded-lg shadow-md placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />

        <div className="w-full flex justify-end">
          <button
            onClick={sendMessage} 
            className="bg-blue-600 text-white px-6 py-2 rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}