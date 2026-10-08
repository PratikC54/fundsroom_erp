import { useEffect, useState } from "react";
import api from "./api/client.js";
import { authStore } from "./api/authStore.js";
import Login from "./components/Login.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { Toast } from "./components/common.jsx";
import EnquiriesPage from "./pages/EnquiriesPage.jsx";
import QuotationsPage from "./pages/QuotationsWorkflowPage.jsx";
import SalesOrdersPage from "./pages/SalesOrdersWorkflowPage.jsx";

export default function App() {
  const [auth, setAuth] = useState(authStore.get());
  const [page, setPage] = useState("enquiries");
  const [state, setState] = useState({
    enquiries: [],
    quotations: [],
    orders: [],
    inventory: [],
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!auth) return;

    setLoading(true);
    try {
      const [enquiries, quotations, orders, inventory] = await Promise.all(
        ["/enquiries", "/quotations", "/sales-orders", "/inventory"].map(
          (path) => api.get(path),
        ),
      );
      setState({ enquiries, quotations, orders, inventory });
    } catch (error) {
      setMessage(error.message);

      if (/Session|Authentication/.test(error.message)) {
        authStore.clear();
        setAuth(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    authStore.clear();
    setAuth(null);
  }

  useEffect(() => {
    reload();
  }, [auth]);

  if (!auth) return <Login onLogin={setAuth} />;

  const views = {
    enquiries: (
      <EnquiriesPage data={state.enquiries} user={auth.user} reload={reload} />
    ),
    quotations: (
      <QuotationsPage
        data={state.quotations}
        enquiries={state.enquiries}
        user={auth.user}
        reload={reload}
      />
    ),
    orders: (
      <SalesOrdersPage
        data={state.orders}
        inventory={state.inventory}
        user={auth.user}
        reload={reload}
        notify={setMessage}
      />
    ),
  };
  return (
    <div className="app-shell">
      <Sidebar
        auth={auth}
        page={page}
        onPageChange={setPage}
        onLogout={logout}
      />
      <main className="content">
        {loading ? (
          <div className="loading">Loading your workspace…</div>
        ) : (
          views[page]
        )}
      </main>
      <Toast>{message}</Toast>
    </div>
  );
}
