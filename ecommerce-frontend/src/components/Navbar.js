<div
  style={{
    width: "100%",
    backgroundColor: "#0b1120",
    padding: "15px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    flexWrap: "wrap",
    boxSizing: "border-box"
  }}
>
  <h1
    style={{
      color: "#4f83ff",
      fontSize: "30px",
      margin: 0
    }}
  >
    Nexora 🚀
  </h1>

  <div
    style={{
      display: "flex",
      gap: "15px",
      alignItems: "center",
      flexWrap: "wrap"
    }}
  >
    <Link to="/" style={linkStyle}>
      Home
    </Link>

    <Link to="/products" style={linkStyle}>
      Products
    </Link>

    <button
      onClick={() => setCartOpen(true)}
      style={cartButtonStyle}
    >
      Cart 🛒
    </button>

    <Link to="/login" style={buttonStyle}>
      Login
    </Link>
  </div>
</div>