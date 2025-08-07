// ==========================================
// IMPORTS & DEPENDENCIES
// ==========================================
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================
const NODE_ENV = process.env.NODE_ENV || "development";

// Load environment variables in correct order
const loadEnvironmentVariables = () => {
  const envPath = path.resolve(__dirname, `.env.${NODE_ENV}`);
  const defaultEnvPath = path.resolve(__dirname, ".env");

  console.log(`🔍 Starting Jhankari backend in ${NODE_ENV} mode...`);
  console.log(`📂 Current working directory: ${process.cwd()}`);
  console.log(`📁 Looking for environment file: ${envPath}`);
  console.log(`📄 File exists: ${fs.existsSync(envPath) ? "Yes ✅" : "No ❌"}`);

  // Load environment-specific file first
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log(`✅ Loaded .env.${NODE_ENV}`);
  } else {
    console.log(`❌ .env.${NODE_ENV} not found, trying default .env`);
    require("dotenv").config({ path: defaultEnvPath });
  }

  // Debug loaded variables
  console.log("🔍 Environment Variables Check:");
  console.log("NODE_ENV:", process.env.NODE_ENV || "Not Set");
  console.log("PORT:", process.env.PORT || "Not Set");
  console.log(
    "SUPABASE_URL:",
    process.env.SUPABASE_URL ? "Set ✅" : "Missing ❌"
  );
  console.log(
    "SUPABASE_SERVICE_ROLE_KEY:",
    process.env.SUPABASE_SERVICE_ROLE_KEY ? `Set ✅` : "Missing ❌"
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
};

loadEnvironmentVariables();

// ==========================================
// CONFIGURATION SETTINGS
// ==========================================
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
const PORT = process.env.PORT || 3000;

// ==========================================
// ENVIRONMENT VALIDATION
// ==========================================
const validateEnvironment = () => {
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error(`❌ CRITICAL ERROR: Missing required environment variables:`);
    console.error(`   Missing: ${missingVars.join(", ")}`);
    console.error(
      `   Please check your .env.${NODE_ENV} file and add these variables`
    );
    console.error(`   Server cannot start without these credentials`);
    process.exit(1);
  }

  console.log("✅ All required environment variables are present");
};

validateEnvironment();

// ==========================================
// DATABASE INITIALIZATION
// ==========================================
const initializeDatabase = () => {
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
  return supabase;
};

const supabase = initializeDatabase();

// ==========================================
// EXPRESS APP SETUP
// ==========================================
const app = express();

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
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
        callback(null, true);
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
  maxAge: NODE_ENV === "production" ? 86400 : 0,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Logging middleware
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

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");

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

// ==========================================
// DATABASE HELPER FUNCTIONS
// ==========================================

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

// ==========================================
// USER MANAGEMENT FUNCTIONS
// ==========================================

const createOrUpdateUserProfile = async (authUser) => {
  try {
    console.log("Creating/updating user profile for:", authUser.email);

    const fullName =
      authUser.user_metadata?.full_name || authUser.user_metadata?.name || "";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    const userData = {
      id: authUser.id,
      email: authUser.email,
      first_name: firstName,
      last_name: lastName,
      phone_number: authUser.phone || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("users")
      .upsert(userData, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting user:", error);
      throw error;
    }

    console.log("User profile upserted successfully:", data.email);
    return data;
  } catch (error) {
    console.error("Error in createOrUpdateUserProfile:", error);
    throw error;
  }
};

// ==========================================
// CART MANAGEMENT FUNCTIONS
// ==========================================

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
    if (currentConfig.enableDebug) {
      console.log("✅ Item removed from cart");
    }
  } catch (error) {
    throw error;
  }
};

// ==========================================
// ORDER MANAGEMENT FUNCTIONS
// ==========================================

const createOrder = async (orderData) => {
  try {
    console.log(
      `📋 Creating order in database for: ${orderData.customer_email}`
    );
    console.log(`💰 Order amount: ₹${orderData.total_amount}`);

    const { data: order, error } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error("❌ Database error details:", error);
      console.error("❌ Failed orderData:", JSON.stringify(orderData, null, 2));
      throw new Error(
        `Database error: ${error.message || "Unknown database error"}`
      );
    }

    console.log("✅ Order created successfully in database:", order.id);
    return order;
  } catch (error) {
    console.error("❌ Error in createOrder function:", error);
    throw error;
  }
};

const updateOrderPaymentStatus = async (orderId, paymentData) => {
  try {
    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({
        ...paymentData,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", orderId)
      .select()
      .single();

    if (error) {
      console.error("❌ Database update error:", error);
      throw error;
    }

    console.log("✅ Order payment status updated");
    return updatedOrder;
  } catch (error) {
    console.error("❌ Error updating order payment status:", error);
    throw error;
  }
};

// ==========================================
// PAYMENT INTEGRATION
// ==========================================

const initializeRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log(
      "⚠️ Razorpay credentials not found - payment integration will work in test mode"
    );
    return null;
  }

  try {
    const Razorpay = require("razorpay");
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log("✅ Razorpay initialized successfully");
    return razorpay;
  } catch (error) {
    console.error("❌ Failed to initialize Razorpay:", error.message);
    return null;
  }
};

const razorpay = initializeRazorpay();

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
    console.log("⚠️ Razorpay not enabled - skipping signature verification");
    return true;
  }

  const crypto = require("crypto");
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
};

// ==========================================
// API ROUTES - HEALTH & DEBUG
// ==========================================

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

app.get("/api/debug/test-connection", async (req, res) => {
  if (NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      error: "Debug endpoints not available in production",
    });
  }

  try {
    console.log("🔧 Testing database connection...");
    const dbStatus = await testDatabase();

    res.json({
      success: true,
      message: "Database connection test completed",
      connected: dbStatus,
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

app.get("/api/debug/razorpay-config", (req, res) => {
  if (NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      error: "Debug endpoints not available in production",
    });
  }

  res.json({
    success: true,
    config: {
      razorpay_key_id_set: !!process.env.RAZORPAY_KEY_ID,
      razorpay_key_secret_set: !!process.env.RAZORPAY_KEY_SECRET,
      razorpay_key_id_preview:
        process.env.RAZORPAY_KEY_ID?.substring(0, 10) + "..." || "Not set",
      node_env: NODE_ENV,
      supabase_configured: !!process.env.SUPABASE_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API ROUTES - AUTHENTICATION
// ==========================================

app.post("/api/v1/auth/verify-google", async (req, res) => {
  try {
    console.log("🔐 Google auth verification received");
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
        code: "MISSING_TOKEN",
      });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      console.error("❌ Token verification failed:", error);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    console.log("✅ Token verified for user:", user.email);

    try {
      const userProfile = await createOrUpdateUserProfile(user);

      res.json({
        success: true,
        message: "Google authentication successful",
        user: userProfile,
        sessionToken: access_token,
      });
    } catch (profileError) {
      console.error("❌ Profile creation failed:", profileError);

      res.json({
        success: true,
        message: "Authentication successful, profile creation pending",
        user: {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.full_name?.split(" ")[0] || null,
          last_name:
            user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
            null,
        },
        sessionToken: access_token,
        profileError: profileError.message,
      });
    }
  } catch (error) {
    console.error("❌ Google auth verification error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication verification failed",
      code: "AUTH_VERIFICATION_FAILED",
      details: error.message,
    });
  }
});

// ==========================================
// API ROUTES - USER MANAGEMENT
// ==========================================

app.post("/api/v1/user", async (req, res) => {
  try {
    const { id, email, firstname, lastname, phonenumber, isactive } = req.body;

    console.log("Creating user manually:", email);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        id,
        email,
        first_name: firstname,
        last_name: lastname,
        phone_number: phonenumber,
        is_active: isactive !== undefined ? isactive : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return res.status(400).json({
        success: false,
        error: "Failed to create user",
        details: error.message,
      });
    }

    console.log("User created successfully:", user.email);
    res.json({
      success: true,
      user: {
        ...user,
        firstname: user.first_name,
        lastname: user.last_name,
        phonenumber: user.phone_number,
        createdat: user.created_at,
        updatedat: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

app.get("/api/v1/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Getting user profile for:", userId);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Database error:", error);
      return res.status(404).json({
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
        details: error.message,
      });
    }

    console.log("User found:", user.email);

    const mappedUser = {
      ...user,
      firstname: user.first_name,
      lastname: user.last_name,
      phonenumber: user.phone_number,
      createdat: user.created_at,
      updatedat: user.updated_at,
    };

    res.json({
      success: true,
      user: mappedUser,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
      code: "GET_USER_FAILED",
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

// Orders endpoint for payment integration (POST /api/v1/orders)
app.post("/api/v1/orders", async (req, res) => {
  console.log("🎯 Creating order with payment integration");

  try {
    const {
      items,
      billingAddress,
      shippingAddress,
      phoneNumber,
      email,
      totalAmount,
    } = req.body;

    // Enhanced validation
    if (!billingAddress || !phoneNumber || !email || !items || !totalAmount) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        details:
          "billingAddress, phoneNumber, email, items, and totalAmount are required",
      });
    }

    // Check if Razorpay credentials are properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log("⚠️ Razorpay credentials not configured properly");
      console.log("RAZORPAY_KEY_ID exists:", !!process.env.RAZORPAY_KEY_ID);
      console.log(
        "RAZORPAY_KEY_SECRET exists:",
        !!process.env.RAZORPAY_KEY_SECRET
      );

      return res.status(500).json({
        success: false,
        error: "Payment service configuration error. Please contact support.",
        code: "PAYMENT_SERVICE_CONFIG_ERROR",
      });
    }

    // Validate amount
    const amountInPaise = Math.round(totalAmount * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum order amount should be ₹1.00",
        code: "INVALID_AMOUNT",
      });
    }

    // Initialize Razorpay
    const Razorpay = require("razorpay");
    let razorpay;

    try {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID.trim(),
        key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
      });
      console.log("✅ Razorpay instance created successfully");
    } catch (razorpayInitError) {
      console.error("❌ Razorpay initialization failed:", razorpayInitError);
      return res.status(500).json({
        success: false,
        error: "Payment service initialization failed",
        code: "RAZORPAY_INIT_ERROR",
      });
    }

    // Create Razorpay order
    console.log("💳 Creating Razorpay order...");

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes: {
        customer_email: email,
        customer_phone: phoneNumber,
        billing_city: billingAddress.city || "Not provided",
        shipping_city: shippingAddress.city || "Not provided",
        items_count: items.length.toString(),
      },
    };

    try {
      const razorpayOrder = await razorpay.orders.create(orderOptions);
      console.log("✅ Razorpay order created:", razorpayOrder.id);

      // Store order in database
      const orderData = {
        razorpay_order_id: razorpayOrder.id,
        customer_email: email,
        customer_phone: phoneNumber,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        items: items,
        total_amount: totalAmount,
        subtotal: totalAmount,
        payment_method: "razorpay",
        status: "pending",
        payment_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const order = await createOrder(orderData);

      res.json({
        success: true,
        order: order,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (razorpayError) {
      console.error("❌ Razorpay API error:", razorpayError);

      let errorMessage =
        "Payment service temporarily unavailable. Please try again.";
      let errorCode = "RAZORPAY_API_ERROR";

      if (razorpayError.statusCode === 400) {
        errorMessage = "Invalid payment details. Please check and try again.";
        errorCode = "INVALID_PAYMENT_DATA";
      } else if (razorpayError.statusCode === 401) {
        errorMessage =
          "Payment service authentication failed. Please contact support.";
        errorCode = "PAYMENT_AUTH_ERROR";
      }

      return res.status(500).json({
        success: false,
        error: errorMessage,
        code: errorCode,
      });
    }
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create order. Please try again.",
      code: "ORDER_CREATION_FAILED",
    });
  }
});

app.put("/api/v1/orders", async (req, res) => {
  console.log("🔐 Verifying payment");

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (razorpay_order_id.startsWith("test_order_")) {
      console.log("🧪 Test payment verification - auto approving");

      const paymentData = {
        payment_status: "paid",
        status: "confirmed",
        paid_at: new Date().toISOString(),
      };

      const updatedOrder = await updateOrderPaymentStatus(
        razorpay_order_id,
        paymentData
      );

      return res.json({
        success: true,
        message: "Test payment verified successfully",
        order: updatedOrder,
        test_mode: true,
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

    const paymentData = {
      razorpay_payment_id: razorpay_payment_id,
      payment_signature: razorpay_signature,
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    };

    const updatedOrder = await updateOrderPaymentStatus(
      razorpay_order_id,
      paymentData
    );

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      code: "PAYMENT_VERIFICATION_ERROR",
    });
  }
});

// ==========================================
// API ROUTES - TESTING
// ==========================================

app.get("/api/v1/test-db", async (req, res) => {
  if (NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      error: "Test endpoints not available in production",
    });
  }

  try {
    const { data: testData, error: insertError } = await supabase
      .from("products")
      .insert([
        {
          name: "Test Product",
          slug: "test-product-" + Date.now(),
          description: "Test Description",
          price: 99.99,
          stock_quantity: 10,
          category_id: "714c80bf-4c40-471a-a9ca-14456967deb6",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    await supabase.from("products").delete().eq("id", testData.id);

    res.json({
      success: true,
      message: "Database operations working correctly",
      testResult: "Insert and delete successful",
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);
    res.status(500).json({
      success: false,
      error: "Database test failed",
      details: error.message,
    });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(currentConfig.enableDebug && {
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
      auth: ["POST /api/v1/auth/verify-google"],
      users: ["POST /api/v1/user", "GET /api/v1/user/:userId"],
      products: ["GET /api/v1/products"],
      cart: [
        "POST /api/v1/cart",
        "POST /api/v1/cart/merge",
        "DELETE /api/v1/cart",
        "GET /api/v1/cart/:userId",
      ],
      orders: ["POST /api/v1/orders", "PUT /api/v1/orders"],
    },
  });
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
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
  console.log(`🛡️ CORS Origins: ${currentConfig.corsOrigins.join(", ")}`);
  console.log(`💳 Razorpay Status: ${razorpay ? "Enabled" : "Test Mode"}`);

  const dbConnected = await testDatabase();
  if (dbConnected) {
    console.log(`🎉 All systems operational in ${NODE_ENV} mode!`);
  } else {
    console.error("⚠️ Database connection issues - Check configuration");
  }
});

module.exports = app;
