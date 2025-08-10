import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Textarea } from './ui/textarea'
import { MapPin, User, Mail, Phone, CreditCard, Package, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../hooks/use-toast'
import { apiClient } from '../config/api'

interface CheckoutFormProps {
  onOrderComplete: (orderId: string) => void
  onBack: () => void
}

const CheckoutForm = ({ onOrderComplete, onBack }: CheckoutFormProps) => {
  const { user } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Personal Details
    firstName: user?.user_metadata?.full_name?.split(' ')[0] || '',
    lastName: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone_number || '',
    
    // Shipping Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    
    // Order Notes
    orderNotes: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'state', 'postalCode']
    const missing = required.filter(field => !formData[field as keyof typeof formData])
    
    if (missing.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return false
    }

    // Validate phone number (basic Indian format)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(formData.phone.replace(/\D/g, '').slice(-10))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        phoneNumber: formData.phone,
        email: formData.email,
        totalAmount: totalPrice,
        orderNotes: formData.orderNotes
      }

      console.log('🛒 Creating order:', orderData)

      // Create order with payment integration
      const response = await apiClient.post('/orders', orderData)

      if (response.data.success) {
        // Initialize Razorpay payment
        const options = {
          key: response.data.key_id,
          amount: response.data.amount,
          currency: response.data.currency || 'INR',
          name: 'Jhankari Craft Collective',
          description: 'Order Payment',
          order_id: response.data.razorpay_order_id,
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#8B5CF6'
          },
          handler: async (paymentResponse: any) => {
            await verifyPayment(paymentResponse)
          },
          modal: {
            ondismiss: () => {
              toast({
                title: "Payment Cancelled",
                description: "Your order has been saved. Complete payment to confirm.",
                variant: "destructive"
              })
            }
          }
        }

        if (window.Razorpay) {
          const razorpay = new window.Razorpay(options)
          razorpay.open()
        } else {
          throw new Error('Payment gateway not loaded')
        }
      }
    } catch (error: any) {
      console.error('Order creation failed:', error)
      toast({
        title: "Order Failed",
        description: error.response?.data?.error || "Failed to create order. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (paymentResponse: any) => {
    try {
      const response = await apiClient.put('/orders', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      })

      if (response.data.success) {
        clearCart()
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully."
        })
        onOrderComplete(response.data.order.id)
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support for assistance.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onBack}
                className="h-8"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
                <p className="text-sm text-gray-600">Complete your secure purchase</p>
              </div>
            </div>
            
            {/* Compact Order Badge */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border">
              <Package className="h-4 w-4 text-royal-purple" />
              <div className="text-sm">
                <span className="font-medium">{items.length} Items</span>
                <span className="text-royal-crimson font-bold ml-2">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <div className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Personal Information - Ultra Compact */}
                  <Card className="bg-white border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-royal-purple" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="h-8 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm">Phone *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="10-digit number"
                          className="h-8 text-sm"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Address - Ultra Compact */}
                  <Card className="bg-white border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4 text-royal-purple" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div>
                        <Label htmlFor="addressLine1" className="text-sm">Address *</Label>
                        <Input
                          id="addressLine1"
                          name="addressLine1"
                          value={formData.addressLine1}
                          onChange={handleInputChange}
                          placeholder="House no., Street name"
                          className="h-8 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          name="addressLine2"
                          value={formData.addressLine2}
                          onChange={handleInputChange}
                          placeholder="Apartment, suite (optional)"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="city" className="text-sm">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state" className="text-sm">State *</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="postalCode" className="text-sm">PIN Code *</Label>
                          <Input
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            placeholder="6 digits"
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="country" className="text-sm">Country</Label>
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            disabled
                            className="h-8 text-sm bg-gray-50"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Notes - Minimal */}
                  <Card className="bg-white border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4 text-royal-purple" />
                        Order Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Textarea
                        name="orderNotes"
                        value={formData.orderNotes}
                        onChange={handleInputChange}
                        placeholder="Special instructions (optional)"
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </CardContent>
                  </Card>
                </form>
              </div>

              {/* Order Summary - Fixed Height */}
              <div>
                <Card className="bg-white border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-4 w-4 text-royal-purple" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {/* Cart Items - Fixed Height */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{item.name}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-royal-crimson text-xs">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Shipping</span>
                        <span>Free</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span className="text-royal-crimson">₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || items.length === 0}
                      className="w-full h-9 text-sm font-semibold bg-gradient-to-r from-royal-purple to-royal-crimson hover:from-royal-purple/90 hover:to-royal-crimson/90 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Place Order (₹{totalPrice.toLocaleString('en-IN')})
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      🔒 Secure payment with 256-bit encryption
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutForm
