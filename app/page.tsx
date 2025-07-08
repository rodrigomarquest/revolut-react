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
    welcome:
      "👋 Hello Margaret! I'm here to help you today. Don't worry - whatever you're facing, we'll work through it together. How can I assist you?",
    speak: "🔔 Speak to a Human",
    postSubmission:
      "Thank you, Margaret. I understand this might feel overwhelming, but a real person is reviewing your case right now. You're not alone in this - we'll update you very shortly.",
    calmMode: "Calm Mode",
    normalMode: "Normal Mode",
  },
  ga: {
    header: "Customer Support",
    welcome:
      "👋 Dia duit Margaret! Táim anseo chun cabhrú leat inniu. Ná bí buartha - pé rud atá romhat, oibreoimid tríd le chéile.",
    speak: "🔔 Labhair le Duine",
    postSubmission:
      "Go raibh maith agat, Margaret. Tuigim go bhféadfadh sé seo a bheith ró-mhór, ach tá duine fíor ag athbhreithniú do chás anois.",
    calmMode: "Mód Suaimhneach",
    normalMode: "Gnáthmhód",
  },
  fr: {
    header: "Customer Support",
    welcome:
      "👋 Bonjour Margaret ! Je suis là pour vous aider aujourd'hui. Ne vous inquiétez pas - quoi que vous traversiez, nous allons le résoudre ensemble.",
    speak: "🔔 Parler à un Humain",
    postSubmission:
      "Merci, Margaret. Je comprends que cela puisse sembler accablant, mais une vraie personne examine votre cas maintenant.",
    calmMode: "Mode Calme",
    normalMode: "Mode Normal",
  },
  es: {
    header: "Customer Support",
    welcome:
      "👋 Hola Margaret! Estoy aquí para ayudarte hoy. No te preocupes - sea lo que sea que estés enfrentando, lo resolveremos juntos.",
    speak: "🔔 Hablar con un Humano",
    postSubmission:
      "Gracias, Margaret. Entiendo que esto puede sentirse abrumador, pero una persona real está revisando tu caso ahora.",
    calmMode: "Modo Tranquilo",
    normalMode: "Modo Normal",
  },
  pt: {
    header: "Customer Support",
    welcome:
      "👋 Olá Margaret! Estou aqui para ajudar você hoje. Não se preocupe - seja o que for que você esteja enfrentando, vamos resolver juntos.",
    speak: "🔔 Falar com um Humano",
    postSubmission:
      "Obrigado, Margaret. Entendo que isso pode parecer esmagador, mas uma pessoa real está analisando seu caso agora.",
    calmMode: "Modo Calmo",
    normalMode: "Modo Normal",
  },
  ja: {
    header: "Customer Support",
    welcome:
      "👋 こんにちは、マーガレットさん！今日はお手伝いさせていただきます。ご心配なく - どのような問題でも、一緒に解決いたします。",
    speak: "🔔 人間と話す",
    postSubmission:
      "ありがとうございます、マーガレットさん。圧倒的に感じるかもしれませんが、実際の担当者があなたのケースを確認中です。",
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
  "i need help":
    "Of course! I'm here for you, and you're not alone in this. Take a deep breath - we'll figure this out together. What's happening that I can help you with? 🤝",
  "my account was scammed":
    "I'm so sorry this happened to you - I can only imagine how stressful this must be. Please don't worry, you've come to the right place. I'm escalating this to our security team immediately so we can protect you and get this resolved. 🔒",
  "i'm worried":
    "I understand you're feeling worried, and that's completely natural. You're being very smart by reaching out for help. Let's work through this step by step - I'm here to support you. What's on your mind?",
  "i'm scared":
    "I hear you, and I want you to know that your feelings are completely valid. It's okay to feel scared, but please remember - you're not facing this alone. We're here to help and protect you. Can you tell me what's making you feel this way?",
  "i'm confused":
    "That's perfectly okay - sometimes things can feel overwhelming and confusing. There's no judgment here, and no question is too small. Let's break this down together, one step at a time. What would you like me to help clarify?",
}

const glossaryTerms: { [key: string]: string } = {
  chargeback:
    "A chargeback is when you dispute a payment and ask your bank to reverse it. This usually happens when you didn't authorize a transaction or there was an error. Don't worry - this is a normal process designed to protect you.",
  hold: "A hold is when we temporarily freeze some money in your account for security reasons. I know this can be concerning, but it's actually a good thing - it means our systems are protecting you. This is usually lifted within 1-3 business days after verification.",
  verification:
    "Verification is the process where we check your identity to keep your account safe. Think of it as an extra layer of protection for you. This might involve uploading documents or answering security questions - all completely normal and secure.",
  "pending transaction":
    "A pending transaction is a payment that has been authorized but not yet completed. Don't worry if you see this - it's completely normal and usually takes 1-3 business days to process fully.",
  "available balance":
    "Your available balance is the money you can spend right now. It doesn't include pending transactions or money on hold - this is designed to protect you from accidentally overspending.",
  "security check":
    "A security check is when we review your account activity to make sure everything is legitimate and your money is safe. This might seem inconvenient, but it's one of the ways we protect you and your funds.",
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
        sender: "Support Assistant",
        content: translations[currentLanguage].welcome,
        isBot: true,
        timestamp: formatTime(new Date()),
        nextStep: "Feel free to share what's on your mind - I'm here to listen and help you through this.",
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
        "Support Assistant",
        keywordResponses[lower],
        true,
        false,
        "I'm here to support you through whatever comes next. Please don't hesitate to ask anything else.",
      )
    } else {
      addMessage(
        "Support Assistant",
        "Thank you for sharing that with me! 😊 I really appreciate you taking the time to reach out. You're in good hands here.",
        true,
        false,
        "Please know that I'm here to help with anything else you need. No question is too small or too big.",
      )
    }
  }

  const autoEscalate = (riskLevel: "high" | "medium" = "high") => {
    setIsHighRiskDetected(true)

    if (riskLevel === "high") {
      addMessage(
        "Security Support",
        "🚨 I can see this is urgent and I want to help you right away. Don't worry - you've done the right thing by reaching out. I'm connecting you with our security specialists immediately because your safety and peace of mind are our top priority.",
        true,
        false,
        "A security specialist who deals with these situations every day will join this chat within 2 minutes. You're going to be okay - we've got this handled.",
      )
      setAgentETA(2) // 2 minutes for high risk
    } else {
      addMessage(
        "Support Assistant",
        "I can hear the concern in your message, and I want you to know that's completely understandable. You're not alone in feeling this way. Let me connect you with one of our human agents who can give you the personal attention you deserve.",
        true,
        false,
        "A caring human agent will join this chat within 5 minutes to provide you with personalized support. Take a deep breath - help is on the way.",
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
        addMessage(
          "Security Support",
          "While we're preparing your case, would you feel more comfortable with an immediate phone call? Sometimes it helps to hear a friendly voice. 📞",
          true,
        )
      }, 2000)
    }
  }

  const manualEscalate = () => {
    if (!hasSubmittedToHuman) {
      setHasSubmittedToHuman(true)
      addMessage(
        "Support Assistant",
        translations[currentLanguage].postSubmission,
        true,
        false,
        "Expected response time: 2-5 minutes. You'll receive updates here, and remember - you're doing great by reaching out for help.",
      )
    }

    addMessage(
      "Support Assistant",
      "I'm connecting you to one of our wonderful human agents right now… ⏳ They're going to take excellent care of you.",
      true,
      false,
      "Please stay right here on this page - your dedicated agent will appear here very shortly. You're in good hands.",
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

    const agentName = isHighRiskDetected ? "Security Specialist Mike" : "Support Agent Sarah"
    const message = isHighRiskDetected
      ? "Hi Margaret, I'm Mike from our Security team. I've already reviewed your case and I want you to know - you're safe now, and we're going to get this sorted out together. Take a deep breath, you've done everything right. 🔒"
      : "Hi Margaret! I'm Sarah, and I'm so glad you reached out today. I'm here to give you my full attention and support. Whatever brought you here, we're going to work through it together. How are you feeling right now?"

    addMessage(
      agentName,
      message,
      false,
      true,
      "I'm completely focused on helping you resolve this. Please feel free to share anything that's on your mind - there's no judgment here, only support.",
    )
    setIsEscalated(true)
    setEscalationCountdown(0)

    if (!showCallbackOptions) {
      setShowCallbackOptions(true)
    }
  }

  const instantCallback = () => {
    addMessage(
      "Support Agent Sarah",
      "I completely understand wanting to talk this through. We'll call you within the next 2-3 minutes. 📞 Please keep your phone close by - it's going to be okay.",
      false,
      true,
      "We'll call from +44 203 695 8888. If you miss the call, don't worry - we'll try again and you can always message me here.",
    )
    setShowCallbackOptions(false)
  }

  const scheduleCallback = () => {
    addMessage(
      "Support Agent Sarah",
      "Of course! I want to make sure we connect at a time that works perfectly for you. 🗓️ Your comfort and convenience matter to us.",
      false,
      true,
      "Just let me know your preferred time and timezone, and I'll personally arrange it for you. We'll make sure you get the support you need.",
    )
    setShowCallbackOptions(false)
  }

  const startRecording = () => {
    addMessage("You (audio)", "🎤 [Audio message sent - thank you for sharing]")
    alert("Your audio message has been received. Thank you for taking the time to share with us.")
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
      "Support Assistant",
      "No problem at all! I'm still here and ready to help you with whatever you need. Sometimes it's good to take a moment to think things through.",
      true,
      false,
      "I'm here for you whenever you're ready. What else can I help you with today?",
    )
  }

  const GlossaryTooltip = ({
    term,
    definition,
    children,
  }: { term: string; definition: string; children: React.ReactNode }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted decoration-blue-600 cursor-help text-blue-800 font-medium">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4 bg-blue-50 border-2 border-blue-300 text-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-800 mt-1 flex-shrink-0" />
            <div>
              <div className="font-bold text-blue-900 text-lg">{term}</div>
              <div className="text-blue-800 mt-2 text-base leading-relaxed">{definition}</div>
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
    <div
      className={`min-h-screen bg-[#f8fafc] flex flex-col font-sans text-lg leading-relaxed ${isCalmMode ? "text-xl" : ""}`}
    >
      {/* Header */}
      <header className={`bg-[#1a1a1a] text-white p-6 flex items-center gap-4 ${isCalmMode ? "p-8" : ""}`}>
        <img src="/revolut-logo.svg" alt="Revolut Logo" className="h-10 w-auto filter brightness-0 invert" />
        <span className={`font-semibold ${isCalmMode ? "text-3xl" : "text-2xl"}`}>
          {translations[currentLanguage].header}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <span className="text-lg font-medium">Secure Chat</span>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 max-w-4xl mx-auto my-6 bg-white rounded-3xl shadow-xl flex flex-col gap-6 ${isCalmMode ? "p-10 max-w-5xl" : "p-8"}`}
      >
        {/* Controls */}
        <div className="flex justify-between items-center">
          {/* Language Selector */}
          <div className="flex gap-3">
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
                className={`hover:scale-110 transition-transform min-h-[48px] px-4 ${isCalmMode ? "text-4xl min-h-[56px]" : "text-3xl"}`}
                onClick={() => changeLanguage(code)}
              >
                {flag}
              </Button>
            ))}
          </div>

          {/* Calm Mode Toggle */}
          <Button
            variant="outline"
            onClick={toggleCalmMode}
            className={`flex items-center gap-3 min-h-[48px] px-6 text-lg font-medium border-2 ${
              isCalmMode
                ? "bg-green-50 border-green-400 text-green-800 min-h-[56px] text-xl"
                : "border-gray-400 text-gray-800"
            }`}
          >
            <User className="w-5 h-5" />
            {isCalmMode ? translations[currentLanguage].normalMode : translations[currentLanguage].calmMode}
          </Button>
        </div>

        {/* Chat Box */}
        <div
          ref={chatBoxRef}
          className={`border-2 rounded-2xl p-6 bg-gray-50 overflow-y-auto transition-all duration-300 ${
            isCalmMode ? "border-gray-500 max-h-[500px] p-8 bg-white" : "border-gray-400 max-h-[400px]"
          }`}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`my-4 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                isCalmMode ? "my-6 p-4 rounded-xl bg-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <strong
                  className={`${
                    message.isBot ? "text-blue-800" : message.isAgent ? "text-green-800" : "text-gray-900"
                  } ${isCalmMode ? "text-2xl" : "text-xl"}`}
                >
                  {message.sender}
                </strong>
                <span
                  className={`text-gray-700 flex items-center gap-2 font-medium ${isCalmMode ? "text-lg" : "text-base"}`}
                >
                  <Clock className="w-4 h-4" />
                  {message.timestamp}
                </span>
                {message.isAgent && (
                  <span
                    className={`bg-green-100 text-green-800 px-3 py-2 rounded-full font-semibold border-2 border-green-300 ${isCalmMode ? "text-base" : "text-sm"}`}
                  >
                    Human Agent
                  </span>
                )}
              </div>
              <div className={`text-gray-900 ${isCalmMode ? "text-xl leading-relaxed" : "text-lg leading-relaxed"}`}>
                {renderContentWithGlossary(message.content)}
              </div>
              {message.nextStep && (
                <div
                  className={`mt-3 text-gray-700 italic flex items-start gap-3 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400 ${isCalmMode ? "text-lg" : "text-base"}`}
                >
                  <Info className="w-5 h-5 mt-1 flex-shrink-0 text-blue-600" />
                  <span>
                    <strong>Next:</strong> {message.nextStep}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Escalation Countdown */}
          {escalationCountdown > 0 && (
            <div
              className={`mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                isCalmMode ? "p-6 border-4" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-800">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <strong className={`font-bold ${isCalmMode ? "text-xl" : "text-lg"}`}>
                    Agent connecting in: {Math.floor(escalationCountdown / 60)}:
                    {(escalationCountdown % 60).toString().padStart(2, "0")}
                  </strong>
                </div>
                <Button
                  variant="outline"
                  onClick={cancelEscalation}
                  className="bg-white hover:bg-gray-50 border-2 border-gray-400 text-gray-800 min-h-[48px] px-4 font-medium"
                >
                  Cancel
                </Button>
              </div>
              <div className={`text-red-700 mt-2 font-medium ${isCalmMode ? "text-lg" : "text-base"}`}>
                Priority case #{Math.floor(Math.random() * 10000)} - Security team notified and standing by
              </div>
            </div>
          )}

          {/* Callback Options */}
          {showCallbackOptions && (
            <div
              className={`mt-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                isCalmMode ? "flex-col gap-4" : ""
              }`}
            >
              <Button
                variant="outline"
                className={`flex-1 bg-transparent border-2 border-blue-400 text-blue-800 hover:bg-blue-50 min-h-[48px] font-medium ${isCalmMode ? "text-lg py-4" : "text-base"}`}
                onClick={instantCallback}
              >
                <Phone className="w-5 h-5 mr-3" />
                Instant Callback
              </Button>
              <Button
                variant="outline"
                className={`flex-1 bg-transparent border-2 border-blue-400 text-blue-800 hover:bg-blue-50 min-h-[48px] font-medium ${isCalmMode ? "text-lg py-4" : "text-base"}`}
                onClick={scheduleCallback}
              >
                <Calendar className="w-5 h-5 mr-3" />
                Schedule Callback
              </Button>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-0">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here… We're here to listen and help."
            className={`flex-1 rounded-r-none border-r-0 border-2 border-gray-400 text-gray-900 ${isCalmMode ? "text-xl p-6 min-h-[56px]" : "text-lg p-4 min-h-[48px]"}`}
          />
          <Button
            onClick={sendMessage}
            className={`bg-blue-700 hover:bg-blue-800 text-white rounded-l-none rounded-r-none border-2 border-blue-700 font-medium ${
              isCalmMode ? "px-8 min-h-[56px]" : "px-6 min-h-[48px]"
            }`}
          >
            <Send className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            onClick={startRecording}
            className={`rounded-l-none border-l-0 bg-transparent border-2 border-gray-400 text-gray-800 hover:bg-gray-50 font-medium ${
              isCalmMode ? "px-8 min-h-[56px]" : "px-6 min-h-[48px]"
            }`}
          >
            <Mic className="w-5 h-5" />
          </Button>
        </div>

        {/* Always-Visible Human Button */}
        <Button
          onClick={manualEscalate}
          disabled={isEscalated}
          className={`bg-blue-700 hover:bg-blue-800 text-white rounded-2xl transition-colors flex items-center justify-center gap-3 font-semibold shadow-lg ${
            isCalmMode
              ? "text-2xl py-8 bg-green-700 hover:bg-green-800 border-4 border-green-500 min-h-[64px]"
              : "text-xl py-6 min-h-[56px]"
          }`}
        >
          <User className="w-6 h-6" />
          {translations[currentLanguage].speak}
          {hasSubmittedToHuman && (
            <span className="bg-white text-green-700 px-3 py-2 rounded-full text-base ml-3 font-bold border-2 border-green-300">
              ✓ Submitted
            </span>
          )}
        </Button>

        {/* Trust Indicators */}
        <div
          className={`text-center text-gray-800 flex items-center justify-center gap-6 font-medium ${
            isCalmMode ? "text-lg" : "text-base"
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-700" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-700" />
            <span>Real Human Support</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-700" />
            <span>24/7 Available</span>
          </div>
        </div>
      </main>
    </div>
  )
}
