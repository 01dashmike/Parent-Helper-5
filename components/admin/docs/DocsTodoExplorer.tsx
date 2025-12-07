"use client";

import { useState } from "react";

interface TodoItem {
  file: string;
  line: number;
  content: string;
  type: "TODO" | "FIXME" | "NOTE";
  priority?: string;
}

interface DocsTodoExplorerProps {
  todos: TodoItem[];
}

export default function DocsTodoExplorer({ todos }: DocsTodoExplorerProps) {
  const [filter, setFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.content.toLowerCase().includes(filter.toLowerCase()) ||
      todo.file.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === "all" || todo.type === typeFilter;
    const matchesPriority =
      priorityFilter === "all" || todo.priority === priorityFilter;
    return matchesSearch && matchesType && matchesPriority;
  });

  const typeColors = {
    TODO: "bg-blue-100 text-blue-800",
    FIXME: "bg-red-100 text-red-800",
    NOTE: "bg-yellow-100 text-yellow-800",
  };

  const groupedByFile = filteredTodos.reduce((acc, todo) => {
    if (!acc[todo.file]) {
      acc[todo.file] = [];
    }
    acc[todo.file].push(todo);
    return acc;
  }, {} as Record<string, TodoItem[]>);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search TODOs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-small"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-small"
        >
          <option value="all">All Types</option>
          <option value="TODO">TODO</option>
          <option value="FIXME">FIXME</option>
          <option value="NOTE">NOTE</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-small"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="text-small text-slateSoft">
        Found {filteredTodos.length} items in {Object.keys(groupedByFile).length} files
      </div>

      <div className="max-h-[600px] space-y-4 overflow-y-auto">
        {Object.entries(groupedByFile).map(([file, items]) => (
          <div key={file} className="rounded border border-gray-200 bg-white p-4">
            <div className="mb-2 font-mono text-small font-semibold text-charcoal">
              {file}
            </div>
            <div className="space-y-2">
              {items.map((todo) => (
                <div
                  key={`${todo.file}-${todo.line}-${todo.content.slice(0, 20)}`}
                  className="flex items-start gap-2 rounded bg-gray-50 p-2"
                >
                  <span
                    className={`rounded px-2 py-1 text-small font-medium ${typeColors[todo.type]}`}
                  >
                    {todo.type}
                  </span>
                  {todo.priority && (
                    <span className="rounded bg-orange-100 px-2 py-1 text-small text-orange-800">
                      {todo.priority} priority
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="text-small text-charcoal">{todo.content}</div>
                    <div className="mt-1 text-small text-slateSoft">Line {todo.line}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

