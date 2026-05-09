// pages/Home.jsx

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import Navbar from "../component/Navbar";
import {
  FaHeart,
  FaRegHeart,
  FaRegCommentDots,
  FaShare
} from "react-icons/fa";

export default function Home() {

  // =========================
  // STATES
  // =========================

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);



  // Guard against concurrent / double fetches (StrictMode safe)
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);



const [requestedIds, setRequestedIds] = useState([]);   // no more localStorage

// Fetch already-sent connection IDs from DB on mount
useEffect(() => {
  const fetchSentIds = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/connections/sent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Extract receiver IDs from sent requests
      const ids = res.data.requests.map((r) => r.receiver._id);
      setRequestedIds(ids);
    } catch (err) {
      console.error(err);
    }
  };
  fetchSentIds();
}, []);

// Update handleInterested — no more localStorage
const handleInterested = async (receiverId) => {
  if (requestedIds.includes(receiverId)) return;
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/connections/send/${receiverId}`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    setRequestedIds((prev) => [...prev, receiverId]);   // optimistic update, no localStorage
  } catch (err) {
    console.error(err);
  }
};

  // =========================
  // FETCH USERS
  // =========================

  const fetchUsers = async () => {
    // Block if a fetch is already in-flight (fixes StrictMode double-call)
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/users?page=${pageRef.current}&limit=5`
      );

      console.log(response.data);

      const newUsers = response.data.users.map((user, index) => ({
        id: user._id,
        name: user.name,
        profession: user.occupation,
        city: user.city,
        gender: user.gender,
        profile:
          user.photos?.[0] ||
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        image:
          user.photos?.[1] ||
          user.photos?.[0],
        bio: "Looking for meaningful connection ❤️",
        interests: "Travel • Music • Family",
        likes: 100 + index,
        isLiked: false,
      }));

      // Deduplicate by id before appending (StrictMode / double-fetch safe)
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...newUsers.filter((u) => !existingIds.has(u.id))];
      });

      // Advance page via ref so concurrent calls can't double-increment
      pageRef.current += 1;
      setPage(pageRef.current);

      if (response.data.currentPage >= response.data.totalPages) {
        setHasMore(false);
      }

      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  };

  // =========================
  // INITIAL FETCH
  // =========================

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================
  // LIKE FUNCTION
  // =========================

  const handleLike = (id) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  return (
    <div style={{ background: "#0D0404", minHeight: "100vh", color: "#FFF5E6" }}>
      <Navbar />

      <div className="lg:ml-[240px] flex justify-center">
        <div className="w-full max-w-xl pt-20 lg:pt-8 px-4 pb-20">

          {/* Header */}
          <div className="mb-6" style={{ borderBottom: "1px solid #3D1515", paddingBottom: 16 }}>
            <h2 style={{ color: "#C9A84C", fontSize: 13, letterSpacing: "0.2em", margin: "0 0 2px" }}>
              ❋ DISCOVER
            </h2>
            <h1 style={{ color: "#FFF5E6", fontSize: 22, fontWeight: 600, margin: 0 }}>
              Find Your Life Partner
            </h1>
          </div>

          {/* Stories strip */}
          <div className="flex gap-4 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: "none" }}>
            {posts.slice(0, 10).map((profile) => (
              <div
                key={profile.id}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                style={{ minWidth: 70 }}
              >
                <div style={{
                  padding: 2, borderRadius: "50%",
                  background: "linear-gradient(135deg, #C9A84C, #7B1C1C)"
                }}>
                  <img
                    src={profile.profile}
                    alt=""
                    style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", border: "2px solid #1A0A0A", display: "block" }}
                  />
                </div>
                <p style={{ color: "#C4A882", fontSize: 11, marginTop: 6, textAlign: "center", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.name.split(" ")[0]}
                </p>
              </div>
            ))}
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
              loader={<p style={{ textAlign: "center", color: "#6B5030", padding: 16 }}>Loading more profiles...</p>}
              endMessage={<p style={{ textAlign: "center", color: "#3D1515", padding: 16 }}>❋ You've seen all profiles</p>}
            >
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="mb-6 overflow-hidden"
                  style={{ background: "#150707", border: "1px solid #3D1515", borderRadius: 16 }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div style={{ padding: 2, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7B1C1C)" }}>
                        <img
                          src={post.profile}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #150707", display: "block" }}
                        />
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

                  {/* Image */}
                  <div style={{ position: "relative" }}>
                    <img
                      src={post.image}
                      alt=""
                      style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
                      background: "linear-gradient(transparent, rgba(10,2,2,0.85))",
                      display: "flex", alignItems: "flex-end", padding: "0 16px 12px"
                    }}>
                      <p style={{ color: "#C4A882", fontSize: 13, margin: 0 }}>{post.interests}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4">
                    <div className="flex items-center gap-5 mb-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 transition-all hover:scale-110"
                        style={{ color: post.isLiked ? "#C9A84C" : "#6B5030", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        {post.isLiked ? <FaHeart size={22} /> : <FaRegHeart size={22} />}
                        <span style={{ fontSize: 13 }}>{post.likes}</span>
                      </button>
                      <button
                        className="transition-all hover:scale-110"
                        style={{ color: "#6B5030", background: "none", border: "none", cursor: "pointer" }}
                      >
                        <FaRegCommentDots size={22} />
                      </button>
                      <button
                        className="transition-all hover:scale-110"
                        style={{ color: "#6B5030", background: "none", border: "none", cursor: "pointer" }}
                      >
                        <FaShare size={20} />
                      </button>
                    </div>

                    <p style={{ color: "#9A7A5A", fontSize: 13, margin: "0 0 12px", lineHeight: 1.6 }}>
                      <span style={{ color: "#C4A882", fontWeight: 500 }}>{post.name}</span>
                      {"  "}{post.bio}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleInterested(post.id)}
                        style={{
                          flex: 1, padding: "11px 0",
                          background: requestedIds.includes(post.id)
                            ? "rgba(201,168,76,0.1)"
                            : "linear-gradient(90deg, #7B1C1C, #A0341E)",
                          color: requestedIds.includes(post.id) ? "#C9A84C" : "#FFF5E6",
                          border: requestedIds.includes(post.id) ? "1px solid #C9A84C44" : "none",
                          borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        {requestedIds.includes(post.id) ? "✓ Requested" : "❤ Interested"}
                      </button>

                      <button style={{
                        flex: 1, padding: "11px 0",
                        background: "transparent",
                        color: "#C9A84C", border: "1px solid #3D1515", borderRadius: 10,
                        fontSize: 14, fontWeight: 500, cursor: "pointer"
                      }}>
                        ✉ Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </InfiniteScroll>
          )}

        </div>
      </div>
    </div>
  );
}