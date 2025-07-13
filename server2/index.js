const express = require("express");     
const { getUserById, createUser, createSeller, getSellerById, createProduct, getProductById, addToCart, removeFromCart, getCart, placeOrder, updateOrderStatus, getSellerOrders, getUserOrders, getOrderById } = require("./client"); 
const cors = require('cors');
const app = express();
const PORT = 3000; 


app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded());


app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });


app.get("api/v1/user/:id", async (req,res) => {
    const userId = req.query() ; 
    const user = getUserById(userId); 
    res.json(user) ; 
}); 


app.post("/api/v1/user" , async (req, res) => {
    const {email , password, phoneNumber, address} = req.body(); 
    const userData = {
        email: email, 
        password: password, 
        phoneNumber: phoneNumber, 
        address: address ,  
    }

    const newUser = await createUser(userData);
    res.json(newUser);
})



app.post("/api/v1/seller/signup" , async (req,res) => {
    const {email , password, businessName ,phoneNumber } = req.body(); 
    const userData = {
        email: email, 
        password: password, 
        businessName: businessName , 
        phoneNumber: phoneNumber,   
    }

    const newSeller = await createSeller(userData);
    res.json(newSeller);
})

app.get("api/v1/seller/:id", async (req,res) => {
    const sellerId = req.query() ; 
    const seller = getSellerById(sellerId); 
    res.json(seller) ; 
}); 


app.post("api/v1/seller/signin" , async (req, res) =>{
    const {email , password} = req.body(); 

    
})



app.post("api/v1/product" , async (req, res) => {

    const {name, description ,category, price, sellerId, stockQuantity, imageUrl} = req.body();

    const productData = {
        name: name,
        description: description,
        category: category,
        price: price,
        sellerId: sellerId,
        stockQuantity: stockQuantity,
        imageUrl: imageUrl
      };
    createProduct(productData); 
    
})


app.get("api/v1/product/:id", async (req, res) => {
    const productId = req.query(); 
    const product = getProductById(productId);
    res.json(product) ; 
})


app.post("/api/v1/cart" , async(req , res) => {
    const {userId , productId , quantity } = req.body(); 
    const cart = await addToCart(userId, productId , quantity); 
    res.json(cart); 
})


app.delete("/api/v1/cart" , async(req, res) => {
    const {userId , productId  } = req.body(); 
    removeFromCart(userId, productId); 
    console.log("done"); 
})


app.get("/api/v1/cart/:id" , async (req, res) => {
    const userId = req.query(); 
    const cart = await getCart(userId);
    res.json(cart);  
})


app.get("/api/v1/Order", async(req,res)=>{
    const {userId , shippingAddress} = req.body(); 
    const order = placeOrder(userId, shippingAddress); 
    res.json(order);
})

// Update Order Status
app.post("/api/v1/order/:id/status", async (req, res) => {
    const { newStatus } = req.body();
    const orderId = req.params.id;
    const updatedOrder = await updateOrderStatus(orderId, newStatus);
    res.json(updatedOrder);
})

// Get Seller Orders
app.get("/api/v1/seller/orders", async (req, res) => {
    const sellerId = req.query.sellerId;
    const orders = await getSellerOrders(sellerId);
    res.json(orders);
})

// Get User Orders
app.get("/api/v1/user/orders", async (req, res) => {
    const userId = req.query.userId;
    const orders = await getUserOrders(userId);
    res.json(orders);
})

// Get Order by ID
app.get("/api/v1/order/:id", async (req, res) => {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    res.json(order);
})



app.listen(3000 , ()=> {
    console.log("Server is starting boi")
})