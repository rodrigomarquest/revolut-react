"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Send, Phone, Calendar, Info, User, Clock, Shield } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Message {
  id: number
  sender: string
  content: string
  isBot?: boolean
  isAgent?: boolean
  timestamp: string
  nextStep?: string
}

interface Translation {
  header: string
  welcome: string
  speak: string
  postSubmission: string
  calmMode: string
  normalMode: string
}

interface Translations {
  [key: string]: Translation
}

const translations: Translations = {
  en: {
    header: "Customer Support",
    welcome: "👋 Hello Margaret! How can we help you today?",
    speak: "🔔 Speak to a Human",
    postSubmission: "Thanks, Margaret. A real person is reviewing this now. We'll update you shortly.",
    calmMode: "Calm Mode",
    normalMode: "Normal Mode",
  },
  ga: {
    header: "Customer Support",
    welcome: "👋 Dia duit Margaret! Conas is féidir linn cabhrú leat inniu?",
    speak: "🔔 Labhair le Duine",
    postSubmission: "Go raibh maith agat, Margaret. Tá duine fíor ag athbhreithniú seo anois.",
    calmMode: "Mód Suaimhneach",
    normalMode: "Gnáthmhód",
  },
  fr: {
    header: "Customer Support",
    welcome: "👋 Bonjour Margaret ! Comment pouvons-nous vous aider ?",
    speak: "🔔 Parler à un Humain",
    postSubmission: "Merci, Margaret. Une vraie personne examine cela maintenant.",
    calmMode: "Mode Calme",
    normalMode: "Mode Normal",
  },
  es: {
    header: "Customer Support",
    welcome: "👋 Hola Margaret ! ¿Cómo podemos ayudarte hoy?",
    speak: "🔔 Hablar con un Humano",
    postSubmission: "Gracias, Margaret. Una persona real está revisando esto ahora.",
    calmMode: "Modo Tranquilo",
    normalMode: "Modo Normal",
  },
  pt: {
    header: "Customer Support",
    welcome: "👋 Olá Margaret! Como podemos ajudar você hoje?",
    speak: "🔔 Falar com um Humano",
    postSubmission: "Obrigado, Margaret. Uma pessoa real está analisando isso agora.",
    calmMode: "Modo Calmo",
    normalMode: "Modo Normal",
  },
  ja: {
    header: "Customer Support",
    welcome: "👋 こんにちは、マーガレットさん！ご用件をお聞かせください。",
    speak: "🔔 人間と話す",
    postSubmission: "ありがとうございます、マーガレットさん。実際の担当者が確認中です。",
    calmMode: "落ち着きモード",
    normalMode: "通常モード",
  },
}

const highRiskKeywords = [
  "scam",
  "scammed",
  "fraud",
  "fraudulent",
  "panic",
  "stolen",
  "hacked",
  "hack",
  "hijacked",
  "unauthorized",
  "suspicious",
  "emergency",
  "urgent",
  "help me",
  "lost money",
  "missing funds",
  "can't access",
  "locked out",
  "compromised",
]

const emotionalKeywords = [
  "worried",
  "scared",
  "anxious",
  "desperate",
  "confused",
  "angry",
  "frustrated",
  "upset",
  "stressed",
  "concerned",
  "terrified",
  "devastated",
]

const keywordResponses: { [key: string]: string } = {
  "i need help": "Of course! We're here to assist you. How can I help? 🤝",
  "my account was scammed": "I'm really sorry to hear that. I'll escalate this to a human agent immediately. 🔒",
}

const glossaryTerms: { [key: string]: string } = {
  chargeback:
    "A chargeback is when you dispute a payment and ask your bank to reverse it. This usually happens when you didn't authorize a transaction or there was an error.",
  hold: "A hold is when we temporarily freeze some money in your account for security reasons. This is usually lifted within 1-3 business days after verification.",
  verification:
    "Verification is the process where we check your identity to keep your account safe. This might involve uploading documents or answering security questions.",
  "pending transaction":
    "A pending transaction is a payment that has been authorized but not yet completed. It usually takes 1-3 business days to process.",
  "available balance":
    "Your available balance is the money you can spend right now. It doesn't include pending transactions or money on hold.",
  "security check":
    "A security check is when we review your account activity to make sure everything is legitimate and your money is safe.",
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function RevolutSupportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [showCallbackOptions, setShowCallbackOptions] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const [isCalmMode, setIsCalmMode] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const messageIdRef = useRef(0)

  const [escalationTimer, setEscalationTimer] = useState<NodeJS.Timeout | null>(null)
  const [escalationCountdown, setEscalationCountdown] = useState(0)
  const [isHighRiskDetected, setIsHighRiskDetected] = useState(false)
  const [agentETA, setAgentETA] = useState(5)
  const [hasSubmittedToHuman, setHasSubmittedToHuman] = useState(false)

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: messageIdRef.current++,
        sender: "Bot",
        content: translations[currentLanguage].welcome,
        isBot: true,
        timestamp: formatTime(new Date()),
        nextStep: "Feel free to describe your issue, and I'll help you right away.",
      },
    ])
  }, [currentLanguage])

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    return () => {
      if (escalationTimer) {
        clearInterval(escalationTimer)
      }
    }
  }, [escalationTimer])

  const addMessage = (sender: string, content: string, isBot = false, isAgent = false, nextStep?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: messageIdRef.current++,
        sender,
        content,
        isBot,
        isAgent,
        timestamp: formatTime(new Date()),
        nextStep,
      },
    ])
  }

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang)
  }

  const toggleCalmMode = () => {
    setIsCalmMode(!isCalmMode)
  }

  const sendMessage = () => {
    const text = inputValue.trim()
    if (!text) return

    addMessage("You", text)
    setInputValue("")

    const lower = text.toLowerCase()
    const isHighRisk = highRiskKeywords.some((kw) => lower.includes(kw))
    const isEmotional = emotionalKeywords.some((kw) => lower.includes(kw))

    if (isHighRisk) {
      autoEscalate("high")
    } else if (isEmotional) {
      autoEscalate("medium")
    } else {
      normalBotReply(lower)
    }
  }

  const normalBotReply = (lower: string) => {
    if (keywordResponses[lower]) {
      addMessage(
        "Bot",
        keywordResponses[lower],
        true,
        false,
        "I'm here to help with any other questions you might have.",
      )
    } else {
      addMessage(
        "Bot",
        "Thank you for your message! 😊",
        true,
        false,
        "Please let me know if you need any clarification or have more questions.",
      )
    }
  }

  const autoEscalate = (riskLevel: "high" | "medium" = "high") => {
    setIsHighRiskDetected(true)

    if (riskLevel === "high") {
      addMessage(
        "Security Bot",
        "🚨 HIGH PRIORITY: Security concern detected. Initiating immediate escalation protocol...",
        true,
        false,
        "A security specialist will join this chat within 2 minutes to assist you personally.",
      )
      setAgentETA(2) // 2 minutes for high risk
    } else {
      addMessage(
        "Bot",
        "I detect this might need special attention. Escalating to a human agent...",
        true,
        false,
        "A human agent will join this chat within 5 minutes to provide personalized assistance.",
      )
      setAgentETA(5) // 5 minutes for medium risk
    }

    setEscalationCountdown(agentETA * 60) // Convert to seconds

    // Start countdown timer
    const timer = setInterval(() => {
      setEscalationCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          humanAgentJoin()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setEscalationTimer(timer)

    // Show callback options immediately for high risk
    if (riskLevel === "high") {
      setTimeout(() => {
        setShowCallbackOptions(true)
        addMessage("Security Bot", "Would you like an immediate callback while we prepare your case?", true)
      }, 2000)
    }
  }

  const manualEscalate = () => {
    if (!hasSubmittedToHuman) {
      setHasSubmittedToHuman(true)
      addMessage(
        "Bot",
        translations[currentLanguage].postSubmission,
        true,
        false,
        "Expected response time: 2-5 minutes. You'll receive updates here.",
      )
    }

    addMessage(
      "Bot",
      "Connecting you to a human agent… ⏳",
      true,
      false,
      "Please stay on this page - your agent will appear here shortly.",
    )
    setTimeout(() => {
      humanAgentJoin()
    }, 1000)
  }

  const humanAgentJoin = () => {
    if (escalationTimer) {
      clearInterval(escalationTimer)
      setEscalationTimer(null)
    }

    const agentName = isHighRiskDetected ? "Security Agent Mike" : "Agent Sarah"
    const message = isHighRiskDetected
      ? "Hi, I'm Mike from our Security team. I've reviewed your case and I'm here to help immediately. 🔒"
      : "Hi Margaret, I'm here to help right away."

    addMessage(
      agentName,
      message,
      false,
      true,
      "I'll work with you to resolve this issue. Feel free to ask any questions - I'm here to help.",
    )
    setIsEscalated(true)
    setEscalationCountdown(0)

    if (!showCallbackOptions) {
      setShowCallbackOptions(true)
    }
  }

  const instantCallback = () => {
    addMessage(
      "Agent Sarah",
      "Great! We'll call you in the next few minutes. 📞",
      false,
      true,
      "Please keep your phone nearby. We'll call from +44 203 695 8888.",
    )
    setShowCallbackOptions(false)
  }

  const scheduleCallback = () => {
    addMessage(
      "Agent Sarah",
      "Sure, please suggest a suitable time and we'll schedule your callback. 🗓️",
      false,
      true,
      "Just let me know your preferred time and timezone, and I'll arrange it for you.",
    )
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

  const cancelEscalation = () => {
    if (escalationTimer) {
      clearInterval(escalationTimer)
      setEscalationTimer(null)
    }
    setEscalationCountdown(0)
    setIsHighRiskDetected(false)
    addMessage(
      "Bot",
      "Escalation cancelled. How else can I help you?",
      true,
      false,
      "I'm still here to assist with any questions you might have.",
    )
  }

  const renderMessageWithGlossary = (content: string) => {
    let processedContent = content

    Object.entries(glossaryTerms).forEach(([term, definition]) => {
      const regex = new RegExp(`\\b${term}\\b`, "gi")
      if (processedContent.match(regex)) {
        processedContent = processedContent.replace(
          regex,
          `<span class="glossary-term" data-definition="${definition}">${term}</span>`,
        )
      }
    })

    return processedContent
  }

  const GlossaryTooltip = ({
    term,
    definition,
    children,
  }: { term: string; definition: string; children: React.ReactNode }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted decoration-blue-400 cursor-help text-blue-600">{children}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-blue-900">{term}</div>
              <div className="text-sm text-blue-700 mt-1">{definition}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  const renderContentWithGlossary = (content: string) => {
    let parts = [content]

    Object.entries(glossaryTerms).forEach(([term, definition]) => {
      const newParts: (string | React.ReactNode)[] = []

      parts.forEach((part) => {
        if (typeof part === "string") {
          const regex = new RegExp(`\\b(${term})\\b`, "gi")
          const matches = part.split(regex)

          matches.forEach((match, index) => {
            if (match.toLowerCase() === term.toLowerCase()) {
              newParts.push(
                <GlossaryTooltip key={`${term}-${index}`} term={term} definition={definition}>
                  {match}
                </GlossaryTooltip>,
              )
            } else if (match) {
              newParts.push(match)
            }
          })
        } else {
          newParts.push(part)
        }
      })

      parts = newParts
    })

    return parts
  }

  return (
    <div className={`min-h-screen bg-[#f4f8fb] flex flex-col font-sans ${isCalmMode ? "text-lg" : ""}`}>
      {/* Header */}
      <header className={`bg-[#002663] text-white p-4 flex items-center gap-3 ${isCalmMode ? "p-6" : ""}`}>
        <img src="/revolut-logo.svg" alt="Revolut Logo" className="h-8 w-auto filter brightness-0 invert" />
        <span className={`font-medium ${isCalmMode ? "text-2xl" : "text-xl"}`}>
          {translations[currentLanguage].header}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="text-sm">Secure Chat</span>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 max-w-2xl mx-auto my-5 bg-white rounded-2xl shadow-lg flex flex-col gap-4 ${isCalmMode ? "p-8 max-w-3xl" : "p-5"}`}
      >
        {/* Controls */}
        <div className="flex justify-between items-center">
          {/* Language Selector */}
          <div className="flex gap-2">
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
                size={isCalmMode ? "lg" : "sm"}
                className={`hover:scale-110 transition-transform ${isCalmMode ? "text-3xl" : "text-2xl"}`}
                onClick={() => changeLanguage(code)}
              >
                {flag}
              </Button>
            ))}
          </div>

          {/* Calm Mode Toggle */}
          <Button
            variant="outline"
            size={isCalmMode ? "lg" : "sm"}
            onClick={toggleCalmMode}
            className={`flex items-center gap-2 ${isCalmMode ? "bg-green-50 border-green-200 text-green-700" : ""}`}
          >
            <User className="w-4 h-4" />
            {isCalmMode ? translations[currentLanguage].normalMode : translations[currentLanguage].calmMode}
          </Button>
        </div>

        {/* Chat Box */}
        <div
          ref={chatBoxRef}
          className={`border rounded-xl p-4 bg-gray-50 overflow-y-auto transition-all duration-300 ${
            isCalmMode ? "border-2 border-gray-400 max-h-96 p-6 bg-white" : "border-gray-300 max-h-80"
          }`}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`my-3 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                isCalmMode ? "my-4 p-3 rounded-lg bg-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <strong
                  className={`${
                    message.isBot ? "text-blue-600" : message.isAgent ? "text-green-600" : "text-gray-800"
                  } ${isCalmMode ? "text-xl" : ""}`}
                >
                  {message.sender}
                </strong>
                <span className={`text-gray-500 flex items-center gap-1 ${isCalmMode ? "text-base" : "text-xs"}`}>
                  <Clock className="w-3 h-3" />
                  {message.timestamp}
                </span>
                {message.isAgent && (
                  <span
                    className={`bg-green-100 text-green-700 px-2 py-1 rounded-full ${isCalmMode ? "text-sm" : "text-xs"}`}
                  >
                    Human Agent
                  </span>
                )}
              </div>
              <div className={isCalmMode ? "text-lg leading-relaxed" : ""}>
                {renderContentWithGlossary(message.content)}
              </div>
              {message.nextStep && (
                <div
                  className={`mt-2 text-gray-600 italic flex items-start gap-2 ${isCalmMode ? "text-base" : "text-sm"}`}
                >
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Next: {message.nextStep}</span>
                </div>
              )}
            </div>
          ))}

          {/* Escalation Countdown */}
          {escalationCountdown > 0 && (
            <div
              className={`mt-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                isCalmMode ? "p-4 border-2" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <strong className={isCalmMode ? "text-lg" : ""}>
                    Agent connecting in: {Math.floor(escalationCountdown / 60)}:
                    {(escalationCountdown % 60).toString().padStart(2, "0")}
                  </strong>
                </div>
                <Button
                  variant="outline"
                  size={isCalmMode ? "default" : "sm"}
                  onClick={cancelEscalation}
                  className="bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
              <div className={`text-red-600 mt-1 ${isCalmMode ? "text-base" : "text-sm"}`}>
                Priority case #{Math.floor(Math.random() * 10000)} - Security team notified
              </div>
            </div>
          )}

          {/* Callback Options */}
          {showCallbackOptions && (
            <div
              className={`mt-3 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                isCalmMode ? "flex-col gap-3" : ""
              }`}
            >
              <Button
                variant="outline"
                size={isCalmMode ? "lg" : "sm"}
                className={`flex-1 bg-transparent ${isCalmMode ? "text-base py-3" : "text-sm"}`}
                onClick={instantCallback}
              >
                <Phone className="w-4 h-4 mr-2" />
                Instant Callback
              </Button>
              <Button
                variant="outline"
                size={isCalmMode ? "lg" : "sm"}
                className={`flex-1 bg-transparent ${isCalmMode ? "text-base py-3" : "text-sm"}`}
                onClick={scheduleCallback}
              >
                <Calendar className="w-4 h-4 mr-2" />
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
            className={`flex-1 rounded-r-none border-r-0 ${isCalmMode ? "text-lg p-4 border-2 border-gray-400" : ""}`}
          />
          <Button
            onClick={sendMessage}
            className={`bg-blue-600 hover:bg-blue-700 rounded-l-none rounded-r-none ${
              isCalmMode ? "px-6 py-4" : "px-4"
            }`}
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={startRecording}
            className={`rounded-l-none border-l-0 bg-transparent ${
              isCalmMode ? "px-6 py-4 border-2 border-gray-400" : "px-4"
            }`}
          >
            <Mic className="w-4 h-4" />
          </Button>
        </div>

        {/* Always-Visible Human Button */}
        <Button
          onClick={manualEscalate}
          disabled={isEscalated}
          className={`bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 ${
            isCalmMode ? "text-xl py-6 bg-green-600 hover:bg-green-700 border-2 border-green-400" : "text-lg py-3"
          }`}
        >
          <User className="w-5 h-5" />
          {translations[currentLanguage].speak}
          {hasSubmittedToHuman && (
            <span className="bg-white text-green-600 px-2 py-1 rounded-full text-sm ml-2">✓ Submitted</span>
          )}
        </Button>

        {/* Trust Indicators */}
        <div
          className={`text-center text-gray-600 flex items-center justify-center gap-4 ${
            isCalmMode ? "text-base" : "text-sm"
          }`}
        >
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-4 h-4 text-blue-600" />
            <span>Real Human Support</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>24/7 Available</span>
          </div>
        </div>
      </main>
    </div>
  )
}
