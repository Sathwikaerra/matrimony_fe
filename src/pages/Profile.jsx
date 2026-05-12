// pages/Profile.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, updateUser } from "../redux/authSlice";
import { FaCamera } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

const FIELDS = [
    { key: "name",          label: "Full Name",      type: "text"   },
    { key: "phoneNumber",   label: "Phone Number",   type: "tel"    },
    { key: "gender",        label: "Gender",         type: "select", options: ["Male", "Female", "Other"] },
    { key: "dateOfBirth",   label: "Date of Birth",  type: "date"   },
    { key: "religion",      label: "Religion",       type: "text"   },
    { key: "motherTongue",  label: "Mother Tongue",  type: "text"   },
    { key: "maritalStatus", label: "Marital Status", type: "select", options: ["Never Married", "Divorced", "Widowed"] },
    { key: "education",     label: "Education",      type: "text"   },
    { key: "occupation",    label: "Occupation",     type: "text"   },
    { key: "city",          label: "City",           type: "text"   },
    { key: "state",         label: "State",          type: "text"   },
];

const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "#1A0A0A", border: "1px solid #3D1515",
    borderRadius: 10, color: "#FFF5E6", fontSize: 14,
    outline: "none", boxSizing: "border-box",
};

// ── Spinner SVG ───────────────────────────────────────────────────────────────
function Spinner({ size = 36, trackColor = "#3D1515", arcColor = "#C9A84C", strokeWidth = 3 }) {
    const r = (size / 2) - strokeWidth;
    const circ = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={arcColor} strokeWidth={strokeWidth}
                strokeDasharray={`${circ * 0.3} ${circ * 0.7}`} strokeLinecap="round"
                style={{ transformOrigin: `${size / 2}px ${size / 2}px`, animation: "prof-spin 0.9s linear infinite" }}
            />
        </svg>
    );
}

export default function Profile() {
    const [form, setForm]           = useState({});
    const [photos, setPhotos]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg]             = useState(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector(state => state.auth);
    const headers   = { Authorization: `Bearer ${token}` };

    // ── Inject keyframes once ─────────────────────────────────────────────────
    useEffect(() => {
        const id = 'profile-upload-kf';
        if (document.getElementById(id)) return;
        const s = document.createElement('style');
        s.id = id;
        s.textContent = `
            @keyframes prof-spin {
                to { transform: rotate(360deg); }
            }
            @keyframes prof-shimmer {
                0%   { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            @keyframes prof-fadein {
                from { opacity: 0; transform: scale(0.92); }
                to   { opacity: 1; transform: scale(1); }
            }
            @keyframes prof-pulse-border {
                0%, 100% { border-color: #3D1515; }
                50%       { border-color: #C9A84C; }
            }
        `;
        document.head.appendChild(s);
        return () => document.getElementById(id)?.remove();
    }, []);

    // ── Load profile ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        axios.get(`${API}/auth/me`, { headers })
            .then(res => {
                const u = res.data.user || {};
                setPhotos(u.photos || []);
                setForm({
                    name:          u.name          || "",
                    phoneNumber:   u.phoneNumber   || "",
                    gender:        u.gender        || "",
                    dateOfBirth:   u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
                    religion:      u.religion      || "",
                    motherTongue:  u.motherTongue  || "",
                    maritalStatus: u.maritalStatus || "",
                    education:     u.education     || "",
                    occupation:    u.occupation    || "",
                    city:          u.city          || "",
                    state:         u.state         || "",
                });
            })
            .catch(() => setMsg({ type: "error", text: "Failed to load profile" }))
            .finally(() => setLoading(false));
    }, [token]);

    const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const res = await axios.put(`${API}/auth/me`, form, { headers });
            dispatch(updateUser(res.data.user));
            setMsg({ type: "success", text: "Profile updated successfully ✓" });
        } catch (err) {
            setMsg({ type: "error", text: err.response?.data?.message || "Update failed" });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => { dispatch(logout()); navigate("/"); };

    // ── Upload ────────────────────────────────────────────────────────────────
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || uploading) return;
        const formData = new FormData();
        formData.append("photo", file);
        setUploading(true);
        setMsg(null);
        try {
            const res = await axios.post(`${API}/auth/photos`, formData, {
                headers: { ...headers, "Content-Type": "multipart/form-data" },
            });
            setPhotos(res.data.photos);
        } catch {
            setMsg({ type: "error", text: "Photo upload failed" });
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (photoUrl) => {
        try {
            const res = await axios.delete(`${API}/auth/photos`, { headers, data: { photoUrl } });
            setPhotos(res.data.photos);
        } catch {
            setMsg({ type: "error", text: "Failed to delete photo" });
        }
    };

    // ── Set as profile photo ──────────────────────────────────────────────────
    const setAsProfile = async (photoUrl) => {
        const reordered = [photoUrl, ...photos.filter(p => p !== photoUrl)];
        try {
            const res = await axios.put(`${API}/auth/photos/reorder`, { photos: reordered }, { headers });
            setPhotos(res.data.photos);
        } catch {
            setMsg({ type: "error", text: "Failed to update profile photo" });
        }
    };

    return (
        <div className="flex justify-center no-scrollbar" style={{ height: "100%", overflowY: "auto" }}>
            <div className="w-full max-w-xl pb-10">

                {/* ── Header ── */}
                <div style={{ borderBottom: "1px solid #3D1515", paddingBottom: 16, marginBottom: 24 }}>
                    <h2 style={{ color: "#C9A84C", fontSize: 13, letterSpacing: "0.2em", margin: "0 0 2px" }}>❋ ACCOUNT</h2>
                    <h1 style={{ color: "#FFF5E6", fontSize: 22, fontWeight: 600, margin: 0 }}>Your Profile</h1>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", paddingTop: 60 }}>
                        <Spinner size={40} />
                        <p style={{ color: "#6B5030", marginTop: 14 }}>Loading profile...</p>
                    </div>
                ) : (
                    <>
                        {/* ── Profile Avatar ── */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                            <div style={{ position: "relative" }}>
                                {/* Animated ring when uploading */}
                                <div style={{
                                    padding: 3, borderRadius: "50%",
                                    background: uploading
                                        ? "conic-gradient(#C9A84C var(--p, 0%), #3D1515 0%)"
                                        : "linear-gradient(135deg, #C9A84C, #7B1C1C)",
                                    transition: "background 0.4s",
                                    animation: uploading ? "prof-spin 1.2s linear infinite" : "none",
                                }}>
                                    {photos[0] ? (
                                        <img
                                            src={photos[0]}
                                            alt="Profile"
                                            style={{
                                                width: 90, height: 90, borderRadius: "50%",
                                                objectFit: "cover", border: "3px solid #1A0A0A",
                                                display: "block",
                                                filter: uploading ? "brightness(0.35)" : "none",
                                                transition: "filter 0.4s",
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: 90, height: 90, borderRadius: "50%",
                                            background: "#1A0A0A", border: "3px solid #1A0A0A",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 32,
                                            color: uploading ? "#3D1515" : "#C9A84C",
                                            transition: "color 0.4s",
                                        }}>
                                            {form.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                </div>

                                {/* Spinner centered on avatar */}
                                {uploading && (
                                    <div style={{
                                        position: "absolute", inset: 3, borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        pointerEvents: "none",
                                    }}>
                                        <Spinner size={38} trackColor="#2A0808" arcColor="#C9A84C" strokeWidth={3} />
                                    </div>
                                )}

                                {/* Camera button */}
                                <label style={{
                                    position: "absolute", bottom: 2, right: 2,
                                    width: 30, height: 30, borderRadius: "50%",
                                    background: uploading ? "#2A0808" : "#C9A84C",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    border: "2px solid #0D0404",
                                    transition: "background 0.3s",
                                }}>
                                    {uploading
                                        ? <Spinner size={14} trackColor="#3D1515" arcColor="#C9A84C" strokeWidth={2} />
                                        : <FaCamera size={12} color="#1A0A0A" />
                                    }
                                    <input
                                        type="file" accept="image/*"
                                        onChange={handleUpload}
                                        style={{ display: "none" }}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* ── Photo Grid ── */}
                        <div style={{ marginBottom: 28 }}>
                            <label style={{ color: "#8B6914", fontSize: 12, display: "block", marginBottom: 10, letterSpacing: "0.05em" }}>
                                PHOTOS
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>

                                {/* Existing photos */}
                                {photos.map((url, index) => (
                                    <div
                                        key={url}
                                        style={{
                                            position: "relative", aspectRatio: "1",
                                            borderRadius: 12, overflow: "hidden",
                                            animation: "prof-fadein 0.35s ease both",
                                        }}
                                    >
                                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

                                        {index === 0 && (
                                            <div style={{
                                                position: "absolute", top: 6, left: 6,
                                                background: "#C9A84C", borderRadius: 20,
                                                padding: "2px 8px", fontSize: 10,
                                                color: "#1A0A0A", fontWeight: 700,
                                            }}>
                                                Profile
                                            </div>
                                        )}

                                        {/* Hover actions */}
                                        <div
                                            style={{
                                                position: "absolute", inset: 0,
                                                background: "rgba(0,0,0,0.55)",
                                                display: "flex", alignItems: "center",
                                                justifyContent: "center", gap: 6,
                                                opacity: 0, transition: "opacity 0.2s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                        >
                                            <button
                                                onClick={() => setAsProfile(url)}
                                                title="Set as profile"
                                                style={{ background: "#C9A84C", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
                                            >★</button>
                                            <button
                                                onClick={() => handleDelete(url)}
                                                title="Delete"
                                                style={{ background: "#7B1C1C", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "white", cursor: "pointer" }}
                                            >✕</button>
                                        </div>
                                    </div>
                                ))}

                                {/* Shimmer tile while uploading */}
                                {uploading && (
                                    <div style={{
                                        aspectRatio: "1", borderRadius: 12,
                                        overflow: "hidden", position: "relative",
                                        background: "#1A0A0A",
                                        border: "1.5px solid #3D1515",
                                        animation: "prof-pulse-border 1.2s ease-in-out infinite",
                                    }}>
                                        {/* Shimmer sweep */}
                                        <div style={{
                                            position: "absolute", inset: 0,
                                            background: "linear-gradient(90deg, #1A0A0A 25%, #2E1010 50%, #1A0A0A 75%)",
                                            backgroundSize: "200% 100%",
                                            animation: "prof-shimmer 1.4s ease-in-out infinite",
                                        }} />
                                        {/* Centered spinner + label */}
                                        <div style={{
                                            position: "absolute", inset: 0,
                                            display: "flex", flexDirection: "column",
                                            alignItems: "center", justifyContent: "center", gap: 8,
                                        }}>
                                            <Spinner size={30} trackColor="#2A0808" arcColor="#C9A84C" strokeWidth={2.5} />
                                            <span style={{ fontSize: 9, color: "#6B5030", letterSpacing: "0.12em", fontWeight: 600 }}>
                                                UPLOADING
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Add photo slot — hidden while uploading */}
                                {photos.length < 6 && !uploading && (
                                    <label style={{
                                        aspectRatio: "1", borderRadius: 12,
                                        border: "2px dashed #3D1515",
                                        display: "flex", alignItems: "center",
                                        justifyContent: "center", cursor: "pointer",
                                        transition: "border-color 0.2s",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "#C9A84C"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "#3D1515"}
                                    >
                                        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
                                        <FaCamera size={20} color="#3D1515" />
                                    </label>
                                )}
                            </div>

                            {/* Upload status text below grid */}
                            <div style={{
                                height: 20, marginTop: 8,
                                display: "flex", alignItems: "center", gap: 6,
                                opacity: uploading ? 1 : 0,
                                transition: "opacity 0.3s",
                            }}>
                                <Spinner size={12} trackColor="#3D1515" arcColor="#C9A84C" strokeWidth={2} />
                                <span style={{ fontSize: 11, color: "#6B5030", letterSpacing: "0.06em" }}>
                                    Uploading photo...
                                </span>
                            </div>
                        </div>

                        {/* ── Form Fields ── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {FIELDS.map(({ key, label, type, options }) => (
                                <div key={key}>
                                    <label style={{ color: "#8B6914", fontSize: 12, display: "block", marginBottom: 6 }}>{label}</label>
                                    {type === "select" ? (
                                        <select
                                            value={form[key] || ""}
                                            onChange={e => handleChange(key, e.target.value)}
                                            style={inputStyle}
                                        >
                                            <option value="" disabled>Select {label}</option>
                                            {options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={type}
                                            value={form[key] || ""}
                                            onChange={e => handleChange(key, e.target.value)}
                                            style={inputStyle}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Status message ── */}
                        {msg && (
                            <div style={{
                                marginTop: 20, padding: 12, borderRadius: 10,
                                background: "rgba(255,255,255,0.04)",
                                color: msg.type === "success" ? "#7BC47B" : "#C46B6B",
                                border: "1px solid #3D1515", fontSize: 13,
                                animation: "prof-fadein 0.25s ease both",
                            }}>
                                {msg.text}
                            </div>
                        )}

                        {/* ── Save button ── */}
                        <button
                            onClick={handleSave}
                            disabled={saving || uploading}
                            style={{
                                marginTop: 24, width: "100%", padding: 14,
                                background: saving || uploading
                                    ? "#3D1515"
                                    : "linear-gradient(90deg, #7B1C1C, #A0341E)",
                                color: saving || uploading ? "#6B5030" : "white",
                                borderRadius: 12, fontWeight: 600,
                                cursor: saving || uploading ? "not-allowed" : "pointer",
                                border: "none", fontSize: 15,
                                transition: "background 0.3s, color 0.3s",
                                display: "flex", alignItems: "center",
                                justifyContent: "center", gap: 10,
                            }}
                        >
                            {saving && <Spinner size={16} trackColor="#5A1515" arcColor="#C9A84C" strokeWidth={2} />}
                            {saving ? "Saving..." : uploading ? "Waiting for upload..." : "Save Changes"}
                        </button>

                        {/* ── Logout ── */}
                        <button
                            onClick={handleLogout}
                            style={{
                                marginTop: 12, width: "100%", padding: 12,
                                background: "transparent", color: "#6B5030",
                                border: "1px solid #3D1515", borderRadius: 12,
                                fontWeight: 500, cursor: "pointer", fontSize: 14,
                                transition: "color 0.2s, border-color 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#C46B6B"; e.currentTarget.style.borderColor = "#7B1C1C"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#6B5030"; e.currentTarget.style.borderColor = "#3D1515"; }}
                        >
                            Sign Out
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}