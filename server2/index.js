const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("🔍 Starting server initialization...");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

// Initialize Supabase clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

console.log("✅ Supabase client initialized");

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:8080",
      "http://0.0.0.0:8080",
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(null, true); // Allow for now to test
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${
      req.path
    } - Origin: ${req.get("Origin")}`
  );
  next();
});

// Add to your server2/index.js

// Create user with proper auth flow
const createUser = async (userData) => {
  try {
    // Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp(
      {
        email: userData.email,
        password: userData.password,
      }
    );

    if (authError) throw authError;

    // The user profile will be automatically created via Supabase trigger
    // or we can create it using service role
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email: userData.email,
          phone_number: userData.phoneNumber,
          address: userData.address,
        },
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    return profile;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Sign in user and return profile
const signInUser = async (email, password) => {
  try {
    const { data: authData, error: authError } =
      await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) throw authError;

    // Get user profile using service role
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) throw profileError;

    return profile;
  } catch (error) {
    console.error("Error signing in user:", error);
    throw error;
  }
};

// Update other functions to use service role appropriately
const addToCart = async (userId, productId, quantity = 1) => {
  try {
    // Check if item already exists
    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (existing) {
      // Update existing item
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
      return data;
    } else {
      // Create new cart item
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
      return data;
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

// Database functions
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
      .eq("is_active", true);

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

// Test database connection
const testDatabase = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("count")
      .limit(1);

    if (error) throw error;
    console.log("✅ Database connection test passed");
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
};

// Health check
app.get("/health", async (req, res) => {
  const dbStatus = await testDatabase();
  res.status(200).json({
    status: "OK",
    database: dbStatus ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
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
      message: error.message,
      code: "PRODUCTS_FETCH_ERROR",
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);

  // Test database on startup
  await testDatabase();
});

module.exports = app;
