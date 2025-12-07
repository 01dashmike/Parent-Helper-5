"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, BarChart3, CreditCard, TrendingUp } from "lucide-react";

export function OneClickActions() {
  const actions = [
    {
      label: "Add a Class",
      href: "/provider/classes/new",
      icon: Plus,
      description: "Create a new class listing",
    },
    {
      label: "Update Profile",
      href: "/provider/profile",
      icon: Edit,
      description: "Edit your business information",
    },
    {
      label: "View Analytics",
      href: "/provider/analytics",
      icon: BarChart3,
      description: "See detailed performance metrics",
    },
    {
      label: "Connect Payments",
      href: "/provider/payouts",
      icon: CreditCard,
      description: "Set up Stripe for payouts",
    },
    {
      label: "Boost Visibility",
      href: "/provider/marketing",
      icon: TrendingUp,
      description: "Promote your listings",
    },
  ];

  return (
    <Card className="border-sage/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-charcoal">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col items-start justify-start p-4 text-left hover:bg-sage/5"
                asChild
              >
                <Link href={action.href}>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5 text-sage" />
                    <span className="font-semibold text-charcoal">{action.label}</span>
                  </div>
                  <p className="text-xs text-charcoal/60">{action.description}</p>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}





