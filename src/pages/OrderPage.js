import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [furnitureOptions, setFurnitureOptions] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [showFurnitureFilter, setShowFurnitureFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFurnitureType, setSelectedFurnitureType] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.name === 'admin';
  const API_BASE = 'https://repaso-esdbf8asb6g7apdv.canadacentral-01.azurewebsites.net';

  const furnitureTypes = ['table', 'chair', 'couch'];
  const furnitureStyles = ['industrial', 'modern', 'rustic', 'classic'];

  const fetchAllOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch {
      setError('Error loading all orders');
    }
  };

  const fetchUserOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/by-user/${user.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch {
      setError('Error loading orders');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      setError('Error loading users');
    }
  };

  const fetchByFurnitureType = async (type) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/by-furniture-type?type=${type}`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      setError('Error filtering by furniture type');
      return [];
    }
  };

  const fetchFurnitureOptions = async () => {
    setLoading(true);
    try {
      const requests = furnitureTypes.flatMap(type =>
        furnitureTypes.map(style =>
          fetch(`${API_BASE}/api/${style}/${type}`)
            .then(res => res.json())
            .then(data => ({ ...data, style, type }))
            .catch(() => null)
        )
      );

      const results = await Promise.all(requests);
      setFurnitureOptions(results.filter(Boolean).flat());
    } catch {
      setError('Error loading furniture options');
    } finally {
      setLoading(false);
    }
  };

  const toggleFurnitureSelection = (furniture) => {
    setSelectedFurniture(prev => {
      const key = `${furniture.type}-${furniture.style}-${furniture.description}`;
      const current = prev[key];
      return {
        ...prev,
        [key]: current
          ? { ...current, quantity: current.quantity + 1 }
          : { ...furniture, quantity: 1 },
      };
    });
  };

  const changeQuantity = (key, delta) => {
    setSelectedFurniture(prev => {
      const updated = { ...prev };
      const item = updated[key];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        delete updated[key];
      } else {
        updated[key] = { ...item, quantity: newQty };
      }
      return updated;
    });
  };

  const handleCreateOrder = async () => {
    try {
      const furnitures = Object.values(selectedFurniture).flatMap(f =>
        Array.from({ length: f.quantity }, () => ({
          price: f.price,
          type: f.type,
          style: f.style,
          description: f.description,
          furnitureType: f.furnitureType || f.type
        }))
      );

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          user,
          date: new Date().toISOString(),
          furnitures
        })
      });

      if (!response.ok) throw new Error();
      const newOrder = await response.json();
      setOrders([...orders, newOrder]);
      setFilteredOrders([...filteredOrders, newOrder]);
      setIsModalOpen(false);
      setSelectedFurniture({});
    } catch {
      setError('Error creating order');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`, { method: 'DELETE' });
      if (res.status !== 204) throw new Error();
      setOrders(prev => prev.filter(o => o.id !== id));
      setFilteredOrders(prev => prev.filter(o => o.id !== id));
    } catch {
      setError('Error deleting order');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const applyFilters = async () => {
    try {
      setLoading(true);

      // Priority 1: User filter (admin only)
      if (isAdmin && selectedUserId) {
        const res = await fetch(`${API_BASE}/api/orders/by-user/${selectedUserId}`);
        const data = await res.json();
        setFilteredOrders(data);
      }
      // Priority 2: Furniture type filter
      else if (selectedFurnitureType) {
        const data = await fetchByFurnitureType(selectedFurnitureType);
        setFilteredOrders(data);
      }
      // Priority 3: Date filter
      else if (startDate || endDate) {
        const filtered = orders.filter(order => {
          const orderDate = new Date(order.date);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          if (end) end.setHours(23, 59, 59, 999);
          return (!start || orderDate >= start) && (!end || orderDate <= end);
        });
        setFilteredOrders(filtered);
      }
      // No filters
      else {
        setFilteredOrders(orders);
      }
    } catch (error) {
      setError('Error applying filters');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUserId('');
    setSelectedFurnitureType('');
    if (isAdmin) {
      fetchAllOrders();
    } else {
      fetchUserOrders();
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllOrders();
      fetchUsers();
    } else {
      fetchUserOrders();
    }
    fetchFurnitureOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [startDate, endDate, selectedUserId, selectedFurnitureType]);

  return (
    <div style={styles.container}>
      <div style={styles.mainCard}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>
            {isAdmin ? 'All Orders' : 'My Orders'}
            {isAdmin && selectedUserId && ` (User: ${users.find(u => u.id === selectedUserId)?.name || selectedUserId})`}
            {selectedFurnitureType && ` (Style: ${selectedFurnitureType})`}
          </h1>
          <div style={styles.buttonGroup}>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.controls}>
          <button onClick={() => setIsModalOpen(true)} style={styles.buttonCreate}>
            Create New Order
          </button>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            style={styles.filterButton}
          >
            {showDateFilter ? 'Hide Date Filter' : 'Filter by Date'}
          </button>
          <button
            onClick={() => setShowFurnitureFilter(!showFurnitureFilter)}
            style={styles.filterButton}
          >
            {showFurnitureFilter ? 'Hide Style Filter' : 'Filter by Style'}
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowUserFilter(!showUserFilter)}
              style={styles.filterButton}
            >
              {showUserFilter ? 'Hide User Filter' : 'Filter by User'}
            </button>
          )}
          {(showDateFilter || showUserFilter || showFurnitureFilter) && (
            <button onClick={clearFilters} style={styles.clearFilterButton}>
              Clear All Filters
            </button>
          )}
        </div>

        {showDateFilter && (
          <div style={styles.filterContainer}>
            <div style={styles.dateInputGroup}>
              <label style={styles.filterLabel}>From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.filterInput}
              />
            </div>
            <div style={styles.dateInputGroup}>
              <label style={styles.filterLabel}>To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.filterInput}
              />
            </div>
          </div>
        )}

        {showFurnitureFilter && (
          <div style={styles.filterContainer}>
            <div style={styles.dateInputGroup}>
              <label style={styles.filterLabel}>Furniture Style:</label>
              <select
                value={selectedFurnitureType}
                onChange={(e) => setSelectedFurnitureType(e.target.value)}
                style={styles.filterInput}
              >
                <option value="">All Styles</option>
                {furnitureTypes.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {showUserFilter && isAdmin && (
          <div style={styles.filterContainer}>
            <div style={styles.dateInputGroup}>
              <label style={styles.filterLabel}>User:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={styles.filterInput}
              >
                <option value="">All Users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} (ID: {u.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <p style={styles.loading}>Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p style={styles.noOrders}>No orders found.</p>
        ) : (
          <div style={styles.list}>
            {filteredOrders.map(order => (
              <div key={order.id} style={styles.card}>
                <h3 style={styles.orderTitle}>Order #{order.id}</h3>
                {isAdmin && (
                  <p style={styles.orderDetail}>
                    <strong>User:</strong> {order.user?.name || 'Unknown'} (ID: {order.userId})
                  </p>
                )}
                <p style={styles.orderDetail}><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                <p style={styles.orderDetail}><strong>Total Price:</strong> ${order.price?.toLocaleString?.() ?? 0}</p>
                <ul style={styles.furnitureList}>
                  {order.furnitures?.map((f, idx) => (
                    <li key={idx} style={styles.furnitureItem}>
                      🪑 <strong>{f.furnitureType}</strong> - {f.type} (Style: {f.style}) - ${f.price?.toLocaleString?.() ?? 0}
                      <br />
                      <span style={styles.furnitureDescription}>{f.description}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleDelete(order.id)} style={styles.buttonDelete}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <button style={styles.closeButton} onClick={() => { setIsModalOpen(false); setSelectedFurniture({}); }}>
                ×
              </button>
              <h2 style={styles.modalTitle}>Create New Order</h2>

              {loading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <div style={styles.furnitureGrid}>
                    {furnitureOptions.map((f, idx) => {
                      const key = `${f.type}-${f.style}-${f.description}`;
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleFurnitureSelection(f)}
                          style={{
                            ...styles.furnitureOption,
                            backgroundColor: selectedFurniture[key] ? '#e6f7ff' : '#fff',
                          }}
                        >
                          <h4 style={styles.furnitureType}>{f.type} - {f.style}</h4>
                          <p style={styles.furniturePrice}>${f.price.toLocaleString()}</p>
                          <p style={styles.furnitureDesc}>{f.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div style={styles.selectedSection}>
                    <h3 style={styles.selectedTitle}>Selected Items</h3>
                    {Object.entries(selectedFurniture).length === 0 ? (
                      <p style={styles.noItems}>No items selected</p>
                    ) : (
                      <>
                        {Object.entries(selectedFurniture).map(([key, item]) => (
                          <div key={key} style={styles.selectedItem}>
                            {item.type} - {item.style} | Qty: {item.quantity}
                            <button onClick={() => changeQuantity(key, -1)} style={styles.qtyButton}>-</button>
                            <button onClick={() => changeQuantity(key, 1)} style={styles.qtyButton}>+</button>
                          </div>
                        ))}
                        <p style={styles.totalPrice}>
                          <strong>Total:</strong> ${Object.values(selectedFurniture)
                            .reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()}
                        </p>
                        <button
                          onClick={handleCreateOrder}
                          disabled={Object.keys(selectedFurniture).length === 0}
                          style={styles.buttonConfirm}
                        >
                          Confirm Order
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    background: 'linear-gradient(to right, #667eea, #764ba2)',
    fontFamily: 'Arial, sans-serif',
    padding: '2rem 1rem',
  },
  mainCard: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '1200px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    color: '#333',
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    margin: '1rem 0',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  noOrders: {
    textAlign: 'center',
    color: '#666',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    margin: '2rem 0',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: '#f9f9f9',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
  },
  orderTitle: {
    color: '#333',
    marginBottom: '1rem',
    borderBottom: '1px solid #ddd',
    paddingBottom: '0.5rem',
  },
  orderDetail: {
    margin: '0.5rem 0',
    color: '#555',
  },
  furnitureList: {
    margin: '1rem 0',
    paddingLeft: '1.5rem',
  },
  furnitureItem: {
    marginBottom: '0.75rem',
    color: '#444',
  },
  furnitureDescription: {
    fontSize: '0.9em',
    color: '#666',
    display: 'inline-block',
    marginTop: '0.25rem',
  },
  buttonCreate: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#27ae60',
    },
  },
  filterButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  buttonDelete: {
    marginTop: '1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  filterContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '0.5rem',
  },
  dateInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  filterInput: {
    padding: '0.5rem',
    borderRadius: '0.25rem',
    border: '1px solid #ddd',
    minWidth: '200px',
  },
  clearFilterButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#7f8c8d',
    },
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    background: 'white',
    padding: '2rem',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '1rem',
    position: 'relative',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '1.5rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#666',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#333',
  },
  furnitureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  furnitureOption: {
    border: '1px solid #ddd',
    padding: '1rem',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
  },
  furnitureType: {
    color: '#333',
    marginBottom: '0.5rem',
  },
  furniturePrice: {
    color: '#2ecc71',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  furnitureDesc: {
    color: '#666',
    fontSize: '0.9em',
  },
  selectedSection: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #eee',
  },
  selectedTitle: {
    color: '#333',
    marginBottom: '1rem',
  },
  noItems: {
    color: '#666',
    textAlign: 'center',
  },
  selectedItem: {
    marginBottom: '0.75rem',
    padding: '0.5rem',
    background: '#f5f5f5',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyButton: {
    marginLeft: '0.5rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#5a67d8',
    },
  },
  totalPrice: {
    fontWeight: 'bold',
    fontSize: '1.1em',
    margin: '1rem 0',
    textAlign: 'right',
  },
  buttonConfirm: {
    marginTop: '1rem',
    backgroundColor: '#667eea',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
    '&:hover:not(:disabled)': {
      backgroundColor: '#5a67d8',
    },
  },
};

export default OrderPage;