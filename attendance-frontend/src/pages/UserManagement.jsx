import { useState, useEffect } from "react";
import api from "../Services/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    name: "", email: "", phone: "", city: "", reportingManager: "", role: "tl", password: "" 
  });

  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      setError("Failed to load users");
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const filtered = users.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) || 
      u.role?.toLowerCase().includes(q)
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const handleSubmit = async (e) => {
    // ... logic stays same
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post("/users", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", phone: "", city: "", reportingManager: "", role: "tl", password: "" });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      city: user.city, 
      reportingManager: user.reportingManager, 
      role: user.role,
      password: "" 
    });
    setShowModal(true);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>User Management</h1>
          <p style={s.subtitle}>Total users whitelist: {users.length}</p>
        </div>
        <div style={s.headActions}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>🔍</span>
            <input 
              style={s.searchInput} 
              placeholder="Search users..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>
          <button style={s.addBtn} onClick={() => { setEditingUser(null); setFormData({ name: "", email: "", phone: "", city: "", reportingManager: "", role: "tl", password: "" }); setShowModal(true); }}>
            + Add New User
          </button>
        </div>
      </div>

      <div style={s.tableCard}>
        {loading ? <p style={s.loading}>Loading users...</p> : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>User Info</th>
                <th style={s.th}>Phone</th>
                <th style={s.th}>City</th>
                <th style={s.th}>Role</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={s.emptyCell}>
                    <p style={s.emptyTxt}>No users found matching "{search}"</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.userInfo}>
                        <div style={s.avatar}>{user.name?.charAt(0)}</div>
                        <div style={s.userDetails}>
                          <div style={s.userName}>{user.name}</div>
                          <div style={s.userEmail}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.phone}>{user.phone}</span></td>
                    <td style={s.td}><span style={s.cityBadge}>{user.city}</span></td>
                    <td style={s.td}>
                      <span style={{ ...s.roleBadge, background: user.role === "admin" ? "#fef3c7" : "#e8f5e9", color: user.role === "admin" ? "#92400e" : "#2e7d32" }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.editBtn} onClick={() => openEdit(user)}>Edit</button>
                        <button style={s.deleteBtn} onClick={() => handleDelete(user._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>{editingUser ? "Edit User" : "Add User"}</h2>
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.inputRow}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Full Name</label>
                  <input style={s.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Role</label>
                  <select style={s.input} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="tl">Team Leader (TL)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              {!editingUser && (
                <div style={s.inputGroup}>
                  <label style={s.label}>Initial Password</label>
                  <input style={s.input} type="password" placeholder="Defaults to flipkart123" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
              )}
              <div style={s.inputRow}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Phone Number</label>
                  <input style={s.input} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>City</label>
                  <select style={s.input} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required>
                    <option value="">Select City</option>
                    <option value="NCR">NCR</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Reporting Manager</label>
                <input style={s.input} value={formData.reportingManager} onChange={e => setFormData({ ...formData, reportingManager: e.target.value })} />
              </div>
              
              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={s.submitBtn}>Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: { padding: "28px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  headActions: { display: "flex", gap: "16px", alignItems: "center" },
  searchWrap: { position: "relative", display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: "10px", padding: "0 12px", width: "280px" },
  searchIcon: { marginRight: "8px", fontSize: "14px", opacity: 0.5 },
  searchInput: { border: "none", padding: "10px 0", fontSize: "14px", outline: "none", width: "100%", background: "transparent" },
  clearBtn: { background: "none", border: "none", padding: "4px", fontSize: "12px", color: "#aaa", cursor: "pointer" },
  title: { fontSize: "24px", fontWeight: 700, color: "#212121", marginBottom: "4px" },
  subtitle: { fontSize: "14px", color: "#878787" },
  addBtn: { background: "#2874F0", color: "#fff", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" },
  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "16px 20px", textAlign: "left", fontSize: "12px", color: "#878787", textTransform: "uppercase", background: "#fbfbfb", borderBottom: "1px solid #f0f0f0" },
  td: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5", fontSize: "14px" },
  emptyCell: { padding: "40px", textAlign: "center" },
  emptyTxt: { color: "#878787", fontSize: "14px" },
  userInfo: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#e8f0fe", color: "#2874F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" },
  userName: { fontWeight: 600, color: "#212121" },
  userEmail: { fontSize: "12px", color: "#878787" },
  phone: { color: "#555" },
  cityBadge: { background: "#f0f0f0", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500 },
  roleBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" },
  actions: { display: "flex", gap: "10px" },
  editBtn: { background: "#e8f0fe", color: "#2874F0", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 },
  deleteBtn: { background: "#fdecea", color: "#c62828", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 },
  loading: { padding: "40px", textAlign: "center", color: "#878787" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal: { background: "#fff", width: "500px", borderRadius: "16px", padding: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#212121" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
  inputRow: { display: "flex", gap: "16px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#555" },
  input: { padding: "10px 14px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#fff" },
  modalActions: { display: "flex", gap: "12px", marginTop: "12px" },
  cancelBtn: { flex: 1, padding: "12px", background: "#f5f5f5", color: "#555", borderRadius: "8px", fontWeight: 600 },
  submitBtn: { flex: 1, padding: "12px", background: "#2874F0", color: "#fff", borderRadius: "8px", fontWeight: 600 },
};

export default UserManagement;
