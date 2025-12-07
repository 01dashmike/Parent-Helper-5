"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { Button } from "@/components/ui/buttons";
import {
  registerServiceWorker,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendSubscriptionToServer,
  removeSubscriptionFromServer,
} from "@/lib/push-notifications";
// Toast functionality - can be replaced with a toast library if available

interface PushNotificationButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PushNotificationButton({
  className,
  variant = "outline",
  size = "default",
}: PushNotificationButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    ) {
      setIsSupported(true);
      initializePush();
    }
  }, []);

  async function initializePush() {
    try {
      const reg = await registerServiceWorker();
      if (!reg) {
        setIsSupported(false);
        return;
      }

      setRegistration(reg);

      // Check existing subscription
      const subscription = await reg.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("[PushNotificationButton] Unexpected error:", error);
      setIsSupported(false);
    }
  }

  async function handleSubscribe() {
    if (!registration) {
      setMessage({ type: "error", text: "Service worker not registered" });
      return;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permission = await requestPushPermission();

      if (permission !== "granted") {
        setMessage({ type: "error", text: "Please enable notifications in your browser settings" });
        setIsLoading(false);
        return;
      }

      // Subscribe to push
      const subscription = await subscribeToPush(registration);

      if (!subscription) {
        setMessage({ type: "error", text: "Failed to subscribe to push notifications" });
        setIsLoading(false);
        return;
      }

      // Send subscription to server
      const success = await sendSubscriptionToServer(subscription);

      if (success) {
        setIsSubscribed(true);
        setMessage({ type: "success", text: "You'll now receive push notifications" });
      } else {
        setMessage({ type: "error", text: "Failed to save subscription" });
      }
    } catch (error) {
      console.error("[PushNotificationButton] Unexpected error:", error);
      setMessage({ type: "error", text: "Failed to enable push notifications" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnsubscribe() {
    if (!registration) {
      return;
    }

    setIsLoading(true);

    try {
      // Get current subscription to get endpoint
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;

      // Unsubscribe from push
      await unsubscribeFromPush(registration);

      // Remove from server
      await removeSubscriptionFromServer(endpoint);

      setIsSubscribed(false);
      setMessage({ type: "success", text: "Push notifications disabled" });
    } catch (error) {
      console.error("[PushNotificationButton] Unexpected error:", error);
      setMessage({ type: "error", text: "Failed to disable push notifications" });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={className}
      >
        {isSubscribed ? (
          <>
            <BellOff size={iconSize.sm} className="mr-2" aria-hidden="true" />
            Disable Notifications
          </>
        ) : (
          <>
            <Bell size={iconSize.sm} className="mr-2" aria-hidden="true" />
            Enable Notifications
          </>
        )}
      </Button>
      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          aria-live={message.type === "error" ? "assertive" : "polite"}
          aria-atomic="true"
          className={`text-small ${message.type === "error" ? "text-red-600" : "text-green-600"}`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

