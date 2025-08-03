const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Load environment-specific configuration
const NODE_ENV = process.env.NODE_ENV || "development";

// Load appropriate env file
require("dotenv").config({
  path: path.resolve(__dirname, `.env.${NODE_ENV}`),
});

// Fallback to default .env if specific env file doesn't exist
require("dotenv").config();

console.log(`🔍 Starting Jhankari backend in ${NODE_ENV} mode...`);

const app = express();
const PORT = process.env.PORT || 3000;

// Environment-specific configuration
const config = {
  development: {
    corsOrigins: [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:8080",
    ],
    logLevel: "debug",
    enableDebug: true,
    securityHeaders: false,
    timeout: 10000,
  },
  production: {
    corsOrigins: [
      "https://jhankari.com",
      "https://www.jhankari.com",
      "https://api.jhankari.com",
    ],
    logLevel: "info",
    enableDebug: false,
    securityHeaders: true,
    timeout: 30000,
  },
};

const currentConfig = config[NODE_ENV] || config.development;

// Enhanced environment validation
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

// Initialize Supabase with enhanced configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: { "x-application-name": "jhankari-backend" },
    },
  }
);

console.log(`✅ Supabase client initialized for ${NODE_ENV}`);

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : currentConfig.corsOrigins;

    if (currentConfig.enableDebug) {
      console.log(
        `🌐 CORS check - Origin: ${origin}, Allowed: ${allowedOrigins.includes(
          origin
        )}`
      );
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (NODE_ENV === "development") {
        console.warn(
          `⚠️ CORS allowing unknown origin in development: ${origin}`
        );
        callback(null, true); // Allow in development
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
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
  maxAge: NODE_ENV === "production" ? 86400 : 0, // Cache preflight for 24h in production
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enhanced logging middleware
app.use((req, res, next) => {
  if (currentConfig.logLevel === "debug") {
    const timestamp = new Date().toISOString();
    const origin = req.get("Origin") || "No Origin";
    const userAgent = req.get("User-Agent") || "Unknown";
    console.log(
      `${timestamp} - ${req.method} ${
        req.path
      } - Origin: ${origin} - UA: ${userAgent.substring(0, 50)}`
    );
  }
  next();
});

// Security headers middleware (applied conditionally)
app.use((req, res, next) => {
  // Basic security headers for all environments
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Production-only security headers
  if (currentConfig.securityHeaders) {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    );
  }
  next();
});

// Database connection test (single definition)
const testDatabase = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("count")
      .limit(1);

    if (error) throw error;

    if (currentConfig.enableDebug) {
      console.log(`✅ Database connection test passed (${NODE_ENV})`);
    }
    return true;
  } catch (error) {
    console.error(
      `❌ Database connection test failed (${NODE_ENV}):`,
      error.message
    );
    return false;
  }
};

// Database functions (single definitions)
const getAllProducts = async () => {
  try {
    if (currentConfig.enableDebug) {
      console.log("📦 Fetching products from database...");
    }

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

    if (currentConfig.enableDebug) {
      console.log(`✅ Found ${data?.length || 0} products`);
    }
    return data || [];
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    throw error;
  }
};

const createOrUpdateUserProfile = async (authUser) => {
  try {
    if (currentConfig.enableDebug) {
      console.log("👤 Creating/updating user profile for:", authUser.email);
    }

    const userData = {
      id: authUser.id,
      email: authUser.email,
      first_name:
        authUser.user_metadata?.full_name?.split(" ")[0] ||
        authUser.user_metadata?.name?.split(" ")[0] ||
        null,
      last_name:
        authUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
        authUser.user_metadata?.name?.split(" ").slice(1).join(" ") ||
        null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    let userProfile;
    if (existingUser) {
      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("id", authUser.id)
        .select()
        .single();

      if (error) throw error;
      userProfile = data;
      if (currentConfig.enableDebug) {
        console.log("✅ User profile updated");
      }
    } else {
      userData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      userProfile = data;
      if (currentConfig.enableDebug) {
        console.log("✅ New user profile created");
      }
    }

    return userProfile;
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
};

// Cart management functions
const addToCart = async (userId, productId, quantity = 1) => {
  try {
    if (currentConfig.enableDebug) {
      console.log(
        `🛒 Adding to cart: User ${userId}, Product ${productId}, Qty ${quantity}`
      );
    }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: existing.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*, products(*)")
        .single();

      if (error) throw error;
      if (currentConfig.enableDebug) {
        console.log("✅ Cart item quantity updated");
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from("cart_items")
        .insert([
          {
            user_id: userId,
            product_id: productId,
            quantity: quantity,
          },
        ])
        .select("*, products(*)")
        .single();

      if (error) throw error;
      if (currentConfig.enableDebug) {
        console.log("✅ New item added to cart");
      }
      return data;
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

// Merge guest cart items into user cart endpoint
app.post("/api/v1/cart/merge", async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: "Invalid payload: userId and items are required",
        code: "MISSING_FIELDS",
      });
    }

    // Iterate guest cart items and add/increment in DB cart
    for (const item of items) {
      if (item.productId && item.quantity > 0) {
        await addToCart(userId, item.productId, item.quantity);
      }
    }

    res.json({ success: true, message: "Cart merged successfully" });
  } catch (error) {
    console.error("Error merging carts:", error);
    res.status(500).json({ success: false, error: "Failed to merge carts" });
  }
});

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
    if (currentConfig.enableDebug) {
      console.log("✅ Item removed from cart");
    }
  } catch (error) {
    throw error;
  }
};

const placeOrder = async (userId, shippingAddress) => {
  try {
    if (currentConfig.enableDebug) {
      console.log(`📋 Placing order for user: ${userId}`);
    }

    const cart = await getCart(userId);

    if (!cart || cart.CartItem.length === 0) {
      throw new Error("Cart is empty");
    }

    const totalAmount = cart.CartItem.reduce((sum, item) => {
      return sum + item.Product.price * item.quantity;
    }, 0);

    // Generate order number
    const orderNumber = `JH${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          user_id: userId,
          shipping_address: { address: shippingAddress },
          total_amount: totalAmount,
          subtotal: totalAmount,
          billing_address: { address: shippingAddress },
          status: "pending",
          payment_status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = cart.CartItem.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.Product.price,
      total_price: item.Product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Clear cart after successful order
    const { error: clearError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (clearError) throw clearError;

    if (currentConfig.enableDebug) {
      console.log(`✅ Order placed successfully: ${orderNumber}`);
    }
    return order;
  } catch (error) {
    console.error("Error placing order:", error);
    throw error;
  }
};

// API Endpoints

// Health check with enhanced info
app.get("/health", async (req, res) => {
  const dbStatus = await testDatabase();
  res.status(200).json({
    status: "OK",
    service: "Jhankari E-commerce API",
    environment: NODE_ENV,
    database: dbStatus ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    domain: req.get("host"),
    version: "1.0.0",
    debug: currentConfig.enableDebug,
    uptime: process.uptime(),
  });
});

// Google Auth verification
app.post("/api/v1/auth/verify-google", async (req, res) => {
  try {
    if (currentConfig.enableDebug) {
      console.log("🔐 Google auth verification received");
    }
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
        code: "MISSING_TOKEN",
      });
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      console.error("Token verification failed:", error);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    // Create or update user profile
    const userProfile = await createOrUpdateUserProfile(user);

    res.json({
      success: true,
      message: "Google authentication successful",
      user: userProfile,
      sessionToken: access_token,
    });
  } catch (error) {
    console.error("Google auth verification error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication verification failed",
      code: "AUTH_VERIFICATION_FAILED",
    });
  }
});

// User profile endpoint
app.get("/api/v1/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
      code: "GET_USER_FAILED",
    });
  }
});

// Products endpoint
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

// Cart endpoints
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

// Orders endpoint
app.post("/api/v1/order", async (req, res) => {
  try {
    const { userId, shippingAddress } = req.body;

    if (!userId || !shippingAddress) {
      return res.status(400).json({
        success: false,
        error: "UserId and shippingAddress are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    const order = await placeOrder(userId, shippingAddress);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error placing order:", error);

    if (error.message === "Cart is empty") {
      return res.status(400).json({
        success: false,
        error: "Cart is empty",
        code: "EMPTY_CART",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to place order",
      code: "ORDER_FAILED",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(currentConfig.enableDebug && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
    path: req.originalUrl,
    code: "ENDPOINT_NOT_FOUND",
  });
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server with environment info
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
  console.log(`🎯 Frontend: ${process.env.FRONTEND_URL || "Not set"}`);
  console.log(`🛡️ CORS Origins: ${currentConfig.corsOrigins.join(", ")}`);

  // Test database connection
  const dbConnected = await testDatabase();
  if (dbConnected) {
    console.log(`🎉 All systems operational in ${NODE_ENV} mode!`);
  } else {
    console.error("⚠️ Database connection issues - Check configuration");
  }
});

module.exports = app;
