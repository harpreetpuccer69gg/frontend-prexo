import { useState, useEffect } from "react";
import api from "../Services/api";

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({ name: "", latitude: "", longitude: "" });

  const [search, setSearch] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);

  const token = localStorage.getItem("token");

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await api.get("/stores", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(res.data);
      setFilteredStores(res.data);
    } catch (err) {
      setError("Failed to load stores");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const filtered = stores.filter(s => s.name?.toLowerCase().includes(q));
    setFilteredStores(filtered);
  }, [search, stores]);

  const handleSubmit = async (e) => {
    // ... logic remains same
    e.preventDefault();
    try {
      if (editingStore) {
        await api.put(`/stores/${editingStore._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post("/stores/create", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setEditingStore(null);
      setFormData({ name: "", latitude: "", longitude: "" });
      fetchStores();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store?")) return;
    try {
      await api.delete(`/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStores();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const openEdit = (store) => {
    setEditingStore(store);
    setFormData({ name: store.name, latitude: store.latitude, longitude: store.longitude });
    setShowModal(true);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Store Management</h1>
          <p style={s.subtitle}>Total stores: {stores.length}</p>
        </div>
        <div style={s.headActions}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>🔍</span>
            <input 
              style={s.searchInput} 
              placeholder="Search stores..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>
          <button style={s.addBtn} onClick={() => { setEditingStore(null); setFormData({ name: "", latitude: "", longitude: "" }); setShowModal(true); }}>
            + Add New Store
          </button>
        </div>
      </div>

      <div style={s.tableCard}>
        {loading ? <p style={s.loading}>Loading stores...</p> : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Store Name</th>
                <th style={s.th}>Latitude</th>
                <th style={s.th}>Longitude</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={4} style={s.emptyCell}>
                    <p style={s.emptyTxt}>No stores found matching "{search}"</p>
                  </td>
                </tr>
              ) : (
                filteredStores.map(store => (
                  <tr key={store._id} style={s.tr}>
                    <td style={s.td}><div style={s.storeName}>{store.name}</div></td>
                    <td style={s.td}><span style={s.coord}>{store.latitude}</span></td>
                    <td style={s.td}><span style={s.coord}>{store.longitude}</span></td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.editBtn} onClick={() => openEdit(store)}>Edit</button>
                        <button style={s.deleteBtn} onClick={() => handleDelete(store._id)}>Delete</button>
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
            <h2 style={s.modalTitle}>{editingStore ? "Edit Store" : "Add Store"}</h2>
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.inputGroup}>
                <label style={s.label}>Store Name</label>
                <input style={s.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div style={s.inputRow}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Latitude</label>
                  <input style={s.input} type="number" step="any" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} required />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Longitude</label>
                  <input style={s.input} type="number" step="any" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} required />
                </div>
              </div>
              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={s.submitBtn}>Save Store</button>
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
  searchWrap: { position: "relative", display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: "10px", padding: "0 12px", width: "240px" },
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
  storeName: { fontWeight: 600, color: "#212121" },
  coord: { fontFamily: "monospace", color: "#555" },
  actions: { display: "flex", gap: "10px" },
  editBtn: { background: "#e8f0fe", color: "#2874F0", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 },
  deleteBtn: { background: "#fdecea", color: "#c62828", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 },
  loading: { padding: "40px", textAlign: "center", color: "#878787" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal: { background: "#fff", width: "400px", borderRadius: "16px", padding: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#212121" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
  inputRow: { display: "flex", gap: "16px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#555" },
  input: { padding: "10px 14px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "14px" },
  modalActions: { display: "flex", gap: "12px", marginTop: "12px" },
  cancelBtn: { flex: 1, padding: "12px", background: "#f5f5f5", color: "#555", borderRadius: "8px", fontWeight: 600 },
  submitBtn: { flex: 1, padding: "12px", background: "#2874F0", color: "#fff", borderRadius: "8px", fontWeight: 600 },
};

export default StoreManagement;
