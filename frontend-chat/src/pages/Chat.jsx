import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import {
  getMessages, queryRAG, saveMessage,
  createConversation, getConversations
} from '../api'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import SuggestedQuestions from '../components/chat/SuggestedQuestions'
import NisrLogo from '../components/ui/NisrLogo'

const SUGGESTED = [
  'What is the total fertility rate in Rwanda and how has it changed over time?',
  'What is the under-5 and infant mortality rate according to the latest DHS?',
  'What percentage of children are fully vaccinated in Rwanda?',
  'What is the prevalence of stunting, wasting, and undernutrition among children under 5?',
  'What is the contraceptive prevalence rate and unmet need for family planning?',
  'What percentage of births are attended by skilled health personnel?',
  'What is the HIV/AIDS prevalence rate among women and men aged 15-49?',
  'What are the key indicators of maternal mortality and antenatal care coverage?',
]

export default function Chat() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bottomRef = useRef(null)
  const [isTyping, setIsTyping] = useState(false)
  const [localMessages, setLocalMessages] = useState([])

  // Load messages for current conversation
  const { data: serverMessages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
  })

  useEffect(() => {
    if (conversationId) {
      setLocalMessages(serverMessages)
    } else {
      setLocalMessages([])
    }
  }, [serverMessages, conversationId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages, isTyping])

  const handleSend = async (question) => {
    let activeConvId = conversationId

    // Create conversation if none exists
    if (!activeConvId) {
      const conv = await createConversation(
        question.length > 60 ? question.slice(0, 57) + '...' : question
      )
      activeConvId = conv.id
      queryClient.invalidateQueries(['conversations'])
      navigate(`/chat/${activeConvId}`, { replace: true })
    }

    // Optimistic user message
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    }
    setLocalMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      // Save user message
      await saveMessage({ conversationId: activeConvId, role: 'user', content: question })

      // Call RAG
      const { answer, sources } = await queryRAG(question, activeConvId)

      // Save assistant message
      const assistantMsg = await saveMessage({
        conversationId: activeConvId,
        role: 'assistant',
        content: answer,
        sources,
      })

      setLocalMessages(prev => [
        ...prev.filter(m => m.id !== userMsg.id),
        { ...userMsg, id: `user-${Date.now()}` },
        assistantMsg,
      ])

      queryClient.invalidateQueries(['messages', activeConvId])
      queryClient.invalidateQueries(['conversations'])
    } catch (err) {
      const errMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Please check that your backend is running and try again.',
        created_at: new Date().toISOString(),
        isError: true,
      }
      setLocalMessages(prev => [...prev, errMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const isNewChat = !conversationId || localMessages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header bar — matches screenshot */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <h1 className="text-sm font-semibold text-slate-800">
          {conversationId
            ? (localMessages[0]?.content?.slice(0, 60) || 'Conversation')
            : 'New Conversation'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Citation-first answers from NISR reports
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isNewChat ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
            <div className="mb-6">
              <NisrLogo size={80} dark />
            </div>
            <h1 className="text-3xl font-bold text-navy-800 mb-2 text-center">
              Ask DHS Intelligence
            </h1>
            <p className="text-slate-500 text-center max-w-md mb-10 text-sm leading-relaxed">
              Query Rwanda's Demographic and Health Surveys, Census data,
              and statistical reports. Every answer includes traceable citations.
            </p>
            <SuggestedQuestions questions={SUGGESTED} onSelect={handleSend} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
            {localMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={handleSend} disabled={isTyping} />
        </div>
      </div>
    </div>
  )
}
