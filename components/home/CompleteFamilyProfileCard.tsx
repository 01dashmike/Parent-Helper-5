"use client";

import LinkComponent from "@/components/ui/link";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { Users } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { CardContainer, CardBody } from "@/components/cards";

type CompleteFamilyProfileCardProps = {
  childCount: number;
};

export function CompleteFamilyProfileCard({ childCount }: CompleteFamilyProfileCardProps) {
  // Only show if user has 0 child profiles
  if (childCount > 0) {
    return null;
  }

  const progress = 0; // 0% when no children

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: motionTokens.medium, type: "spring", stiffness: 200 }}
      whileHover={{ y: -2, transition: { duration: motionTokens.fast } }}
    >
      <CardContainer
        bgVariant="cream"
      >
      <CardBody>
        <div className="flex items-start gap-3">
          <motion.div
            className="flex-shrink-0 rounded-full bg-sage/20 p-2"
            whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: motionTokens.slow } }}
          >
            <Users size={iconSize.md} className="text-sage" aria-hidden="true" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="text-small font-semibold text-charcoal">Complete your family profile</h3>
            <p className="mt-1 text-small text-slateSoft">
              Add your child&apos;s profile to get personalized class recommendations
            </p>
            
            {/* Progress indicator */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-small">
                <span className="text-slateSoft">Progress</span>
                <span className="font-medium text-charcoal">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-sage transition-slow"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <LinkComponent
                href="/family/children/new"
                className="bg-sage text-white font-medium rounded-xl px-4 py-3 shadow-soft hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 mt-3 inline-block motion-reduce:animate-none"
                prefetch={false}
              >
                Add your child&apos;s profile
              </LinkComponent>
            </motion.div>
          </div>
        </div>
      </CardBody>
    </CardContainer>
    </motion.div>
  );
}

