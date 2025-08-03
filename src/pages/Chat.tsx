import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello ${user?.email?.split('@')[0]}! I'm your AI assistant. I can help you with information about your domains, hosting services, and answer any questions you have about Time Publishers' services. What would you like to know?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Simulate AI response - In production, this would call your Grok API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('domain') || input.includes('domains')) {
      return "I can help you with domain-related queries! Time Publishers offers domain registration for .com domains at PKR 6,250/year and .pk domains at PKR 3,750/year. We provide free DNS management, domain forwarding, and 24/7 support. Would you like to know about your current domains or register a new one?"
    }
    
    if (input.includes('hosting') || input.includes('host')) {
      return "Our hosting services include various packages with SSD storage, unlimited bandwidth, email accounts, and databases. All packages come with 99.9% uptime guarantee, free SSL certificates, and 24/7 support. Would you like to see our hosting packages or check your current hosting services?"
    }
    
    if (input.includes('price') || input.includes('cost') || input.includes('pricing')) {
      return "Here's our pricing:\n• .com domains: PKR 6,250/year\n• .pk domains: PKR 3,750/year\n• Hosting packages start from PKR 2,500/month\n\nAll prices include free DNS management and 24/7 support. Would you like detailed information about any specific service?"
    }
    
    if (input.includes('support') || input.includes('help')) {
      return "Time Publishers provides 24/7 technical support through multiple channels:\n• Email: websol@timepublishers.com\n• Phone: +92-21-34533913\n• Live chat (business hours)\n\nOur expert team is always ready to help with any technical issues or questions you may have."
    }
    
    return "I'm here to help you with information about Time Publishers' services including domains, hosting, pricing, and support. You can ask me about:\n• Your current domains and hosting services\n• Pricing for new services\n• Technical support\n• Service features and benefits\n\nWhat specific information would you like to know?"
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg h-[calc(100vh-8rem)] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-sm text-gray-600">Get instant help with your services</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 ml-2' 
                      : 'bg-gradient-to-br from-yellow-500 to-red-500 mr-2'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-red-500 flex items-center justify-center mr-2">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <Loader className="w-4 h-4 animate-spin text-gray-600" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your services..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}