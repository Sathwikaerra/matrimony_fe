import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaBell, FaPaperPlane, FaHeart, FaTimes, FaEnvelope } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const TABS = [
    { key: "received", label: "Received", icon: <FaBell size={16} /> },
    { key: "sent", label: "Sent", icon: <FaPaperPlane size={15} /> },
    { key: "accepted", label: "Connections", icon: <FaHeart size={15} /> },
    { key: "rejected", label: "Rejected", icon: <FaTimes size={16} /> },
];

export default function Connections() {
    const [activeTab, setActiveTab] = useState("received");
    const [data, setData] = useState({ received: [], sent: [], accepted: [], rejected: [] });
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    // Update time-ago labels every minute
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [pendingRes, sentRes, myRes, declinedRes] = await Promise.all([
                axios.get(`${API}/api/connections/pending`,  { headers: headers() }),
                axios.get(`${API}/api/connections/sent`,     { headers: headers() }),
                axios.get(`${API}/api/connections/my`,       { headers: headers() }),
                axios.get(`${API}/api/connections/declined`, { headers: headers() }),
            ]);

            const sentList     = sentRes.data.requests     || [];
            const declinedList = declinedRes.data.requests || [];

            console.log("Rejected Data Debug:", { sentList, declinedList });

            setData({
                received: pendingRes.data.requests || [],
                sent:     sentList.filter(r => r.status === "pending"),
                accepted: [
                    ...(myRes.data.connections || []),
                    ...sentList.filter(r => r.status === "accepted"),
                ],
                rejected: [
                    ...sentList.filter(r => r.status === "rejected" || r.status === "declined").map(r => ({
                        ...r,
                        _displayUser: r.receiver || {},
                        _type: "sent"
                    })),
                    ...declinedList.map(r => ({
                        ...r,
                        _displayUser: r.sender || {},
                        _type: "received"
                    })),
                ],
            });
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const accept = async (connectionId) => {
        await axios.patch(`${API}/api/connections/accept/${connectionId}`, {}, { headers: headers() });
        fetchAll();
    };

    const reject = async (connectionId) => {
        await axios.patch(`${API}/api/connections/reject/${connectionId}`, {}, { headers: headers() });
        fetchAll();
    };

    const withdraw = async (connectionId) => {
        await axios.patch(`${API}/api/connections/withdraw/${connectionId}`, {}, { headers: headers() });
        fetchAll();
    };

    const ProfileCard = ({ user, meta, actions }) => {
        if (!user) return null;
        return (
            <div style={{
                background: "#150707", border: "1px solid #3D1515", borderRadius: 16,
                padding: "16px", display: "flex", flexDirection: "column",
                gap: 12, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ padding: 2, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#7B1C1C)", flexShrink: 0 }}>
                        <img
                            src={user.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`}
                            alt={user.name || "User"}
                            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #150707", display: "block" }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ color: "#FFF5E6", fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>{user.name || "Unknown User"}</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px" }}>
                            {user.city && (
                                <span style={{ color: "#C9A84C", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ fontSize: 10 }}>📍</span> {user.city}
                                </span>
                            )}
                            {user.occupation && (
                                <span style={{ color: "#8B6B52", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ opacity: 0.5 }}>·</span> {user.occupation}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    paddingTop: 10, borderTop: "1px solid #2A0F0F", marginTop: 4 
                }}>
                    <div style={{ color: "#4A2A1A", fontSize: 11, fontStyle: "italic" }}>
                        {meta}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {actions}
                    </div>
                </div>
            </div>
        );
    };

    const Badge = ({ type }) => {
        const map = {
            pending: { bg: "rgba(201,168,76,0.12)", color: "#C9A84C", label: "Pending" },
            accepted: { bg: "rgba(60,120,60,0.15)", color: "#7BC47B", label: "Accepted" },
            rejected: { bg: "rgba(123,28,28,0.2)", color: "#C46B6B", label: "Declined" },
        };
        const s = map[type] || map.pending;
        return (
            <span style={{ fontSize: 11, borderRadius: 20, padding: "3px 10px", fontWeight: 600, background: s.bg, color: s.color }}>
                {s.label}
            </span>
        );
    };

    const BtnPrimary = ({ onClick, children }) => (
        <button onClick={onClick} style={{
            background: "linear-gradient(90deg,#7B1C1C,#A0341E)", color: "#FFF5E6",
            border: "none", borderRadius: 8, padding: "7px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer"
        }}>{children}</button>
    );

    const BtnOutline = ({ onClick, children, gold }) => (
        <button onClick={onClick} style={{
            background: gold ? "rgba(201,168,76,0.1)" : "transparent",
            color: gold ? "#C9A84C" : "#C9A84C",
            border: "1px solid #3D1515", borderRadius: 8,
            padding: "7px 14px", fontSize: 12, cursor: "pointer"
        }}>{children}</button>
    );

    const renderTab = () => {
        if (loading) return (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ color: "#C9A84C", fontSize: 28, marginBottom: 10 }}>❋</div>
                <p style={{ color: "#6B5030" }}>Loading...</p>
            </div>
        );

        if (activeTab === "received") {
            if (!data.received.length) return <Empty msg="No pending requests" />;
            return data.received.map(req => (
                <ProfileCard
                    key={req._id}
                    user={req.sender}
                    meta={`Sent ${timeAgo(req.updatedAt || req.createdAt)}`}
                    actions={<>
                        <BtnPrimary onClick={() => accept(req._id)}>Accept</BtnPrimary>
                        <BtnOutline onClick={() => reject(req._id)}>Decline</BtnOutline>
                    </>}
                />
            ));
        }

        if (activeTab === "sent") {
            if (!data.sent.length) return <Empty msg="No pending sent requests" />;
            return data.sent.map(req => (
                <ProfileCard
                    key={req._id}
                    user={req.receiver}
                    meta={`Sent ${timeAgo(req.updatedAt || req.createdAt)}`}
                    actions={<>
                        <Badge type="pending" />
                        <BtnOutline onClick={() => withdraw(req._id)}>Withdraw</BtnOutline>
                    </>}
                />
            ));
        }

        if (activeTab === "accepted") {
            if (!data.accepted.length) return <Empty msg="No connections yet" />;
            return data.accepted.map(item => {
                const user = item.user || item.receiver || item.sender;
                return (
                    <ProfileCard
                        key={item.connectionId || item._id}
                        user={user}
                        meta={`Connected ${timeAgo(item.connectedAt || item.updatedAt)}`}
                        actions={<BtnOutline gold onClick={() => { }}><FaEnvelope size={12} style={{ marginRight: 5 }} />Message</BtnOutline>}
                    />
                );
            });
        }

        if (activeTab === "rejected") {
            if (!data.rejected.length) return <Empty msg="No rejected requests" />;
            return data.rejected.map(req => (
                <ProfileCard
                    key={req._id}
                    user={req._displayUser}
                    meta={
                        req._type === "sent"
                            ? `You sent · declined ${timeAgo(req.updatedAt)}`
                            : `You declined · ${timeAgo(req.updatedAt)}`
                    }
                    actions={
                        <Badge type="rejected" />
                    }
                />
            ));
        }
    };

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-xl">
                <div style={{ borderBottom: "1px solid #3D1515", paddingBottom: 16, marginBottom: 20 }}>
                    <h2 style={{ color: "#C9A84C", fontSize: 13, letterSpacing: "0.2em", margin: "0 0 2px" }}>❋ CONNECTIONS</h2>
                    <h1 style={{ color: "#FFF5E6", fontSize: 22, fontWeight: 600, margin: 0 }}>Manage Interests</h1>
                </div>

                <div className="grid grid-cols-2 lg:flex lg:flex-row gap-3 mb-8">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                padding: "12px 16px", borderRadius: 12, fontSize: 13, cursor: "pointer",
                                background: activeTab === tab.key ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.02)",
                                color: activeTab === tab.key ? "#C9A84C" : "#8B6B52",
                                border: activeTab === tab.key ? "1px solid #C9A84C" : "1px solid #3D1515",
                                fontWeight: activeTab === tab.key ? 700 : 500,
                                transition: "all 0.2s",
                                width: "100%",
                            }}
                        >
                            <span style={{ opacity: activeTab === tab.key ? 1 : 0.7 }}>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.key === "received" && data.received.length > 0 && (
                                <span style={{ background: "#7B1C1C", color: "#FFF5E6", fontSize: 10, borderRadius: 20, padding: "1px 6px", marginLeft: 4 }}>
                                    {data.received.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="no-scrollbar" style={{ paddingBottom: 40 }}>
                    {renderTab()}
                </div>
            </div>
        </div>
    );
}

function Empty({ msg }) {
    return (
        <div style={{ textAlign: "center", padding: "100px 20px", color: "#6B5030" }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>❋</div>
            <p style={{ fontSize: 15, letterSpacing: "0.02em", fontWeight: 400 }}>{msg}</p>
        </div>
    );
}

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const now = Date.now();
    const diff = (now - date.getTime()) / 1000;

    // Debugging time drift
    if (Math.abs(diff) > 0 && Math.abs(diff) < 30) console.log("Time drift detected (seconds):", diff);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(Math.max(0, diff) / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}