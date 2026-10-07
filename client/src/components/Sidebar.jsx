export default function Sidebar({ auth, page, onPageChange, onLogout }) {
  const links = [
    ["enquiries", "Enquiries"],
    ["quotations", "Quotations"],
    ["orders", "Sales orders"],
  ];

  return (
    <aside>
      <div className="brand">Fundsroom ERP</div>
      <nav aria-label="Main navigation">
        {links.map(([key, label]) => (
          <button
            key={key}
            className={page === key ? "active" : ""}
            onClick={() => onPageChange(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="profile">
        <strong>{auth.user.name}</strong>
        <span>{auth.user.role === "ADMIN" ? "Administrator" : "Sales user"}</span>
        <button onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}
