import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FaUserShield, FaUsers, FaSearch, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

export default function AdminDashboard() {
  const { token, user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data.users || []);
      } catch (err) {
        console.error('Failed to fetch users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full text-[#C9A84C]">
        <h1 className="text-2xl font-bold">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen" style={{ background: '#0D0404' }}>

      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] shrink-0">
          <FaUserShield size={24} className="sm:hidden" />
          <FaUserShield size={32} className="hidden sm:block" />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-[#FFF5E6]">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#6B5030]">Manage your platform users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-[#1F0A0A] p-5 sm:p-6 rounded-2xl border border-[#3D1515] shadow-xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-[#6B5030] font-medium uppercase text-[10px] sm:text-xs tracking-widest">Total Users</h3>
            <FaUsers className="text-[#C9A84C]" />
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-[#FFF5E6]">{users.length}</p>
        </div>
      </div>

      {/* User List Card */}
      <div className="bg-[#1F0A0A] rounded-2xl border border-[#3D1515] overflow-hidden shadow-2xl">

        {/* Card Header */}
        <div className="p-4 sm:p-6 border-b border-[#3D1515] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-[#FFF5E6] shrink-0">User List</h2>
          <div className="relative w-full sm:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5030]" size={12} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full bg-[#0D0404] border border-[#3D1515] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#6B5030]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table — hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#170808] text-[#6B5030] uppercase text-[11px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D1515]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#6B5030]">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#6B5030]">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id}`}
                          className="w-10 h-10 rounded-full object-cover border border-[#3D1515] shrink-0"
                          alt=""
                        />
                        <div>
                          <p className="font-medium text-[#FFF5E6] group-hover:text-[#C9A84C] transition-colors">{u.name}</p>
                          <p className="text-[11px] text-[#6B5030] uppercase tracking-wider">{u.gender || 'Not specified'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-[#FFF5E6]/80">
                          <FaEnvelope size={10} className="text-[#C9A84C]" />
                          {u.email}
                        </div>
                        {u.phoneNumber && (
                          <p className="text-[10px] text-[#6B5030]">{u.phoneNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-[#FFF5E6]/80">
                        <FaMapMarkerAlt size={10} className="text-[#C9A84C]" />
                        {u.city ? `${u.city}, ${u.state}` : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        u.role === 'admin' ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#6B5030]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List — visible only on mobile */}
        <div className="md:hidden divide-y divide-[#3D1515]">
          {loading ? (
            <p className="py-12 text-center text-[#6B5030] text-sm">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-12 text-center text-[#6B5030] text-sm">No users found</p>
          ) : (
            filteredUsers.map((u) => (
              <div key={u._id} className="p-4 flex gap-3 hover:bg-white/5 transition-colors">

                {/* Avatar */}
                <img
                  src={u.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id}`}
                  className="w-11 h-11 rounded-full object-cover border border-[#3D1515] shrink-0 mt-0.5"
                  alt=""
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-[#FFF5E6] truncate text-sm">{u.name}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#FFF5E6]/70 mb-1">
                    <FaEnvelope size={9} className="text-[#C9A84C] shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#FFF5E6]/60">
                      <FaMapMarkerAlt size={9} className="text-[#C9A84C] shrink-0" />
                      <span>{u.city ? `${u.city}, ${u.state}` : 'Unknown'}</span>
                    </div>
                    <span className="text-[10px] text-[#6B5030] shrink-0">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {u.gender && (
                    <p className="text-[10px] text-[#6B5030] uppercase tracking-wider mt-1">{u.gender}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}