import type { ReactNode } from "react";

type MotionSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export default function MotionSection({ children, className, id }: MotionSectionProps) {
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
}
