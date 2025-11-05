import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Need Help?</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Our support team can help with billing questions and subscription changes.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">Documentation</Button>
          <Button variant="outline" size="sm">Contact Support</Button>
          <Button variant="outline" size="sm">Billing FAQ</Button>
        </div>
      </CardContent>
    </Card>
  );
}

