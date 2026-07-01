import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    imageUrl: "",
    categoryId: "",
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/admin/dashboard");
      setDashboard(response.data);
      const firstCategory = response.data?.categories?.[0]?.id;
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || (firstCategory ? String(firstCategory) : ""),
      }));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Could not load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const products = useMemo(() => dashboard?.products || [], [dashboard]);
  const categories = dashboard?.categories || [];
  const recentOrders = dashboard?.recentOrders || [];
  const summary = dashboard?.summary || {};

  const stockRows = useMemo(
    () => [...products].sort((a, b) => Number(a.stockQuantity) - Number(b.stockQuantity)).slice(0, 5),
    [products]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await API.post("/products", {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        imageUrl: form.imageUrl,
        categoryId: Number(form.categoryId),
      });
      setNotice("Product added to catalog.");
      setForm((current) => ({
        ...current,
        name: "",
        description: "",
        price: "",
        stockQuantity: "",
        imageUrl: "",
      }));
      await loadDashboard();
      setActiveTab("products");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <Link to="/" style={styles.brand}>Nexora</Link>
          <p style={styles.sidebarText}>Commerce operations</p>
        </div>

        <nav style={styles.nav}>
          {["overview", "products", "orders", "create"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? styles.navButtonActive : styles.navButton}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <span style={styles.roleBadge}>Admin</span>
          <Link to="/" style={styles.secondaryLink}>Storefront</Link>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Admin workspace</p>
            <h1 style={styles.title}>Dashboard</h1>
          </div>
          <div style={styles.headerActions}>
            <button type="button" onClick={loadDashboard} style={styles.outlineButton}>Refresh</button>
            <Link to="/orders" style={styles.primaryLink}>Customer orders</Link>
          </div>
        </header>

        {error && <div style={styles.error}>{error}</div>}
        {notice && <div style={styles.notice}>{notice}</div>}
        {loading && <div style={styles.panel}>Loading dashboard...</div>}

        {!loading && activeTab === "overview" && (
          <>
            <section style={styles.metricsGrid}>
              <Metric label="Revenue" value={currency.format(Number(summary.totalRevenue || 0))} detail="Non-cancelled orders" />
              <Metric label="Orders" value={summary.totalOrders || 0} detail="All customer orders" />
              <Metric label="Products" value={summary.totalProducts || 0} detail={`${summary.activeProducts || 0} active`} />
              <Metric label="Low Stock" value={summary.lowStockProducts || 0} detail="5 units or fewer" tone="warning" />
            </section>

            <section style={styles.twoColumn}>
              <div style={styles.panel}>
                <SectionTitle title="Order Status" action={`${summary.totalOrders || 0} total`} />
                <div style={styles.statusList}>
                  {(dashboard?.orderStatus || []).map((item) => (
                    <div key={item.status} style={styles.statusRow}>
                      <span style={statusChip(item.status)}>{cleanStatus(item.status)}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.panel}>
                <SectionTitle title="Stock Watch" action="Lowest inventory" />
                <Table
                  columns={["Product", "Category", "Stock"]}
                  rows={stockRows.map((product) => [
                    product.name,
                    product.categoryName,
                    <span style={product.stockQuantity <= 5 ? styles.stockDanger : styles.stockOk}>{product.stockQuantity}</span>,
                  ])}
                  empty="No products yet."
                />
              </div>
            </section>
          </>
        )}

        {!loading && activeTab === "products" && (
          <section style={styles.panel}>
            <SectionTitle title="Products" action={`${products.length} listed`} />
            <Table
              columns={["Name", "Category", "Price", "Stock", "Status"]}
              rows={products.map((product) => [
                product.name,
                product.categoryName,
                currency.format(Number(product.price)),
                product.stockQuantity,
                <span style={product.active ? styles.activeBadge : styles.inactiveBadge}>{product.active ? "Active" : "Inactive"}</span>,
              ])}
              empty="No products yet."
            />
          </section>
        )}

        {!loading && activeTab === "orders" && (
          <section style={styles.panel}>
            <SectionTitle title="Recent Orders" action={`${recentOrders.length} shown`} />
            <Table
              columns={["Order", "Customer", "Status", "Payment", "Total", "Placed"]}
              rows={recentOrders.map((order) => [
                order.orderNumber,
                order.deliveryAddress?.fullName || "Customer",
                <span style={statusChip(order.status)}>{cleanStatus(order.status)}</span>,
                order.paymentStatus,
                currency.format(Number(order.total)),
                new Date(order.placedAt).toLocaleString("en-IN"),
              ])}
              empty="No orders yet."
            />
          </section>
        )}

        {!loading && activeTab === "create" && (
          <section style={styles.panel}>
            <SectionTitle title="Add Product" action="Catalog control" />
            <form onSubmit={handleCreateProduct} style={styles.formGrid}>
              <label style={styles.field}>
                <span style={styles.label}>Product name</span>
                <input name="name" value={form.name} onChange={handleChange} required style={styles.input} />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Category</span>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} required style={styles.input}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Price</span>
                <input name="price" type="number" min="1" step="0.01" value={form.price} onChange={handleChange} required style={styles.input} />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Stock</span>
                <input name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={handleChange} required style={styles.input} />
              </label>
              <label style={styles.fieldWide}>
                <span style={styles.label}>Image URL</span>
                <input name="imageUrl" value={form.imageUrl} onChange={handleChange} style={styles.input} />
              </label>
              <label style={styles.fieldWide}>
                <span style={styles.label}>Description</span>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} style={styles.textarea} />
              </label>
              <div style={styles.formActions}>
                <button type="submit" disabled={saving} style={styles.primaryButton}>
                  {saving ? "Saving..." : "Add product"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, detail, tone }) {
  return (
    <div style={tone === "warning" ? styles.metricWarning : styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
      <span style={styles.metricDetail}>{detail}</span>
    </div>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div style={styles.sectionTitle}>
      <h2 style={styles.sectionHeading}>{title}</h2>
      <span style={styles.sectionAction}>{action}</span>
    </div>
  );
}

function Table({ columns, rows, empty }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => <th key={column} style={styles.th}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={styles.emptyCell}>{empty}</td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex} style={styles.td}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function tabLabel(tab) {
  return {
    overview: "Overview",
    products: "Products",
    orders: "Orders",
    create: "Add product",
  }[tab];
}

function cleanStatus(status) {
  return String(status || "").replaceAll("_", " ");
}

function statusChip(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "CANCELLED") {
    return { ...styles.statusBase, color: "#fecaca", background: "#3b1111", borderColor: "#7f1d1d" };
  }
  if (normalized === "DELIVERED") {
    return { ...styles.statusBase, color: "#bbf7d0", background: "#052e1a", borderColor: "#166534" };
  }
  return { ...styles.statusBase, color: "#bfdbfe", background: "#0f254a", borderColor: "#1d4ed8" };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0f14",
    color: "#e5e7eb",
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  sidebar: {
    borderRight: "1px solid #202936",
    background: "#0f141b",
    padding: "26px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  brand: { color: "#f8fafc", fontSize: "28px", fontWeight: 800, textDecoration: "none" },
  sidebarText: { color: "#94a3b8", margin: "8px 0 0", fontSize: "13px" },
  nav: { display: "grid", gap: "8px", marginTop: "34px" },
  navButton: {
    textAlign: "left",
    color: "#cbd5e1",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: "8px",
    padding: "12px 13px",
    cursor: "pointer",
    fontSize: "14px",
  },
  navButtonActive: {
    textAlign: "left",
    color: "#ffffff",
    background: "#1d4ed8",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    padding: "12px 13px",
    cursor: "pointer",
    fontSize: "14px",
  },
  sidebarFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" },
  roleBadge: { border: "1px solid #334155", borderRadius: "999px", color: "#bfdbfe", padding: "6px 10px", fontSize: "12px" },
  secondaryLink: { color: "#93c5fd", textDecoration: "none", fontSize: "13px" },
  main: { padding: "30px", overflow: "hidden" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "24px" },
  kicker: { margin: 0, color: "#38bdf8", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em" },
  title: { margin: "6px 0 0", fontSize: "32px", color: "#f8fafc" },
  headerActions: { display: "flex", gap: "10px", alignItems: "center" },
  outlineButton: {
    background: "#111827",
    border: "1px solid #334155",
    color: "#e5e7eb",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  primaryLink: {
    background: "#2563eb",
    color: "white",
    borderRadius: "8px",
    padding: "10px 14px",
    textDecoration: "none",
  },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px", marginBottom: "16px" },
  metric: { background: "#111827", border: "1px solid #243044", borderRadius: "8px", padding: "18px" },
  metricWarning: { background: "#17120f", border: "1px solid #7c2d12", borderRadius: "8px", padding: "18px" },
  metricLabel: { display: "block", color: "#94a3b8", fontSize: "13px" },
  metricValue: { display: "block", color: "#f8fafc", fontSize: "30px", marginTop: "10px" },
  metricDetail: { display: "block", color: "#94a3b8", fontSize: "13px", marginTop: "8px" },
  twoColumn: { display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "16px" },
  panel: { background: "#111827", border: "1px solid #243044", borderRadius: "8px", padding: "18px", marginBottom: "16px" },
  sectionTitle: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px" },
  sectionHeading: { margin: 0, color: "#f8fafc", fontSize: "18px" },
  sectionAction: { color: "#94a3b8", fontSize: "13px" },
  statusList: { display: "grid", gap: "10px" },
  statusRow: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2937", paddingBottom: "10px" },
  statusBase: { display: "inline-block", border: "1px solid", borderRadius: "999px", padding: "5px 9px", fontSize: "11px", fontWeight: 700 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "720px" },
  th: { textAlign: "left", color: "#94a3b8", borderBottom: "1px solid #243044", padding: "12px 10px", fontSize: "12px", textTransform: "uppercase" },
  td: { borderBottom: "1px solid #1f2937", padding: "13px 10px", color: "#e5e7eb", fontSize: "14px", verticalAlign: "middle" },
  emptyCell: { color: "#94a3b8", padding: "18px 10px" },
  stockDanger: { color: "#fca5a5", fontWeight: 800 },
  stockOk: { color: "#bbf7d0", fontWeight: 800 },
  activeBadge: { color: "#bbf7d0", background: "#052e1a", border: "1px solid #166534", borderRadius: "999px", padding: "5px 9px", fontSize: "12px" },
  inactiveBadge: { color: "#cbd5e1", background: "#1f2937", border: "1px solid #334155", borderRadius: "999px", padding: "5px 9px", fontSize: "12px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  field: { display: "grid", gap: "7px" },
  fieldWide: { display: "grid", gap: "7px", gridColumn: "1 / -1" },
  label: { color: "#cbd5e1", fontSize: "13px" },
  input: { background: "#0b1220", color: "#f8fafc", border: "1px solid #334155", borderRadius: "8px", padding: "12px", fontSize: "14px", outline: "none" },
  textarea: { background: "#0b1220", color: "#f8fafc", border: "1px solid #334155", borderRadius: "8px", padding: "12px", fontSize: "14px", outline: "none", resize: "vertical" },
  formActions: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" },
  primaryButton: { background: "#2563eb", color: "white", border: "none", borderRadius: "8px", padding: "12px 18px", cursor: "pointer", fontWeight: 800 },
  error: { background: "#3b1111", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" },
  notice: { background: "#052e1a", border: "1px solid #166534", color: "#bbf7d0", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" },
};
