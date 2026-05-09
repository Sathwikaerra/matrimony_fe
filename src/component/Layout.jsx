import { useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { FaBell, FaSignOutAlt } from "react-icons/fa";
import Navbar from "./Navbar";

export default function Layout({ children, fullScreen = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isHome = location.pathname === "/home";
  const isProfile = location.pathname === "/profile";
  const showMobileHeader = isHome || isProfile;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div style={{ background: "#0D0404", minHeight: "100vh", color: "#FFF5E6" }}>
      <Navbar />

      {/* Mobile Header (Home & Profile) */}
      {showMobileHeader && (
        <div
          className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3"
          style={{
            background: "rgba(13,4,4,0.96)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid #3D1515",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ color: "#E8C96D", fontSize: 18, fontWeight: 700, margin: 0 }}>❋ Vivaah</h1>
              <p style={{ color: "#8B6B52", fontSize: 10, margin: 0, letterSpacing: "0.15em" }}>SACRED BONDS</p>
            </div>
            {isHome && (
              <Link to="/connections" style={{ color: "#C9A84C", padding: 8 }}>
                <FaBell size={20} />
              </Link>
            )}
            {isProfile && (
              <button
                onClick={handleLogout}
                style={{ color: "#7B1C1C", padding: 8, background: "none", border: "none", cursor: "pointer" }}
              >
                <FaSignOutAlt size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:ml-[240px]">
        {fullScreen ? (
          <div className={`${showMobileHeader ? "pt-16" : "pt-0"} lg:pt-0 pb-20 lg:pb-0 h-screen overflow-hidden`}>
             {children}
          </div>
        ) : (
          <div className={`${showMobileHeader ? "pt-20" : "pt-6"} lg:pt-8 px-4 lg:px-8 pb-24 min-h-screen`}>
            <div className="w-full max-w-6xl mx-auto">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
