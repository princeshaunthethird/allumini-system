import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react'
import { messagesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow, format } from 'date-fns'

function Avatar({ user, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold flex-shrink-0 overflow-hidden`}>
      {user?.profile_pic
        ? <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
        : user?.name?.charAt(0)?.toUpperCase()
      }
    </div>
  )
}

export default function Messages() {
  const { userId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef()
  const wsRef = useRef(null)
  const inputRef = useRef()

  // Load conversation list
  useEffect(() => {
    messagesAPI.getConversations()
      .then(res => setConversations(res.data))
      .catch(() => {})
  }, [])

  // Load messages when active user changes
  useEffect(() => {
    if (!activeUser) return
    messagesAPI.getConversation(activeUser.id)
      .then(res => {
        setMessages(res.data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .catch(() => {})
  }, [activeUser?.id])

  // Open conversation from URL param
  useEffect(() => {
    if (userId) {
      // Try to find from conversations list, else just set minimal user object
      const found = conversations.find(c => c.user.id === parseInt(userId))
      if (found) setActiveUser(found.user)
    }
  }, [userId, conversations])

  // WebSocket for real-time
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    const wsUrl = `ws://localhost:8000/api/messages/ws/${token}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      // Only append to current conversation
      setMessages(prev => {
        const alreadyExists = prev.some(m => m.id === msg.id)
        if (alreadyExists) return prev
        return [...prev, msg]
      })
      setConversations(prev => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        const existing = prev.find(c => c.user.id === partnerId)
        if (existing) {
          return prev.map(c => c.user.id === partnerId
            ? { ...c, last_message: msg.content, last_message_time: msg.created_at, unread_count: msg.sender_id !== user.id ? c.unread_count + 1 : 0 }
            : c
          )
        }
        return prev
      })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    ws.onerror = () => {} // silently fail if WS unavailable

    return () => ws.close()
  }, [user.id])

  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return
    const content = text.trim()
    setText('')
    setSending(true)

    // Optimistic update
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: activeUser.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ receiver_id: activeUser.id, content }))
      } else {
        await messagesAPI.send({ receiver_id: activeUser.id, content })
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectConversation = (conv) => {
    setActiveUser(conv.user)
    navigate(`/messages/${conv.user.id}`)
    // Mark as read locally
    setConversations(prev => prev.map(c => c.user.id === conv.user.id ? { ...c, unread_count: 0 } : c))
  }

  const filtered = conversations.filter(c =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  )

  const isOwn = (msg) => msg.sender_id === user.id

  return (
    <div className="flex h-screen bg-white">
      {/* Conversation list */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col flex-shrink-0 ${activeUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-xl font-display font-bold text-slate-900 mb-3">Messages</h1>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 text-sm py-2" placeholder="Search conversations..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare size={36} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No conversations yet</p>
              <p className="text-slate-400 text-sm mt-1">Connect with alumni and start chatting</p>
            </div>
          ) : filtered.map(conv => (
            <button key={conv.user.id} onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left
                ${activeUser?.id === conv.user.id ? 'bg-brand-50' : ''}`}>
              <Avatar user={conv.user} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800 text-sm truncate">{conv.user.name}</p>
                  <p className="text-slate-400 text-xs flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: false })}
                  </p>
                </div>
                <p className="text-slate-500 text-xs truncate mt-0.5">{conv.last_message}</p>
              </div>
              {conv.unread_count > 0 && (
                <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className={`flex-1 flex flex-col ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
        {!activeUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-brand-500" />
            </div>
            <h2 className="text-xl font-display font-semibold text-slate-700 mb-2">Select a conversation</h2>
            <p className="text-slate-400 text-sm">Choose a chat from the left to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <button onClick={() => { setActiveUser(null); navigate('/messages') }}
                className="md:hidden btn-ghost p-1.5 mr-1"><ArrowLeft size={18} /></button>
              <Avatar user={activeUser} />
              <div>
                <p className="font-semibold text-slate-900">{activeUser.name}</p>
                <p className="text-slate-400 text-xs">{activeUser.course || 'Alumni'}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const own = isOwn(msg)
                const showTime = i === 0 || new Date(msg.created_at) - new Date(messages[i-1].created_at) > 5 * 60 * 1000
                return (
                  <div key={msg.id}>
                    {showTime && (
                      <p className="text-center text-slate-400 text-xs my-2">
                        {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      </p>
                    )}
                    <div className={`flex items-end gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                      {!own && <Avatar user={activeUser} size="sm" />}
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                        ${own
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-slate-100">
              <div className="flex items-end gap-3 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2 focus-within:border-brand-400 transition-colors">
                <textarea
                  ref={inputRef}
                  className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder-slate-400 max-h-28 py-1"
                  placeholder={`Message ${activeUser.name}...`}
                  rows={1}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button onClick={sendMessage} disabled={!text.trim() || sending}
                  className="w-9 h-9 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
                  <Send size={16} />
                </button>
              </div>
              <p className="text-slate-400 text-xs mt-1.5 pl-1">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
