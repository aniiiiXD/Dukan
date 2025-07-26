const express = require("express");
const cors = require("cors");

console.log("🔍 Starting server initialization...");

const app = express();
const PORT = process.env.PORT || 3000;

// Mock Database (since you don't have Prisma set up)
let mockUsers = [];
let mockSellers = [];
let mockProducts = [
  {
    id: "1",
    name: "Royal Crimson Lehenga with Gold Embroidery",
    description: "Exquisite handcrafted lehenga with intricate gold work",
    category: "lehenga",
    price: 25000,
    imageUrl:
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400",
    sellerId: "seller-1",
    stockQuantity: 5,
    isActive: true,
  },
  {
    id: "2",
    name: "Purple Anarkali with Zardozi Work",
    description:
      "Traditional Rajasthani anarkali with authentic zardozi embroidery",
    category: "kurti",
    price: 18000,
    imageUrl:
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400",
    sellerId: "seller-1",
    stockQuantity: 8,
    isActive: true,
  },
  {
    id: "3",
    name: "Emerald Royal Saree with Gold Border",
    description: "Handwoven silk saree with traditional gold border",
    category: "saree",
    price: 15000,
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
    sellerId: "seller-2",
    stockQuantity: 3,
    isActive: true,
  },
];
let mockCarts = [];
let mockOrders = [];

// Helper functions
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Database functions
const createUser = async (userData) => {
  const newUser = {
    id: generateId(),
    email: userData.email,
    password: userData.password,
    phoneNumber: userData.phoneNumber || null,
    address: userData.address || null,
    createdAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  console.log("✅ User created:", newUser.email);
  return newUser;
};

const signInUser = async (email, password) => {
  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) {
    throw new Error("Invalid credentials");
  }
  console.log("✅ User signed in:", user.email);
  return user;
};

const getAllProducts = async () => {
  console.log("✅ Returning all products:", mockProducts.length);
  return mockProducts;
};

const addToCart = async (userId, productId, quantity = 1) => {
  let cart = mockCarts.find((c) => c.userId === userId);

  if (!cart) {
    cart = {
      id: generateId(),
      userId: userId,
      CartItem: [],
      createdAt: new Date().toISOString(),
    };
    mockCarts.push(cart);
  }

  const existingItem = cart.CartItem.find(
    (item) => item.productId === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const product = mockProducts.find((p) => p.id === productId);
    cart.CartItem.push({
      id: generateId(),
      productId: productId,
      quantity: quantity,
      addedAt: new Date().toISOString(),
      Product: product,
    });
  }

  console.log("✅ Added to cart for user:", userId);
  return cart;
};

const removeFromCart = async (userId, productId) => {
  const cart = mockCarts.find((c) => c.userId === userId);
  if (cart) {
    cart.CartItem = cart.CartItem.filter(
      (item) => item.productId !== productId
    );
    console.log("✅ Removed from cart for user:", userId);
  }
};

const getCart = async (userId) => {
  const cart = mockCarts.find((c) => c.userId === userId);
  if (!cart) {
    return null;
  }

  // Ensure products are populated
  cart.CartItem = cart.CartItem.map((item) => {
    if (!item.Product) {
      item.Product = mockProducts.find((p) => p.id === item.productId);
    }
    return item;
  });

  console.log(
    "✅ Cart retrieved for user:",
    userId,
    "items:",
    cart.CartItem.length
  );
  return cart;
};

const placeOrder = async (userId, shippingAddress) => {
  const cart = await getCart(userId);

  if (!cart || cart.CartItem.length === 0) {
    throw new Error("Cart is empty");
  }

  const totalAmount = cart.CartItem.reduce((sum, item) => {
    return sum + item.Product.price * item.quantity;
  }, 0);

  const newOrder = {
    id: generateId(),
    userId: userId,
    shippingAddress: shippingAddress,
    totalAmount: totalAmount,
    status: "pending",
    items: cart.CartItem,
    createdAt: new Date().toISOString(),
  };

  mockOrders.push(newOrder);

  // Clear cart
  const cartIndex = mockCarts.findIndex((c) => c.userId === userId);
  if (cartIndex !== -1) {
    mockCarts[cartIndex].CartItem = [];
  }

  console.log("✅ Order placed:", newOrder.id, "Amount:", totalAmount);
  return newOrder;
};

console.log("🔧 Setting up middleware...");

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend-domain.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("🛣️  Setting up routes...");

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// User endpoints
app.post("/api/v1/user", async (req, res) => {
  try {
    const { email, password, phoneNumber, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userData = { email, password, phoneNumber, address };
    const newUser = await createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/v1/user/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await signInUser(email, password);
    res.json(user);
  } catch (error) {
    console.error("Error signing in user:", error);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Product endpoints
app.get("/api/v1/products", async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ error: "Failed to get products" });
  }
});

// Cart endpoints
app.post("/api/v1/cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ error: "UserId and productId are required" });
    }

    const cart = await addToCart(userId, productId, quantity || 1);
    res.json(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

app.delete("/api/v1/cart", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ error: "UserId and productId are required" });
    }

    await removeFromCart(userId, productId);
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

app.get("/api/v1/cart/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const cart = await getCart(userId);

    if (!cart) {
      return res.json({
        id: null,
        userId: userId,
        CartItem: [],
        items: [],
      });
    }

    res.json(cart);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ error: "Failed to get cart" });
  }
});

// Order endpoints
app.post("/api/v1/order", async (req, res) => {
  try {
    const { userId, shippingAddress } = req.body;

    if (!userId || !shippingAddress) {
      return res
        .status(400)
        .json({ error: "UserId and shippingAddress are required" });
    }

    const order = await placeOrder(userId, shippingAddress);
    res.status(201).json(order);
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

console.log("🚀 Starting server on port", PORT);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server successfully started on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Error handlers
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
