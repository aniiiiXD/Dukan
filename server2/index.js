const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Load environment-specific configuration
const NODE_ENV = process.env.NODE_ENV || "development";
const { PrismaClient } = require("./generated/prisma");
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

// Enhanced user profile creation with better error handling
const createOrUpdateUserProfile = async (authUser) => {
  try {
    console.log("Creating/updating user profile for:", authUser.email);

    // Extract names from Google OAuth metadata
    const fullName =
      authUser.user_metadata?.full_name || authUser.user_metadata?.name || "";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    const userData = {
      id: authUser.id,
      email: authUser.email,
      firstname: firstName,
      lastname: lastName,
      phonenumber: authUser.phone || null,
      isactive: true,
      updatedat: new Date().toISOString(),
    };

    // Use upsert to handle both insert and update
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

    console.log("User profile upserted successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createOrUpdateUserProfile:", error);
    throw error;
  }
};

// Enhanced cart functions with proper database inserts
const addToCart = async (userId, productId, quantity = 1) => {
  try {
    console.log(
      `🛒 Adding to cart: User ${userId}, Product ${productId}, Qty ${quantity}`
    );

    // Check if item already exists in cart
    const { data: existing, error: selectError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (existing && !selectError) {
      // Update quantity of existing item
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
      // Insert new cart item
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

// Merge guest cart items into user cart endpoint
app.post("/api/v1/cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    console.log("🛒 Cart add request:", { userId, productId, quantity });

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: "UserId and productId are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    const cartItem = await addToCart(userId, productId, quantity || 1);

    console.log("✅ Item added to cart successfully");

    res.json({
      success: true,
      message: "Item added to cart",
      cartItem: cartItem,
    });
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add to cart",
      code: "CART_ADD_FAILED",
      details: error.message,
    });
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

// Enhanced order creation
const placeOrder = async (userId, shippingAddress) => {
  try {
    console.log(`📋 Placing order for user: ${userId}`);

    const cart = await getCart(userId);

    if (!cart || cart.CartItem.length === 0) {
      throw new Error("Cart is empty");
    }

    const totalAmount = cart.CartItem.reduce((sum, item) => {
      return sum + item.Product.price * item.quantity;
    }, 0);

    // Generate unique order number
    const orderNumber = `JH${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Insert order with proper error handling
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error creating order:", orderError);
      throw orderError;
    }

    console.log("✅ Order created successfully:", orderNumber);

    // Clear cart after successful order
    const { error: clearError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (clearError) {
      console.error("❌ Error clearing cart:", clearError);
      // Don't throw here, order was successful
    } else {
      console.log("✅ Cart cleared after order");
    }

    return order;
  } catch (error) {
    console.error("❌ Error placing order:", error);
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
    console.log("🔐 Google auth verification received");
    const { access_token } = req.body;

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
      console.error("❌ Token verification failed:", error);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    console.log("✅ Token verified for user:", user.email);

    // Create or update user profile with better error handling
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

      // Still return success for auth, but indicate profile issue
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

// Check your actual database schema and use correct column names
// Update the POST /user endpoint with correct column names
app.post("/api/v1/user", async (req, res) => {
  try {
    const { id, email, firstname, lastname, phonenumber, isactive } = req.body;

    console.log("Creating user manually:", email);

    // Map frontend field names to database column names
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        id,
        email,
        first_name: firstname, // Map firstname -> first_name
        last_name: lastname, // Map lastname -> last_name
        phone_number: phonenumber, // Map phonenumber -> phone_number
        is_active: isactive !== undefined ? isactive : true,
        created_at: new Date().toISOString(), // Use created_at
        updated_at: new Date().toISOString(), // Use updated_at
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
        // Map database column names back to frontend field names
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

// Update the existing get user endpoint to be more robust
// Update the GET /user/:userId endpoint
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

    // Map database column names to frontend field names
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

// Database test endpoint
app.get("/api/v1/test-db", async (req, res) => {
  try {
    // Test insert with proper slug
    const { data: testData, error: insertError } = await supabase
      .from("products")
      .insert([
        {
          name: "Test Product",
          slug: "test-product-" + Date.now(), // Add required slug field
          description: "Test Description",
          price: 99.99,
          stock_quantity: 10,
          category_id: "714c80bf-4c40-471a-a9ca-14456967deb6", // Use existing category ID
          is_active: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Test delete (cleanup)
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
