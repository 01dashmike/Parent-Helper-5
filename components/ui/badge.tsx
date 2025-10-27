interface BadgeProps {
  label: string;
  color?: "coral" | "teal" | "sage";
}

export function Badge({ label, color = "coral" }: BadgeProps) {
  const base =
    color === "coral" ? "bg-coral" : color === "teal" ? "bg-teal" : "bg-sage";

  return (
    <span
      className={`${base} text-white text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide`}
    >
      {label}
    </span>
  );
}
