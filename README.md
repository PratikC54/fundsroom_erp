# Fundsroom ERP

It is a focused manufacturing-sales ERP for the chain **customer enquiry → quotation → sales order → inventory reservation → dispatch**. It intentionally does not attempt to be a general-purpose ERP.

## Stack

- React + Vite client
- Express REST API, Zod validation and JWT authentication
- PostgreSQL + Prisma
- bcrypt password hashing and Jest test suite
- OpenAPI 3 specification with Swagger UI

## Project layout

```
client/                 React workflow screens
server/prisma/          PostgreSQL schema and seed
server/src/modules/     Auth, catalogue, enquiries, quotations, orders, dispatches
server/tests/           Domain-rule tests
```

## Start locally

1. Create a PostgreSQL database called `fundsroom_erp`.
2. In `server/.env` set `DATABASE_URL` and a long `JWT_SECRET`.
3. Install the server packages and prepare the database:

	```powershell
	cd server
	npm install
	npm run prisma:generate
	npm run prisma:migrate
	npm run prisma:seed
	```

4. In one terminal, start the API:

	```powershell
	cd server
	npm run dev
	```

5. In another terminal, install and start the client:

	```powershell
	cd client
	npm install
	npm run dev
	```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:4000`. Interactive API documentation is at `http://localhost:4000/api-docs` and the raw OpenAPI document is at `http://localhost:4000/api-docs.json`.

Seed credentials:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fundsroom.local` | `Welcome@123` |
| Sales | `sales@fundsroom.local` | `Welcome@123` |

Run the client production build from `client` with `npm run build`. Run the server tests from `server` with `npm test`.


## Important business rules

- Totals are produced in the quotation service from quantity, unit price, discount, and GST; a client cannot choose the final price.
- Only `ACCEPTED` quotations can convert to an order. `SalesOrder.quotationId` has a database unique constraint, preventing a second conversion even during a race.
- Admin confirmation locks all related `Inventory` rows in product-ID order inside a serializable PostgreSQL transaction. It rereads inventory after locking, calculates availability in one place, reserves inventory and changes the order state in the same transaction.
- Availability is `physicalQuantity - reservedQuantity - damagedQuantity`. `damagedQuantity` is already represented in the schema so adding a damaged-stock workflow does not require rewriting reservation logic.
- Dispatch also runs transactionally: it checks order state and remaining quantities, creates a dispatch, decreases physical and reserved stock, then marks the order dispatched once all lines have shipped.

