"use client";

import { useState } from "react";

interface TableInfo {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
  }>;
  indexes?: string[];
  policies?: string[];
}

interface DocsSchemaViewProps {
  tables: TableInfo[];
}

export default function DocsSchemaView({ tables }: DocsSchemaViewProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(
    tables.length > 0 ? tables[0].name : null
  );

  const table = tables.find((t) => t.name === selectedTable);

  if (tables.length === 0) {
    return (
      <div className="text-center text-slateSoft">
        <p>No schema information available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h3 className="mb-3 text-small font-semibold text-charcoal">Tables</h3>
        <div className="space-y-1">
          {tables.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedTable(t.name)}
              className={`w-full rounded border px-3 py-2 text-left text-small transition ${
                selectedTable === t.name
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-charcoal hover:bg-gray-50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        {table ? (
          <div>
            <h3 className="mb-4 text-title font-semibold text-charcoal">{table.name}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-small font-semibold text-charcoal">Columns</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-small">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-3 py-2 text-left font-semibold">Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Type</th>
                        <th className="px-3 py-2 text-left font-semibold">Nullable</th>
                        <th className="px-3 py-2 text-left font-semibold">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((col) => (
                        <tr key={col.name} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-mono text-small">{col.name}</td>
                          <td className="px-3 py-2 text-slateSoft">{col.type}</td>
                          <td className="px-3 py-2">
                            {col.nullable ? (
                              <span className="text-yellow-600">Yes</span>
                            ) : (
                              <span className="text-green-600">No</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-small text-slateSoft">
                            {col.default || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {table.indexes && table.indexes.length > 0 && (
                <div>
                  <h4 className="mb-2 text-small font-semibold text-charcoal">Indexes</h4>
                  <ul className="ml-4 list-disc space-y-1 text-small text-slateSoft">
                    {table.indexes.map((idx) => (
                      <li key={idx} className="font-mono text-small">
                        {idx}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {table.policies && table.policies.length > 0 && (
                <div>
                  <h4 className="mb-2 text-small font-semibold text-charcoal">RLS Policies</h4>
                  <ul className="ml-4 list-disc space-y-1 text-small text-slateSoft">
                    {table.policies.map((policy) => (
                      <li key={policy} className="text-small">{policy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slateSoft">
            <p>Select a table to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

