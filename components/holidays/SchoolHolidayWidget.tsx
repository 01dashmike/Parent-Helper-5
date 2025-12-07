"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/buttons";
import { EmptyState } from "@/components/ui/emptystate";
import { getHolidayInfo, formatHolidayRange, type UKRegion } from "@/lib/utils/holidays";

export function SchoolHolidayWidget() {
  const [region, setRegion] = useState<UKRegion>("england");
  const [holidayInfo, setHolidayInfo] = useState<ReturnType<typeof getHolidayInfo> | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const info = getHolidayInfo(region);
    setHolidayInfo(info);
    setConfirmed(false);
  }, [region]);

  if (!holidayInfo) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sage" />
            School Holidays
          </CardTitle>
          <CardDescription>Check upcoming school breaks in your region</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" aria-label="Loading holiday information">
          <div className="skeleton h-10" aria-hidden="true"></div>
          <div className="skeleton h-24" aria-hidden="true"></div>
        </CardContent>
      </Card>
    );
  }

  const { nextHoliday, currentHoliday } = holidayInfo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-sage" />
          School Holidays
        </CardTitle>
        <CardDescription>Check upcoming school breaks in your region</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-small font-medium text-charcoal">Region</label>
          <Select value={region} onValueChange={(value: UKRegion) => setRegion(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="england">England</SelectItem>
              <SelectItem value="scotland">Scotland</SelectItem>
              <SelectItem value="wales">Wales</SelectItem>
              <SelectItem value="northern-ireland">Northern Ireland</SelectItem>
              <SelectItem value="london">London</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentHoliday ? (
          <div className="rounded-lg border border-sage/30 bg-sage/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-sage shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-charcoal">Currently on break</p>
                <p className="text-small text-slateSoft">{currentHoliday.name}</p>
                <p className="text-small text-slateSoft">{formatHolidayRange(currentHoliday.startDate, currentHoliday.endDate)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {nextHoliday ? (
          <div className="rounded-lg border border-sage/20 bg-white p-4">
            <p className="font-semibold text-charcoal">Next break:</p>
            <p className="text-small text-slateSoft">{nextHoliday.name}</p>
            <p className="text-small text-slateSoft">{formatHolidayRange(nextHoliday.startDate, nextHoliday.endDate)}</p>
          </div>
        ) : (
          <EmptyState
            title="No upcoming holidays found"
            description="Check back later for upcoming school holiday dates."
            iconVariant="inbox"
            size="sm"
          />
        )}

        {!confirmed && (
          <div className="rounded-lg border border-sage/20 bg-cream/50 p-4">
            <p className="mb-2 text-small font-medium text-charcoal">Is this correct?</p>
            <p className="mb-3 text-small text-slateSoft">
              School holiday dates can vary by local authority. Please verify with your school.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmed(true)}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Yes, correct
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmed(true)}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Needs update
              </Button>
            </div>
          </div>
        )}

        {confirmed && (
          <p className="text-small text-slateSoft text-center">
            ✓ Confirmed. We&apos;ll use this for personalized recommendations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

