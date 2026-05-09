import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Navbar from "../component/Navbar";
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

    // ── Fetch all tabs ──────────────────────────────
   // Replace fetchAll
const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
        const [pendingRes, sentRes, myRes, declinedRes] = await Promise.all([
            axios.get(`${API}/api/connections/pending`,  { headers: headers() }),
            axios.get(`${API}/api/connections/sent`,     { headers: headers() }),
            axios.get(`${API}/api/connections/my`,       { headers: headers() }),
            axios.get(`${API}/api/connections/declined`, { headers: headers() }),  // ← new
        ]);

        const sentList     = sentRes.data.requests     || [];
        const declinedList = declinedRes.data.requests || [];

        setData({
            received: pendingRes.data.requests || [],
            sent:     sentList.filter(r => r.status === "pending"),
            accepted: [
                ...(myRes.data.connections || []),
                ...sentList.filter(r => r.status === "accepted"),
            ],
            rejected: [
                // Requests YOU sent that were rejected by receiver
                ...sentList.filter(r => r.status === "rejected").map(r => ({
                    ...r,
                    _displayUser: r.receiver,   // ← the person who rejected you
                    _type: "sent"
                })),
                // Requests YOU received and declined
                ...declinedList.map(r => ({
                    ...r,
                    _displayUser: r.sender,     // ← the person you declined
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

    // ── Actions ─────────────────────────────────────
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

    // ── Card Components ──────────────────────────────
    const ProfileCard = ({ user, meta, actions }) => (
        <div style={{
            background: "#150707", border: "1px solid #3D1515", borderRadius: 14,
            padding: "14px 16px", display: "flex", alignItems: "center",
            gap: 14, marginBottom: 12
        }}>
            <div style={{ padding: 2, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#7B1C1C)", flexShrink: 0 }}>
                <img
                    src={user.photos?.[0] || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                    alt={user.name}
                    style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #150707", display: "block" }}
                />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#FFF5E6", fontWeight: 600, fontSize: 14, margin: "0 0 2px" }}>{user.name}</p>
                <p style={{ color: "#8B6914", fontSize: 12, margin: "0 0 4px" }}>
                    {user.city ? `📍 ${user.city}` : ""}{user.occupation ? ` · ${user.occupation}` : ""}
                </p>
                {meta && <p style={{ color: "#4A2A1A", fontSize: 11, margin: 0 }}>{meta}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {actions}
            </div>
        </div>
    );

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

    // ── Tab Content ──────────────────────────────────
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
                    meta={`Sent ${timeAgo(req.createdAt)}`}
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
                    meta={`Sent ${timeAgo(req.createdAt)}`}
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

       // Replace the rejected renderTab block
if (activeTab === "rejected") {
    if (!data.rejected.length) return <Empty msg="No rejected requests" />;
    return data.rejected.map(req => (
        <ProfileCard
            key={req._id}
            user={req._displayUser}   // ← works for both cases now
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
        <div style={{ background: "#0D0404", minHeight: "100vh", color: "#FFF5E6" }}>
            <Navbar />
            <div className="lg:ml-[240px] flex justify-center">
                <div className="w-full max-w-xl pt-20 lg:pt-8 px-4 pb-20">

                    {/* Header */}
                    <div style={{ borderBottom: "1px solid #3D1515", paddingBottom: 16, marginBottom: 20 }}>
                        <h2 style={{ color: "#C9A84C", fontSize: 13, letterSpacing: "0.2em", margin: "0 0 2px" }}>❋ CONNECTIONS</h2>
                        <h1 style={{ color: "#FFF5E6", fontSize: 22, fontWeight: 600, margin: 0 }}>Manage Interests</h1>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "8px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                                    background: activeTab === tab.key ? "rgba(201,168,76,0.1)" : "transparent",
                                    color: activeTab === tab.key ? "#C9A84C" : "#6B5030",
                                    border: activeTab === tab.key ? "1px solid #C9A84C44" : "1px solid #3D1515",
                                    fontWeight: activeTab === tab.key ? 600 : 400,
                                }}
                            >
                                {tab.icon} {tab.label}
                                {tab.key === "received" && data.received.length > 0 && (
                                    <span style={{ background: "#7B1C1C", color: "#FFF5E6", fontSize: 10, borderRadius: 20, padding: "1px 6px" }}>
                                        {data.received.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {renderTab()}
                </div>
            </div>
        </div>
    );
}

function Empty({ msg }) {
    return (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#4A2A1A" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>❋</div>
            <p style={{ fontSize: 14 }}>{msg}</p>
        </div>
    );
}

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}