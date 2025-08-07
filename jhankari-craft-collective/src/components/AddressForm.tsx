import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { MapPin, User } from 'lucide-react';

interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressFormProps {
  onSubmit: (billingAddress: Address, shippingAddress: Address) => void;
  loading?: boolean;
  initialData?: Partial<Address>;
}

export const AddressForm: React.FC<AddressFormProps> = ({ 
  onSubmit, 
  loading,
  initialData 
}) => {
  const [billingAddress, setBillingAddress] = useState<Address>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    ...initialData
  });

  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    ...initialData
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);

  const handleBillingChange = (field: keyof Address, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
    if (sameAsBilling) {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleShippingChange = (field: keyof Address, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setShippingAddress({ ...billingAddress });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(billingAddress, shippingAddress);
  };

  const renderAddressFields = (
    address: Address,
    onChange: (field: keyof Address, value: string) => void,
    prefix: string
  ) => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor={`${prefix}-firstName`}>First Name *</Label>
        <Input
          id={`${prefix}-firstName`}
          value={address.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-lastName`}>Last Name *</Label>
        <Input
          id={`${prefix}-lastName`}
          value={address.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          required
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor={`${prefix}-email`}>Email *</Label>
        <Input
          id={`${prefix}-email`}
          type="email"
          value={address.email}
          onChange={(e) => onChange('email', e.target.value)}
          required
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor={`${prefix}-phone`}>Phone Number *</Label>
        <Input
          id={`${prefix}-phone`}
          type="tel"
          value={address.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+91 1234567890"
          required
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor={`${prefix}-addressLine1`}>Address Line 1 *</Label>
        <Input
          id={`${prefix}-addressLine1`}
          value={address.addressLine1}
          onChange={(e) => onChange('addressLine1', e.target.value)}
          placeholder="House/Flat number, Building name"
          required
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor={`${prefix}-addressLine2`}>Address Line 2</Label>
        <Input
          id={`${prefix}-addressLine2`}
          value={address.addressLine2}
          onChange={(e) => onChange('addressLine2', e.target.value)}
          placeholder="Street, Area, Landmark"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-city`}>City *</Label>
        <Input
          id={`${prefix}-city`}
          value={address.city}
          onChange={(e) => onChange('city', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-state`}>State *</Label>
        <Input
          id={`${prefix}-state`}
          value={address.state}
          onChange={(e) => onChange('state', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-postalCode`}>Postal Code *</Label>
        <Input
          id={`${prefix}-postalCode`}
          value={address.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          pattern="[0-9]{6}"
          placeholder="123456"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-country`}>Country *</Label>
        <Input
          id={`${prefix}-country`}
          value={address.country}
          onChange={(e) => onChange('country', e.target.value)}
          required
          disabled
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-royal-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-royal-purple" />
            Billing Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderAddressFields(billingAddress, handleBillingChange, 'billing')}
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="sameAsBilling"
          checked={sameAsBilling}
          onCheckedChange={handleSameAsBillingChange}
        />
        <Label htmlFor="sameAsBilling">
          Shipping address is same as billing address
        </Label>
      </div>

      {!sameAsBilling && (
        <Card className="border-royal-purple/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-royal-purple" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderAddressFields(shippingAddress, handleShippingChange, 'shipping')}
          </CardContent>
        </Card>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        variant="royal" 
        size="lg"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </Button>
    </form>
  );
};
