// pages/Home.jsx

import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import UserProfileDrawer from "../component/UserProfileDrawer";
import {
  FaHeart, FaRegHeart, FaRegCommentDots,
  FaStar, FaRegStar, FaSearch, FaTimes, FaClock,
  FaPaperPlane, FaTrash, FaChevronDown, FaChevronUp,
} from "react-icons/fa";

// ─── debounce ────────────────────────────────────────────────────────────────
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Recent searches (localStorage, max 6) ───────────────────────────────────
const RECENT_KEY = "matrimony_recent_searches";
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
  catch { return []; }
}
function saveRecent(user) {
  const prev = getRecent().filter(u => u._id !== user._id);
  const next = [
    { _id: user._id, name: user.name, email: user.email, photos: user.photos, city: user.city },
    ...prev
  ].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
function deleteRecent(id) {
  const next = getRecent().filter(u => u._id !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
function clearAllRecent() {
  localStorage.removeItem(RECENT_KEY);
  return [];
}

// ─── Comment Section Component ───────────────────────────────────────────────
function CommentSection({ postUserId, token }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);

  // fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/comment/${postUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComments(res.data.comments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postUserId, token]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/comment/${postUserId}`,
        { text: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // backend may return the new comment object or a full list
      const returned = res.data.comment || res.data.comments;
      if (Array.isArray(returned)) {
        setComments(returned);
      } else if (returned) {
        setComments(prev => [...prev, returned]);
      }
      setNewComment("");
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/auth/comment/${postUserId}/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev => prev.filter(c => (c._id || c.id) !== commentId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{
      borderTop: "1px solid #2A0F0F",
      padding: "12px 12px 4px",
      background: "rgba(10,2,2,0.4)",
    }}>
      {/* Comment input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
      }}>
        <div style={{
          flex: 1,
          display: "flex", alignItems: "center",
          background: "#0E0404",
          border: "1px solid #3D1515",
          borderRadius: 10,
          padding: "7px 10px",
          gap: 8,
          transition: "border-color 0.2s",
        }}
          onFocus={() => { }}
        >
          <input
            ref={inputRef}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder="Add a comment…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#FFF5E6", fontSize: 13, caretColor: "#C9A84C",
            }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
            background: newComment.trim()
              ? "linear-gradient(135deg, #7B1C1C, #C9A84C)"
              : "#1F0A0A",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting
            ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #3D1515", borderTopColor: "#C9A84C", animation: "spin 0.7s linear infinite" }} />
            : <FaPaperPlane size={13} style={{ color: newComment.trim() ? "#FFF5E6" : "#3D1515" }} />
          }
        </button>
      </div>

      {/* Comments list */}
      {loading && (
        <div style={{ textAlign: "center", padding: "8px 0 12px", color: "#6B5030", fontSize: 12 }}>
          Loading comments…
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p style={{ color: "#3D1515", fontSize: 12, textAlign: "center", padding: "4px 0 10px", margin: 0 }}>
          No comments yet. Be the first ✨
        </p>
      )}

      {!loading && comments.map((c, i) => {
        const id = c._id || c.id;
        const isDeleting = deletingId === id;
        return (
          <div
            key={id || i}
            style={{
              display: "flex", gap: 10, marginBottom: 12,
              alignItems: "flex-start",
              opacity: isDeleting ? 0.4 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {/* Avatar */}
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
              padding: 1, background: "rgba(201,168,76,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img
                src={c.user?.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`}
                alt=""
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "1px solid #1A0707" }}
              />
            </div>

            {/* Bubble */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                background: "#1C0A0A",
                border: "1px solid #3D1515",
                borderRadius: "2px 14px 14px 14px",
                padding: "8px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: "#C9A84C", fontSize: 11, fontWeight: 700 }}>
                    {c.user?.name || "User"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#6B5030", fontSize: 10 }}>{timeAgo(c.createdAt)}</span>
                    <button
                      onClick={() => handleDelete(id)}
                      disabled={isDeleting}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: "2px 3px", color: "#3D1515",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <FaTrash size={9} />
                    </button>
                  </div>
                </div>
                <p style={{ color: "#E6D5B8", fontSize: 12, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
                  {c.text}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Home() {
  const token = localStorage.getItem("token");

  // Feed
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);

  // Connections
  const [requestedIds, setRequestedIds] = useState([]);
  const [pendingInterestIds, setPendingInterestIds] = useState([]);

  // Like animation tracker
  const [likeAnimating, setLikeAnimating] = useState({});

  // Comments open state per post
  const [openComments, setOpenComments] = useState({});

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecent);
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 350);

  // Profile drawer
  const [drawerUserId, setDrawerUserId] = useState(null);

  // ── Fetch sent connection IDs ─────────────────────────────────────────────
  useEffect(() => {
    const fetchSentIds = async () => {
      if (!token) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/connections/sent`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRequestedIds(res.data.requests.map(r => r.receiver._id));
      } catch (err) { console.error(err); }
    };
    fetchSentIds();
  }, []);

  // ── Interested handler ────────────────────────────────────────────────────
  const handleInterested = async (receiverId) => {
    if (requestedIds.includes(receiverId) || pendingInterestIds.includes(receiverId)) return;
    setPendingInterestIds(prev => [...prev, receiverId]);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/connections/send/${receiverId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestedIds(prev => [...prev, receiverId]);
    } catch (err) { 
      console.error(err); 
    } finally {
      setPendingInterestIds(prev => prev.filter(id => id !== receiverId));
    }
  };

  // ── Fetch feed ────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/users?page=1&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("ressss", response?.data?.users)
      const newUsers = response.data.users.map((user, index) => ({
        id: user._id,
        name: user.name,
        profession: user.occupation,
        city: user.city,
        gender: user.gender,
        profile: user.photos?.[0] || "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        image: user.photos?.[1] || user.photos?.[0],
        bio: "Looking for meaningful connection ❤️",
        interests: "Travel • Music • Family",
        likes: user.likesCount ?? 100 + index,
        isLiked: user.isLiked ?? false,
        scoreMatch: user.matchScore,
      }));
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newUsers.filter(u => !existingIds.has(u.id))];
      });
      pageRef.current += 1;
      if (response.data.currentPage >= response.data.totalPages) setHasMore(false);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Like (calls API) ──────────────────────────────────────────────────────
  const handleLike = async (id) => {
    // optimistic update
    setPosts(prev => prev.map(post =>
      post.id === id
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
    setLikeAnimating(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setLikeAnimating(prev => ({ ...prev, [id]: false })), 400);

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/like/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // revert on error
      console.error(err);
      setPosts(prev => prev.map(post =>
        post.id === id
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    }
  };

  // ── Toggle comment section ────────────────────────────────────────────────
  const toggleComments = (id) => {
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Live search ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const doSearch = async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/search`,
          { params: { search: debouncedQuery }, signal: controller.signal }
        );
        setSearchResults(res.data.users || []);
      } catch (err) {
        if (!axios.isCancel(err)) console.error(err);
      } finally {
        setSearchLoading(false);
      }
    };
    doSearch();
    return () => controller.abort();
  }, [debouncedQuery]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  // ── Open profile drawer ───────────────────────────────────────────────────
  const openProfile = (user, fromSearch = false) => {
    const userId = user._id || user.id;
    if (fromSearch) {
      const updated = saveRecent({
        _id: userId,
        name: user.name,
        email: user.email || "",
        photos: user.photos || (user.profile ? [user.profile] : []),
        city: user.city || "",
      });
      setRecentSearches(updated);
    }
    setDrawerUserId(userId);
    setShowDropdown(false);
  };

  // ── Recent search handlers ────────────────────────────────────────────────
  const removeRecent = (e, id) => {
    e.stopPropagation();
    setRecentSearches(deleteRecent(id));
  };

  const showRecentsPanel = showDropdown && !debouncedQuery.trim() && recentSearches.length > 0;
  const showResultsPanel = showDropdown && (searchLoading || searchResults.length > 0 || debouncedQuery.trim());

  // ─────────────────────────────────────────────────────────────────────────
  // PostCard — inline so it can access state setters without prop drilling
  // ─────────────────────────────────────────────────────────────────────────
  const PostCard = useCallback(({ post }) => {
    const isCommentsOpen = openComments[post.id];
    const isAnimating = likeAnimating[post.id];

    return (
      <div
        className="overflow-hidden flex flex-col"
        style={{ background: "#150707", border: "1px solid #3D1515", borderRadius: 16 }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between p-3"
          onClick={() => openProfile({ _id: post.id, name: post.name, photos: [post.profile], city: post.city })}
          style={{ cursor: "pointer" }}
        >
          <div className="flex items-center gap-2.5">
            <div style={{ padding: 1.5, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7B1C1C)" }}>
              <img src={post.profile} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #150707", display: "block" }} />
            </div>
            <div>
              <h2 style={{ color: "#FFF5E6", fontWeight: 600, fontSize: 14, margin: 0 }}>{post.name}</h2>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            {post.scoreMatch && (
              <div style={{
                background: "linear-gradient(135deg, #7B1C1C, #A0341E)",
                borderRadius: 6, padding: "2px 6px", color: "#FFF",
                fontSize: 9, fontWeight: 800, whiteSpace: "nowrap",
                textTransform: "uppercase", letterSpacing: "0.02em"
              }}>
                {post.scoreMatch}% Match
              </div>
            )}

          </div>
        </div>

        {/* ── Photo ── */}
        <div style={{ position: "relative" }}>
          <img
            src={post.image}
            alt=""
            style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: "linear-gradient(transparent, rgba(10,2,2,0.9))",
            display: "flex", alignItems: "flex-end", padding: "0 12px 10px"
          }}>
            <p style={{ color: "#C4A882", fontSize: 11, margin: 0 }}>{post.interests}</p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="p-3 pb-2">
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 8 }}>

            {/* Like button */}
            <button
              onClick={() => handleLike(post.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer", padding: "6px 10px 6px 0",
                transform: isAnimating ? "scale(1.25)" : "scale(1)",
                transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {post.isLiked
                ? <FaHeart size={20} style={{ color: "#E05555", filter: "drop-shadow(0 0 6px #E0555566)" }} />
                : <FaRegHeart size={20} style={{ color: "#6B5030" }} />
              }
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: post.isLiked ? "#E05555" : "#6B5030",
                minWidth: 18,
                transition: "color 0.2s",
              }}>
                {post.likes}
              </span>
            </button>

            {/* Comment toggle button (Icon only) */}
            <button
              onClick={() => toggleComments(post.id)}
              style={{
                display: "flex", alignItems: "center",
                background: "none", border: "none", cursor: "pointer", padding: "6px 10px",
                color: isCommentsOpen ? "#C9A84C" : "#6B5030",
                transition: "color 0.2s",
              }}
            >
              <FaRegCommentDots size={21} />
            </button>

            {/* Interested / Connect */}
            <button
              onClick={() => handleInterested(post.id)}
              disabled={pendingInterestIds.includes(post.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer", padding: "6px 10px",
                color: requestedIds.includes(post.id) ? "#C9A84C" : "#6B5030",
                transition: "color 0.2s",
                opacity: pendingInterestIds.includes(post.id) ? 0.6 : 1,
              }}
            >
              {pendingInterestIds.includes(post.id) ? (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #3D1515", borderTopColor: "#C9A84C", animation: "spin 0.7s linear infinite" }} />
              ) : requestedIds.includes(post.id) ? (
                <FaStar size={20} style={{ color: "#C9A84C", filter: "drop-shadow(0 0 5px #C9A84C88)" }} />
              ) : (
                <FaRegStar size={20} />
              )}
              <span style={{ fontSize: 11, fontWeight: 600 }}>
                {pendingInterestIds.includes(post.id) ? "Sending..." : requestedIds.includes(post.id) ? "Request Sent" : "Connect"}
              </span>
            </button>
          </div>

          {/* Bio */}
          <p style={{ color: "#9A7A5A", fontSize: 12, margin: "0 0 4px", lineHeight: 1.5 }}>
            <span style={{ color: "#C4A882", fontWeight: 500 }}>{post.name}</span>
            {"  "}{post.bio}
          </p>
        </div>

        {/* ── Comment Section (collapsible) ── */}
        <div style={{
          maxHeight: isCommentsOpen ? 600 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          {isCommentsOpen && (
            <CommentSection postUserId={post.id} token={token} />
          )}
        </div>
      </div>
    );
  }, [posts, openComments, likeAnimating, requestedIds]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="mb-6" style={{ borderBottom: "1px solid #3D1515", paddingBottom: 16 }}>
        <h2 style={{ color: "#C9A84C", fontSize: 13, letterSpacing: "0.2em", margin: "0 0 2px" }}>❋ DISCOVER</h2>
        <h1 style={{ color: "#FFF5E6", fontSize: 22, fontWeight: 600, margin: 0 }}>Find Your Life Partner</h1>
      </div>

      {/* ── Search ── */}
      <div
        ref={searchRef}
        style={{ position: "relative", marginBottom: 24, zIndex: 40, maxWidth: 600 }}
      >
        <div style={{
          display: "flex", alignItems: "center",
          background: "#1F0A0A",
          border: "1px solid",
          borderColor: showDropdown ? "#5A2020" : "#3D1515",
          borderRadius: (showRecentsPanel || showResultsPanel) ? "12px 12px 0 0" : 12,
          padding: "10px 14px", gap: 10,
          transition: "border-color 0.2s",
        }}>
          {searchLoading
            ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #3D1515", borderTopColor: "#C9A84C", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
            : <FaSearch size={14} style={{ color: "#6B5030", flexShrink: 0 }} />
          }
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by name or email…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#FFF5E6", fontSize: 14, caretColor: "#C9A84C" }}
          />
          {searchQuery && (
            <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#6B5030", display: "flex" }}>
              <FaTimes size={13} />
            </button>
          )}
        </div>

        {(showRecentsPanel || showResultsPanel) && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#1A0707",
            border: "1px solid #3D1515", borderTop: "1px solid #2A0F0F",
            borderRadius: "0 0 12px 12px",
            maxHeight: 360, overflowY: "auto", zIndex: 50,
          }}>
            {showRecentsPanel && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 6px" }}>
                  <span style={{ color: "#6B5030", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Recent</span>
                  <button
                    onClick={() => setRecentSearches(clearAllRecent())}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#5A2020", fontSize: 11, padding: 0 }}
                  >Clear all</button>
                </div>
                {recentSearches.map((user, i) => (
                  <div
                    key={user._id}
                    onClick={() => { setDrawerUserId(user._id); setShowDropdown(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "9px 14px", cursor: "pointer",
                      borderBottom: i < recentSearches.length - 1 ? "1px solid #1F0A0A" : "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#220A0A"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <FaClock size={12} style={{ color: "#3D1515", flexShrink: 0 }} />
                    <div style={{ padding: 1.5, borderRadius: "50%", background: "linear-gradient(135deg, #5A2020, #3D1515)", flexShrink: 0 }}>
                      <img
                        src={user.photos?.[0] || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                        alt=""
                        style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "2px solid #1A0707", display: "block" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#C4A882", fontSize: 13, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                      <p style={{ color: "#4A2020", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.city || user.email || ""}</p>
                    </div>
                    <button
                      onClick={e => removeRecent(e, user._id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#3D1515", display: "flex", flexShrink: 0 }}
                    ><FaTimes size={11} /></button>
                  </div>
                ))}
              </>
            )}

            {showResultsPanel && (
              <>
                {searchLoading && (
                  <div style={{ padding: "14px", textAlign: "center", color: "#6B5030", fontSize: 13 }}>Searching…</div>
                )}
                {!searchLoading && searchResults.length === 0 && debouncedQuery.trim() && (
                  <div style={{ padding: "16px", textAlign: "center", color: "#6B5030", fontSize: 13 }}>
                    No profiles found for "{searchQuery}"
                  </div>
                )}
                {!searchLoading && searchResults.map((user, i) => (
                  <div
                    key={user._id}
                    onClick={() => openProfile(user, true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", cursor: "pointer",
                      borderBottom: i < searchResults.length - 1 ? "1px solid #1F0A0A" : "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#220A0A"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ padding: 2, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7B1C1C)", flexShrink: 0 }}>
                      <img
                        src={user.photos?.[0] || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                        alt=""
                        style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #1A0707", display: "block" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#FFF5E6", fontSize: 14, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                      <p style={{ color: "#6B5030", fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}{user.city ? ` · ${user.city}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleInterested(user._id); }}
                      style={{
                        padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", flexShrink: 0,
                        background: requestedIds.includes(user._id) ? "rgba(201,168,76,0.1)" : "linear-gradient(90deg, #7B1C1C, #A0341E)",
                        color: requestedIds.includes(user._id) ? "#C9A84C" : "#FFF5E6",
                        border: requestedIds.includes(user._id) ? "1px solid #C9A84C44" : "none",
                      }}
                    >
                      {requestedIds.includes(user._id) ? "✓" : "❤"}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Feed ── */}
      {loading && (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <div style={{ color: "#C9A84C", fontSize: 28, marginBottom: 12 }}>❋</div>
          <p style={{ color: "#6B5030" }}>Finding matches for you...</p>
        </div>
      )}

      {!loading && (
        <InfiniteScroll
          dataLength={posts.length}
          next={fetchUsers}
          hasMore={hasMore}
          loader={<p style={{ textAlign: "center", color: "#6B5030", padding: 16, gridColumn: "1 / -1" }}>Loading more profiles...</p>}
          endMessage={<p style={{ textAlign: "center", color: "#3D1515", padding: 16, gridColumn: "1 / -1" }}>❋ No more Matching profiles</p>}
        >
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </InfiniteScroll>
      )}

      {drawerUserId && (
        <UserProfileDrawer
          userId={drawerUserId}
          onClose={() => setDrawerUserId(null)}
          requestedIds={requestedIds}
          onInterested={handleInterested}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}