// pages/Messages.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import socket from '../services/socket';
import { IoSend, IoTrash, IoCheckmarkDone, IoArrowBack } from 'react-icons/io5';
import { FaSearch, FaTimes } from 'react-icons/fa';


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
  const [contextMenu, setContextMenu] = useState(null);
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
  }, [messages, isPartnerTyping, scrollToBottom]);

  const isMine = (msg) => msg.senderId?.toString() === senderId?.toString();
  const isOnline = (userId) => onlineUsers.includes(userId?.toString());

  const fetchRecentChats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/recent/${senderId}`);
      const chats = res.data.chats || [];
      setRecentChats(chats);
      
      const counts = {};
      chats.forEach(c => {
        if (c.unreadCount > 0) counts[c.user._id] = c.unreadCount;
      });
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
      
      // Let backend and other components know unread count has changed
      socket.emit('refreshUnreadCount', { userId: senderId }); 
      
      // Also explicitly mark as read in case the GET didn't cover everything
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/messages/mark-read/${receiverId}`, { receiverId: senderId });
    } catch (err) { console.error(err); }
  };

  const openChat = (user) => {
    setSelectedUser(user);
    selectedUserRef.current = user; // ✅ Update ref immediately
    setIsPartnerTyping(false);
    fetchMessages(user._id);
    setMobileView('chat');
    clearSearch();
    setTimeout(() => inputRef.current?.focus(), 150);
  };

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
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/send`, messageData);
      const saved = res.data.messageData;
      setMessages((prev) => prev.map((m) => (m._id === tempId ? saved : m)));
      socket.emit('sendMessage', { ...saved, senderName });
      socket.emit('stopTyping', { senderId, receiverId: selectedUser._id });
      fetchRecentChats();
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally { setSending(false); }
  };

  const deleteMessage = async (msgId) => {
    setContextMenu(null);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      socket.emit('deleteMessage', { msgId, receiverId: selectedUser._id });
    } catch (err) { console.error(err); }
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

  useEffect(() => {
    if (!senderId) return;
    console.log('📡 Messages.jsx: Setting up socket listeners for user:', senderId);
    fetchRecentChats();
    // Socket logic handled globally and via listeners below

    const onReceiveMessage = (data) => {
      console.log('📨 Message received via socket:', data);
      const currentSelectedId = selectedUserRef.current?._id?.toString();
      const incomingSenderId = data.senderId?.toString();
      
      const isFromSelected = currentSelectedId === incomingSenderId;
      console.log(`🔗 Comparison: ${currentSelectedId} === ${incomingSenderId} ? ${isFromSelected}`);
      
      // 1. Immediate local update for "instant" feel
      if (isFromSelected) {
        setMessages(p => [...p, data]);
        // Auto-mark as read if we are looking at the chat
        axios.patch(`${import.meta.env.VITE_API_URL}/api/messages/mark-read/${data.senderId}`, { receiverId: senderId })
          .then(() => socket.emit('refreshUnreadCount', { userId: senderId }))
          .catch(err => console.error('Auto-read failed:', err));
      } else {
        setUnreadCounts(p => ({ ...p, [data.senderId]: (p[data.senderId] || 0) + 1 }));
      }
      
      // 2. Delayed background sync for the sidebar list
      setTimeout(() => {
        fetchRecentChats();
      }, 500);
    };

    const onMessageDeleted = ({ msgId }) => setMessages(p => p.filter(m => m._id !== msgId));
    const onOnlineUsers = setOnlineUsers;
    const onPartnerTyping = ({ senderId: f }) => { if (selectedUserRef.current?._id === f) setIsPartnerTyping(true); };
    const onPartnerStopTyping = ({ senderId: f }) => { if (selectedUserRef.current?._id === f) setIsPartnerTyping(false); };

    socket.on('receiveMessage', onReceiveMessage);
    socket.on('messageDeleted', onMessageDeleted);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('partnerTyping', onPartnerTyping);
    socket.on('partnerStopTyping', onPartnerStopTyping);
    
    socket.emit('getOnlineUsers'); // 🔄 Request initial list

    return () => {
      socket.off('receiveMessage', onReceiveMessage); 
      socket.off('messageDeleted', onMessageDeleted); 
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('partnerTyping', onPartnerTyping); 
      socket.off('partnerStopTyping', onPartnerStopTyping);
    };
  }, [senderId]);

  const displayList = search.trim() ? searchUsers : recentChats;
  const grouped = groupByDate(messages);

  return (
    <div className="flex h-full min-w-0" onClick={() => setContextMenu(null)}>
      {/* Left Panel */}
      <div className={`flex flex-col w-full md:w-[340px] lg:w-[380px] border-r border-white/10 flex-shrink-0 h-full ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`} style={{ background: '#0D0404' }}>
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 style={{ color: '#C9A84C', fontSize: 12, letterSpacing: '0.18em', marginBottom: 2 }}>❋ INBOX</h2>
          <h1 className="text-xl font-bold" style={{ color: '#FFF5E6' }}>Messages</h1>
        </div>
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: '#1F0A0A', border: '1px solid #3D1515' }}>
            <FaSearch size={13} style={{ color: '#6B5030' }} />
            <input type="text" placeholder="Search people..." value={search} onChange={handleSearchChange} className="flex-1 bg-transparent text-sm outline-none text-[#FFF5E6]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {displayList.length > 0 ? (
            displayList.map((item) => {
              const user = item.user || item; // handle both chat objects and search result user objects
              const lastMsg = item.lastMessage;
              const lastTime = item.lastTime;
              const isSelected = selectedUser?._id === user._id;

              return (
                <div key={user._id} onClick={() => openChat(user)} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/5" style={{ background: isSelected ? 'rgba(201,168,76,0.07)' : 'transparent' }}>
                  <div className="relative">
                    <img src={user.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`} className="w-12 h-12 rounded-full object-cover border-2 border-[#3D1515]" alt="" />
                    {isOnline(user._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0D0404] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h2 className="font-semibold text-sm truncate text-[#FFF5E6]">{user.name}</h2>
                      {lastTime && <span className="text-[10px] text-[#4A2A1A]">{formatTime(lastTime)}</span>}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-xs truncate text-[#6B5030] flex-1">
                        {lastMsg || (isOnline(user._id) ? 'Online' : user.city || 'Offline')}
                      </p>
                      {unreadCounts[user._id] > 0 && (
                        <div className="bg-[#7B1C1C] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-[0_0_8px_rgba(123,28,28,0.5)]">
                          {unreadCounts[user._id]}
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
                {search.trim() ? "No results found" : "No conversations yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className={`flex-1 flex flex-col min-w-0 h-full ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`} style={{ background: '#0D0404' }}>
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-[#2A0F0F] bg-[#110505] flex-shrink-0">
              <button onClick={() => setMobileView('list')} className="md:hidden p-2 text-[#C9A84C]"><IoArrowBack /></button>
              <div className="relative">
                <img src={selectedUser.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser._id}`} className="w-10 h-10 rounded-full object-cover" alt="" />
                {isOnline(selectedUser._id) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#110505] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#FFF5E6]">{selectedUser.name}</h2>
                <p className="text-xs text-[#6B5030]">{isOnline(selectedUser._id) ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
              {Object.entries(grouped).map(([date, msgs]) => (
                <div key={date}>
                  <div className="text-center my-6 text-[10px] text-[#6B5030] uppercase tracking-widest">{date}</div>
                  {msgs.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex mb-3 ${isMine(msg) ? 'justify-end' : 'justify-start'} animate-slide-in`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] shadow-lg ${
                        isMine(msg) 
                          ? 'bg-gradient-to-br from-[#7B1C1C] to-[#5A1515] text-white rounded-tr-none' 
                          : 'bg-[#1F0A0A] text-[#FFF5E6] border border-[#3D1515] rounded-tl-none'
                      }`}>
                        {msg.message}
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
                    <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 flex items-center gap-3 border-t border-[#2A0F0F] bg-[#110505] flex-shrink-0">
              <input type="text" value={text} onChange={handleTyping} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 bg-[#1F0A0A] border border-[#3D1515] text-white px-4 py-2 rounded-full outline-none" />
              <button onClick={sendMessage} className="p-2 bg-[#7B1C1C] text-white rounded-full"><IoSend /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#6B5030]">Select a chat to start</div>
        )}
      </div>
    </div>
  );
}