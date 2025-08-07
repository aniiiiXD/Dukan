const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

// ==========================================
// CONFIGURATION & SETUP
// ==========================================

const app = express();

// Middleware Configuration
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:8080",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ==========================================
// RAZORPAY INITIALIZATION
// ==========================================

let razorpay = null;
let isRazorpayEnabled = false;

const initializeRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log(
      "⚠️ Razorpay credentials not found - payment integration will work in test mode"
    );
    return false;
  }

  try {
    const Razorpay = require("razorpay");

    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log(
      "✅ Razorpay initialized successfully with key:",
      process.env.RAZORPAY_KEY_ID
    );
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Razorpay:", error.message);
    return false;
  }
};

isRazorpayEnabled = initializeRazorpay();

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Validation result
 */
const validateRequiredFields = (body, requiredFields) => {
  const missingFields = requiredFields.filter((field) => {
    const value = field.split(".").reduce((obj, key) => obj?.[key], body);
    return !value;
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Generate unique receipt ID
 * @returns {String} - Unique receipt ID
 */
const generateReceiptId = () => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Verify Razorpay payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID
 * @param {String} signature - Razorpay signature
 * @returns {Boolean} - Verification result
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!isRazorpayEnabled) {
    console.log("⚠️ Razorpay not enabled - skipping signature verification");
    return true; // Allow in test mode
  }

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
};

// ==========================================
// ORDER MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Create new order with Razorpay integration
 * POST /api/v1/orders
 */
app.post("/api/v1/orders", async (req, res) => {
  console.log("🎯 Creating order with data:", {
    itemsCount: req.body.items?.length,
    email: req.body.email,
    totalAmount: req.body.totalAmount,
  });

  try {
    const {
      items,
      billingAddress,
      shippingAddress,
      phoneNumber,
      email,
      totalAmount,
    } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, [
      "items",
      "billingAddress",
      "shippingAddress",
      "phoneNumber",
      "email",
      "totalAmount",
    ]);

    if (!validation.isValid) {
      console.log("❌ Missing required fields:", validation.missingFields);
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        missingFields: validation.missingFields,
        code: "VALIDATION_ERROR",
      });
    }

    // Validate totalAmount
    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Total amount must be greater than 0",
        code: "INVALID_AMOUNT",
      });
    }

    let orderResponse;

    if (isRazorpayEnabled) {
      // Create Razorpay order
      console.log("💳 Creating Razorpay order...");

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Amount in paise
        currency: "INR",
        receipt: generateReceiptId(),
        notes: {
          customer_email: email,
          customer_phone: phoneNumber,
          billing_city: billingAddress.city || "Not provided",
          shipping_city: shippingAddress.city || "Not provided",
          items_count: items.length,
        },
      });

      console.log("✅ Razorpay order created:", razorpayOrder.id);

      orderResponse = {
        success: true,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        order: {
          id: razorpayOrder.id,
          receipt: razorpayOrder.receipt,
          status: razorpayOrder.status,
          created_at: razorpayOrder.created_at,
        },
      };
    } else {
      // Test mode - create mock order
      console.log("🧪 Creating test order (Razorpay not configured)...");

      const mockOrderId = `test_order_${Date.now()}`;

      orderResponse = {
        success: true,
        razorpay_order_id: mockOrderId,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        key_id: "test_key_id",
        test_mode: true,
        order: {
          id: mockOrderId,
          receipt: generateReceiptId(),
          status: "created",
          created_at: Math.floor(Date.now() / 1000),
        },
      };
    }

    // TODO: Store order in database here
    // const dbOrder = await saveOrderToDatabase({
    //   razorpay_order_id: orderResponse.razorpay_order_id,
    //   customer_email: email,
    //   customer_phone: phoneNumber,
    //   billing_address: billingAddress,
    //   shipping_address: shippingAddress,
    //   items: items,
    //   total_amount: totalAmount,
    //   status: 'pending'
    // });

    res.json(orderResponse);
  } catch (error) {
    console.error("❌ Error creating order:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create order",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      code: "ORDER_CREATION_FAILED",
    });
  }
});

/**
 * Verify payment and update order status
 * PUT /api/v1/orders
 */
app.put("/api/v1/orders", async (req, res) => {
  console.log("🔐 Verifying payment:", {
    orderId: req.body.razorpay_order_id,
    paymentId: req.body.razorpay_payment_id,
  });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, [
      "razorpay_order_id",
      "razorpay_payment_id",
      "razorpay_signature",
    ]);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Missing payment verification data",
        missingFields: validation.missingFields,
        code: "VALIDATION_ERROR",
      });
    }

    // Handle test orders
    if (razorpay_order_id.startsWith("test_order_")) {
      console.log("🧪 Test payment verification - auto approving");

      // TODO: Update test order in database

      return res.json({
        success: true,
        message: "Test payment verified successfully",
        test_mode: true,
        order: {
          id: razorpay_order_id,
          status: "paid",
          verified_at: new Date().toISOString(),
        },
      });
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      console.log("❌ Payment signature verification failed");
      return res.status(400).json({
        success: false,
        error: "Payment verification failed",
        code: "PAYMENT_VERIFICATION_FAILED",
      });
    }

    console.log("✅ Payment verified successfully");

    // TODO: Update order in database
    // const updatedOrder = await updateOrderPaymentStatus({
    //   razorpay_order_id,
    //   razorpay_payment_id,
    //   razorpay_signature,
    //   status: 'paid'
    // });

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: {
        id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        status: "paid",
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      code: "PAYMENT_VERIFICATION_ERROR",
    });
  }
});

// ==========================================
// LEGACY ENDPOINTS (Backward Compatibility)
// ==========================================

/**
 * Legacy order creation endpoint
 * POST /api/create-order
 */
app.post("/api/create-order", async (req, res) => {
  console.log("🔄 Legacy order creation endpoint called");

  try {
    const { amount, currency = "INR", customerInfo } = req.body;

    if (!amount || !customerInfo) {
      return res.status(400).json({
        success: false,
        error: "Amount and customerInfo are required",
        code: "VALIDATION_ERROR",
      });
    }

    if (!isRazorpayEnabled) {
      return res.status(503).json({
        success: false,
        error: "Payment service not available",
        code: "SERVICE_UNAVAILABLE",
      });
    }

    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: generateReceiptId(),
      payment_capture: 1,
      notes: {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        billing_address: JSON.stringify(customerInfo.billingAddress),
        shipping_address: JSON.stringify(customerInfo.shippingAddress),
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error in legacy order creation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create order",
      code: "ORDER_CREATION_FAILED",
    });
  }
});

/**
 * Legacy payment verification endpoint
 * POST /api/verify-payment
 */
app.post("/api/verify-payment", (req, res) => {
  console.log("🔄 Legacy payment verification endpoint called");

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (isValid) {
      res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
        code: "PAYMENT_VERIFICATION_FAILED",
      });
    }
  } catch (error) {
    console.error("Legacy payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

// ==========================================
// PAYMENT INFORMATION ENDPOINTS
// ==========================================

/**
 * Get payment details by payment ID
 * GET /api/payment/:payment_id
 */
app.get("/api/payment/:payment_id", async (req, res) => {
  try {
    const { payment_id } = req.params;

    if (!isRazorpayEnabled) {
      return res.status(503).json({
        success: false,
        error: "Payment service not available",
        code: "SERVICE_UNAVAILABLE",
      });
    }

    const payment = await razorpay.payments.fetch(payment_id);

    res.json({
      success: true,
      payment: payment,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);

    if (error.statusCode === 404) {
      res.status(404).json({
        success: false,
        error: "Payment not found",
        code: "PAYMENT_NOT_FOUND",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to fetch payment details",
        code: "PAYMENT_FETCH_FAILED",
      });
    }
  }
});

// ==========================================
// HEALTH CHECK & DEBUG ENDPOINTS
// ==========================================

/**
 * Health check endpoint
 * GET /api/health
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment API server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    razorpay_status: isRazorpayEnabled ? "enabled" : "disabled",
    endpoints: {
      orders: ["POST /api/v1/orders", "PUT /api/v1/orders"],
      legacy: ["POST /api/create-order", "POST /api/verify-payment"],
      info: ["GET /api/payment/:payment_id", "GET /api/health"],
    },
  });
});

/**
 * Debug endpoint for development
 * GET /api/debug/config
 */
app.get("/api/debug/config", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      error: "Debug endpoints not available in production",
    });
  }

  res.json({
    success: true,
    config: {
      node_env: process.env.NODE_ENV,
      razorpay_enabled: isRazorpayEnabled,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID ? "Set" : "Not Set",
      razorpay_key_secret: process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not Set",
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

/**
 * Global error handling middleware
 */
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);

  res.status(err.status || 500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && {
      details: err.message,
      stack: err.stack,
    }),
  });
});

/**
 * 404 handler for undefined routes
 */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
    path: req.originalUrl,
    code: "ENDPOINT_NOT_FOUND",
    available_endpoints: [
      "POST /api/v1/orders",
      "PUT /api/v1/orders",
      "GET /api/health",
    ],
  });
});

// ==========================================
// MODULE EXPORT
// ==========================================

module.exports = app;
