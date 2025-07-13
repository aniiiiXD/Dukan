
import Link from 'next/link';

export default function Choose() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="container max-w-md p-8 bg-white rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
                    Which Category do you belong to?
                </h1>
                <div className="flex gap-4 justify-center">
                    <Link href="/user" className="px-6 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                        User
                    </Link>
                    <Link href="/seller" className="px-6 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                        Seller
                    </Link>
                </div>
            </div>
        </div>
    )
}