"use client";

import React from "react";
import { toError } from "@/lib/errors";

type Props = { children: React.ReactNode; fallback?: React.ReactNode; name?: string };

type State = { hasError: boolean; error?: Error };

export default class SafeBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error: toError(error) };
  }

  override componentDidCatch(error: unknown) {
    const err = toError(error);
    const name = this.props.name || "SafeBoundary";
    // eslint-disable-next-line no-console
    console.error(`[SafeBoundary:${name}]`, err);
  }

  override render() {
    if (this.state.hasError) {
      // Never return null - always render something to prevent React from unmounting the tree
      if (this.props.fallback === null || this.props.fallback === undefined) {
        return <div style={{ display: "none" }} aria-hidden="true" />;
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}
