import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Seller = () => {
  const [responses, setResponses] = useState<any[]>([]);
  const [sellerId, setSellerId] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    phoneNumber: '',
    productName: '',
    productDescription: '',
    productCategory: '',
    productPrice: '',
    productStockQuantity: '',
    productImageUrl: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const BASE_URL = 'http://localhost:3000';

  const handleSellerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/api/v1/seller/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          phoneNumber: formData.phoneNumber
        })
      });
      const data = await response.json();
      setResponses(prev => [...prev, { endpoint: '/api/v1/seller/signup', data }]);
      setSellerId(data.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSellerSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/api/v1/seller/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });
      const data = await response.json();
      setResponses(prev => [...prev, { endpoint: '/api/v1/seller/signin', data }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGetSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/api/v1/seller/${sellerId}`);
      const data = await response.json();
      setResponses(prev => [...prev, { endpoint: `/api/v1/seller/${sellerId}`, data }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/api/v1/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.productName,
          description: formData.productDescription,
          category: formData.productCategory,
          price: Number(formData.productPrice),
          sellerId: sellerId,
          stockQuantity: Number(formData.productStockQuantity),
          imageUrl: formData.productImageUrl
        })
      });
      const data = await response.json();
      setResponses(prev => [...prev, { endpoint: '/api/v1/product', data }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGetProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/products`);
      const data = await response.json();
      setResponses(prev => [...prev, { endpoint: '/api/v1/products', data }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="seller-page p-4 space-y-8">
      <div className="space-y-8">
        {/* Seller Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Seller Signup</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSellerSignup} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter business name"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <Button type="submit" className="w-full">
                Signup
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Seller Signin Form */}
        <Card>
          <CardHeader>
            <CardTitle>Seller Signin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSellerSignin} className="space-y-4">
              <div>
                <Label htmlFor="signinEmail">Email</Label>
                <Input
                  id="signinEmail"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="signinPassword">Password</Label>
                <Input
                  id="signinPassword"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                />
              </div>
              <Button type="submit" className="w-full">
                Signin
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Get Seller Form */}
        <Card>
          <CardHeader>
            <CardTitle>Get Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGetSeller} className="space-y-4">
              <div>
                <Label htmlFor="sellerId">Seller ID</Label>
                <Input
                  id="sellerId"
                  name="sellerId"
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  placeholder="Enter seller ID"
                />
              </div>
              <Button type="submit" className="w-full">
                Get Seller
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Product Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="productDescription">Description</Label>
                <Input
                  id="productDescription"
                  name="productDescription"
                  value={formData.productDescription}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <Label htmlFor="productCategory">Category</Label>
                <Input
                  id="productCategory"
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                />
              </div>
              <div>
                <Label htmlFor="productPrice">Price</Label>
                <Input
                  id="productPrice"
                  name="productPrice"
                  type="number"
                  value={formData.productPrice}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                />
              </div>
              <div>
                <Label htmlFor="productStockQuantity">Stock Quantity</Label>
                <Input
                  id="productStockQuantity"
                  name="productStockQuantity"
                  type="number"
                  value={formData.productStockQuantity}
                  onChange={handleInputChange}
                  placeholder="Enter stock quantity"
                />
              </div>
              <div>
                <Label htmlFor="productImageUrl">Image URL</Label>
                <Input
                  id="productImageUrl"
                  name="productImageUrl"
                  value={formData.productImageUrl}
                  onChange={handleInputChange}
                  placeholder="Enter image URL"
                />
              </div>
              <Button type="submit" className="w-full">
                Create Product
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Get Products Button */}
        <Card>
          <CardHeader>
            <CardTitle>Get Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGetProducts} className="w-full">
              Get Products
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Responses Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">API Responses</h2>
        {responses.map((response, index) => (
          <Card key={index} className="p-4">
            <CardHeader className="mb-4">
              <CardTitle>{response.endpoint}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Seller;