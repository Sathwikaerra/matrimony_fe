// pages/Messages.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { IoSend, IoTrash, IoCheckmarkDone, IoArrowBack } from 'react-icons/io5';
import { FaSearch, FaTimes } from 'react-icons/fa';

// ─── Socket singleton ──────────────────────────────────────────────────────────
const socket = io(`${import.meta.env.VITE_API_URL}`, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
socket.on('connect_error', (err) => console.log('❌ Socket error:', err.message));

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const groupByDate = (messages) => {
  const groups = {};
  messages.forEach((msg) => {
    const key = formatDate(msg.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  });
  return groups;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 12, showOnline = false, online = false }) {
  return (
    <div className="relative flex-shrink-0">
      <img
        src={
          user.photos?.[0] ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`
        }
        alt={user.name}
        className={`w-${size} h-${size} rounded-full object-cover`}
      />
      {showOnline && online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0D0404]" />
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Messages() {
  const senderId = localStorage.getItem('userId');

  const [recentChats, setRecentChats] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const selectedUserRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  const isMine = (msg) => msg.senderId?.toString() === senderId?.toString();
  const isOnline = (userId) => onlineUsers.includes(userId?.toString());

  // ── Fetch recent chats ────────────────────────────────────────────────────
  const fetchRecentChats = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/messages/recent/${senderId}`
      );
      setRecentChats(res.data.users || []);
    } catch (err) {
      console.error('fetchRecentChats:', err);
    }
  };

  // ── Search users ──────────────────────────────────────────────────────────
  const searchPeople = async (value) => {
    if (!value.trim()) {
      setSearchUsers([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/search?search=${value}`
      );
      setSearchUsers(res.data.users || []);
    } catch (err) {
      console.error('searchPeople:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchPeople(val), 350);
  };

  const clearSearch = () => {
    setSearch('');
    setSearchUsers([]);
  };

  // ── Fetch messages ────────────────────────────────────────────────────────
  const fetchMessages = async (receiverId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/messages/${senderId}/${receiverId}`
      );
      setMessages(res.data.messages || []);
      setUnreadCounts((prev) => ({ ...prev, [receiverId]: 0 }));
    } catch (err) {
      console.error('fetchMessages:', err);
    }
  };

  // ── Open chat ─────────────────────────────────────────────────────────────
  const openChat = (user) => {
    setSelectedUser(user);
    setIsPartnerTyping(false);
    fetchMessages(user._id);
    setMobileView('chat');
    clearSearch();
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ── Back to list (mobile) ─────────────────────────────────────────────────
  const goBack = () => {
    setMobileView('list');
    setSelectedUser(null);
    setMessages([]);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || !selectedUser || sending) return;
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const messageData = {
      senderId,
      receiverId: selectedUser._id,
      message: text.trim(),
      createdAt: new Date().toISOString(),
      _id: tempId,
      status: 'sent',
    };

    setMessages((prev) => [...prev, messageData]);
    setText('');

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/send`,
        messageData
      );
      const saved = res.data.messageData;
      setMessages((prev) => prev.map((m) => (m._id === tempId ? saved : m)));
      socket.emit('sendMessage', saved);
      socket.emit('stopTyping', { senderId, receiverId: selectedUser._id });
      fetchRecentChats();
    } catch (err) {
      console.error('sendMessage:', err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // ── Delete message ────────────────────────────────────────────────────────
  const deleteMessage = async (msgId) => {
    setContextMenu(null);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      socket.emit('deleteMessage', { msgId, receiverId: selectedUser._id });
    } catch (err) {
      console.error('deleteMessage:', err);
    }
  };

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!selectedUser) return;
    if (!typing) {
      setTyping(true);
      socket.emit('typing', { senderId, receiverId: selectedUser._id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit('stopTyping', { senderId, receiverId: selectedUser._id });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openContextMenu = (e, msgId, mine) => {
    if (!mine) return;
    e.preventDefault();
    setContextMenu({ msgId, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!senderId) return;

    fetchRecentChats();

    const registerUser = () => socket.emit('registerUser', senderId);
    registerUser();
    socket.on('connect', registerUser);

    socket.on('receiveMessage', (data) => {
      const fromId = data.senderId?.toString();
      const currentUser = selectedUserRef.current;
      if (currentUser?._id?.toString() === fromId) {
        setMessages((prev) => [...prev, data]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [fromId]: (prev[fromId] || 0) + 1,
        }));
      }
      fetchRecentChats();
    });

    socket.on('messageDeleted', ({ msgId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    });

    socket.on('onlineUsers', (ids) => setOnlineUsers(ids));

    socket.on('partnerTyping', ({ senderId: from }) => {
      if (selectedUserRef.current?._id?.toString() === from) setIsPartnerTyping(true);
    });

    socket.on('partnerStopTyping', ({ senderId: from }) => {
      if (selectedUserRef.current?._id?.toString() === from) setIsPartnerTyping(false);
    });

    return () => {
      socket.off('connect', registerUser);
      socket.off('receiveMessage');
      socket.off('messageDeleted');
      socket.off('onlineUsers');
      socket.off('partnerTyping');
      socket.off('partnerStopTyping');
    };
  }, [senderId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayList = search.trim() ? searchUsers : recentChats;
  const grouped = groupByDate(messages);

  // ─────────────────────────────────────────────────────────────────────────
  // LEFT PANEL — conversation list
  // ─────────────────────────────────────────────────────────────────────────
  const LeftPanel = (
    <div
      className={`
        flex flex-col
        w-full md:w-[340px] lg:w-[380px]
        border-r border-white/10
        flex-shrink-0
        h-full
        ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
      `}
      style={{ background: '#0D0404' }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
        <h2 style={{ color: '#C9A84C', fontSize: 12, letterSpacing: '0.18em', marginBottom: 2 }}>
          ❋ INBOX
        </h2>
        <h1 className="text-xl font-bold" style={{ color: '#FFF5E6' }}>Messages</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: '#1F0A0A', border: '1px solid #3D1515' }}
        >
          <FaSearch size={13} style={{ color: '#6B5030', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={handleSearchChange}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#FFF5E6', caretColor: '#C9A84C' }}
          />
          {search && (
            <button onClick={clearSearch} style={{ color: '#6B5030', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-3 pb-1 flex-shrink-0">
        <span style={{ color: '#6B5030', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {search.trim() ? 'Search Results' : 'Recent Chats'}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {searchLoading && (
          <p className="text-center mt-8 text-sm" style={{ color: '#6B5030' }}>Searching...</p>
        )}

        {!searchLoading && displayList.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-16 gap-2">
            <p className="text-sm" style={{ color: '#6B5030' }}>
              {search.trim() ? 'No users found' : 'No conversations yet'}
            </p>
            {!search.trim() && (
              <p className="text-xs" style={{ color: '#3D1515' }}>Search for someone to start chatting</p>
            )}
          </div>
        )}

        {!searchLoading && displayList.map((user) => {
          const active = selectedUser?._id === user._id;
          const online = isOnline(user._id);
          const unread = unreadCounts[user._id] || 0;

          return (
            <div
              key={user._id}
              onClick={() => openChat(user)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
              style={{
                background: active ? 'rgba(201,168,76,0.07)' : 'transparent',
                borderLeft: active ? '3px solid #C9A84C' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#1A0707'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                  style={{ border: '2px solid #3D1515' }}
                />
                {online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full"
                    style={{ border: '2px solid #0D0404' }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm truncate" style={{ color: '#FFF5E6' }}>{user.name}</h2>
                  {unread > 0 && (
                    <span className="flex-shrink-0 ml-2 text-xs rounded-full px-2 py-0.5"
                      style={{ background: '#7B1C1C', color: '#FFF5E6' }}>
                      {unread}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: '#6B5030' }}>
                  {online ? <span style={{ color: '#4CAF50' }}>Online</span> : (user.city || 'Offline')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RIGHT PANEL — chat area
  // ─────────────────────────────────────────────────────────────────────────
  const RightPanel = (
    <div
      className={`
        flex-1 flex flex-col min-w-0 h-full
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
      `}
      style={{ background: '#0D0404' }}
    >
      {!selectedUser ? (
        /* Empty state (desktop only) */
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: '#1F0A0A', border: '1px solid #3D1515' }}>
            <IoSend size={30} style={{ color: '#3D1515' }} />
          </div>
          <p className="text-lg font-semibold" style={{ color: '#6B5030' }}>Your Messages</p>
          <p className="text-sm" style={{ color: '#3D1515' }}>Select a conversation to start chatting</p>
        </div>
      ) : (
        <>
          {/* Chat header */}
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ borderBottom: '1px solid #2A0F0F', background: '#110505' }}
          >
            {/* Back button — mobile only */}
            <button
              onClick={goBack}
              className="md:hidden flex-shrink-0 p-2 rounded-full transition-all"
              style={{ background: '#1F0A0A', border: '1px solid #3D1515', color: '#C9A84C' }}
            >
              <IoArrowBack size={18} />
            </button>

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={selectedUser.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser._id}`}
                alt={selectedUser.name}
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: '2px solid #3D1515' }}
              />
              {isOnline(selectedUser._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full"
                  style={{ border: '2px solid #110505' }} />
              )}
            </div>

            {/* Name & status */}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm" style={{ color: '#FFF5E6' }}>{selectedUser.name}</h2>
              <p className="text-xs" style={{ color: isOnline(selectedUser._id) ? '#4CAF50' : '#6B5030' }}>
                {isOnline(selectedUser._id) ? 'Online' : selectedUser.city || 'Offline'}
              </p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-sm" style={{ color: '#6B5030' }}>No messages yet</p>
                <p className="text-xs" style={{ color: '#3D1515' }}>Say hello 👋</p>
              </div>
            )}

            {Object.entries(grouped).map(([date, msgs]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: '#2A0F0F' }} />
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ color: '#6B5030', background: '#1A0707', border: '1px solid #2A0F0F' }}>
                    {date}
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#2A0F0F' }} />
                </div>

                {msgs.map((msg, index) => {
                  const mine = isMine(msg);
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex mb-1.5 ${mine ? 'justify-end' : 'justify-start'}`}
                      onContextMenu={(e) => openContextMenu(e, msg._id, mine)}
                    >
                      <div
                        className="group relative max-w-[75%] px-4 py-2.5 rounded-2xl"
                        style={{
                          background: mine
                            ? 'linear-gradient(135deg, #7B1C1C, #A0341E)'
                            : '#1F0A0A',
                          border: mine ? 'none' : '1px solid #3D1515',
                          borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        }}
                      >
                        <p className="text-sm break-words leading-relaxed" style={{ color: '#FFF5E6' }}>
                          {msg.message}
                        </p>
                        <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px]" style={{ color: 'rgba(255,245,230,0.4)' }}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {mine && <IoCheckmarkDone size={12} style={{ color: 'rgba(255,245,230,0.4)' }} />}
                        </div>

                        {/* Delete button on hover */}
                        {mine && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMessage(msg._id); }}
                            className="absolute -top-2 -left-8 hidden group-hover:flex
                              w-7 h-7 items-center justify-center rounded-full transition-all"
                            style={{ background: '#1A0707', border: '1px solid #3D1515' }}
                            title="Delete"
                          >
                            <IoTrash size={12} style={{ color: '#C9A84C' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Typing indicator */}
            {isPartnerTyping && (
              <div className="flex justify-start mb-2">
                <div className="px-4 py-3 rounded-2xl flex gap-1 items-center"
                  style={{ background: '#1F0A0A', border: '1px solid #3D1515' }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: '#C9A84C', animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ borderTop: '1px solid #2A0F0F', background: '#110505' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 text-sm px-5 py-3 rounded-full outline-none transition-colors"
              style={{
                background: '#1F0A0A',
                border: '1px solid #3D1515',
                color: '#FFF5E6',
                caretColor: '#C9A84C',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="flex-shrink-0 p-3.5 rounded-full transition-all active:scale-95"
              style={{
                background: text.trim() && !sending
                  ? 'linear-gradient(135deg, #7B1C1C, #A0341E)'
                  : '#1F0A0A',
                border: '1px solid',
                borderColor: text.trim() && !sending ? 'transparent' : '#3D1515',
                cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
              }}
            >
              <IoSend size={18} style={{ color: text.trim() && !sending ? '#FFF5E6' : '#3D1515' }} />
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#0D0404', color: '#FFF5E6' }}
      onClick={() => setContextMenu(null)}
    >
      {LeftPanel}
      {RightPanel}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-xl shadow-2xl py-1"
          style={{
            top: contextMenu.y, left: contextMenu.x,
            background: '#1A0707', border: '1px solid #3D1515',
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => deleteMessage(contextMenu.msgId)}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
            style={{ color: '#C9A84C' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2A0F0F'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IoTrash size={14} />
            Delete message
          </button>
        </div>
      )}
    </div>
  );
}