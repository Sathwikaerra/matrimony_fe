// component/UserProfileDrawer.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaTimes, FaHeart, FaMapMarkerAlt, FaBriefcase,
  FaGraduationCap, FaPray, FaLanguage, FaRing, FaPhone,
} from "react-icons/fa";

export default function UserProfileDrawer({ userId, onClose, requestedIds, onInterested }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("photos");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setVisible(true), 10);
    return () => {
      document.body.style.overflow = "unset";
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setProfile(null);
    setActivePhoto(0);
    setActiveTab("photos");
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile(res.data.profile || res.data.user || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [userId]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const isRequested = requestedIds.includes(userId);

  const details = profile ? [
    { icon: <FaMapMarkerAlt />,   label: "Location",      value: [profile.city, profile.state].filter(Boolean).join(", ") || null },
    { icon: <FaBriefcase />,      label: "Occupation",    value: profile.occupation    || null },
    { icon: <FaGraduationCap />,  label: "Education",     value: profile.education     || null },
    { icon: <FaPray />,           label: "Religion",      value: profile.religion      || null },
    { icon: <FaLanguage />,       label: "Mother Tongue", value: profile.motherTongue  || null },
    { icon: <FaRing />,           label: "Marital",       value: profile.maritalStatus || null },
    { icon: <FaPhone />,          label: "Contact",       value: profile.phoneNumber   || null },
  ].filter(d => d.value) : [];

  const age = profile?.dateOfBirth
    ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()
    : null;

  const stats = [
    { label: "Photos",  value: profile?.photos?.length || 0 },
    { label: "Age",     value: age || "—" },
    { label: "Status",  value: profile?.maritalStatus ? profile.maritalStatus.split(" ")[0] : "—" },
  ];

  return (
    <>
      <div
        onClick={handleClose}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "88vh", zIndex: 101,
        display: "flex", flexDirection: "column", background: "#0A0202",
        borderRadius: "20px 20px 0 0", border: "1px solid #2A0A0A", borderBottom: "none",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
        boxShadow: "0 -12px 80px rgba(0,0,0,0.95)", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 10px", borderBottom: "1px solid #1A0505", flexShrink: 0,
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A0A0A", margin: "0 auto", position: "absolute", left: "50%", transform: "translateX(-50%)", top: 8 }} />
          <h3 style={{ color: "#FFF5E6", fontSize: 15, fontWeight: 700, margin: 0 }}>
            {loading ? "Profile" : profile?.name || "Profile"}
          </h3>
          <button onClick={handleClose} style={{ background: "#1A0505", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9A7A5A" }}>
            <FaTimes size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #2A0A0A", borderTopColor: "#C9A84C", animation: "spin 0.7s linear infinite", marginBottom: 14 }} />
              <p style={{ color: "#6B5030", fontSize: 13 }}>Loading profile…</p>
            </div>
          )}

          {!loading && profile && (
            <>
              {/* Header Info */}
              <div style={{ padding: "20px 20px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                  <div style={{ padding: 3, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7B1C1C, #C9A84C)", flexShrink: 0 }}>
                    <div style={{ padding: 2, borderRadius: "50%", background: "#0A0202" }}>
                      <img src={profile.photos?.[0] || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"} alt="" style={{ width: 82, height: 82, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24, flex: 1 }}>
                    {stats.map((s, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ color: "#FFF5E6", fontSize: 17, fontWeight: 700 }}>{s.value}</span>
                        <span style={{ color: "#6B5030", fontSize: 11 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <h2 style={{ color: "#FFF5E6", fontSize: 15, fontWeight: 700, margin: 0 }}>{profile.name}</h2>
                    <span style={{ background: "rgba(201,168,76,0.12)", border: "1px solid #C9A84C33", borderRadius: 20, padding: "2px 9px", color: "#C9A84C", fontSize: 11, fontWeight: 500 }}>
                      {profile.gender || "Profile"}
                    </span>
                  </div>
                  {profile.occupation && <p style={{ color: "#9A7A5A", fontSize: 13, margin: "0 0 2px" }}>💼 {profile.occupation}</p>}
                  {(profile.city || profile.state) && <p style={{ color: "#9A7A5A", fontSize: 13, margin: "0 0 2px" }}>📍 {[profile.city, profile.state].filter(Boolean).join(", ")}</p>}
                  {profile.religion && <p style={{ color: "#9A7A5A", fontSize: 13, margin: "0 0 2px" }}>🙏 {profile.religion}{profile.motherTongue ? ` · ${profile.motherTongue}` : ""}</p>}
                  {profile.education && <p style={{ color: "#9A7A5A", fontSize: 13, margin: 0 }}>🎓 {profile.education}</p>}
                </div>

                {/* Action Buttons (Below details, above tabs) */}
                <div style={{ padding: "10px 0 20px" }}>
                  <div className="flex flex-col md:flex-row gap-3 md:max-w-lg md:mx-auto" style={{ width: "100%" }}>
                    <button
                      onClick={() => onInterested(userId)}
                      style={{
                        flex: 1.4, padding: "12px 0",
                        background: isRequested ? "#1A0505" : "linear-gradient(90deg, #7B1C1C, #A0341E)",
                        color: isRequested ? "#C9A84C" : "#FFF5E6",
                        border: isRequested ? "1px solid #C9A84C33" : "none",
                        borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: isRequested ? "none" : "0 4px 15px rgba(123, 28, 28, 0.3)",
                      }}
                    >
                      <FaHeart size={14} />
                      {isRequested ? "Requested" : "Interested"}
                    </button>
                    <button style={{ flex: 1, padding: "12px 0", background: "#150A0A", color: "#C4A882", border: "1px solid #3D1515", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      ✉ Message
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", padding: "0 20px", gap: 30, borderBottom: "1px solid #1A0505", flexShrink: 0, marginBottom: 4 }}>
                {[
                  { key: "photos", label: "Photos" },
                  { key: "about",  label: "About"  },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "12px 0", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: activeTab === tab.key ? "#C9A84C" : "#4A2020", borderBottom: activeTab === tab.key ? "2px solid #C9A84C" : "2px solid transparent", transition: "all 0.2s" }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "photos" && (
                <div style={{ padding: "0 20px 20px" }}>
                  {profile.photos?.length > 0 ? (
                    <>
                      <div className="hidden lg:grid grid-cols-3 gap-3 pt-4">
                        {profile.photos.map((p, i) => (
                          <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", border: "1px solid #1A0505" }}>
                            <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        ))}
                      </div>
                      <div className="lg:hidden">
                        <div style={{ position: "relative", margin: "0 -20px" }}>
                          <img src={profile.photos[activePhoto]} alt="" style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "linear-gradient(transparent, #0A0202)" }} />
                          {profile.photos.length > 1 && (
                            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
                              {profile.photos.map((_, i) => (
                                <div key={i} style={{ width: i === activePhoto ? 18 : 5, height: 5, borderRadius: 3, background: i === activePhoto ? "#C9A84C" : "rgba(255,245,230,0.3)", transition: "all 0.2s" }} />
                              ))}
                            </div>
                          )}
                        </div>
                        {profile.photos.length > 1 && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
                            {profile.photos.map((p, i) => (
                              <div key={i} onClick={() => setActivePhoto(i)} style={{ position: "relative", aspectRatio: "1", cursor: "pointer", overflow: "hidden", borderRadius: 8, border: i === activePhoto ? "2px solid #C9A84C" : "1px solid #1A0505" }}>
                                <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: i === activePhoto ? 1 : 0.6 }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : <div style={{ textAlign: "center", padding: "40px 20px", color: "#3D1515", fontSize: 13 }}>No photos uploaded yet</div>}
                </div>
              )}

              {activeTab === "about" && (
                <div style={{ padding: "20px 20px 0" }}>
                  <div style={{ background: "#0F0303", border: "1px solid #1A0505", borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
                    {details.map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: i < details.length - 1 ? "1px solid #150404" : "none", gap: 14 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C", fontSize: 14, flexShrink: 0 }}>{d.icon}</span>
                        <div>
                          <p style={{ color: "#4A2020", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.label}</p>
                          <p style={{ color: "#C4A882", fontSize: 14, fontWeight: 600, margin: 0 }}>{d.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !profile && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "#6B5030" }}>Could not load profile.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}