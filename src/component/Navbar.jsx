import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { logout } from "../redux/authSlice";
import { FaHome, FaRegHeart, FaBars, FaTimes, FaUserPlus, FaBell, FaUser, FaSignOutAlt } from "react-icons/fa";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token, userId, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const userName = user?.name || "User";
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!token || !userId) return;
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch current user profile photo
    axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, { headers })
      .then(res => setUserProfile(res.data.user || res.data))
      .catch(() => { });

    // Pending connection requests
    axios.get(`${import.meta.env.VITE_API_URL}/api/connections/pending`, {
      headers, validateStatus: (s) => s < 500,
    }).then(res => {
      if (res.status === 200) setPendingCount(res.data.requests?.length || 0);
    }).catch(() => { });

    // Unread messages
    axios.get(`${import.meta.env.VITE_API_URL}/api/messages/unread-count/${userId}`, {
      headers, validateStatus: (s) => s < 500,
    }).then(res => {
      if (res.status === 200) setUnreadMsgCount(res.data.count || 0);
    }).catch(() => { });

  }, [location.pathname, token, userId]);

  const navItems = [
    { to: "/home", icon: <FaHome size={20} />, label: "Home" },
    { to: "/messages", icon: <HiOutlineChatBubbleLeftRight size={21} />, label: "Messages", badge: unreadMsgCount },
    { to: "/connections", icon: <FaUserPlus size={20} />, label: "Connections", badge: pendingCount },
    { to: "/notifications", icon: <FaBell size={20} />, label: "Notifications" },
    { to: "/profile", icon: <FaUser size={20} />, label: "Profile" },
  ];

  // Mobile only shows 4 items
  const mobileNavItems = navItems.filter(item => item.to !== "/notifications");

  return (
    <>


      <div
        className={`hidden lg:flex fixed top-0 left-0 h-screen flex-col z-50 transition-all duration-300 w-[240px]`}
        style={{ background: "#1A0A0A", borderRight: "1px solid #3D1515" }}
      >
        {/* Logo */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid #3D1515" }}>
          <div className="flex items-center gap-2.5">
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "#C9A84C", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18, color: "#1A0A0A"
            }}>❋</div>
            <div>
              <h1 style={{ color: "#E8C96D", fontSize: 20, fontWeight: 700, letterSpacing: "0.04em", margin: 0 }}>Vivaah</h1>
              <p style={{ color: "#6B3A1F", fontSize: 9, margin: 0, letterSpacing: "0.18em" }}>SACRED BONDS</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-5 py-4 transition-all hover:bg-white/5"
          style={{ borderBottom: "1px solid #3D1515" }}
        >
          {/* Photo if available, initials fallback */}
          {userProfile?.photos?.[0] ? (
            <div style={{ padding: 2, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7B1C1C)", flexShrink: 0 }}>
              <img
                src={userProfile.photos[0]}
                alt={userName}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #1A0A0A", display: "block" }}
              />
            </div>
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #C9A84C, #7B1C1C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FFF5E6", fontWeight: 600, fontSize: 16,
              border: "2px solid #C9A84C", flexShrink: 0
            }}>{initials}</div>
          )}

          <div>
            <p style={{ color: "#FFF5E6", fontSize: 14, fontWeight: 500, margin: 0 }}>
              {userProfile?.name || userName}
            </p>
            <p style={{ color: "#C9A84C", fontSize: 11, margin: 0 }}>
              {userProfile?.occupation || "View profile →"}
            </p>
          </div>
        </Link>

        {/* Nav items */}
        <div className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(({ to, icon, label, badge }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: active ? "rgba(201,168,76,0.1)" : "transparent",
                  color: active ? "#C9A84C" : "#9A7A5A",
                  borderLeft: active ? "3px solid #C9A84C" : "3px solid transparent",
                }}
              >
                <span>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: active ? 500 : 400 }}>{label}</span>
                {badge > 0 && (
                  <span style={{
                    marginLeft: "auto", background: "#7B1C1C", color: "#FFF5E6",
                    fontSize: 10, borderRadius: 20, padding: "1px 7px", fontWeight: 600
                  }}>{badge}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout at bottom of sidebar */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid #3D1515" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-[#7B1C1C]/10"
            style={{ color: "#7B1C1C" }}
          >
            <FaSignOutAlt size={20} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navbar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(20, 5, 5, 0.96)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid #3D1515",
        }}
      >
        <div className="flex items-center justify-around py-3">
          {mobileNavItems.map(({ to, icon, label, badge }) => {
            const active = location.pathname === to;

            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center relative"
                style={{
                  color: active ? "#C9A84C" : "#8B6B52",
                  minWidth: 60,
                }}
              >
                <div className="relative">
                  {icon}

                  {badge > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -7,
                        right: -10,
                        background: "#7B1C1C",
                        color: "#FFF",
                        fontSize: 9,
                        borderRadius: 20,
                        padding: "1px 5px",
                        fontWeight: 700,
                        minWidth: 16,
                        textAlign: "center",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>


    </>
  );
}