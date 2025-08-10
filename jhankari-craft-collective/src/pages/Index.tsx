import Header from '../components/Header'
import Hero from '../components/Hero'
import ProductGrid from '../components/ProductGrid'
import Footer from '../components/Footer'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const Index = () => {
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0)
  const { refreshAuth, user } = useAuth()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  const handleCartUpdate = () => {
    setCartUpdateTrigger(prev => prev + 1)
  }

  useEffect(() => {
    // Only refresh auth state once when homepage loads and user is not logged in
    const urlParams = new URLSearchParams(window.location.search)
    const hasAuthError = urlParams.get('error')
    
    if (!hasAuthError && !user && !hasCheckedAuth) {
      console.log('🔄 Homepage loaded, checking auth state...')
      refreshAuth().finally(() => {
        setHasCheckedAuth(true)
      })
    }
  }, [refreshAuth, user, hasCheckedAuth])

  return (
    <div className="min-h-screen">
      <Header key={cartUpdateTrigger} />
      <Hero />
      <ProductGrid onCartUpdate={handleCartUpdate} />
      <Footer />
    </div>
  )
}

export default Index
