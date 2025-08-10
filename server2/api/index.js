const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config();

// ==========================================
// ENVIRONMENT AND CONFIGURATION
// ==========================================

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Load environment-specific configuration
const envPath = path.resolve(__dirname, `.env.${NODE_ENV}`);
const defaultEnvPath = path.resolve(__dirname, ".env");

console.log(`🔍 Starting Jhankari backend in ${NODE_ENV} mode...`);
console.log(`📁 Looking for: ${envPath}`);

// Load environment variables
require("dotenv").config({ path: envPath });
require("dotenv").config({ path: defaultEnvPath });

// Debug environment variables
console.log("🔍 Environment Variables Check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log(
  "SUPABASE_URL:",
  process.env.SUPABASE_URL ? "Set ✅" : "Missing ❌"
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set ✅" : "Missing ❌"
);
console.log(
  "SUPABASE_ANON_KEY:",
  process.env.SUPABASE_ANON_KEY ? "Set ✅" : "Missing ❌"
);
console.log(
  "RAZORPAY_KEY_ID:",
  process.env.RAZORPAY_KEY_ID ? "Set ✅" : "Missing ❌"
);
console.log(
  "RAZORPAY_KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET ? "Set ✅" : "Missing ❌"
);

// Environment validation
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error(
    "Please check your .env files and ensure all required variables are set."
  );
  process.exit(1);
}

// ==========================================
// SUPABASE INITIALIZATION
// ==========================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
    global: { headers: { "x-application-name": "jhankari-backend" } },
  }
);

console.log(`✅ Supabase client initialized for ${NODE_ENV}`);

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS Configuration
const allowedOrigins =
  NODE_ENV === "production"
    ? [
        "https://jhankari.com",
        "https://www.jhankari.com",
        "https://api.jhankari.com",
        "https://your-domain.vercel.app",
      ]
    : [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
      ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (NODE_ENV === "development") {
        console.warn(
          `⚠️ CORS allowing unknown origin in development: ${origin}`
        );
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: NODE_ENV === "production" ? 86400 : 0,
  })
);

app.options("*", cors());

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

const generateReceiptId = () => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!isRazorpayEnabled) {
    console.log("⚠️ Razorpay not enabled - skipping signature verification");
    return true;
  }
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");
  return expectedSignature === signature;
};

// Database helper functions
const getAllProducts = async () => {
  try {
    console.log("📦 Fetching products from database...");
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (
          name,
          slug
        )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    console.log(`✅ Found ${data?.length || 0} products`);
    return data || [];
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    throw error;
  }
};

const addToCart = async (userId, productId, quantity = 1) => {
  try {
    console.log(
      `🛒 Adding to cart: User ${userId}, Product ${productId}, Qty ${quantity}`
    );

    const { data: existing, error: selectError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (existing && !selectError) {
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: existing.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*, products(*)")
        .single();

      if (error) {
        console.error("❌ Error updating cart item:", error);
        throw error;
      }
      console.log("✅ Cart item quantity updated");
      return data;
    } else {
      const { data, error } = await supabase
        .from("cart_items")
        .insert([
          {
            user_id: userId,
            product_id: productId,
            quantity: quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("*, products(*)")
        .single();

      if (error) {
        console.error("❌ Error inserting cart item:", error);
        throw error;
      }
      console.log("✅ New item added to cart");
      return data;
    }
  } catch (error) {
    console.error("❌ Error in addToCart:", error);
    throw error;
  }
};

const getCart = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        *,
        products (*)
      `
      )
      .eq("user_id", userId);

    if (error) throw error;

    const cart = {
      id: `cart-${userId}`,
      userId: userId,
      CartItem: data.map((item) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        addedAt: item.created_at,
        Product: item.products,
      })),
    };
    return cart;
  } catch (error) {
    throw error;
  }
};

const removeFromCart = async (userId, productId) => {
  try {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) throw error;
    console.log("✅ Item removed from cart");
  } catch (error) {
    throw error;
  }
};

// ==========================================
// API ROUTES - HEALTH & DEBUG
// ==========================================

app.get("/health", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("count")
      .limit(1);

    const dbStatus = error ? "disconnected" : "connected";

    res.status(200).json({
      status: "OK",
      service: "Jhankari E-commerce API",
      environment: NODE_ENV,
      database: dbStatus,
      timestamp: new Date().toISOString(),
      domain: req.get("host"),
      version: "1.0.0",
      uptime: process.uptime(),
      razorpay_status: isRazorpayEnabled ? "enabled" : "disabled",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
    });
  }
});

app.get("/api/debug/test-connection", async (req, res) => {
  if (NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      error: "Debug endpoints not available in production",
    });
  }

  try {
    console.log("🔧 Testing database connection...");
    const { data, error } = await supabase
      .from("products")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Database test failed:", error);
      return res.status(500).json({
        success: false,
        error: "Database connection failed",
        details: error.message,
      });
    }

    console.log("✅ Database connection successful");
    res.json({
      success: true,
      message: "Database connection working",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Database connection error:", error);
    res.status(500).json({
      success: false,
      error: "Database connection error",
      details: error.message,
    });
  }
});

// ==========================================
// API ROUTES - PRODUCTS
// ==========================================

app.get("/api/v1/products", async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Products endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
      code: "PRODUCTS_FETCH_ERROR",
    });
  }
});

// ==========================================
// API ROUTES - CART MANAGEMENT
// ==========================================

app.post("/api/v1/cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: "UserId and productId are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    const cartItem = await addToCart(userId, productId, quantity || 1);

    res.json({
      success: true,
      message: "Item added to cart",
      cartItem: cartItem,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add to cart",
      code: "CART_ADD_FAILED",
    });
  }
});

app.post("/api/v1/cart/merge", async (req, res) => {
  try {
    const { userId, guestCartItems } = req.body;

    if (!userId || !guestCartItems || !Array.isArray(guestCartItems)) {
      return res.status(400).json({
        success: false,
        error: "UserId and guestCartItems array are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    for (const item of guestCartItems) {
      try {
        await addToCart(userId, item.productId, item.quantity);
      } catch (error) {
        console.warn(`Failed to merge item ${item.productId}:`, error.message);
      }
    }

    const cart = await getCart(userId);
    res.json({
      success: true,
      message: "Guest cart merged successfully",
      cart: cart,
    });
  } catch (error) {
    console.error("Error merging cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to merge cart",
      code: "CART_MERGE_FAILED",
    });
  }
});

app.delete("/api/v1/cart", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: "UserId and productId are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    await removeFromCart(userId, productId);

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove from cart",
      code: "CART_REMOVE_FAILED",
    });
  }
});

app.get("/api/v1/cart/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const cart = await getCart(userId);

    if (!cart || cart.CartItem.length === 0) {
      return res.json({
        success: true,
        id: null,
        userId: userId,
        CartItem: [],
        items: [],
      });
    }

    res.json({
      success: true,
      ...cart,
    });
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cart",
      code: "CART_GET_FAILED",
    });
  }
});

// ==========================================
// API ROUTES - ORDER MANAGEMENT
// ==========================================

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

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Total amount must be greater than 0",
        code: "INVALID_AMOUNT",
      });
    }

    let orderResponse;

    if (isRazorpayEnabled) {
      console.log("💳 Creating Razorpay order...");

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
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
    res.json(orderResponse);
  } catch (error) {
    console.error("❌ Error creating order:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create order",
      details: NODE_ENV === "development" ? error.message : undefined,
      code: "ORDER_CREATION_FAILED",
    });
  }
});

app.put("/api/v1/orders", async (req, res) => {
  console.log("🔐 Verifying payment:", {
    orderId: req.body.razorpay_order_id,
    paymentId: req.body.razorpay_payment_id,
  });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

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

    if (razorpay_order_id.startsWith("test_order_")) {
      console.log("🧪 Test payment verification - auto approving");

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
      details: NODE_ENV === "development" ? error.message : undefined,
      code: "PAYMENT_VERIFICATION_ERROR",
    });
  }
});

// ==========================================
// LEGACY ENDPOINTS (Backward Compatibility)
// ==========================================

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
// ERROR HANDLING MIDDLEWARE
// ==========================================

app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);

  res.status(err.status || 500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(NODE_ENV === "development" && {
      details: err.message,
      stack: err.stack,
    }),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
    path: req.originalUrl,
    code: "ENDPOINT_NOT_FOUND",
    available_endpoints: {
      health: ["GET /health"],
      products: ["GET /api/v1/products"],
      cart: [
        "POST /api/v1/cart",
        "POST /api/v1/cart/merge",
        "DELETE /api/v1/cart",
        "GET /api/v1/cart/:userId",
      ],
      orders: ["POST /api/v1/orders", "PUT /api/v1/orders"],
      legacy: ["POST /api/create-order", "POST /api/verify-payment"],
    },
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

app.listen(PORT, async () => {
  console.log(`🚀 Jhankari E-commerce API started`);
  console.log(`🌐 Environment: ${NODE_ENV}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(
    `🔗 API Base: ${
      NODE_ENV === "production"
        ? "https://api.jhankari.com"
        : `http://localhost:${PORT}`
    }`
  );
  console.log(`🛡️ CORS Origins: ${allowedOrigins.join(", ")}`);
  console.log(
    `💳 Razorpay Status: ${isRazorpayEnabled ? "Enabled" : "Test Mode"}`
  );

  try {
    const { data, error } = await supabase
      .from("products")
      .select("count")
      .limit(1);
    if (!error) {
      console.log(`🎉 All systems operational in ${NODE_ENV} mode!`);
    } else {
      console.error("⚠️ Database connection issues - Check configuration");
    }
  } catch (error) {
    console.error("⚠️ Database connection issues - Check configuration");
  }
});

module.exports = app;
