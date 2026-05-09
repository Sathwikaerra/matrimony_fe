// pages/Home.jsx

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import UserProfileDrawer from "../component/UserProfileDrawer";
import {
  FaHeart, FaRegHeart, FaRegCommentDots,
  FaShare, FaSearch, FaTimes, FaClock,
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

export default function Home() {
  // Feed
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);

  // Connections
  const [requestedIds, setRequestedIds] = useState([]);

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
      const token = localStorage.getItem("token");
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
    if (requestedIds.includes(receiverId)) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/connections/send/${receiverId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setRequestedIds(prev => [...prev, receiverId]);
    } catch (err) { console.error(err); }
  };

  // ── Fetch feed ────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/users?page=${pageRef.current}&limit=10`
      );
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
        likes: 100 + index,
        isLiked: false,
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

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = (id) => {
    setPosts(prev => prev.map(post =>
      post.id === id
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
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

  // ── Single post card ──────────────────────────────────────────────────────
  const PostCard = ({ post }) => (
    <div
      className="overflow-hidden flex flex-col"
      style={{ background: "#150707", border: "1px solid #3D1515", borderRadius: 16 }}
    >
      <div
        className="flex items-center justify-between p-4"
        onClick={() => openProfile({ _id: post.id, name: post.name, photos: [post.profile], city: post.city })}
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center gap-3">
          <div style={{ padding: 2, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7B1C1C)" }}>
            <img src={post.profile} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #150707", display: "block" }} />
          </div>
          <div>
            <h2 style={{ color: "#FFF5E6", fontWeight: 600, fontSize: 15, margin: 0 }}>{post.name}</h2>
            <p style={{ color: "#8B6914", fontSize: 12, margin: 0 }}>
              📍 {post.city || "India"} {post.profession ? `· ${post.profession}` : ""}
            </p>
          </div>
        </div>
        <div style={{
          background: "rgba(201,168,76,0.1)", border: "1px solid #3D1515",
          borderRadius: 20, padding: "4px 12px", color: "#C9A84C", fontSize: 12
        }}>
          {post.gender || "Profile"}
        </div>
      </div>

      <div style={{ position: "relative", flex: 1 }}>
        <img
          src={post.image}
          alt=""
          style={{ width: "100%", height: 340, objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
          background: "linear-gradient(transparent, rgba(10,2,2,0.85))",
          display: "flex", alignItems: "flex-end", padding: "0 16px 12px"
        }}>
          <p style={{ color: "#C4A882", fontSize: 13, margin: 0 }}>{post.interests}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-5 mb-3">
          <button
            onClick={() => handleLike(post.id)}
            className="flex items-center gap-1.5 transition-all hover:scale-110"
            style={{ color: post.isLiked ? "#C9A84C" : "#6B5030", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {post.isLiked ? <FaHeart size={22} /> : <FaRegHeart size={22} />}
            <span style={{ fontSize: 13 }}>{post.likes}</span>
          </button>
          <button className="transition-all hover:scale-110" style={{ color: "#6B5030", background: "none", border: "none", cursor: "pointer" }}>
            <FaRegCommentDots size={22} />
          </button>
          <button className="transition-all hover:scale-110" style={{ color: "#6B5030", background: "none", border: "none", cursor: "pointer" }}>
            <FaShare size={20} />
          </button>
        </div>

        <p style={{ color: "#9A7A5A", fontSize: 13, margin: "0 0 12px", lineHeight: 1.6 }}>
          <span style={{ color: "#C4A882", fontWeight: 500 }}>{post.name}</span>{"  "}{post.bio}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => handleInterested(post.id)}
            style={{
              flex: 1, padding: "10px 0",
              background: requestedIds.includes(post.id) ? "rgba(201,168,76,0.1)" : "linear-gradient(90deg, #7B1C1C, #A0341E)",
              color: requestedIds.includes(post.id) ? "#C9A84C" : "#FFF5E6",
              border: requestedIds.includes(post.id) ? "1px solid #C9A84C44" : "none",
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}
          >
            {requestedIds.includes(post.id) ? "✓ Requested" : "❤ Interested"}
          </button>
          <button style={{
            flex: 1, padding: "10px 0", background: "transparent",
            color: "#C9A84C", border: "1px solid #3D1515", borderRadius: 10,
            fontSize: 14, fontWeight: 500, cursor: "pointer"
          }}>
            ✉ Message
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-6" style={{ borderBottom: "1px solid #3D1515", paddingBottom: 16 }}>
        <h2 style={{ color: "#C9A84C", fontSize: 13, letterSpacing: "0.2em", margin: "0 0 2px" }}>❋ DISCOVER</h2>
        <h1 style={{ color: "#FFF5E6", fontSize: 22, fontWeight: 600, margin: 0 }}>Find Your Life Partner</h1>
      </div>

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
          endMessage={<p style={{ textAlign: "center", color: "#3D1515", padding: 16, gridColumn: "1 / -1" }}>❋ No profiles</p>}
        >
          <div
            style={{
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}