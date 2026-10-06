import { useState } from "react";
import api from "../api/client.js";
import { Empty, Status } from "../components/common.jsx";

export default function SalesOrdersPage({ data, inventory, user, reload, notify }) {
  const [busyAction, setBusyAction] = useState("");
  const [editingInventoryId, setEditingInventoryId] = useState("");
  const isAdmin = user.role === "ADMIN";

  async function updateOrder(order, action) {
    const actionKey = `${order.id}-${action}`;
    setBusyAction(actionKey);

    try {
      if (action === "confirm") {
        await api.post(`/sales-orders/${order.id}/confirm`);
        notify("Order confirmed and inventory reserved.");
      } else {
        await api.post(`/sales-orders/${order.id}/dispatch`, {
          vehicleNumber: "MH-12-AB-4312",
          driverName: "Ramesh Patil",
          items: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
        notify("Dispatch recorded.");
      }
      reload();
    } catch (requestError) {
      notify(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function saveInventory(event, record) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyAction(record.id);

    try {
      await api.patch(`/inventory/${record.productId}`, {
        physicalQuantity: Number(form.get("physicalQuantity")),
        damagedQuantity: Number(form.get("damagedQuantity")),
      });
      setEditingInventoryId("");
      notify("Inventory updated.");
      reload();
    } catch (requestError) {
      notify(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">FULFILMENT</p>
          <h2>Sales orders</h2>
        </div>
        <div className="stock-note">{inventory.length} stocked products</div>
      </div>

      <div className="panel table-wrap">
        {data.length ? (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr key={order.id}>
                  <td className="mono">{order.orderNumber}</td>
                  <td>{order.customer.companyName}</td>
                  <td>
                    {order.items
                      .map((item) => `${item.product.productCode} x ${item.quantity}`)
                      .join(", ")}
                  </td>
                  <td>INR {Number(order.totalAmount).toLocaleString("en-IN")}</td>
                  <td><Status value={order.status} /></td>
                  <td className="action-cell">
                    {isAdmin && order.status === "PENDING" && (
                      <button
                        disabled={busyAction === `${order.id}-confirm`}
                        onClick={() => updateOrder(order, "confirm")}
                      >
                        Confirm order
                      </button>
                    )}
                    {isAdmin && order.status === "CONFIRMED" && (
                      <button
                        disabled={busyAction === `${order.id}-dispatch`}
                        onClick={() => updateOrder(order, "dispatch")}
                      >
                        Process dispatch
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty title="No sales orders yet" detail="Accepted quotations appear here after conversion." />
        )}
      </div>

      <div className="inventory-strip">
        <h3>Inventory availability</h3>
        <div className="panel table-wrap">
          {inventory.length ? (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Physical</th>
                  <th>Reserved</th>
                  <th>Damaged</th>
                  <th>Available</th>
                  {isAdmin && <th>Manage</th>}
                </tr>
              </thead>
              <tbody>
                {inventory.map((record) => (
                  <tr key={record.id}>
                    <td>{record.product.productCode} - {record.product.name}</td>
                    <td>{record.physicalQuantity}</td>
                    <td>{record.reservedQuantity}</td>
                    <td>{record.damagedQuantity}</td>
                    <td>{record.availableQuantity} {record.product.unit}</td>
                    {isAdmin && (
                      <td>
                        {editingInventoryId === record.id ? (
                          <form
                            className="inventory-edit"
                            onSubmit={(event) => saveInventory(event, record)}
                          >
                            <label>
                              Physical
                              <input
                                name="physicalQuantity"
                                type="number"
                                min={record.reservedQuantity + record.damagedQuantity}
                                defaultValue={record.physicalQuantity}
                                required
                              />
                            </label>
                            <label>
                              Damaged
                              <input
                                name="damagedQuantity"
                                type="number"
                                min="0"
                                max={record.physicalQuantity - record.reservedQuantity}
                                defaultValue={record.damagedQuantity}
                                required
                              />
                            </label>
                            <button disabled={busyAction === record.id}>Save</button>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => setEditingInventoryId("")}
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <button
                            className="secondary"
                            onClick={() => setEditingInventoryId(record.id)}
                          >
                            Edit stock
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="No inventory" detail="Stock records will appear here." />
          )}
        </div>
      </div>
    </section>
  );
}
