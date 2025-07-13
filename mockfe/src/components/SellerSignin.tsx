import Link from 'next/link';

interface SellerSigninProps {
  isSignUp: boolean;
}

export default function SellerSignin({ isSignUp = false }: SellerSigninProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="container max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          {isSignUp ? "Seller Sign Up" : "Seller Login"}
        </h1>
        
        <form className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-black mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  id="businessName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-black mb-1">
                  Business Type
                </label>
                <select
                  id="businessType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select business type</option>
                  <option value="retail">Retail Store</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Enter your password"
            />
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isSignUp 
            ? "Already have an account? Login" 
            : "Don't have an account? Sign up"}
          {' '}
          <Link 
            href={isSignUp ? "/seller/login" : "/seller/signup"} 
            className="text-gray-800 hover:text-gray-600"
          >
            here
          </Link>
        </p>
      </div>
    </div>
  );
}