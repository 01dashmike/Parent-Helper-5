/**
 * Module type declarations for packages without TypeScript definitions
 */

declare module "twilio" {
  export interface TwilioConfig {
    accountSid: string;
    authToken: string;
  }
  
  export class Twilio {
    constructor(accountSid: string, authToken: string);
    messages: {
      create(options: {
        to: string;
        from: string;
        body: string;
      }): Promise<{ sid: string; status: string }>;
    };
  }
  
  export default Twilio;
}

declare module "recharts" {
  import { ComponentType, ReactNode } from "react";
  
  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    children: ReactNode;
    [key: string]: unknown;
  }
  
  export const ResponsiveContainer: ComponentType<ResponsiveContainerProps>;
  
  export interface LineChartProps {
    data: unknown[];
    children: ReactNode;
    [key: string]: unknown;
  }
  
  export const LineChart: ComponentType<LineChartProps>;
  export const Line: ComponentType<Record<string, unknown>>;
  export const BarChart: ComponentType<Record<string, unknown>>;
  export const Bar: ComponentType<Record<string, unknown>>;
  export const PieChart: ComponentType<Record<string, unknown>>;
  export const Pie: ComponentType<Record<string, unknown>>;
  export const Cell: ComponentType<Record<string, unknown>>;
  export const XAxis: ComponentType<Record<string, unknown>>;
  export const YAxis: ComponentType<Record<string, unknown>>;
  export const CartesianGrid: ComponentType<Record<string, unknown>>;
  export const Tooltip: ComponentType<Record<string, unknown>>;
  export const Legend: ComponentType<Record<string, unknown>>;
  export const AreaChart: ComponentType<Record<string, unknown>>;
  export const Area: ComponentType<Record<string, unknown>>;
  export const Brush: ComponentType<Record<string, unknown>>;
  export const ReferenceLine: ComponentType<Record<string, unknown>>;
  export const ReferenceArea: ComponentType<Record<string, unknown>>;
  export const RadialBar: ComponentType<Record<string, unknown>>;
  export const RadialBarChart: ComponentType<Record<string, unknown>>;
  export const ComposedChart: ComponentType<Record<string, unknown>>;
  export const Scatter: ComponentType<Record<string, unknown>>;
  export const ScatterChart: ComponentType<Record<string, unknown>>;
  export const FunnelChart: ComponentType<Record<string, unknown>>;
  export const Treemap: ComponentType<Record<string, unknown>>;
  export const Sankey: ComponentType<Record<string, unknown>>;
  export const Radar: ComponentType<Record<string, unknown>>;
  export const RadarChart: ComponentType<Record<string, unknown>>;
  export const Sunburst: ComponentType<Record<string, unknown>>;
  export const TreemapChart: ComponentType<Record<string, unknown>>;
}

declare module "@/components/motion/motion-proxy" {
  import { ComponentType, ReactNode } from "react";
  
  export interface MotionProps {
    children?: ReactNode;
    [key: string]: any;
  }
  
  export const motion: {
    div: ComponentType<any>;
    span: ComponentType<any>;
    p: ComponentType<any>;
    li: ComponentType<any>;
    [key: string]: ComponentType<any>;
  };
  
  export const AnimatePresence: ComponentType<{ children: ReactNode; [key: string]: any }>;
}

declare module "openai" {
  export class OpenAI {
    constructor(config?: { apiKey?: string; [key: string]: any });
    chat: {
      completions: {
        create(options: any): Promise<any>;
      };
    };
  }
}

declare module "@vercel/og" {
  import { ReactElement } from "react";
  export class ImageResponse extends Response {
    constructor(element: ReactElement, options?: { width?: number; height?: number; [key: string]: any });
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

declare module "web-push" {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }
  
  export interface SendResult {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  }
  
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;
  
  export function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: { TTL?: number; [key: string]: any }
  ): Promise<SendResult>;
  
  export function generateVAPIDKeys(): {
    publicKey: string;
    privateKey: string;
  };
  
  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
    generateVAPIDKeys: typeof generateVAPIDKeys;
  };
  
  export default webpush;
}

