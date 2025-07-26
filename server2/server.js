const express = require("express");
const cors = require("cors");
const {
  getUserById,
  createUser,
  createSeller,
  getSellerById,
  createProduct,
  getProductById,
  addToCart,
  removeFromCart,
  getCart,
  placeOrder,
  updateOrderStatus,
  getSellerOrders,
  getUserOrders,
  getOrderById,
  signInUser,
  signInSeller, // Added missing function
  getAllProducts,
} = require("./client");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend-domain.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Fixed: added extended option

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// User endpoints
app.get("/api/v1/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

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

// Seller endpoints
app.post("/api/v1/seller/signup", async (req, res) => {
  try {
    const { email, password, businessName, phoneNumber } = req.body;

    if (!email || !password || !businessName) {
      return res
        .status(400)
        .json({ error: "Email, password, and business name are required" });
    }

    const sellerData = { email, password, businessName, phoneNumber };
    const newSeller = await createSeller(sellerData);
    res.status(201).json(newSeller);
  } catch (error) {
    console.error("Error creating seller:", error);
    res.status(500).json({ error: "Failed to create seller" });
  }
});

app.get("/api/v1/seller/:id", async (req, res) => {
  try {
    const sellerId = req.params.id;
    const seller = await getSellerById(sellerId);

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json(seller);
  } catch (error) {
    console.error("Error getting seller:", error);
    res.status(500).json({ error: "Failed to get seller" });
  }
});

app.post("/api/v1/seller/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const seller = await signInSeller(email, password);

    if (!seller) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json(seller);
  } catch (error) {
    console.error("Error signing in seller:", error);
    res.status(500).json({ error: "Failed to sign in seller" });
  }
});

// Product endpoints
app.post("/api/v1/product", async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      sellerId,
      stockQuantity,
      imageUrl,
    } = req.body;

    if (!name || !category || !price || !sellerId) {
      return res
        .status(400)
        .json({ error: "Name, category, price, and sellerId are required" });
    }

    const productData = {
      name,
      description,
      category,
      price: parseFloat(price),
      sellerId,
      stockQuantity: parseInt(stockQuantity) || 0,
      imageUrl,
    };

    const product = await createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.get("/api/v1/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error getting product:", error);
    res.status(500).json({ error: "Failed to get product" });
  }
});

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
      // Return empty cart structure instead of 404
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

// Fixed: Removed extra parentheses from req.body()
app.post("/api/v1/order/:id/status", async (req, res) => {
  try {
    const { newStatus } = req.body; // Fixed: removed ()
    const orderId = req.params.id;

    if (!newStatus) {
      return res.status(400).json({ error: "newStatus is required" });
    }

    const updatedOrder = await updateOrderStatus(orderId, newStatus);

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

app.get("/api/v1/seller/orders", async (req, res) => {
  try {
    const sellerId = req.query.sellerId;

    if (!sellerId) {
      return res.status(400).json({ error: "sellerId parameter is required" });
    }

    const orders = await getSellerOrders(sellerId);
    res.json(orders);
  } catch (error) {
    console.error("Error getting seller orders:", error);
    res.status(500).json({ error: "Failed to get seller orders" });
  }
});

app.get("/api/v1/user/orders", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const orders = await getUserOrders(userId);
    res.json(orders);
  } catch (error) {
    console.error("Error getting user orders:", error);
    res.status(500).json({ error: "Failed to get user orders" });
  }
});

app.get("/api/v1/order/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error getting order:", error);
    res.status(500).json({ error: "Failed to get order" });
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

// Start server only if not in Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
