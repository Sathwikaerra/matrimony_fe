// components/PhotoUpload.jsx
import { useState } from "react";
import axios from "axios";
import { FaCamera, FaTimes, FaStar } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export default function PhotoUpload({ photos, setPhotos }) {
    const [uploading, setUploading] = useState(false);

    // Upload new photo
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("photo", file);

        setUploading(true);
        try {
            const res = await axios.post(`${API}/auth/photos`, formData, {
                headers: { ...headers(), "Content-Type": "multipart/form-data" },
            });
            setPhotos(res.data.photos);
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    // Delete a photo
    const handleDelete = async (photoUrl) => {
        try {
            const res = await axios.delete(`${API}/auth/photos`, {
                headers: headers(),
                data: { photoUrl },
            });
            setPhotos(res.data.photos);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    // Set as profile pic — move to index 0
    const setAsProfile = async (photoUrl) => {
        const reordered = [
            photoUrl,
            ...photos.filter(p => p !== photoUrl)
        ];
        try {
            const res = await axios.put(`${API}/auth/photos/reorder`, { photos: reordered }, {
                headers: headers(),
            });
            setPhotos(res.data.photos);
        } catch (err) {
            console.error("Reorder failed:", err);
        }
    };

    return (
        <div style={{ marginBottom: 28 }}>
            <label style={{ color: "#8B6914", fontSize: 12, display: "block", marginBottom: 12, letterSpacing: "0.05em" }}>
                PHOTOS <span style={{ color: "#4A2A1A", fontWeight: 400 }}>· first photo is your profile picture</span>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>

                {/* Existing photos */}
                {photos.map((url, index) => (
                    <div key={url} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden" }}>
                        <img
                            src={url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />

                        {/* Profile badge on first photo */}
                        {index === 0 && (
                            <div style={{
                                position: "absolute", top: 6, left: 6,
                                background: "rgba(201,168,76,0.9)", borderRadius: 20,
                                padding: "2px 8px", fontSize: 10, color: "#1A0A0A", fontWeight: 700,
                                display: "flex", alignItems: "center", gap: 4
                            }}>
                                <FaStar size={8} /> Profile
                            </div>
                        )}

                        {/* Hover overlay */}
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            gap: 8, opacity: 0, transition: "opacity 0.2s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                            {index !== 0 && (
                                <button
                                    onClick={() => setAsProfile(url)}
                                    style={{
                                        background: "rgba(201,168,76,0.9)", border: "none",
                                        borderRadius: 8, padding: "5px 10px", fontSize: 11,
                                        color: "#1A0A0A", fontWeight: 600, cursor: "pointer"
                                    }}
                                >
                                    ★ Set Profile
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(url)}
                                style={{
                                    background: "rgba(123,28,28,0.9)", border: "none",
                                    borderRadius: 8, padding: "5px 10px", fontSize: 11,
                                    color: "#FFF5E6", cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 4
                                }}
                            >
                                <FaTimes size={10} /> Remove
                            </button>
                        </div>
                    </div>
                ))}

                {/* Upload slot */}
                {photos.length < 6 && (
                    <label style={{
                        aspectRatio: "1", borderRadius: 12,
                        border: "2px dashed #3D1515", display: "flex",
                        flexDirection: "column", alignItems: "center",
                        justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer",
                        gap: 8, color: "#4A2A1A", transition: "border-color 0.2s",
                    }}
                        onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = "#C9A84C")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#3D1515")}
                    >
                        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
                        {uploading ? (
                            <span style={{ color: "#C9A84C", fontSize: 12 }}>Uploading...</span>
                        ) : (
                            <>
                                <FaCamera size={22} />
                                <span style={{ fontSize: 11 }}>Add Photo</span>
                            </>
                        )}
                    </label>
                )}
            </div>
        </div>
    );
}