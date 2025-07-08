"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Send, Phone, Calendar } from "lucide-react"

interface Message {
  id: number
  sender: string
  content: string
  isBot?: boolean
  isAgent?: boolean
}

interface Translation {
  header: string
  welcome: string
  speak: string
}

interface Translations {
  [key: string]: Translation
}

const translations: Translations = {
  en: {
    header: "Revolut Support – Trust Layer",
    welcome: "👋 Hello Margaret! How can we help you today?",
    speak: "🔔 Speak to a Human",
  },
  ga: {
    header: "Tacaíocht Revolut – Ciseal Iontaobhais",
    welcome: "👋 Dia duit Margaret! Conas is féidir linn cabhrú leat inniu?",
    speak: "🔔 Labhair le Duine",
  },
  fr: {
    header: "Support Revolut – Couche de Confiance",
    welcome: "👋 Bonjour Margaret ! Comment pouvons-nous vous aider ?",
    speak: "🔔 Parler à un Humain",
  },
  es: {
    header: "Soporte Revolut – Capa de Confianza",
    welcome: "👋 Hola Margaret ! ¿Cómo podemos ayudarte hoy?",
    speak: "🔔 Hablar con un Humano",
  },
  pt: {
    header: "Suporte Revolut – Camada de Confiança",
    welcome: "👋 Olá Margaret! Como podemos ajudar você hoje?",
    speak: "🔔 Falar com um Humano",
  },
  ja: {
    header: "レボリュートサポート – 信頼レイヤー",
    welcome: "👋 こんにちは、マーガレットさん！ご用件をお聞かせください。",
    speak: "🔔 人間と話す",
  },
}

const keywordResponses: { [key: string]: string } = {
  "i need help": "Of course! We're here to assist you. How can I help? 🤝",
  "my account was scammed": "I'm really sorry to hear that. I'll escalate this to a human agent immediately. 🔒",
}

const highRiskKeywords = ["scam", "scammed", "fraud", "panic", "stolen", "hacked", "hack", "hijacked"]

export default function RevolutSupportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [showCallbackOptions, setShowCallbackOptions] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const messageIdRef = useRef(0)

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: messageIdRef.current++,
        sender: "Bot",
        content: translations[currentLanguage].welcome,
        isBot: true,
      },
    ])
  }, [currentLanguage])

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = (sender: string, content: string, isBot = false, isAgent = false) => {
    setMessages((prev) => [
      ...prev,
      {
        id: messageIdRef.current++,
        sender,
        content,
        isBot,
        isAgent,
      },
    ])
  }

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang)
  }

  const sendMessage = () => {
    const text = inputValue.trim()
    if (!text) return

    addMessage("You", text)
    setInputValue("")

    const lower = text.toLowerCase()
    const isHighRisk = highRiskKeywords.some((kw) => lower.includes(kw))

    if (isHighRisk) {
      autoEscalate()
    } else {
      normalBotReply(lower)
    }
  }

  const normalBotReply = (lower: string) => {
    if (keywordResponses[lower]) {
      addMessage("Bot", keywordResponses[lower], true)
    } else {
      addMessage("Bot", "Thank you for your message! 😊", true)
    }
  }

  const autoEscalate = () => {
    addMessage("Bot", "I detect this might be urgent. Escalating to a human agent… ⏳", true)
    setTimeout(() => {
      humanAgentJoin()
    }, 5000)
  }

  const manualEscalate = () => {
    addMessage("Bot", "Connecting you to a human agent… ⏳", true)
    setTimeout(() => {
      humanAgentJoin()
    }, 1000)
  }

  const humanAgentJoin = () => {
    addMessage("Agent Sarah", "Hi Margaret, I'm here to help right away.", false, true)
    setIsEscalated(true)
    setShowCallbackOptions(true)
  }

  const instantCallback = () => {
    addMessage("Agent Sarah", "Great! We'll call you in the next few minutes. 📞", false, true)
    setShowCallbackOptions(false)
  }

  const scheduleCallback = () => {
    addMessage("Agent Sarah", "Sure, please suggest a suitable time and we'll schedule your callback. 🗓️", false, true)
    setShowCallbackOptions(false)
  }

  const startRecording = () => {
    addMessage("You (audio)", "🎤 [Audio message sent]")
    alert("Audio recorded and sent (simulation).")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#002663] text-white p-4 flex items-center gap-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Revolut_logo_new.svg/512px-Revolut_logo_new.svg.png"
          alt="Revolut Logo"
          className="h-8"
        />
        <span className="text-xl font-medium">{translations[currentLanguage].header}</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto my-5 bg-white rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        {/* Language Selector */}
        <div className="text-center">
          <div className="flex justify-center gap-2">
            {[
              { code: "en", flag: "🇬🇧" },
              { code: "ga", flag: "🇮🇪" },
              { code: "fr", flag: "🇫🇷" },
              { code: "es", flag: "🇪🇸" },
              { code: "pt", flag: "🇧🇷" },
              { code: "ja", flag: "🇯🇵" },
            ].map(({ code, flag }) => (
              <Button
                key={code}
                variant="ghost"
                size="sm"
                className="text-2xl hover:scale-110 transition-transform"
                onClick={() => changeLanguage(code)}
              >
                {flag}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Box */}
        <div
          ref={chatBoxRef}
          className="border border-gray-300 rounded-xl p-4 bg-gray-50 overflow-y-auto max-h-80 transition-all duration-300"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className="my-2 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <strong
                className={message.isBot ? "text-blue-600" : message.isAgent ? "text-green-600" : "text-gray-800"}
              >
                {message.sender}:
              </strong>{" "}
              {message.content}
            </div>
          ))}

          {/* Callback Options */}
          {showCallbackOptions && (
            <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Button variant="outline" size="sm" className="flex-1 text-sm bg-transparent" onClick={instantCallback}>
                <Phone className="w-4 h-4 mr-1" />
                Instant Callback
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-sm bg-transparent" onClick={scheduleCallback}>
                <Calendar className="w-4 h-4 mr-1" />
                Schedule Callback
              </Button>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here…"
            className="flex-1 rounded-r-none border-r-0"
          />
          <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 rounded-l-none rounded-r-none px-4">
            <Send className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={startRecording} className="rounded-l-none border-l-0 px-4 bg-transparent">
            <Mic className="w-4 h-4" />
          </Button>
        </div>

        {/* Human Button */}
        <Button
          onClick={manualEscalate}
          disabled={isEscalated}
          className="bg-blue-600 hover:bg-blue-700 text-lg py-3 rounded-xl transition-colors"
        >
          {translations[currentLanguage].speak}
        </Button>
      </main>
    </div>
  )
}
