const { PrismaClient } = require("./generated/prisma");

let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient();
}
prisma = global.prisma;

async function signInSeller(email, password) {
  try {
    const seller = await prisma.seller.findUnique({
      where: { email: email },
    });

    if (!seller || seller.password !== password) {
      throw new Error("Invalid credentials");
    }

    return seller;
  } catch (error) {
    console.error("Seller signin error:", error);
    throw error;
  }
}

async function findProductsByName(name) {
  try {
    return await prisma.product.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
      include: {
        Seller: true,
      },
    });
  } catch (error) {
    console.error("Error finding products by name:", error);
    throw error;
  }
}

async function createUser(userData) {
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: userData.password,
      phoneNumber: userData.phoneNumber || null,
      address: userData.address || null,
    },
  });
  console.log(user);

  return user;
}

const userData = {
  email: "user@example.com",
  password: "securepassword123",
  phoneNumber: "1234567890", // optional
  address: "123 Street, City", // optional
};

// createUser(userData);

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Cart: true,
      Order: true,
    },
  });
  console.log(user);
  return user;
}

//getUserById("5efcb0e3-0539-4370-88c0-39430e1facd6");

// Seller Functions
async function createSeller(sellerData) {
  const seller = await prisma.seller.create({
    data: {
      email: sellerData.email,
      password: sellerData.password,
      businessName: sellerData.businessName,
      phoneNumber: sellerData.phoneNumber || null,
    },
  });
  console.log(seller);
  return seller;
}

async function getSellerById(sellerId) {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: {
      Product: true,
    },
  });
  console.log(seller);
  return seller;
}

// Test data
// const sellerData = {
//   email: 'seller1@example.com',
//   password: 'sellerpassword123',
//   businessName: 'Fashion Store',
//   phoneNumber: '98765432101'
// };

// Test calls
// createSeller(sellerData);
// getSellerById("d88ff131-f6bc-4adc-ad01-4652a4775191");

async function createProduct(productData) {
  console.log("Creating product with data:", productData);

  const product = await prisma.product.create({
    data: {
      name: productData.name,
      description: productData.description || null,
      category: productData.category,
      imageUrl: productData.imageUrl || null,
      price: productData.price,
      sellerId: productData.sellerId,
      stockQuantity: productData.stockQuantity || 0,
      isActive: productData.isActive || true,
    },
  });

  console.log("Product created successfully:", product);
  return product;
}

const productData = {
  name: "Beautiful Lehenga",
  description: "Traditional Indian wedding wear",
  category: "lehenga",
  price: 15000.0,
  sellerId: "d88ff131-f6bc-4adc-ad01-4652a4775191",
  stockQuantity: 10,
  imageUrl: "https://example.com/lehenga.jpg",
};

// Test call
// createProduct(productData);

async function getProductById(productId) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        Seller: {
          select: {
            id: true,
            businessName: true,
            email: true,
            phoneNumber: true,
          },
        },
        CartItem: {
          select: {
            id: true,
            quantity: true,
            cartId: true,
            addedAt: true,
          },
        },
        OrderItem: {
          select: {
            id: true,
            orderId: true,
            quantity: true,
            unitPrice: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      console.log(`Product with ID ${productId} not found.`);
      return null;
    }

    console.log("Fetched Product:", product);
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

// Test call
//getProductById("2a0e431f-d184-4431-876b-03a788933ac6");

// Function to find products by name
async function findProductsByName(name) {
  return prisma.product.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
  });
}

// Test call
// findProductsByName("lehenga").then(products => console.log(products));

async function addToCart(userId, productId, quantity = 1) {
  try {
    // Step 1: Ensure the user has a cart
    let cart = await prisma.cart.findUnique({
      where: { userId: userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: userId,
          updatedAt: new Date(),
        },
      });
    }

    // Step 2: Check if the product already exists in the cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    if (existingCartItem) {
      // Step 3: If yes, update quantity
      const updatedItem = await prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: productId,
          },
        },
        data: {
          quantity: {
            increment: quantity,
          },
          addedAt: new Date(),
        },
      });

      console.log("Updated CartItem:", updatedItem);
      return updatedItem;
    } else {
      // Step 4: First check if product exists
      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} does not exist`);
      }

      // Step 5: Create new CartItem
      const newCartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
        },
      });

      console.log("Added new CartItem:", newCartItem);
      return newCartItem;
    }
  } catch (error) {
    console.error("Error in addToCart:", error);
    throw error;
  }
}

//addToCart("5efcb0e3-0539-4370-88c0-39430e1facd6", "2a0e431f-d184-4431-876b-03a788933ac6", 2);

async function removeFromCart(userId, productId) {
  try {
    // Step 1: Get the user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: userId },
    });

    if (!cart) {
      throw new Error("Cart not found for user.");
    }

    // Step 2: Delete the CartItem if it exists
    const deletedItem = await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    console.log("Removed from cart:", deletedItem);
    return deletedItem;
  } catch (error) {
    if (error.code === "P2025") {
      console.warn("CartItem not found.");
      return null;
    }

    console.error("Error removing from cart:", error);
    throw error;
  }
}

async function getCart(userId) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        CartItem: {
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                stockQuantity: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      console.log("Cart not found for user.");
      return null;
    }

    console.log("Cart fetched:", cart);
    return cart;
  } catch (error) {
    console.error("Error fetching cart:", error);
    throw error;
  }
}

//getCart("5efcb0e3-0539-4370-88c0-39430e1facd6") ;

async function placeOrder(userId, shippingAddress) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      CartItem: {
        include: { Product: true },
      },
    },
  });

  if (!cart || cart.CartItem.length === 0) {
    throw new Error("Cart is empty or not found.");
  }

  const cartItems = cart.CartItem;

  // Group items by seller
  const sellerGroups = {};
  for (const item of cartItems) {
    const sellerId = item.Product.sellerId;
    if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];
    sellerGroups[sellerId].push(item);
  }

  const orders = [];

  for (const [sellerId, items] of Object.entries(sellerGroups)) {
    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.Product.price) * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId,
        sellerId,
        shippingAddress,
        totalAmount,
        status: "pending",
        OrderItem: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.Product.price,
          })),
        },
      },
      include: { OrderItem: true },
    });

    // Deduct stock for each item
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    orders.push(order);
  }

  // Clear the cart
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  console.log("Order(s) placed:", orders);
  return orders;
}

async function updateOrderStatus(orderId, newStatus) {
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
    },
  });

  console.log("Order status updated:", updatedOrder);
  return updatedOrder;
}

async function getSellerOrders(sellerId) {
  const orders = await prisma.order.findMany({
    where: { sellerId },
    include: {
      OrderItem: {
        include: {
          Product: {
            select: { name: true, price: true },
          },
        },
      },
      User: {
        select: { email: true, address: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

async function getUserOrders(userId) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      OrderItem: {
        include: {
          Product: {
            select: { name: true, imageUrl: true },
          },
        },
      },
      Seller: {
        select: { businessName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

async function getOrderById(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      OrderItem: {
        include: {
          Product: true,
        },
      },
      User: true,
      Seller: true,
    },
  });

  return order;
}

//placeOrder( "5efcb0e3-0539-4370-88c0-39430e1facd6" ,"123 Test Lane");

async function getAllProducts() {
  const products = await prisma.product.findMany({
    include: {
      Seller: true,
    },
  });
  console.log(products);
  return products;
}

// console.log(getAllProducts());

async function signInUser(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        Cart: true,
        Order: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Here you would typically compare the password with a hashed password
    // For now, we're just checking if the passwords match
    if (user.password !== password) {
      throw new Error("Invalid password");
    }

    return user;
  } catch (error) {
    console.error("Signin error:", error);
    throw error;
  }
}

async function getCartCount(userId) {
  try {
    const cart = await prisma.cart.findMany({
      where: {
        userId,
        order: null, // Only count items not in an order
      },
    });

    return cart.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error("Error getting cart count:", error);
    throw error;
  }
}

async function signInSeller(email, password) {
  const seller = await prisma.seller.findUnique({
    where: { email: email },
  });

  if (!seller || seller.password !== password) {
    return null;
  }

  return seller;
}

module.exports = {
  createUser,
  getUserById,
  createSeller,
  findProductsByName,
  getSellerById,
  createProduct,
  getProductById,
  getAllProducts,
  signInUser,
  addToCart,
  removeFromCart,
  getCart,
  placeOrder,
  updateOrderStatus,
  getSellerOrders,
  getUserOrders,
  getOrderById,
  signInSeller,
  getCartCount,
  signInSeller,
  findProductsByName,
};
