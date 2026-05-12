// pages/Messages.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import socket from '../services/socket';
import { IoSend, IoArrowBack } from 'react-icons/io5';
import { FaSearch, FaSmile, FaImage, FaCamera, FaTimes } from 'react-icons/fa';

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = {
  '😊 Smileys': ['😀','😁','😂','🤣','😃','😄','😅','😆','😇','😉','😊','😋','😌','😍','🥰','😎','😏','😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛','😜','😝','😞','😟','😠','😡','😢','😣','😤','😥','😦','😧','😨','😩','😪','😫','😬','😭','😮','😯','😰','😱','😲','😳','😴','😵','😶','😷','🤐','🤑','🤒','🤓','🤔','🤕','🤗','🤠','🤡','🤢','🤣','🤤','🤥','🤧','🤨','🤩','🤪','🤫','🤬','🤭','🤮','🤯'],
  '👋 Gestures': ['👋','🤚','🖐','✋','🖖','👌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
  '❤️ Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️'],
  '🎉 Fun': ['🎉','🎊','🎈','🎁','🎀','🎗','🎟','🎫','🎖','🏆','🥇','🥈','🥉','🏅','🎯','🎱','🎮','🎲','🧩','🃏','🀄','🎭','🎨','🖼','🎬','🎤','🎧','🎵','🎶','🎸','🎹','🎺','🎻','🥁'],
  '🌍 Nature': ['🌸','🌺','🌻','🌼','🌷','🌱','🌲','🌳','🌴','🌵','🎋','🎍','🍀','🍁','🍂','🍃','🌾','🍄','🌿','☘️','🌱','🪴','🪨','🌊','🌬','🌀','🌈','☀️','🌤','⛅','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄','🌬','💨','💧','💦','☔','⚡'],
};

function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: '#1A0808', border: '1px solid #3D1515' }}
    >
      {/* Category tabs */}
      <div className="flex overflow-x-auto gap-1 p-2 border-b border-[#3D1515] scrollbar-hide">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 text-xs px-2 py-1 rounded-lg transition-all"
            style={{
              background: activeCategory === cat ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: activeCategory === cat ? '#C9A84C' : '#6B5030',
            }}
          >
            {cat.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto custom-scrollbar">
        {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-lg p-1 rounded-lg hover:bg-white/10 transition-colors leading-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Image Preview ────────────────────────────────────────────────────────────
function ImagePreview({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative inline-block mr-2 mb-1">
      <img src={url} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-[#3D1515]" />
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#7B1C1C] text-white flex items-center justify-center shadow-lg"
      >
        <FaTimes size={8} />
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Messages() {
  const { token, userId, user } = useSelector((state) => state.auth);
  const senderId = userId || localStorage.getItem('userId');
  const senderName = user?.name || 'Someone';

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
  const [mobileView, setMobileView] = useState('list');

  // Input enhancements
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]); // File[]

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const selectedUserRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isPartnerTyping, scrollToBottom]);

  const isMine = (msg) => msg.senderId?.toString() === senderId?.toString();
  const isOnline = (uid) => onlineUsers.includes(uid?.toString());

  const fetchRecentChats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/recent/${senderId}`);
      const chats = res.data.chats || [];
      setRecentChats(chats);
      const counts = {};
      chats.forEach(c => { if (c.unreadCount > 0) counts[c.user._id] = c.unreadCount; });
      setUnreadCounts(counts);
    } catch (err) { console.error(err); }
  };

  const searchPeople = async (value) => {
    if (!value.trim()) { setSearchUsers([]); return; }
    setSearchLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/search?search=${value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchUsers(res.data.users || []);
    } catch (err) { console.error(err); } finally { setSearchLoading(false); }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchPeople(val), 350);
  };

  const clearSearch = () => { setSearch(''); setSearchUsers([]); };

  const fetchMessages = async (receiverId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${senderId}/${receiverId}`);
      setMessages(res.data.messages || []);
      setUnreadCounts((prev) => ({ ...prev, [receiverId]: 0 }));
      socket.emit('refreshUnreadCount', { userId: senderId });
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/messages/mark-read/${receiverId}`, { receiverId: senderId });
    } catch (err) { console.error(err); }
  };

  const openChat = (user) => {
    setSelectedUser(user);
    selectedUserRef.current = user;
    setIsPartnerTyping(false);
    fetchMessages(user._id);
    setMobileView('chat');
    clearSearch();
    setAttachments([]);
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ── Emoji insert ──────────────────────────────────────────────────────────
  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = text.slice(0, start) + emoji + text.slice(end);
    setText(newVal);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length;
      el.focus();
    }, 0);
  };

  // ── File attachment ───────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files].slice(0, 5)); // max 5
    e.target.value = '';
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if ((!text.trim() && attachments.length === 0) || !selectedUser || sending) return;
    setSending(true);

    // If there are attachments, send via FormData
    if (attachments.length > 0) {
      const form = new FormData();
      form.append('senderId', senderId);
      form.append('receiverId', selectedUser._id);
      form.append('message', text.trim());
      attachments.forEach((f) => form.append('files', f));

      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        senderId,
        receiverId: selectedUser._id,
        message: text.trim() || `📎 ${attachments.length} attachment(s)`,
        createdAt: new Date().toISOString(),
        _id: tempId,
      };
      setMessages((prev) => [...prev, tempMsg]);
      setText('');
      setAttachments([]);

      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/send-with-files`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const saved = res.data.messageData;
        setMessages((prev) => prev.map((m) => (m._id === tempId ? saved : m)));
        socket.emit('sendMessage', { ...saved, senderName });
        socket.emit('refreshUnreadCount', { userId: selectedUser._id });
        fetchRecentChats();
      } catch (err) {
        console.error(err);
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      } finally { setSending(false); }
      return;
    }

    // Text-only path
    const tempId = `temp-${Date.now()}`;
    const messageData = {
      senderId,
      receiverId: selectedUser._id,
      message: text.trim(),
      createdAt: new Date().toISOString(),
      _id: tempId,
    };
    setMessages((prev) => [...prev, messageData]);
    setText('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/send`, messageData);
      const saved = res.data.messageData;
      setMessages((prev) => prev.map((m) => (m._id === tempId ? saved : m)));
      socket.emit('sendMessage', { ...saved, senderName });
      socket.emit('stopTyping', { senderId, receiverId: selectedUser._id });
      socket.emit('refreshUnreadCount', { userId: selectedUser._id });
      fetchRecentChats();
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally { setSending(false); }
  };

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

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!senderId) return;
    fetchRecentChats();

    const onReceiveMessage = (data) => {
      const currentSelectedId = selectedUserRef.current?._id?.toString();
      const isFromSelected = currentSelectedId === data.senderId?.toString();
      if (isFromSelected) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
        axios.patch(`${import.meta.env.VITE_API_URL}/api/messages/mark-read/${data.senderId}`, { receiverId: senderId })
          .then(() => socket.emit('refreshUnreadCount', { userId: senderId }))
          .catch(console.error);
      } else {
        setUnreadCounts((p) => ({ ...p, [data.senderId]: (p[data.senderId] || 0) + 1 }));
      }
      setTimeout(fetchRecentChats, 500);
    };

    const onMessageDeleted = ({ msgId }) => setMessages((p) => p.filter((m) => m._id !== msgId));
    const onOnlineUsers = setOnlineUsers;
    const onPartnerTyping = ({ senderId: f }) => { if (selectedUserRef.current?._id === f) setIsPartnerTyping(true); };
    const onPartnerStopTyping = ({ senderId: f }) => { if (selectedUserRef.current?._id === f) setIsPartnerTyping(false); };
    const onRefreshUnreadCount = () => fetchRecentChats();

    socket.on('receiveMessage', onReceiveMessage);
    socket.on('messageDeleted', onMessageDeleted);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('partnerTyping', onPartnerTyping);
    socket.on('partnerStopTyping', onPartnerStopTyping);
    socket.on('refreshUnreadCount', onRefreshUnreadCount);
    socket.emit('getOnlineUsers');

    return () => {
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('messageDeleted', onMessageDeleted);
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('partnerTyping', onPartnerTyping);
      socket.off('partnerStopTyping', onPartnerStopTyping);
      socket.off('refreshUnreadCount', onRefreshUnreadCount);
    };
  }, [senderId]);

  const displayList = search.trim() ? searchUsers : recentChats;
  const grouped = groupByDate(messages);
  const canSend = (text.trim().length > 0 || attachments.length > 0) && !sending;

  return (
    <div className="flex h-full min-w-0" onClick={() => setShowEmojiPicker(false)}>

      {/* ── Left Panel ── */}
      <div
        className={`flex flex-col w-full md:w-[340px] lg:w-[380px] border-r border-white/10 flex-shrink-0 h-full ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}
        style={{ background: '#0D0404' }}
      >
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 style={{ color: '#C9A84C', fontSize: 12, letterSpacing: '0.18em', marginBottom: 2 }}>❋ INBOX</h2>
          <h1 className="text-xl font-bold" style={{ color: '#FFF5E6' }}>Messages</h1>
        </div>
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: '#1F0A0A', border: '1px solid #3D1515' }}>
            <FaSearch size={13} style={{ color: '#6B5030' }} />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={handleSearchChange}
              className="flex-1 bg-transparent text-sm outline-none text-[#FFF5E6] placeholder:text-[#6B5030]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {displayList.length > 0 ? (
            displayList.map((item) => {
              const u = item.user || item;
              const lastMsg = item.lastMessage;
              const lastTime = item.lastTime;
              const isSelected = selectedUser?._id === u._id;
              return (
                <div
                  key={u._id}
                  onClick={() => openChat(u)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/5"
                  style={{ background: isSelected ? 'rgba(201,168,76,0.07)' : 'transparent' }}
                >
                  <div className="relative">
                    <img
                      src={u.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id}`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#3D1515]"
                      alt=""
                    />
                    {isOnline(u._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0D0404] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h2 className="font-semibold text-sm truncate text-[#FFF5E6]">{u.name}</h2>
                      {lastTime && <span className="text-[10px] text-[#4A2A1A] shrink-0 ml-1">{formatTime(lastTime)}</span>}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-xs truncate text-[#6B5030] flex-1">
                        {lastMsg || (isOnline(u._id) ? 'Online' : u.city || 'Offline')}
                      </p>
                      {unreadCounts[u._id] > 0 && (
                        <div className="bg-[#7B1C1C] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-[0_0_8px_rgba(123,28,28,0.5)]">
                          {unreadCounts[u._id]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-10 text-center opacity-40">
              <div className="text-3xl mb-3">❋</div>
              <p className="text-sm font-medium text-[#6B5030]">
                {search.trim() ? 'No results found' : 'No conversations yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
        style={{ background: '#0D0404' }}
      >
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-[#2A0F0F] bg-[#110505] flex-shrink-0">
              <button onClick={() => setMobileView('list')} className="md:hidden p-2 text-[#C9A84C]">
                <IoArrowBack />
              </button>
              <div className="relative">
                <img
                  src={selectedUser.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser._id}`}
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                {isOnline(selectedUser._id) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#110505] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#FFF5E6]">{selectedUser.name}</h2>
                <p className="text-xs text-[#6B5030]">{isOnline(selectedUser._id) ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
              {Object.entries(grouped).map(([date, msgs]) => (
                <div key={date}>
                  <div className="text-center my-6 text-[10px] text-[#6B5030] uppercase tracking-widest">{date}</div>
                  {msgs.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex mb-3 ${isMine(msg) ? 'justify-end' : 'justify-start'} animate-slide-in`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] shadow-lg ${
                          isMine(msg)
                            ? 'bg-gradient-to-br from-[#7B1C1C] to-[#5A1515] text-white rounded-tr-none'
                            : 'bg-[#1F0A0A] text-[#FFF5E6] border border-[#3D1515] rounded-tl-none'
                        }`}
                      >
                        {/* Image attachments */}
                        {msg.images?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {msg.images.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt=""
                                className="max-w-[180px] max-h-[180px] rounded-xl object-cover cursor-pointer"
                                onClick={() => window.open(url, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                        {msg.message && <p>{msg.message}</p>}
                        <div className={`text-[9px] mt-1 opacity-50 ${isMine(msg) ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {isPartnerTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-[#1F0A0A] border border-[#3D1515] px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Enhanced Input Bar ── */}
            <div
              className="px-3 py-3 border-t border-[#2A0F0F] bg-[#110505] flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Attachment previews */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2 px-1">
                  {attachments.map((file, i) => (
                    <ImagePreview key={i} file={file} onRemove={() => removeAttachment(i)} />
                  ))}
                </div>
              )}

              {/* Input row */}
              <div className="flex items-end gap-2">

                {/* Left action icons */}
                <div className="flex items-center gap-1 pb-1.5 shrink-0">

                  {/* Emoji */}
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowEmojiPicker((v) => !v); }}
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-[#C9A84C]/10"
                      title="Emoji"
                    >
                      <FaSmile size={18} style={{ color: showEmojiPicker ? '#C9A84C' : '#6B5030' }} />
                    </button>
                    {showEmojiPicker && (
                      <EmojiPicker
                        onSelect={(emoji) => { insertEmoji(emoji); }}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </div>

                  {/* Photo library */}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-[#C9A84C]/10"
                    title="Attach photo"
                  >
                    <FaImage size={16} style={{ color: '#6B5030' }} />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Camera */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-[#C9A84C]/10"
                    title="Take photo"
                  >
                    <FaCamera size={16} style={{ color: '#6B5030' }} />
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Text input */}
                <div
                  className="flex-1 flex items-end rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: '#1A0808',
                    border: '1px solid #3D1515',
                    boxShadow: text.length > 0 ? '0 0 0 1px rgba(201,168,76,0.2)' : 'none',
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm px-4 py-2.5 outline-none resize-none placeholder:text-[#4A2A1A] leading-5"
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={!canSend}
                  className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all mb-0.5"
                  style={{
                    background: canSend
                      ? 'linear-gradient(135deg, #9B2222 0%, #6B1515 100%)'
                      : '#1F0A0A',
                    border: canSend ? 'none' : '1px solid #3D1515',
                    boxShadow: canSend ? '0 4px 14px rgba(123,28,28,0.5)' : 'none',
                    transform: canSend ? 'scale(1)' : 'scale(0.95)',
                  }}
                >
                  <IoSend
                    size={16}
                    style={{ color: canSend ? '#FFF5E6' : '#3D1515', marginLeft: 2 }}
                  />
                </button>
              </div>

              {/* Hint */}
              <p className="text-[10px] text-[#3D1515] text-center mt-1.5 select-none">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#6B5030]">Select a chat to start</div>
        )}
      </div>
    </div>
  );
}