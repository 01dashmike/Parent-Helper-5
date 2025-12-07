"use client";

import { useState } from "react";

export default function ClientCounter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Client counter: {count}</p>
      <button
        type="button"
        onClick={() => setCount((prev: number) => prev + 1)}
        className="rounded border px-3 py-1 text-small"
      >
        Increment
      </button>
    </div>
  );
}


