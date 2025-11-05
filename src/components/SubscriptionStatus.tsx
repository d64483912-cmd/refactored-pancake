import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubscription, type SubscriptionWithDetails } from "@/lib/autumn"
import { Calendar, Users, CheckCircle, AlertCircle, Clock } from "lucide-react"

export function SubscriptionStatus({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<SubscriptionWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      if (!userId) return

      try {
        const sub = await getSubscription(userId)
        setSubscription(sub ?? null)
      } catch (error) {
        console.error("Failed to fetch subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [userId])

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return {
          color: 'bg-accent text-accent-foreground',
          icon: CheckCircle,
          label: 'Active'
        }
      case 'trialing':
        return {
          color: 'bg-accent text-accent-foreground',
          icon: Clock,
          label: 'Trial'
        }
      case 'past_due':
        return {
          color: 'bg-accent text-accent-foreground',
          icon: AlertCircle,
          label: 'Past Due'
        }
      case 'canceled':
      case 'incomplete':
        return {
          color: 'bg-destructive text-primary-foreground',
          icon: AlertCircle,
          label: 'Canceled'
        }
      default:
        return {
          color: 'bg-muted text-foreground',
          icon: AlertCircle,
          label: 'Unknown'
        }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Free Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You're currently on our free plan. Upgrade to unlock premium features.
          </p>
        </CardContent>
      </Card>
    )
  }

  const planName = subscription.planName || subscription.plan || 'Subscription'
  const statusInfo = getStatusInfo(subscription.status)
  const StatusIcon = statusInfo.icon

  const isTrialing = subscription.status === 'trialing'
  const isCanceled = subscription.status === 'canceled' || subscription.cancelAtPeriodEnd

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            {planName}
          </CardTitle>
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Current Period
            </div>
            <div className="font-medium text-sm">
              {new Date(subscription.periodStart!).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })} - {new Date(subscription.periodEnd!).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>

          {subscription.seats && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Seats
              </div>
              <div className="font-medium text-sm">{subscription.seats}</div>
            </div>
          )}
        </div>

        {subscription.trialEnd && isTrialing && (
          <div className="bg-accent/40 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Trial Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Trial ends on {new Date(subscription.trialEnd!).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="bg-accent/40 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Canceling at Period End</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You can reactivate before {new Date(subscription.periodEnd!).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        )}

        {isCanceled && !subscription.cancelAtPeriodEnd && (
          <div className="bg-destructive/10 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Canceled</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Access ends on {new Date(subscription.periodEnd!).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
