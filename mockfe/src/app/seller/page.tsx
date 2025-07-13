import SellerSignin from '@/components/SellerSignin';
import ProductForm from '@/components/ProductForm';

export default function Seller() {
    return (
        <div className="min-h-screen bg-black">
            <div className="container mx-auto">
                <SellerSignin isSignUp={false} />
                <ProductForm />
            </div>
        </div>
    );
}