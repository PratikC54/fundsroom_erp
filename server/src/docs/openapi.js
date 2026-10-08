const errorResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
});

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
};

const productIdParameter = {
  name: "productId",
  in: "path",
  required: true,
  schema: { type: "string" },
};

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Fundsroom ERP API",
    version: "1.0.0",
    description:
      "API for customer enquiries, quotations, sales orders, inventory, and dispatches. Use the Authorize button to enter a bearer token for protected endpoints.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Service status" },
    { name: "Authentication", description: "Login and access tokens" },
    { name: "Customers", description: "Customer records" },
    { name: "Products", description: "Product catalogue" },
    { name: "Inventory", description: "Stock quantities and availability" },
    { name: "Enquiries", description: "Customer product requests" },
    { name: "Quotations", description: "Pricing and quotation review" },
    { name: "Sales orders", description: "Accepted quotations and order fulfilment" },
    { name: "Dispatches", description: "Recorded shipments" },
  ],
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API status",
        operationId: "getHealth",
        security: [],
        responses: {
          "200": {
            description: "The API is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Sign in",
        operationId: "login",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login succeeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "401": errorResponse("Email or password is incorrect"),
          "422": errorResponse("The request body is invalid"),
        },
      },
    },
    "/api/customers": {
      get: {
        tags: ["Customers"],
        summary: "List customers",
        operationId: "getCustomers",
        responses: {
          "200": {
            description: "Customers ordered by company name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Customer" },
                },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
        },
      },
      post: {
        tags: ["Customers"],
        summary: "Create a customer",
        description: "Sales users can create customers.",
        operationId: "createCustomer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CustomerInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Customer created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Customer" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Only sales users can create customers"),
          "409": errorResponse("A customer with this email already exists"),
          "422": errorResponse("The request body is invalid"),
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List products",
        operationId: "getProducts",
        responses: {
          "200": {
            description: "Products with inventory details",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create a product",
        description: "Administrators only. Physical quantity is optional and defaults to zero.",
        operationId: "createProduct",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Product created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Administrator role is required"),
          "409": errorResponse("A product with this code already exists"),
          "422": errorResponse("The request body is invalid"),
        },
      },
    },
    "/api/inventory": {
      get: {
        tags: ["Inventory"],
        summary: "View stock and availability",
        operationId: "getInventory",
        responses: {
          "200": {
            description: "Inventory records including calculated available quantities",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/InventoryRecord" },
                },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
        },
      },
    },
    "/api/inventory/{productId}": {
      patch: {
        tags: ["Inventory"],
        summary: "Update stock quantities",
        description: "Administrators only. Physical stock must cover reserved and damaged stock.",
        operationId: "updateInventory",
        parameters: [productIdParameter],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InventoryUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Inventory updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InventoryRecord" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Administrator role is required"),
          "404": errorResponse("Inventory record was not found"),
          "422": errorResponse("Stock quantities are invalid"),
        },
      },
    },
    "/api/enquiries": {
      get: {
        tags: ["Enquiries"],
        summary: "List enquiries",
        operationId: "getEnquiries",
        responses: {
          "200": {
            description: "Enquiries with customer, products, and creator",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Enquiry" },
                },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
        },
      },
      post: {
        tags: ["Enquiries"],
        summary: "Create an enquiry",
        description: "Sales users only. Required date must be on or after enquiry date.",
        operationId: "createEnquiry",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EnquiryInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Enquiry created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Enquiry" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Only sales users can create enquiries"),
          "422": errorResponse("The request body is invalid"),
        },
      },
    },
    "/api/enquiries/{id}": {
      get: {
        tags: ["Enquiries"],
        summary: "Get one enquiry",
        operationId: "getEnquiry",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Enquiry details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Enquiry" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "404": errorResponse("Enquiry was not found"),
        },
      },
    },
    "/api/quotations": {
      get: {
        tags: ["Quotations"],
        summary: "List quotations",
        operationId: "getQuotations",
        responses: {
          "200": {
            description: "Quotations with customer and line items",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Quotation" },
                },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
        },
      },
      post: {
        tags: ["Quotations"],
        summary: "Create a quotation",
        description: "Sales users only. The server calculates all line and grand totals.",
        operationId: "createQuotation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/QuotationInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Draft quotation created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Quotation" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Only sales users can create quotations"),
          "404": errorResponse("Enquiry was not found"),
          "409": errorResponse("The enquiry already has a quotation"),
          "422": errorResponse("The request body is invalid"),
        },
      },
    },
    "/api/quotations/{id}": {
      get: {
        tags: ["Quotations"],
        summary: "Get one quotation",
        operationId: "getQuotation",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Quotation details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Quotation" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "404": errorResponse("Quotation was not found"),
        },
      },
    },
    "/api/quotations/{id}/status": {
      patch: {
        tags: ["Quotations"],
        summary: "Change quotation status",
        description:
          "Sales users can mark a draft as sent. Administrators can accept or reject draft or sent quotations.",
        operationId: "updateQuotationStatus",
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/QuotationStatusUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Quotation status updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Quotation" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("The user's role cannot perform this status change"),
          "404": errorResponse("Quotation was not found"),
          "409": errorResponse("The status transition is not allowed"),
          "422": errorResponse("The request body is invalid"),
        },
      },
    },
    "/api/quotations/{id}/convert": {
      post: {
        tags: ["Quotations"],
        summary: "Convert an accepted quotation to a sales order",
        description: "Sales users only. Each quotation can be converted once.",
        operationId: "convertQuotation",
        parameters: [idParameter],
        responses: {
          "201": {
            description: "Sales order created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SalesOrder" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Only sales users can convert quotations"),
          "404": errorResponse("Quotation was not found"),
          "409": errorResponse("Quotation is not accepted or was already converted"),
        },
      },
    },
    "/api/sales-orders": {
      get: {
        tags: ["Sales orders"],
        summary: "List sales orders",
        operationId: "getSalesOrders",
        responses: {
          "200": {
            description: "Sales orders with customer and line items",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SalesOrder" },
                },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
        },
      },
    },
    "/api/sales-orders/{id}": {
      get: {
        tags: ["Sales orders"],
        summary: "Get one sales order",
        operationId: "getSalesOrder",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Sales order details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SalesOrder" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "404": errorResponse("Sales order was not found"),
        },
      },
    },
    "/api/sales-orders/{id}/confirm": {
      post: {
        tags: ["Sales orders"],
        summary: "Confirm a sales order and reserve stock",
        description: "Administrators only. Fails if available inventory is insufficient.",
        operationId: "confirmSalesOrder",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Order confirmed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SalesOrder" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Administrator role is required"),
          "404": errorResponse("Sales order was not found"),
          "409": errorResponse("Sales order is not pending"),
          "422": errorResponse("Inventory is missing or insufficient"),
        },
      },
    },
    "/api/sales-orders/{id}/dispatch": {
      post: {
        tags: ["Sales orders"],
        summary: "Dispatch sales order items",
        description: "Administrators only. Supports partial dispatches.",
        operationId: "dispatchSalesOrder",
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DispatchInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Dispatch recorded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Dispatch" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "403": errorResponse("Administrator role is required"),
          "404": errorResponse("Sales order was not found"),
          "409": errorResponse("Sales order is not confirmed"),
          "422": errorResponse("Dispatch quantities or details are invalid"),
        },
      },
    },
    "/api/dispatches": {
      get: {
        tags: ["Dispatches"],
        summary: "List dispatches",
        operationId: "getDispatches",
        responses: {
          "200": {
            description: "Dispatch records",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Dispatch" },
                },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
        },
      },
    },
    "/api/dispatches/{id}": {
      get: {
        tags: ["Dispatches"],
        summary: "Get one dispatch",
        operationId: "getDispatch",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Dispatch details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Dispatch" },
              },
            },
          },
          "401": errorResponse("A valid bearer token is required"),
          "404": errorResponse("Dispatch was not found"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: {
            oneOf: [
              { type: "array", items: { type: "object", additionalProperties: true } },
              { type: "object", additionalProperties: true },
            ],
          },
        },
        required: ["error"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "sales@example.com" },
          password: { type: "string", format: "password", example: "password" },
        },
        required: ["email", "password"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "SALES"] },
        },
        required: ["id", "name", "email", "role"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT bearer token" },
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["token", "user"],
      },
      CustomerInput: {
        type: "object",
        properties: {
          companyName: { type: "string", minLength: 2 },
          contactPerson: { type: "string", minLength: 2 },
          mobile: { type: "string", minLength: 6 },
          email: { type: "string", format: "email" },
          city: { type: "string", minLength: 2 },
        },
        required: ["companyName", "contactPerson", "mobile", "email", "city"],
      },
      Customer: {
        allOf: [
          { $ref: "#/components/schemas/CustomerInput" },
          {
            type: "object",
            properties: {
              id: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      ProductInput: {
        type: "object",
        properties: {
          productCode: { type: "string", minLength: 2 },
          name: { type: "string", minLength: 2 },
          category: { type: "string", minLength: 2 },
          unit: { type: "string", minLength: 1 },
          basePrice: { type: "number", minimum: 0 },
          physicalQuantity: { type: "integer", minimum: 0, default: 0 },
        },
        required: ["productCode", "name", "category", "unit", "basePrice"],
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          productCode: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          unit: { type: "string" },
          basePrice: { type: "string", example: "2850.00" },
          inventory: { type: "object", nullable: true },
        },
      },
      InventoryUpdate: {
        type: "object",
        properties: {
          physicalQuantity: { type: "integer", minimum: 0 },
          damagedQuantity: { type: "integer", minimum: 0, default: 0 },
        },
        required: ["physicalQuantity"],
      },
      InventoryRecord: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          physicalQuantity: { type: "integer" },
          reservedQuantity: { type: "integer" },
          damagedQuantity: { type: "integer" },
          availableQuantity: { type: "integer", description: "Physical minus reserved minus damaged" },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      EnquiryItemInput: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
        },
        required: ["productId", "quantity"],
      },
      EnquiryInput: {
        type: "object",
        properties: {
          customerId: { type: "string" },
          enquiryDate: { type: "string", format: "date" },
          requiredDate: { type: "string", format: "date" },
          notes: { type: "string", maxLength: 1000 },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/EnquiryItemInput" },
          },
        },
        required: ["customerId", "enquiryDate", "requiredDate", "items"],
      },
      Enquiry: {
        type: "object",
        properties: {
          id: { type: "string" },
          enquiryNumber: { type: "string" },
          customerId: { type: "string" },
          enquiryDate: { type: "string", format: "date-time" },
          requiredDate: { type: "string", format: "date-time" },
          notes: { type: "string", nullable: true },
          status: { type: "string", enum: ["NEW", "QUOTED", "WON", "LOST"] },
          customer: { $ref: "#/components/schemas/Customer" },
          items: { type: "array", items: { $ref: "#/components/schemas/EnquiryItem" } },
        },
      },
      EnquiryItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          quantity: { type: "integer" },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      QuotationItemInput: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
          unitPrice: { type: "number", minimum: 0 },
          discountPct: { type: "number", minimum: 0, maximum: 100, default: 0 },
          gstPct: { type: "number", minimum: 0, maximum: 100, default: 18 },
        },
        required: ["productId", "quantity", "unitPrice"],
      },
      QuotationInput: {
        type: "object",
        properties: {
          enquiryId: { type: "string" },
          validUntil: { type: "string", format: "date" },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/QuotationItemInput" },
          },
        },
        required: ["enquiryId", "validUntil", "items"],
      },
      QuotationStatusUpdate: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["SENT", "ACCEPTED", "REJECTED"] },
        },
        required: ["status"],
      },
      Quotation: {
        type: "object",
        properties: {
          id: { type: "string" },
          quotationNumber: { type: "string" },
          enquiryId: { type: "string" },
          customerId: { type: "string" },
          validUntil: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] },
          grandTotal: { type: "string", example: "32490.00" },
          customer: { $ref: "#/components/schemas/Customer" },
          items: { type: "array", items: { $ref: "#/components/schemas/QuotationItem" } },
          salesOrder: { type: "object", nullable: true },
        },
      },
      QuotationItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          quantity: { type: "integer" },
          unitPrice: { type: "string", example: "2850.00" },
          discountPct: { type: "string", example: "5.00" },
          gstPct: { type: "string", example: "18.00" },
          lineAmount: { type: "string", example: "32490.00" },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      SalesOrder: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "string" },
          quotationId: { type: "string" },
          customerId: { type: "string" },
          totalAmount: { type: "string", example: "32490.00" },
          status: { type: "string", enum: ["PENDING", "CONFIRMED", "DISPATCHED", "CANCELLED"] },
          customer: { $ref: "#/components/schemas/Customer" },
          items: { type: "array", items: { $ref: "#/components/schemas/SalesOrderItem" } },
        },
      },
      SalesOrderItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          quantity: { type: "integer" },
          unitPrice: { type: "string", example: "2850.00" },
          lineAmount: { type: "string", example: "32490.00" },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      DispatchItemInput: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
        },
        required: ["productId", "quantity"],
      },
      DispatchInput: {
        type: "object",
        properties: {
          vehicleNumber: { type: "string", minLength: 2 },
          driverName: { type: "string", minLength: 2 },
          dispatchDate: { type: "string", format: "date-time" },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/DispatchItemInput" },
          },
        },
        required: ["vehicleNumber", "driverName", "items"],
      },
      Dispatch: {
        type: "object",
        properties: {
          id: { type: "string" },
          dispatchNumber: { type: "string" },
          salesOrderId: { type: "string" },
          dispatchDate: { type: "string", format: "date-time" },
          vehicleNumber: { type: "string" },
          driverName: { type: "string" },
          items: { type: "array", items: { $ref: "#/components/schemas/DispatchItem" } },
        },
      },
      DispatchItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          quantity: { type: "integer" },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
    },
  },
};

export default openApiSpec;
