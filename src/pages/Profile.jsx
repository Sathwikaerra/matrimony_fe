// pages/Profile.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../component/Navbar";
import { FaCamera, FaTimes, FaStar } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

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

export default function Profile() {
    const [form, setForm]         = useState({});
    const [photos, setPhotos]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg]           = useState(null);

    // ── Fetch profile ──────────────────────────────
    useEffect(() => {
        axios.get(`${API}/auth/me`, { headers: headers() })
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
    }, []);

    const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // ── Save profile details ───────────────────────
    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const res = await axios.put(`${API}/auth/me`, form, { headers: headers() });
            localStorage.setItem("userName", res.data.user.name);
            setMsg({ type: "success", text: "Profile updated successfully ✓" });
        } catch (err) {
            setMsg({ type: "error", text: err.response?.data?.message || "Update failed" });
        } finally {
            setSaving(false);
        }
    };

    // ── Upload photo ───────────────────────────────
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("photo", file);
        setUploading(true);
        setMsg(null);
        try {
            const res = await axios.post(`${API}/auth/photos`, formData, {
                headers: { ...headers(), "Content-Type": "multipart/form-data" },
            });
            setPhotos(res.data.photos);
        } catch (err) {
            setMsg({ type: "error", text: "Photo upload failed" });
        } finally {
            setUploading(false);
            e.target.value = "";   // reset input so same file can be re-uploaded
        }
    };

    // ── Delete photo ───────────────────────────────
    const handleDelete = async (photoUrl) => {
        try {
            const res = await axios.delete(`${API}/auth/photos`, {
                headers: headers(),
                data: { photoUrl },
            });
            setPhotos(res.data.photos);
        } catch {
            setMsg({ type: "error", text: "Failed to delete photo" });
        }
    };

    // ── Set as profile pic (move to index 0) ──────
    const setAsProfile = async (photoUrl) => {
        const reordered = [photoUrl, ...photos.filter(p => p !== photoUrl)];
        try {
            const res = await axios.put(`${API}/auth/photos/reorder`,
                { photos: reordered },
                { headers: headers() }
            );
            setPhotos(res.data.photos);
        } catch {
            setMsg({ type: "error", text: "Failed to update profile photo" });
        }
    };

    return (
        <div style={{ background: "#0D0404", minHeight: "100vh", color: "#FFF5E6" }}>
            <Navbar />

            <div className="lg:ml-[240px] flex justify-center">
                <div className="w-full max-w-xl pt-20 lg:pt-8 px-4 pb-24">

                    {/* Header */}
                    <div style={{ borderBottom: "1px solid #3D1515", paddingBottom: 16, marginBottom: 24 }}>
                        <h2 style={{ color: "#C9A84C", fontSize: 13, letterSpacing: "0.2em", margin: "0 0 2px" }}>❋ ACCOUNT</h2>
                        <h1 style={{ color: "#FFF5E6", fontSize: 22, fontWeight: 600, margin: 0 }}>Your Profile</h1>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", paddingTop: 60 }}>
                            <div style={{ color: "#C9A84C", fontSize: 28, marginBottom: 12 }}>❋</div>
                            <p style={{ color: "#6B5030" }}>Loading profile...</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Profile Avatar (first photo) ── */}
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                                <div style={{ position: "relative" }}>
                                    <div style={{ padding: 3, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7B1C1C)" }}>
                                        {photos[0] ? (
                                            <img
                                                src={photos[0]}
                                                alt="Profile"
                                                style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid #1A0A0A", display: "block" }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 90, height: 90, borderRadius: "50%",
                                                background: "#1A0A0A", display: "flex",
                                                alignItems: "center", justifyContent: "center",
                                                fontSize: 32, color: "#C9A84C", border: "3px solid #1A0A0A"
                                            }}>
                                                {form.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick upload trigger on avatar */}
                                    <label style={{
                                        position: "absolute", bottom: 2, right: 2,
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: "#C9A84C", display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        cursor: "pointer", border: "2px solid #0D0404"
                                    }}>
                                        <FaCamera size={12} color="#1A0A0A" />
                                        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
                                    </label>
                                </div>
                            </div>

                            {/* ── Photo Grid ── */}
                            <div style={{ marginBottom: 28 }}>
                                <label style={{ color: "#8B6914", fontSize: 12, display: "block", marginBottom: 10, letterSpacing: "0.05em" }}>
                                    PHOTOS
                                    <span style={{ color: "#4A2A1A", fontWeight: 400, marginLeft: 6 }}>
                                        · tap ★ to set as profile picture
                                    </span>
                                </label>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>

                                    {/* Existing photos */}
                                    {photos.map((url, index) => (
                                        <div
                                            key={url}
                                            className="group"
                                            style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden" }}
                                        >
                                            <img
                                                src={url}
                                                alt=""
                                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                            />

                                            {/* Profile badge */}
                                            {index === 0 && (
                                                <div style={{
                                                    position: "absolute", top: 6, left: 6,
                                                    background: "rgba(201,168,76,0.92)", borderRadius: 20,
                                                    padding: "2px 8px", fontSize: 10,
                                                    color: "#1A0A0A", fontWeight: 700,
                                                    display: "flex", alignItems: "center", gap: 4
                                                }}>
                                                    <FaStar size={8} /> Profile
                                                </div>
                                            )}

                                            {/* Overlay actions */}
                                            <div style={{
                                                position: "absolute", inset: 0,
                                                background: "rgba(0,0,0,0.55)",
                                                display: "flex", flexDirection: "column",
                                                alignItems: "center", justifyContent: "center",
                                                gap: 6, opacity: 0, transition: "opacity 0.2s",
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                            >
                                                {index !== 0 && (
                                                    <button
                                                        onClick={() => setAsProfile(url)}
                                                        style={{
                                                            background: "rgba(201,168,76,0.92)",
                                                            border: "none", borderRadius: 8,
                                                            padding: "5px 10px", fontSize: 11,
                                                            color: "#1A0A0A", fontWeight: 700, cursor: "pointer",
                                                            display: "flex", alignItems: "center", gap: 4
                                                        }}
                                                    >
                                                        <FaStar size={9} /> Set Profile
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(url)}
                                                    style={{
                                                        background: "rgba(123,28,28,0.92)",
                                                        border: "none", borderRadius: 8,
                                                        padding: "5px 10px", fontSize: 11,
                                                        color: "#FFF5E6", cursor: "pointer",
                                                        display: "flex", alignItems: "center", gap: 4
                                                    }}
                                                >
                                                    <FaTimes size={9} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Upload slot (max 6 photos) */}
                                    {photos.length < 6 && (
                                        <label style={{
                                            aspectRatio: "1", borderRadius: 12,
                                            border: `2px dashed ${uploading ? "#C9A84C" : "#3D1515"}`,
                                            display: "flex", flexDirection: "column",
                                            alignItems: "center", justifyContent: "center",
                                            cursor: uploading ? "not-allowed" : "pointer",
                                            gap: 8, color: uploading ? "#C9A84C" : "#4A2A1A",
                                            transition: "all 0.2s",
                                        }}
                                            onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; } }}
                                            onMouseLeave={e => { if (!uploading) { e.currentTarget.style.borderColor = "#3D1515"; e.currentTarget.style.color = "#4A2A1A"; } }}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleUpload}
                                                style={{ display: "none" }}
                                                disabled={uploading}
                                            />
                                            {uploading ? (
                                                <>
                                                    <div style={{ fontSize: 20 }}>⏳</div>
                                                    <span style={{ fontSize: 11 }}>Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaCamera size={22} />
                                                    <span style={{ fontSize: 11 }}>Add Photo</span>
                                                    <span style={{ fontSize: 10, color: "#3D1515" }}>{photos.length}/6</span>
                                                </>
                                            )}
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* ── Profile Form ── */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {FIELDS.map(({ key, label, type, options }) => (
                                    <div key={key}>
                                        <label style={{ color: "#8B6914", fontSize: 12, display: "block", marginBottom: 6, letterSpacing: "0.05em" }}>
                                            {label.toUpperCase()}
                                        </label>

                                        {type === "select" ? (
                                            <select
                                                value={form[key] || ""}
                                                onChange={e => handleChange(key, e.target.value)}
                                                style={{ ...inputStyle, appearance: "none" }}
                                            >
                                                <option value="" disabled>Select {label}</option>
                                                {options.map(o => (
                                                    <option key={o} value={o} style={{ background: "#1A0A0A" }}>{o}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={type}
                                                value={form[key] || ""}
                                                onChange={e => handleChange(key, e.target.value)}
                                                placeholder={label}
                                                style={inputStyle}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Feedback */}
                            {msg && (
                                <div style={{
                                    marginTop: 20, padding: "10px 14px", borderRadius: 10,
                                    background: msg.type === "success" ? "rgba(60,120,60,0.15)" : "rgba(123,28,28,0.2)",
                                    color: msg.type === "success" ? "#7BC47B" : "#C46B6B",
                                    border: `1px solid ${msg.type === "success" ? "#3D6B3D" : "#7B1C1C"}`,
                                    fontSize: 13,
                                }}>
                                    {msg.text}
                                </div>
                            )}

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    marginTop: 24, width: "100%", padding: "13px 0",
                                    background: saving ? "rgba(201,168,76,0.1)" : "linear-gradient(90deg, #7B1C1C, #A0341E)",
                                    color: saving ? "#C9A84C" : "#FFF5E6",
                                    border: saving ? "1px solid #C9A84C44" : "none",
                                    borderRadius: 12, fontSize: 15, fontWeight: 600,
                                    cursor: saving ? "not-allowed" : "pointer"
                                }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}