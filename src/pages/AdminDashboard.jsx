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
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ background: '#0D0404' }}>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C]">
          <FaUserShield size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#FFF5E6]">Admin Dashboard</h1>
          <p className="text-[#6B5030]">Manage your platform users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1F0A0A] p-6 rounded-2xl border border-[#3D1515] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#6B5030] font-medium uppercase text-xs tracking-widest">Total Users</h3>
            <FaUsers className="text-[#C9A84C]" />
          </div>
          <p className="text-4xl font-bold text-[#FFF5E6]">{users.length}</p>
        </div>
      </div>

      <div className="bg-[#1F0A0A] rounded-2xl border border-[#3D1515] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#3D1515] flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-semibold text-[#FFF5E6]">User List</h2>
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5030]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full bg-[#0D0404] border border-[#3D1515] rounded-xl py-2.5 pl-12 pr-4 text-white outline-none focus:border-[#C9A84C] transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
                          className="w-10 h-10 rounded-full object-cover border border-[#3D1515]"
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
      </div>
    </div>
  );
}
