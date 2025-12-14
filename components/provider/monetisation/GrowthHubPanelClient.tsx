"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, BarChart3, Sparkles } from "lucide-react";

type GrowthHubPanelClientProps = {
  providerId: number;
  currentRanking?: number;
  estimatedMissedViews?: number;
  entitlements: {
    featuredListing: boolean;
    verifiedBadge: boolean;
    premiumAnalytics: boolean;
  };
};

export default function GrowthHubPanelClient({
  providerId,
  currentRanking = 0,
  estimatedMissedViews = 0,
  entitlements,
}: GrowthHubPanelClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-charcoal mb-2">Growth Hub</h2>
        <p className="text-slateSoft">
          Boost your visibility and grow your class bookings
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Current Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slateSoft">Current Ranking</span>
            <Badge variant={currentRanking <= 10 ? "success" : "default"}>
              #{currentRanking || "N/A"}
            </Badge>
          </div>
          {estimatedMissedViews > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slateSoft">Estimated Missed Views</span>
              <span className="text-sm font-medium text-orange-600">
                ~{estimatedMissedViews.toLocaleString()} this month
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upsell Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Featured Listing */}
        <Card className={entitlements.featuredListing ? "border-sage" : ""}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-sage" />
              <CardTitle className="text-lg">Featured Listing</CardTitle>
            </div>
            {entitlements.featuredListing && (
              <Badge variant="success" className="w-fit">Active</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slateSoft">
              Top placement in search results with highlighted badge
            </p>
            <ul className="text-sm space-y-1 text-slateSoft">
              <li>• Guaranteed top spot</li>
              <li>• Highlighted badge</li>
              <li>• Priority ranking</li>
            </ul>
            {!entitlements.featuredListing ? (
              <Button asChild className="w-full">
                <Link href={`/provider/upgrade/featured?providerId=${providerId}`}>
                  Upgrade Now
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full">
                <Link href={`/provider/upgrade/featured?providerId=${providerId}`}>
                  Manage
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Verified Badge */}
        <Card className={entitlements.verifiedBadge ? "border-sage" : ""}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Verified Badge</CardTitle>
            </div>
            {entitlements.verifiedBadge && (
              <Badge variant="success" className="w-fit">Active</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slateSoft">
              Trust signal with ranking boost and highlighted checkmark
            </p>
            <ul className="text-sm space-y-1 text-slateSoft">
              <li>• Trust seal</li>
              <li>• +30% ranking boost</li>
              <li>• Higher clickthrough</li>
            </ul>
            {!entitlements.verifiedBadge ? (
              <Button asChild className="w-full">
                <Link href={`/provider/upgrade/verified?providerId=${providerId}`}>
                  Upgrade Now
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full">
                <Link href={`/provider/upgrade/verified?providerId=${providerId}`}>
                  Manage
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Premium Analytics */}
        <Card className={entitlements.premiumAnalytics ? "border-sage" : ""}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Premium Analytics</CardTitle>
            </div>
            {entitlements.premiumAnalytics && (
              <Badge variant="success" className="w-fit">Active</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slateSoft">
              Full insights including ranking visibility and competitor comparison
            </p>
            <ul className="text-sm space-y-1 text-slateSoft">
              <li>• Search ranking visibility</li>
              <li>• Competitor comparison</li>
              <li>• Conversion trends</li>
            </ul>
            {!entitlements.premiumAnalytics ? (
              <Button asChild className="w-full">
                <Link href={`/provider/upgrade/analytics?providerId=${providerId}`}>
                  Try Free Preview
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full">
                <Link href={`/provider/upgrade/analytics?providerId=${providerId}`}>
                  View Analytics
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







