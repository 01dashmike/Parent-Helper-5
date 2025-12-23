"use client";

import type { ShoppingListCategory } from "@/lib/wellness/types";

interface ShoppingListProps {
  shoppingList: ShoppingListCategory[];
}

export default function ShoppingList({ shoppingList }: ShoppingListProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft">
      <h3 className="mb-6 text-2xl font-semibold text-charcoal">
        🛒 Shopping List
      </h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shoppingList.map((category, i) => (
          <div key={i} className="rounded-lg border border-sage/20 bg-sage/5 p-4">
            <h4 className="mb-3 font-medium text-charcoal">{category.category}</h4>
            <ul className="space-y-1 text-sm text-charcoal/80">
              {category.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`item-${i}-${j}`}
                    className="mt-1 text-sage focus:ring-sage"
                  />
                  <label htmlFor={`item-${i}-${j}`} className="cursor-pointer">
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
