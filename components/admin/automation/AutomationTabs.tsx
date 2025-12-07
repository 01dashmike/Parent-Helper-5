"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import AICoachPanel from "./AICoachPanel";
import AIInsightsPanel from "./AIInsightsPanel";
import AutomationSettings from "./AutomationSettings";
import OverviewDashboard from "./OverviewDashboard";
import ProviderReportsPanel from "./ProviderReportsPanel";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "ai-insights", label: "AI Insights" },
  { id: "reports", label: "Provider Reports" },
  { id: "coach", label: "AI Coach" },
  { id: "settings", label: "Settings" },
];

export default function AutomationTabs() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-sage/20">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-small font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-sage"
                  : "text-slateSoft hover:text-charcoal"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: motionTokens.fast }}
        >
          {activeTab === "overview" && <OverviewDashboard />}
          {activeTab === "ai-insights" && <AIInsightsPanel />}
          {activeTab === "reports" && <ProviderReportsPanel />}
          {activeTab === "coach" && <AICoachPanel />}
          {activeTab === "settings" && <AutomationSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

