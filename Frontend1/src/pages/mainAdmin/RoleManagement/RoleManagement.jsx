import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import "./RoleManagement.css";

const API_BASE = "/api/admin";
 
const PERMISSION_MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "students", label: "Students", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "courses", label: "Courses", actions: ["view", "create", "edit", "delete"] },
  { key: "batches", label: "Batches", actions: ["view", "create", "edit", "delete"] },
  { key: "liveClasses", label: "Live Classes", actions: ["view", "create", "edit", "delete"] },
  { key: "mockTests", label: "Mock Tests", actions: ["view", "create", "edit", "delete"] },
  { key: "practiceTests", label: "Practice Tests", actions: ["view", "create", "edit", "delete"] },
  { key: "payments", label: "Payments/Orders", actions: ["view", "approve", "export"] },
  { key: "coupons", label: "Coupons/Offers", actions: ["view", "create", "edit", "delete"] },
  { key: "notifications", label: "Notifications", actions: ["view", "create", "edit", "delete"] },
  { key: "announcements", label: "Announcements", actions: ["view", "create", "edit", "delete"] },
  { key: "leads", label: "Leads/Enquiries", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "reports", label: "Reports/Exports", actions: ["view", "export"] },
  { key: "faculty", label: "Faculty/Teachers", actions: ["view", "create", "edit", "delete"] },
  { key: "blogs", label: "Blog Management", actions: ["view", "create", "edit", "delete"] },
  { key: "studyMaterials", label: "Study Materials", actions: ["view", "create", "edit", "delete"] },
  { key: "discussions", label: "Discussions", actions: ["view", "create", "edit", "delete"] },
  { key: "bschools", label: "B-Schools", actions: ["view", "create", "edit", "delete"] },
  { key: "iimPredictor", label: "IIM Predictor", actions: ["view", "create", "edit", "delete"] },
  { key: "downloads", label: "Downloads", actions: ["view", "create", "edit", "delete"] },
  { key: "gallery", label: "Image Gallery", actions: ["view", "create", "edit", "delete"] },
  { key: "crm", label: "CRM", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "billing", label: "Billing Settings", actions: ["view", "edit"] },
  { key: "roleManagement", label: "Role Management", actions: ["view", "create", "edit", "delete"] }
];

const RoleManagement = () => {
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "", permissions: {} });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: "", email: "", phone: "", password: "", userType: "subadmin", role: "", status: "active"
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: "", roleId: "" });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/roles`, { headers });
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin-users`, { headers });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const initializePermissions = () => {
    const perms = {};
    PERMISSION_MODULES.forEach(mod => {
      perms[mod.key] = {};
      mod.actions.forEach(action => {
        perms[mod.key][action] = false;
      });
    });
    return perms;
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "", permissions: initializePermissions() });
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    const existingPerms = role.permissions || {};
    const mergedPerms = initializePermissions();
    Object.keys(existingPerms).forEach(mod => {
      if (mergedPerms[mod]) {
        Object.keys(existingPerms[mod]).forEach(action => {
          mergedPerms[mod][action] = existingPerms[mod][action];
        });
      }
    });
    setRoleForm({ name: role.name, description: role.description || "", permissions: mergedPerms });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    setLoading(true);
    setError("");
    try {
      if (editingRole) {
        await axios.put(`${API_BASE}/roles/${editingRole._id}`, roleForm, { headers });
        setSuccess("Role updated successfully");
      } else {
        await axios.post(`${API_BASE}/roles`, roleForm, { headers });
        setSuccess("Role created successfully");
      }
      setShowRoleModal(false);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save role");
    }
    setLoading(false);
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/roles/${roleId}`, { headers });
      setSuccess("Role deleted successfully");
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete role");
    }
    setLoading(false);
  };

  const handlePermissionChange = (module, action) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action]
        }
      }
    }));
  };

  const toggleModuleAll = (module, actions) => {
    const allChecked = actions.every(a => roleForm.permissions[module]?.[a]);
    const newPerms = { ...roleForm.permissions[module] };
    actions.forEach(a => { newPerms[a] = !allChecked; });
    setRoleForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: newPerms }
    }));
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({ fullName: "", email: "", phone: "", password: "", userType: "subadmin", role: "", status: "active" });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      password: "",
      userType: user.userType,
      role: user.role?._id || "",
      status: user.status
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...userForm };
      if (editingUser && !payload.password) {
        delete payload.password;
      }
      if (editingUser) {
        await axios.put(`${API_BASE}/admin-users/${editingUser._id}`, payload, { headers });
        setSuccess("User updated successfully");
      } else {
        await axios.post(`${API_BASE}/admin-users`, payload, { headers });
        setSuccess("User created successfully");
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user");
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/admin-users/${userId}`, { headers });
      setSuccess("User deleted successfully");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
    setLoading(false);
  };

  const handleToggleStatus = async (userId) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin-users/${userId}/toggle-status`, {}, { headers });
      setSuccess("User status updated");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin-users/${passwordUserId}/reset-password`, { newPassword }, { headers });
      setSuccess("Password reset successfully");
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
    setLoading(false);
  };

  const handleAssignRole = async () => {
    if (!assignForm.userId) {
      setError("Please select a user");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin-users/${assignForm.userId}/assign-role`, { roleId: assignForm.roleId || null }, { headers });
      setSuccess("Role assigned successfully");
      setShowAssignModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign role");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="role-management">
          <h1>Role Management</h1>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="tabs">
            <button className={`tab ${activeTab === "roles" ? "active" : ""}`} onClick={() => setActiveTab("roles")}>
              Roles
            </button>
            <button className={`tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              Users
            </button>
            <button className={`tab ${activeTab === "assign" ? "active" : ""}`} onClick={() => setActiveTab("assign")}>
              Assign Role
            </button>
          </div>

          {activeTab === "roles" && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Manage Roles</h2>
                <button className="btn btn-primary" onClick={handleCreateRole}>+ Create Role</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Users Assigned</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role._id}>
                      <td><strong>{role.name}</strong></td>
                      <td>{role.description || "-"}</td>
                      <td>{users.filter(u => u.role?._id === role._id).length}</td>
                      <td>{new Date(role.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-sm btn-edit" onClick={() => handleEditRole(role)}>Edit</button>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDeleteRole(role._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
                    <tr><td colSpan="5" className="text-center">No roles found. Create your first role.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "users" && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Manage Admin Users</h2>
                <button className="btn btn-primary" onClick={handleCreateUser}>+ Create User</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>User Type</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td><strong>{user.fullName}</strong></td>
                      <td>{user.email}</td>
                      <td><span className={`badge badge-${user.userType}`}>{user.userType}</span></td>
                      <td>{user.role?.name || "-"}</td>
                      <td><span className={`status status-${user.status}`}>{user.status}</span></td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-sm btn-edit" onClick={() => handleEditUser(user)}>Edit</button>
                        <button className="btn btn-sm btn-warning" onClick={() => handleToggleStatus(user._id)}>
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setPasswordUserId(user._id); setShowPasswordModal(true); }}>
                          Reset Pwd
                        </button>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="7" className="text-center">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "assign" && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Assign Role to User</h2>
              </div>
              <div className="assign-form">
                <div className="form-group">
                  <label>Select User</label>
                  <select value={assignForm.userId} onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })}>
                    <option value="">-- Select User --</option>
                    {users.filter(u => u.userType !== "superadmin").map(user => (
                      <option key={user._id} value={user._id}>{user.fullName} ({user.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Role</label>
                  <select value={assignForm.roleId} onChange={e => setAssignForm({ ...assignForm, roleId: e.target.value })}>
                    <option value="">-- No Role (Remove) --</option>
                    {roles.map(role => (
                      <option key={role._id} value={role._id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handleAssignRole} disabled={loading}>
                  {loading ? "Assigning..." : "Assign Role"}
                </button>
              </div>

              {assignForm.userId && (
                <div className="user-summary">
                  <h3>Selected User Summary</h3>
                  {(() => {
                    const selectedUser = users.find(u => u._id === assignForm.userId);
                    if (!selectedUser) return null;
                    return (
                      <div className="summary-card">
                        <p><strong>Name:</strong> {selectedUser.fullName}</p>
                        <p><strong>Email:</strong> {selectedUser.email}</p>
                        <p><strong>Current Role:</strong> {selectedUser.role?.name || "No Role Assigned"}</p>
                        <p><strong>User Type:</strong> {selectedUser.userType}</p>
                        <p><strong>Status:</strong> {selectedUser.status}</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>{editingRole ? "Edit Role" : "Create Role"}</h2>
              <button className="modal-close" onClick={() => setShowRoleModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Role Name *</label>
                <input type="text" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g., Content Manager" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="Brief description of role responsibilities" />
              </div>
              <div className="permissions-section">
                <h3>Permissions</h3>
                <div className="permissions-grid">
                  {PERMISSION_MODULES.map(mod => (
                    <div key={mod.key} className="permission-module">
                      <div className="module-header">
                        <label className="module-name" onClick={() => toggleModuleAll(mod.key, mod.actions)}>
                          {mod.label}
                        </label>
                      </div>
                      <div className="module-actions">
                        {mod.actions.map(action => (
                          <label key={action} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={roleForm.permissions[mod.key]?.[action] || false}
                              onChange={() => handlePermissionChange(mod.key, action)}
                            />
                            {action}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRole} disabled={loading || !roleForm.name}>
                {loading ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? "Edit User" : "Create User"}</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={userForm.fullName} onChange={e => setUserForm({ ...userForm, fullName: e.target.value })} placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="Email Address" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} placeholder="Phone Number" />
              </div>
              <div className="form-group">
                <label>{editingUser ? "New Password (leave blank to keep)" : "Password *"}</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder="Password" />
              </div>
              <div className="form-group">
                <label>User Type *</label>
                <select value={userForm.userType} onChange={e => setUserForm({ ...userForm, userType: e.target.value })}>
                  <option value="subadmin">Sub Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assign Role</label>
                <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="">-- No Role --</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveUser} disabled={loading || !userForm.fullName || !userForm.email || (!editingUser && !userForm.password)}>
                {loading ? "Saving..." : "Save User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal modal-small">
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="modal-close" onClick={() => { setShowPasswordModal(false); setNewPassword(""); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Password *</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowPasswordModal(false); setNewPassword(""); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={loading || newPassword.length < 6}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
