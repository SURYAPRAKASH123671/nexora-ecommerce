import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

const emptyAddress = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  defaultAddress: false,
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", profilePictureUrl: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/profile");
      setProfile(response.data);
      setProfileForm({
        name: response.data.name || "",
        phone: response.data.phone || "",
        profilePictureUrl: response.data.profilePictureUrl || "",
      });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await API.put("/profile", profileForm);
      setProfile(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await API.post("/profile/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setMessage(response.data?.message || "Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (editingAddressId) {
        await API.put(`/profile/addresses/${editingAddressId}`, addressForm);
      } else {
        await API.post("/profile/addresses", addressForm);
      }
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      setMessage(editingAddressId ? "Address updated." : "Address added.");
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      defaultAddress: Boolean(address.defaultAddress),
    });
  };

  const deleteAddress = async (id) => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await API.delete(`/profile/addresses/${id}`);
      setMessage("Address removed.");
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove address.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return <PageShell><p style={{ color: "#C9A84C" }}>Loading profile...</p></PageShell>;
  }

  return (
    <PageShell>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#4f83ff", fontSize: "32px" }}>My Account</h1>
          <p style={{ color: "#aaa", marginTop: "8px" }}>{profile?.email}</p>
        </div>
        <button onClick={logout} style={secondaryButtonStyle}>Logout</button>
      </div>

      {message && <p style={successStyle}>{message}</p>}
      {error && <p style={errorStyle}>{error}</p>}

      <div style={gridStyle}>
        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>Profile</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <div style={avatarStyle}>
              {profileForm.profilePictureUrl ? (
                <img src={profileForm.profilePictureUrl} alt={profileForm.name} style={avatarImageStyle} />
              ) : (
                (profileForm.name || "N").slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <strong>{profile?.name}</strong>
              <p style={{ color: "#94a3b8", margin: "5px 0 0", fontSize: "13px" }}>
                {profile?.emailVerified ? "Verified customer" : "Email not verified"}
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <input style={inputStyle} placeholder="Full name" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} required />
            <input style={inputStyle} placeholder="Phone" value={profileForm.phone || ""} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
            <input style={inputStyle} placeholder="Profile picture URL" value={profileForm.profilePictureUrl || ""} onChange={(event) => setProfileForm({ ...profileForm, profilePictureUrl: event.target.value })} />
            <button disabled={saving} style={buttonStyle}>{saving ? "Saving..." : "Save Profile"}</button>
          </form>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>Change Password</h2>
          <form onSubmit={changePassword}>
            <input type="password" style={inputStyle} placeholder="Current password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required />
            <input type="password" style={inputStyle} placeholder="New password with letters and numbers" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required />
            <button disabled={saving} style={buttonStyle}>{saving ? "Updating..." : "Change Password"}</button>
          </form>
        </section>
      </div>

      <section style={{ ...panelStyle, marginTop: "22px" }}>
        <h2 style={sectionTitleStyle}>Saved Addresses</h2>
        <form onSubmit={saveAddress} style={addressGridStyle}>
          <input style={inputStyle} placeholder="Label" value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} required />
          <input style={inputStyle} placeholder="Full name" value={addressForm.fullName} onChange={(event) => setAddressForm({ ...addressForm, fullName: event.target.value })} required />
          <input style={inputStyle} placeholder="Phone" value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} required />
          <input style={inputStyle} placeholder="Address line 1" value={addressForm.line1} onChange={(event) => setAddressForm({ ...addressForm, line1: event.target.value })} required />
          <input style={inputStyle} placeholder="Address line 2" value={addressForm.line2} onChange={(event) => setAddressForm({ ...addressForm, line2: event.target.value })} />
          <input style={inputStyle} placeholder="City" value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} required />
          <input style={inputStyle} placeholder="State" value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} required />
          <input style={inputStyle} placeholder="Pincode" value={addressForm.pincode} onChange={(event) => setAddressForm({ ...addressForm, pincode: event.target.value })} required />
          <label style={{ color: "#cbd5e1", display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={addressForm.defaultAddress} onChange={(event) => setAddressForm({ ...addressForm, defaultAddress: event.target.checked })} />
            Default address
          </label>
          <button disabled={saving} style={buttonStyle}>{editingAddressId ? "Update Address" : "Add Address"}</button>
        </form>

        <div style={{ display: "grid", gap: "12px", marginTop: "22px" }}>
          {(profile?.addresses || []).map((address) => (
            <div key={address.id} style={addressCardStyle}>
              <div>
                <strong>{address.label}</strong>
                {address.defaultAddress && <span style={badgeStyle}>Default</span>}
                <p style={mutedStyle}>{address.fullName} | {address.phone}</p>
                <p style={mutedStyle}>{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} - {address.pincode}</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => editAddress(address)} style={secondaryButtonStyle}>Edit</button>
                <button onClick={() => deleteAddress(address.id)} style={dangerButtonStyle}>Delete</button>
              </div>
            </div>
          ))}

          {(!profile?.addresses || profile.addresses.length === 0) && (
            <p style={mutedStyle}>No saved addresses yet.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white" }}>
      <nav style={navStyle}>
        <Link to="/" style={logoStyle}>Nexora</Link>
        <div style={{ display: "flex", gap: "22px", alignItems: "center" }}>
          <Link to="/" style={navLinkStyle}>Home</Link>
          <Link to="/products" style={navLinkStyle}>Products</Link>
          <Link to="/orders" style={navLinkStyle}>Orders</Link>
        </div>
      </nav>
      <main style={{ maxWidth: "1150px", margin: "0 auto", padding: "115px 20px 45px" }}>
        {children}
      </main>
    </div>
  );
}

const navStyle = {
  width: "100%",
  backgroundColor: "#0b1120",
  padding: "18px 50px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #1e293b",
  position: "fixed",
  top: 0,
  zIndex: 100,
  boxSizing: "border-box",
};

const logoStyle = {
  color: "#4f83ff",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "30px",
};

const navLinkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "16px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "22px",
  marginTop: "22px",
};

const panelStyle = {
  background: "#141414",
  border: "1px solid #292929",
  borderRadius: "8px",
  padding: "22px",
};

const sectionTitleStyle = {
  margin: "0 0 18px",
  color: "#C9A84C",
  fontSize: "22px",
};

const inputStyle = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #333",
  color: "white",
  borderRadius: "8px",
  padding: "12px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: "12px",
};

const buttonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#1f2937",
  color: "white",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "10px 13px",
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  color: "#fecaca",
  border: "1px solid #7f1d1d",
};

const successStyle = {
  background: "#052e1a",
  border: "1px solid #166534",
  color: "#86efac",
  padding: "12px 14px",
  borderRadius: "8px",
  marginTop: "20px",
};

const errorStyle = {
  background: "#3b1111",
  border: "1px solid #7f1d1d",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "8px",
  marginTop: "20px",
};

const avatarStyle = {
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  background: "#2563eb",
  display: "grid",
  placeItems: "center",
  fontSize: "26px",
  fontWeight: "bold",
  overflow: "hidden",
};

const avatarImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const addressGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  alignItems: "center",
};

const addressCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  background: "#101010",
  border: "1px solid #292929",
  borderRadius: "8px",
  padding: "14px",
};

const mutedStyle = {
  color: "#94a3b8",
  margin: "6px 0 0",
  fontSize: "13px",
};

const badgeStyle = {
  marginLeft: "8px",
  color: "#111827",
  background: "#C9A84C",
  borderRadius: "4px",
  padding: "3px 7px",
  fontSize: "11px",
  fontWeight: "bold",
};
