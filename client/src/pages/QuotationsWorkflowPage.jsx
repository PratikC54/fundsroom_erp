import { useState } from "react";
import api from "../api/client.js";
import { Empty, Status } from "../components/common.jsx";

function toDateInputValue(date) {
  return date ? String(date).slice(0, 10) : "";
}

export default function QuotationsPage({ data, enquiries, user, reload }) {
  const availableEnquiries = enquiries.filter((item) => item.status === "NEW");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(availableEnquiries[0]?.id || "");
  const [validUntil, setValidUntil] = useState(
    toDateInputValue(availableEnquiries[0]?.requiredDate),
  );
  const [error, setError] = useState("");
  const selectedEnquiry = availableEnquiries.find(
    (item) => item.id === selectedId,
  );
  const isSalesUser = user.role === "SALES";
  const isAdmin = user.role === "ADMIN";

  async function createQuotation(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const enquiry = availableEnquiries.find(
      (item) => item.id === form.get("enquiryId"),
    );

    if (!enquiry) return;

    try {
      await api.post("/quotations", {
        enquiryId: enquiry.id,
        validUntil: form.get("validUntil"),
        items: enquiry.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(form.get(`price-${item.productId}`)),
          discountPct: Number(form.get(`discount-${item.productId}`) || 0),
          gstPct: Number(form.get(`gst-${item.productId}`) || 18),
        })),
      });
      setFormOpen(false);
      setError("");
      reload();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      setError("");
      reload();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function convertToSalesOrder(id) {
    try {
      await api.post(`/quotations/${id}/convert`);
      setError("");
      reload();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openCreateForm() {
    const firstEnquiry = availableEnquiries[0];
    setSelectedId(firstEnquiry?.id || "");
    setValidUntil(toDateInputValue(firstEnquiry?.requiredDate));
    setFormOpen(true);
    setError("");
  }

  function selectEnquiry(event) {
    const enquiryId = event.target.value;
    const enquiry = availableEnquiries.find((item) => item.id === enquiryId);
    setSelectedId(enquiryId);
    setValidUntil(toDateInputValue(enquiry?.requiredDate));
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">COMMERCIALS</p>
          <h2>Quotations</h2>
        </div>
        {isSalesUser && (
          <button
            onClick={openCreateForm}
            disabled={!availableEnquiries.length}
          >
            Make quotation
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {formOpen && isSalesUser && (
        <form className="panel quote-form" onSubmit={createQuotation}>
          <h3>Create from enquiry</h3>
          <label>
            Enquiry
            <select
              name="enquiryId"
              value={selectedId}
              onChange={selectEnquiry}
              required
            >
              {availableEnquiries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.enquiryNumber} - {item.customer.companyName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Valid until
            <input
              name="validUntil"
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
              required
            />
          </label>
          <p className="help">
            Enter a unit price and discount for each product. The server
            calculates the final total.
          </p>
          {selectedEnquiry?.items.map((item) => (
            <div className="inline-fields" key={item.id}>
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <label>
                Unit price
                <input
                  name={`price-${item.productId}`}
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.product.basePrice}
                  required
                />
              </label>
              <label>
                Discount %
                <input
                  name={`discount-${item.productId}`}
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="0"
                />
              </label>
              <label>
                GST %
                <input
                  name={`gst-${item.productId}`}
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="18"
                />
              </label>
            </div>
          ))}
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </button>
            <button disabled={!selectedEnquiry}>Create draft</button>
          </div>
        </form>
      )}

      <div className="cards">
        {data.length ? (
          data.map((quotation) => (
            <article className="quote-card" key={quotation.id}>
              <div className="card-line">
                <span className="mono">{quotation.quotationNumber}</span>
                <Status value={quotation.status} />
              </div>
              <h3>{quotation.customer.companyName}</h3>
              <p>
                {quotation.items
                  .map(
                    (item) => `${item.product.productCode} x ${item.quantity}`,
                  )
                  .join(", ")}
              </p>
              <strong>
                INR{" "}
                {Number(quotation.grandTotal).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </strong>
              <small>
                Valid until{" "}
                {new Date(quotation.validUntil).toLocaleDateString()}
              </small>
              <div className="actions">
                {isSalesUser && quotation.status === "DRAFT" && (
                  <button
                    className="secondary"
                    onClick={() => updateStatus(quotation.id, "SENT")}
                  >
                    Mark sent
                  </button>
                )}
                {isAdmin && ["DRAFT", "SENT"].includes(quotation.status) && (
                  <>
                    <button
                      className="secondary"
                      onClick={() => updateStatus(quotation.id, "REJECTED")}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateStatus(quotation.id, "ACCEPTED")}
                    >
                      Accept
                    </button>
                  </>
                )}
                {isSalesUser &&
                  quotation.status === "ACCEPTED" &&
                  !quotation.salesOrder && (
                    <button onClick={() => convertToSalesOrder(quotation.id)}>
                      Convert to sales order
                    </button>
                  )}
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="No quotations yet"
            detail="Create one against a new enquiry."
          />
        )}
      </div>
    </section>
  );
}
