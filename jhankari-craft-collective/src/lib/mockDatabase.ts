// Mock Database Functions with Console Logging

// Mock data storage
let mockUsers = [];
let mockSellers = [];
let mockProducts = [
  {
    id: "1",
    name: "Royal Crimson Lehenga with Gold Embroidery",
    description: "Exquisite handcrafted lehenga with intricate gold work",
    category: "lehenga",
    price: 25000,
    imageUrl: "/src/assets/product-1.jpg",
    sellerId: "seller-1",
    stockQuantity: 5,
    isActive: true
  }, 
  {
    id: "2", 
    name: "Purple Anarkali with Zardozi Work",
    description: "Traditional Rajasthani anarkali with authentic zardozi embroidery",
    category: "kurti",
    price: 18000,
    imageUrl: "/src/assets/product-2.jpg",
    sellerId: "seller-1",
    stockQuantity: 8,
    isActive: true
  },
  {
    id: "3",
    name: "Emerald Royal Saree with Gold Border",
    description: "Handwoven silk saree with traditional gold border",
    category: "saree",
    price: 15000,
    imageUrl: "/src/assets/product-3.jpg",
    sellerId: "seller-2",
    stockQuantity: 3,
    isActive: true
  }
];
let mockCarts = [];
let mockOrders = [];
let currentUser = null;

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// User Functions
export const createUser = async (userData) => {
  console.log("🔵 createUser() called with:", userData);
  
  const newUser = {
    id: generateId(),
    email: userData.email,
    password: userData.password,
    phoneNumber: userData.phoneNumber || null,
    address: userData.address || null,
  };
  
  mockUsers.push(newUser);
  setCurrentUser(newUser);
  const currentStorage = getCurrentUser();
  console.log("Current User in local storage ",currentStorage )
  console.log("✅ User created successfully:", newUser);
  console.log("📊 Total users:", mockUsers.length);
  
  return newUser;
};

export const getUserById = async (userId) => {
  console.log("🔵 getUserById() called with userId:", userId);
  
  const user = mockUsers.find(u => u.id === userId);
  const userCart = mockCarts.find(c => c.userId === userId);
  const userOrders = mockOrders.filter(o => o.userId === userId);
  
  if (user) {
    const userWithRelations = {
      ...user,
      Cart: userCart || null,
      Order: userOrders
    };
    console.log("✅ User found:", userWithRelations);
    return userWithRelations;
  } else {
    console.log("❌ User not found with ID:", userId);
    return null;
  }
};

export const signInUser = async (email, password) => {
  console.log("🔵 signInUser() called with email:", email);
  
  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    console.log("❌ User not found with email:", email);
    throw new Error('User not found');
  }
  
  if (user.password !== password) {
    console.log("❌ Invalid password for user:", email);
    throw new Error('Invalid password');
  }
  
  setCurrentUser(user);
  const currentStorage = getCurrentUser(); 
  console.log(currentStorage);
  console.log("✅ User signed in successfully:", user);
  return user;
};

// Seller Functions
export const createSeller = async (sellerData) => {
  console.log("🔵 createSeller() called with:", sellerData);
  
  const newSeller = {
    id: generateId(),
    email: sellerData.email,
    password: sellerData.password,
    businessName: sellerData.businessName,
    phoneNumber: sellerData.phoneNumber || null,
    createdAt: new Date().toISOString()
  };
  
  mockSellers.push(newSeller);
  console.log("✅ Seller created successfully:", newSeller);
  console.log("📊 Total sellers:", mockSellers.length);
  
  return newSeller;
};

export const getSellerById = async (sellerId) => {
  console.log("🔵 getSellerById() called with sellerId:", sellerId);
  
  const seller = mockSellers.find(s => s.id === sellerId);
  const sellerProducts = mockProducts.filter(p => p.sellerId === sellerId);
  
  if (seller) {
    const sellerWithProducts = {
      ...seller,
      Product: sellerProducts
    };
    console.log("✅ Seller found:", sellerWithProducts);
    return sellerWithProducts;
  } else {
    console.log("❌ Seller not found with ID:", sellerId);
    return null;
  }
};

// Product Functions
export const createProduct = async (productData) => {
  console.log("🔵 createProduct() called with:", productData);
  
  const newProduct = {
    id: generateId(),
    name: productData.name,
    description: productData.description || null,
    category: productData.category,
    imageUrl: productData.imageUrl || null,
    price: productData.price,
    sellerId: productData.sellerId,
    stockQuantity: productData.stockQuantity || 0,
    isActive: productData.isActive || true,
    createdAt: new Date().toISOString()
  };
  
  mockProducts.push(newProduct);
  console.log("✅ Product created successfully:", newProduct);
  console.log("📊 Total products:", mockProducts.length);
  
  return newProduct;
};

export const getProductById = async (productId) => {
  console.log("🔵 getProductById() called with productId:", productId);
  
  const product = mockProducts.find(p => p.id === productId);
  
  if (product) {
    console.log("✅ Product found:", product);
    return product;
  } else {
    console.log("❌ Product not found with ID:", productId);
    return null;
  }
};

export const getAllProducts = async () => {
  console.log("🔵 getAllProducts() called");
  console.log("✅ Returning all products, count:", mockProducts.length);
  console.log("📦 Products:", mockProducts);
  
  return mockProducts;
};

// Cart Functions
export const addToCart = async (userId, productId, quantity = 1) => {
  console.log("🔵 addToCart() called with:", { userId, productId, quantity });
  
  // Find or create cart
  let cart = mockCarts.find(c => c.userId === userId);
  if (!cart) {
    cart = {
      id: generateId(),
      userId: userId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockCarts.push(cart);
    console.log("📦 New cart created for user:", userId);
  }
  
  // Check if product exists in cart
  const existingItem = cart.items.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.updatedAt = new Date().toISOString();
    console.log("✅ Updated existing cart item:", existingItem);
  } else {
    const newItem = {
      id: generateId(),
      productId: productId,
      quantity: quantity,
      addedAt: new Date().toISOString()
    };
    cart.items.push(newItem);
    console.log("✅ Added new item to cart:", newItem);
  }
  
  cart.updatedAt = new Date().toISOString();
  console.log("📊 Cart total items:", cart.items.length);
  
  return cart;
};

export const removeFromCart = async (userId, productId) => {
  console.log("🔵 removeFromCart() called with:", { userId, productId });
  
  const cart = mockCarts.find(c => c.userId === userId);
  
  if (!cart) {
    console.log("❌ Cart not found for user:", userId);
    return null;
  }
  
  const itemIndex = cart.items.findIndex(item => item.productId === productId);
  
  if (itemIndex === -1) {
    console.log("❌ Item not found in cart:", productId);
    return null;
  }
  
  const removedItem = cart.items.splice(itemIndex, 1)[0];
  cart.updatedAt = new Date().toISOString();
  
  console.log("✅ Item removed from cart:", removedItem);
  console.log("📊 Cart remaining items:", cart.items.length);
  
  return removedItem;
};

export const getCart = async (userId) => {
  console.log("🔵 getCart() called with userId:", userId);
  
  const cart = mockCarts.find(c => c.userId === userId);
  
  if (!cart) {
    console.log("❌ Cart not found for user:", userId);
    return null;
  }
  
  // Populate with product details
  const cartWithProducts = {
    ...cart,
    items: cart.items.map(item => {
      const product = mockProducts.find(p => p.id === item.productId);
      return {
        ...item,
        product: product
      };
    })
  };
  
  console.log("✅ Cart found with items:", cartWithProducts.items.length);
  console.log("📦 Cart details:", cartWithProducts);
  
  return cartWithProducts;
};

// Order Functions
export const placeOrder = async (userId, shippingAddress) => {
  console.log("🔵 placeOrder() called with:", { userId, shippingAddress });
  
  const cart = await getCart(userId);
  
  if (!cart || cart.items.length === 0) {
    console.log("❌ Cart is empty or not found for user:", userId);
    throw new Error("Cart is empty or not found");
  }
  
  // Calculate total
  const totalAmount = cart.items.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);
  
  const newOrder = {
    id: generateId(),
    userId: userId,
    shippingAddress: shippingAddress,
    totalAmount: totalAmount,
    status: "pending",
    items: cart.items.map(item => ({
      id: generateId(),
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.product.price,
      product: item.product
    })),
    createdAt: new Date().toISOString()
  };
  
  mockOrders.push(newOrder);
  
  // Clear cart
  const cartIndex = mockCarts.findIndex(c => c.userId === userId);
  if (cartIndex !== -1) {
    mockCarts[cartIndex].items = [];
  }
  
  console.log("✅ Order placed successfully:", newOrder);
  console.log("📊 Total orders:", mockOrders.length);
  
  return newOrder;
};

export const updateOrderStatus = async (orderId, newStatus) => {
  console.log("🔵 updateOrderStatus() called with:", { orderId, newStatus });
  
  const order = mockOrders.find(o => o.id === orderId);
  
  if (!order) {
    console.log("❌ Order not found:", orderId);
    return null;
  }
  
  order.status = newStatus;
  order.updatedAt = new Date().toISOString();
  
  console.log("✅ Order status updated:", order);
  
  return order;
};

export const getSellerOrders = async (sellerId) => {
  console.log("🔵 getSellerOrders() called with sellerId:", sellerId);
  
  const sellerOrders = mockOrders.filter(order => 
    order.items.some(item => item.product.sellerId === sellerId)
  );
  
  console.log("✅ Found seller orders:", sellerOrders.length);
  console.log("📦 Seller orders:", sellerOrders);
  
  return sellerOrders;
};

export const getUserOrders = async (userId) => {
  console.log("🔵 getUserOrders() called with userId:", userId);
  
  const userOrders = mockOrders.filter(o => o.userId === userId);
  
  console.log("✅ Found user orders:", userOrders.length);
  console.log("📦 User orders:", userOrders);
  
  return userOrders;
};

export const getOrderById = async (orderId) => {
  console.log("🔵 getOrderById() called with orderId:", orderId);
  
  const order = mockOrders.find(o => o.id === orderId);
  
  if (order) {
    console.log("✅ Order found:", order);
    return order;
  } else {
    console.log("❌ Order not found:", orderId);
    return null;
  }
};

const USER_STORAGE_KEY = 'jhankari-user';

// Helper function to get current user
export const getCurrentUser = () => {
  console.log("🔵 getCurrentUser() called");
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.log("👤 Current user from localStorage:", user);
      return user;
    }
    console.log("👤 No user found in localStorage");
    return null;
  } catch (error) {
    console.error("❌ Error getting user from localStorage:", error);
    return null;
  }
};

// Helper function to set current user
export const setCurrentUser = (user) => {
  console.log("🔵 setCurrentUser() called with:", user);
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    console.log("✅ Current user set in localStorage");
  } catch (error) {
    console.error("❌ Error setting user in localStorage:", error);
  }
};

// Helper function to get cart count
export const getCartCount = async (userId) => {
  console.log("🔵 getCartCount() called with userId:", userId);
  
  if (!userId) {
    console.log("❌ No userId provided for cart count");
    return 0;
  }
  
  const cart = await getCart(userId);
  const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  
  console.log("📊 Cart count:", count);
  return count;
};

// Initialize with some mock data
console.log("🚀 Initializing mock database with sample data...");

// Create mock sellers
const mockSellersData = [
  {
    id: "seller-1",
    email: "artisan1@jhankari.com",
    password: "password123",
    businessName: "Royal Crafts Jaipur",
    phoneNumber: "+91 98765 43210"
  },
  {
    id: "seller-2", 
    email: "artisan2@jhankari.com",
    password: "password123",
    businessName: "Heritage Weavers",
    phoneNumber: "+91 98765 43211"
  }
];

// Create a test user
const testUser = {
  id: "test-user-1",
  email: "test@jhankari.com",
  password: "password123",
  phoneNumber: "+91 98765 43212",
  address: "123 Royal Street, Jaipur, Rajasthan",
  createdAt: new Date().toISOString()
};

mockUsers.push(testUser);
mockSellers.push(...mockSellersData);
console.log("✅ Mock sellers initialized:", mockSellers.length);
console.log("✅ Test user created:", testUser.email);