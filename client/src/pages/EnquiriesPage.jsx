import { useState } from "react";
import api from "../api/client.js";
import { Empty, Status } from "../components/common.jsx";

export default function EnquiriesPage({ data, user, reload }) {
  const [formOpen, setFormOpen] = useState(false);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: "1" }]);
  const [customer, setCustomer] = useState({
    companyName: "",
    contactPerson: "",
    mobile: "",
    email: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [customerError, setCustomerError] = useState("");

  async function openForm() {
    try {
      const [customerData, productData] = await Promise.all([
        api.get("/customers"),
        api.get("/products"),
      ]);
      setCustomers(customerData);
      setProducts(productData);
      setSelectedCustomerId(customerData[0]?.id || "");
      setItems([{ productId: productData[0]?.id || "", quantity: "1" }]);
      setFormOpen(true);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function chooseCustomer(event) {
    if (event.target.value === "add-customer") {
      setCustomerFormOpen(true);
      setCustomerError("");
      return;
    }

    setSelectedCustomerId(event.target.value);
  }

  function updateCustomer(event) {
    setCustomer({ ...customer, [event.target.name]: event.target.value });
  }

  function updateItem(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function createCustomer() {
    setCustomerError("");
    try {
      const createdCustomer = await api.post("/customers", customer);
      setCustomers([...customers, createdCustomer]);
      setSelectedCustomerId(createdCustomer.id);
      setCustomer({ companyName: "", contactPerson: "", mobile: "", email: "", city: "" });
      setCustomerFormOpen(false);
    } catch (requestError) {
      setCustomerError(requestError.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await api.post("/enquiries", {
        customerId: selectedCustomerId,
        enquiryDate: form.get("enquiryDate"),
        requiredDate: form.get("requiredDate"),
        notes: form.get("notes"),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      });
      setFormOpen(false);
      reload();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">SALES INBOX</p>
          <h2>Customer enquiries</h2>
        </div>
        {user.role === "SALES" && <button onClick={openForm}>New enquiry</button>}
      </div>

      {error && <p className="error">{error}</p>}

      {formOpen && (
        <form className="panel form-grid" onSubmit={submit}>
          <h3>New enquiry</h3>
          <label>
            Customer
            <select
              name="customerId"
              value={selectedCustomerId}
              onChange={chooseCustomer}
              required
            >
              <option value="">Select a customer</option>
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.companyName}
                </option>
              ))}
              <option value="add-customer">Add a customer...</option>
            </select>
          </label>
          {customerFormOpen && (
            <div className="customer-create">
              <h3>Add customer</h3>
              <div className="customer-fields">
                <label>
                  Company name
                  <input name="companyName" value={customer.companyName} onChange={updateCustomer} required />
                </label>
                <label>
                  Contact person
                  <input name="contactPerson" value={customer.contactPerson} onChange={updateCustomer} required />
                </label>
                <label>
                  Mobile
                  <input name="mobile" value={customer.mobile} onChange={updateCustomer} required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" value={customer.email} onChange={updateCustomer} required />
                </label>
                <label>
                  City
                  <input name="city" value={customer.city} onChange={updateCustomer} required />
                </label>
              </div>
              {customerError && <p className="error">{customerError}</p>}
              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => setCustomerFormOpen(false)}>
                  Cancel
                </button>
                <button type="button" onClick={createCustomer}>Save customer</button>
              </div>
            </div>
          )}

          <label>
            Enquiry date
            <input name="enquiryDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <label>
            Required date
            <input name="requiredDate" type="date" required />
          </label>
          <div className="enquiry-items">
            <div className="enquiry-items-head">
              <h3>Items</h3>
              <button
                type="button"
                className="secondary"
                onClick={() => setItems([...items, { productId: "", quantity: "1" }])}
              >
                Add item
              </button>
            </div>
            {items.map((item, index) => (
              <div className="enquiry-item" key={index}>
                <label>
                  Product
                  <select
                    value={item.productId}
                    onChange={(event) => updateItem(index, "productId", event.target.value)}
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.productCode} - {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, "quantity", event.target.value)}
                    required
                  />
                </label>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={items.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <label>
            Notes
            <input name="notes" placeholder="Optional requirement" />
          </label>
          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button>Create enquiry</button>
          </div>
        </form>
      )}

      <div className="panel table-wrap">
        {data.length ? (
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Customer</th>
                <th>Required</th>
                <th>Products</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.enquiryNumber}</td>
                  <td>{row.customer.companyName}</td>
                  <td>{new Date(row.requiredDate).toLocaleDateString()}</td>
                  <td>
                    {row.items.map((item) => `${item.product.name} x ${item.quantity}`).join(", ")}
                  </td>
                  <td><Status value={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty title="No enquiries yet" detail="Customer enquiries will appear here." />
        )}
      </div>
    </section>
  );
}
