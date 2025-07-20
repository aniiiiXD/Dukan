const express = require("express"); 
const Razorpay = require("razorpay"); 
const bodyParser = require('body-parser'); 
const path = require('path'); 
const fs = require('fs'); 
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');

 
const app = express(); 
const port = 3000 ; 

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true})); 


app.use(express.static(path.join(__dirname))); 


const razorpay = new Razorpay({
    key_id: "rzp_test_gJyeQ7PpskfU2x" , 
    key_secret: "VySL1IsLhWq7CXfmCbmOUAZG", 
});

const readData = () => {
    try {
        if (!fs.existsSync('orders.json')) {
            console.log('Orders file does not exist, creating...');
            writeData([]);
            return [];
        }
        
        const data = fs.readFileSync('orders.json', 'utf8'); 
        return JSON.parse(data); 
    } catch (error) {
        console.error('Error reading orders file:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync('orders.json', JSON.stringify(data, null,2)); 
        console.log('Orders data written successfully');
    } catch (error) {
        console.error('Error writing orders data:', error);
        throw error;
    }
};


if (!fs.existsSync('orders.json')){
    writeData([]); 
}


app.post('/create-order', async (req,res) => {
    try {
        console.log('Received create order request with body:', req.body);
        const {amount , currency, receipt, notes } = req.body; 

        const options = {
            amount: amount*100 , 
            currency , 
            receipt , 
            notes
        };
        console.log('Creating order with options:', options);

        const order = await razorpay.orders.create(options); 
        console.log('Order created successfully:', { orderId: order.id });

        const orders = readData(); 
        orders.push({
            order_id: order.id, 
            amount: order.amount, 
            currency : order.currency ,
            receipt: order.receipt , 
            status: 'created',  
        }); 
        writeData(orders);
        console.log('Order data saved successfully');

        res.json(order); 
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } 
});


app.get('/payment-success', async (req, res)=> {
    console.log('Payment success page requested');
    res.sendFile(path.join(__dirname, 'success.html')); 
}); 


app.post('/verify-payment', async (req, res)=> {
    const { razorpay_order_id , razorpay_payment_id, razorpay_signature} = req.body ; 

    const secret = razorpay.key_secret ; 
    const body = razorpay_order_id + '|' + razorpay_payment_id; 

    try {
        const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret); 
        if(isValidSignature) {
            const orders = readData(); 
            const order = orders.find(o => o.order_id === razorpay_order_id);
            if(order) {
                order.status = 'paid'; 
                order.payment_id = razorpay_payment_id;
                writeData(orders);
            }
            res.status(200).json({status: 'ok' });
        } else {
            res.status(400).json({ status : 'verification failed'});
            console.log("payment verification failed!"); 
        }
    } catch (error) {
        console.log(error); 
        res.status(500).json({status: "error", message: "Error verifying payment"});
    }

});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Server started successfully!');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
}); 



module.exports = app ; 