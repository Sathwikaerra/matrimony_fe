// pages/Messages.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { IoSend, IoTrash, IoCheckmarkDone } from 'react-icons/io5';
import { FaSearch } from 'react-icons/fa';

// ─── Socket singleton ──────────────────────────────────────────────────────────
const socket = io(`${import.meta.env.VITE_API_URL}`, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],

});



console.log("linkkkkk", import.meta.env.VITE_API_URL)
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function Messages() {

    const senderId = localStorage.getItem('userId');

    // ── States ──
    const [users, setUsers] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [contextMenu, setContextMenu] = useState(null);
    const [typing, setTyping] = useState(false);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [sending, setSending] = useState(false);

    // ── Refs ──
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    // ✅ FIX 1: Ref to always hold the latest selectedUser
    // Socket listeners close over a stale value without this
    const selectedUserRef = useRef(null);
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    // ── Auto-scroll ──
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isPartnerTyping]);

    const isMine = (msg) =>
        msg.senderId?.toString() === senderId?.toString();

    // =========================
    // FETCH RECENT CHATS
    // =========================
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

    // =========================
    // SEARCH USERS
    // =========================
    const fetchUsers = async (value = '') => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/auth/search?search=${value}`
            );
            setUsers(res.data.users || []);
        } catch (err) {
            console.error('fetchUsers:', err);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // FETCH MESSAGES
    // =========================
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

    // =========================
    // SEND MESSAGE
    // =========================
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

            setMessages((prev) =>
                prev.map((m) => (m._id === tempId ? saved : m))
            );

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

    // =========================
    // DELETE MESSAGE
    // =========================
    const deleteMessage = async (msgId) => {
        setContextMenu(null);
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/messages/${msgId}`
            );
            setMessages((prev) => prev.filter((m) => m._id !== msgId));
            socket.emit('deleteMessage', { msgId, receiverId: selectedUser._id });
        } catch (err) {
            console.error('deleteMessage:', err);
        }
    };

    // =========================
    // TYPING INDICATOR
    // =========================
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

    // =========================
    // SOCKET SETUP
    // =========================
    useEffect(() => {
        if (!senderId) return;

        fetchRecentChats();
        fetchUsers('');

        // ✅ FIX 2: Register on mount AND on every reconnect
        // Without this, if the socket connected before the component mounted
        // (which happens because socket is a module-level singleton),
        // registerUser never fires and the user stays "offline"
        const registerUser = () => {
            socket.emit('registerUser', senderId);
        };

        registerUser(); // fire immediately
        socket.on('connect', registerUser); // re-fire on every reconnect

        // ✅ FIX 3: Use selectedUserRef instead of setSelectedUser callback trick
        // The old pattern nested setState inside setState to read current state,
        // which is unreliable. A ref always has the latest value synchronously.
        socket.on('receiveMessage', (data) => {
            const fromId = data.senderId?.toString();
            const currentUser = selectedUserRef.current;

            if (currentUser?._id?.toString() === fromId) {
                // Chat is open — append directly
                setMessages((prev) => [...prev, data]);
            } else {
                // Different chat — show badge
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

        socket.on('onlineUsers', (ids) => {
            setOnlineUsers(ids);
        });

        // ✅ FIX 4: Same ref fix for typing indicators
        socket.on('partnerTyping', ({ senderId: from }) => {
            if (selectedUserRef.current?._id?.toString() === from) {
                setIsPartnerTyping(true);
            }
        });

        socket.on('partnerStopTyping', ({ senderId: from }) => {
            if (selectedUserRef.current?._id?.toString() === from) {
                setIsPartnerTyping(false);
            }
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


    console.log('userId:', localStorage.getItem('userId'))
    console.log('all keys:', JSON.stringify(localStorage))

    // ─── Derived ─────────────────────────────────────────────────────────────
    const displayList = search.length > 0 ? users : recentChats;
    const grouped = groupByDate(messages);
    const isOnline = (userId) => onlineUsers.includes(userId?.toString());

    return (
        <div
            className='flex h-screen bg-[#0A0A0A] text-white overflow-hidden'
            onClick={() => setContextMenu(null)}
        >
            {/* ── LEFT PANEL ── */}
            <div className='w-[360px] border-r border-white/10 flex flex-col flex-shrink-0'>

                <div className='px-5 py-4 border-b border-white/10'>
                    <h1 className='text-2xl font-bold tracking-tight'>Messages</h1>
                </div>

                <div className='px-4 py-3 border-b border-white/10'>
                    <div className='flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2'>
                        <FaSearch className='text-gray-500 flex-shrink-0' size={13} />
                        <input
                            type='text'
                            placeholder='Search people...'
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                fetchUsers(e.target.value);
                            }}
                            className='w-full bg-transparent text-sm outline-none placeholder-gray-600 py-1'
                        />
                    </div>
                </div>

                <div className='flex-1 overflow-y-auto'>
                    {loading && (
                        <p className='text-center mt-10 text-sm text-gray-600'>Searching...</p>
                    )}
                    {!loading && displayList.length === 0 && (
                        <p className='text-center mt-10 text-sm text-gray-600'>
                            {search ? 'No users found' : 'No conversations yet'}
                        </p>
                    )}
                    {displayList.map((user) => {
                        const active = selectedUser?._id === user._id;
                        const online = isOnline(user._id);
                        const unread = unreadCounts[user._id] || 0;

                        return (
                            <div
                                key={user._id}
                                onClick={() => {
                                    setSelectedUser(user);
                                    setIsPartnerTyping(false);
                                    fetchMessages(user._id);
                                    setTimeout(() => inputRef.current?.focus(), 100);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                                    ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <div className='relative flex-shrink-0'>
                                    <img
                                        src={user.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`}
                                        alt={user.name}
                                        className='w-12 h-12 rounded-full object-cover'
                                    />
                                    {online && (
                                        <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0A0A]' />
                                    )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center justify-between'>
                                        <h2 className='font-medium text-sm truncate'>{user.name}</h2>
                                        {unread > 0 && (
                                            <span className='bg-pink-600 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0'>
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className='text-xs text-gray-500 truncate mt-0.5'>
                                        {user.city || (online ? 'Online' : 'Offline')}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── CHAT AREA ── */}
            <div className='flex-1 flex flex-col min-w-0'>
                {!selectedUser && (
                    <div className='flex-1 flex flex-col items-center justify-center gap-3 text-gray-700'>
                        <div className='w-16 h-16 rounded-full bg-white/5 flex items-center justify-center'>
                            <IoSend size={28} className='text-gray-600' />
                        </div>
                        <p className='text-lg font-medium text-gray-500'>Your Messages</p>
                        <p className='text-sm text-gray-700'>Select a conversation to start chatting</p>
                    </div>
                )}

                {selectedUser && (
                    <>
                        <div className='px-5 py-3.5 border-b border-white/10 flex items-center gap-3 flex-shrink-0'>
                            <div className='relative'>
                                <img
                                    src={selectedUser.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser._id}`}
                                    alt={selectedUser.name}
                                    className='w-10 h-10 rounded-full object-cover'
                                />
                                {isOnline(selectedUser._id) && (
                                    <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0A0A0A]' />
                                )}
                            </div>
                            <div className='flex-1'>
                                <h2 className='font-semibold text-sm'>{selectedUser.name}</h2>
                                <p className='text-xs text-gray-500'>
                                    {isOnline(selectedUser._id)
                                        ? <span className='text-green-500'>Online</span>
                                        : selectedUser.city || 'Offline'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className='flex-1 overflow-y-auto px-5 py-4 space-y-1'>
                            {messages.length === 0 && (
                                <div className='flex flex-col items-center justify-center h-full gap-2 text-gray-700'>
                                    <p className='text-sm'>No messages yet</p>
                                    <p className='text-xs text-gray-800'>Say hello 👋</p>
                                </div>
                            )}

                            {Object.entries(grouped).map(([date, msgs]) => (
                                <div key={date}>
                                    <div className='flex items-center gap-3 my-4'>
                                        <div className='flex-1 h-px bg-white/10' />
                                        <span className='text-xs text-gray-600'>{date}</span>
                                        <div className='flex-1 h-px bg-white/10' />
                                    </div>

                                    {msgs.map((msg, index) => {
                                        const mine = isMine(msg);
                                        return (
                                            <div
                                                key={msg._id || index}
                                                className={`flex mb-1 ${mine ? 'justify-end' : 'justify-start'}`}
                                                onContextMenu={(e) => openContextMenu(e, msg._id, mine)}
                                            >
                                                <div
                                                    className={`group relative max-w-[70%] px-4 py-2.5 rounded-2xl
                                                        ${mine ? 'bg-pink-600 rounded-br-sm' : 'bg-white/10 rounded-bl-sm'}`}
                                                >
                                                    <p className='text-sm break-words leading-relaxed'>{msg.message}</p>
                                                    <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                                                        <span className='text-[10px] text-white/40'>{formatTime(msg.createdAt)}</span>
                                                        {mine && <IoCheckmarkDone size={12} className='text-white/40' />}
                                                    </div>
                                                    {mine && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteMessage(msg._id);
                                                            }}
                                                            className='absolute -top-2 -left-8 hidden group-hover:flex
                                                                w-7 h-7 items-center justify-center
                                                                bg-[#1a1a1a] rounded-full border border-white/10
                                                                hover:bg-red-600/20 hover:border-red-500/50 transition-all'
                                                            title='Delete message'
                                                        >
                                                            <IoTrash size={12} className='text-gray-400 hover:text-red-400' />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {isPartnerTyping && (
                                <div className='flex justify-start mb-2'>
                                    <div className='bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center'>
                                        {[0, 1, 2].map((i) => (
                                            <span
                                                key={i}
                                                className='w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce'
                                                style={{ animationDelay: `${i * 0.15}s` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <div className='px-4 py-3 border-t border-white/10 flex items-center gap-3 flex-shrink-0'>
                            <input
                                ref={inputRef}
                                type='text'
                                value={text}
                                onChange={handleTyping}
                                onKeyDown={handleKeyDown}
                                placeholder='Type a message...'
                                className='flex-1 bg-white/5 text-sm px-5 py-3 rounded-full outline-none
                                    placeholder-gray-600 transition-colors border border-transparent
                                    focus:border-white/10'
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim() || sending}
                                className={`flex-shrink-0 p-3.5 rounded-full transition-all
                                    ${text.trim() && !sending
                                        ? 'bg-pink-600 hover:bg-pink-500 active:scale-95'
                                        : 'bg-white/5 cursor-not-allowed'
                                    }`}
                            >
                                <IoSend size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── Context Menu ── */}
            {contextMenu && (
                <div
                    className='fixed z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px]'
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => deleteMessage(contextMenu.msgId)}
                        className='flex items-center gap-3 w-full px-4 py-2.5 text-sm
                            text-red-400 hover:bg-white/5 transition-colors'
                    >
                        <IoTrash size={15} />
                        Delete message
                    </button>
                </div>
            )}
        </div>
    );
}