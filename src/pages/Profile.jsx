// pages/Profile.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, updateUser } from "../redux/authSlice";
import { FaCamera, FaTimes, FaStar, FaSignOutAlt } from "react-icons/fa";

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

export default function Profile() {
    const [form, setForm]         = useState({});
    const [photos, setPhotos]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg]           = useState(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector(state => state.auth);
    const headers = { Authorization: `Bearer ${token}` };

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

    const handleLogout = () => {
        dispatch(logout());
        navigate("/");
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("photo", file);
        setUploading(true);
        setMsg(null);
        try {
            const res = await axios.post(`${API}/auth/photos`, formData, {
                headers: { ...headers, "Content-Type": "multipart/form-data" },
            });
            setPhotos(res.data.photos);
        } catch (err) {
            setMsg({ type: "error", text: "Photo upload failed" });
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleDelete = async (photoUrl) => {
        try {
            const res = await axios.delete(`${API}/auth/photos`, {
                headers,
                data: { photoUrl },
            });
            setPhotos(res.data.photos);
        } catch {
            setMsg({ type: "error", text: "Failed to delete photo" });
        }
    };

    const setAsProfile = async (photoUrl) => {
        const reordered = [photoUrl, ...photos.filter(p => p !== photoUrl)];
        try {
            const res = await axios.put(`${API}/auth/photos/reorder`,
                { photos: reordered },
                { headers }
            );
            setPhotos(res.data.photos);
        } catch {
            setMsg({ type: "error", text: "Failed to update profile photo" });
        }
    };

    return (
        <div className="flex justify-center no-scrollbar" style={{ height: "100%", overflowY: "auto" }}>
            <div className="w-full max-w-xl pb-10">
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
                        {/* ── Profile Avatar ── */}
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
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                {photos.map((url, index) => (
                                    <div key={url} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden" }}>
                                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        {index === 0 && (
                                            <div style={{ position: "absolute", top: 6, left: 6, background: "#C9A84C", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#1A0A0A", fontWeight: 700 }}>
                                                Profile
                                            </div>
                                        )}
                                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                            <button onClick={() => setAsProfile(url)} style={{ background: "#C9A84C", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>★</button>
                                            <button onClick={() => handleDelete(url)} style={{ background: "#7B1C1C", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "white", cursor: "pointer" }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                                {photos.length < 6 && (
                                    <label style={{ aspectRatio: "1", borderRadius: 12, border: "2px dashed #3D1515", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
                                        <FaCamera size={20} color="#3D1515" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* ── Form ── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {FIELDS.map(({ key, label, type, options }) => (
                                <div key={key}>
                                    <label style={{ color: "#8B6914", fontSize: 12, display: "block", marginBottom: 6 }}>{label}</label>
                                    {type === "select" ? (
                                        <select value={form[key] || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                            <option value="" disabled>Select {label}</option>
                                            {options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={type} value={form[key] || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {msg && (
                            <div style={{ marginTop: 20, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: msg.type === "success" ? "#7BC47B" : "#C46B6B", border: "1px solid #3D1515", fontSize: 13 }}>
                                {msg.text}
                            </div>
                        )}

                        <button onClick={handleSave} disabled={saving} style={{ marginTop: 24, width: "100%", padding: 14, background: "linear-gradient(90deg, #7B1C1C, #A0341E)", color: "white", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}