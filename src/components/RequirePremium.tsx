import { ReactNode, useEffect, useState } from "react"
import { authClient } from "@/lib/auth"
import { hasPremiumAccess } from "@/lib/autumn"
import { useNavigate } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Crown } from "lucide-react"
import { SubscriptionStatus } from "./SubscriptionStatus"

interface RequirePremiumProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

export function RequirePremium({ children, fallback, redirectTo }: RequirePremiumProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkAccess() {
      try {
        // Get current user
        const { data: sessionData } = await authClient.getSession()
        const currentUser = sessionData?.user
        
        if (!currentUser) {
          setUser(null)
          setHasAccess(false)
          setLoading(false)
          return
        }

        setUser(currentUser)
        
        // Check premium access
        const premiumAccess = await hasPremiumAccess(currentUser.id)
        setHasAccess(premiumAccess)
      } catch (error) {
        console.error('Failed to check premium access:', error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    if (redirectTo) {
      navigate(redirectTo)
      return null
    }
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access this feature.
        </AlertDescription>
        <Button 
          onClick={() => navigate('/sign-in')} 
          className="mt-2"
          size="sm"
        >
          Sign In
        </Button>
      </Alert>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Crown className="h-4 w-4" />
        <AlertDescription>
          This feature requires a premium subscription.
        </AlertDescription>
      </Alert>
      
      <div className="max-w-md">
        <SubscriptionStatus userId={user.id} />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => navigate('/billing')} size="sm">
          View Plans
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)} size="sm">
          Go Back
        </Button>
      </div>
    </div>
  )
}

// Hook for checking premium access in components
export function usePremiumAccess() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: sessionData } = await authClient.getSession()
        const currentUser = sessionData?.user
        
        if (!currentUser) {
          setUser(null)
          setHasAccess(false)
          setLoading(false)
          return
        }

        setUser(currentUser)
        const premiumAccess = await hasPremiumAccess(currentUser.id)
        setHasAccess(premiumAccess)
      } catch (error) {
        console.error('Failed to check premium access:', error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [])

  return { hasAccess, loading, user }
}