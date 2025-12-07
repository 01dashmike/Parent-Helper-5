interface ProviderLead {
  id: string;
  created_at: string;
  contact_name: string | null;
  email: string;
  org_name: string | null;
  postcode: string | null;
  status: string | null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProviderLeadsTable({ leads }: { leads: ProviderLead[] }) {
  if (!leads.length) {
    return (
      <div className="rounded-2xl border border-sage/20 bg-white p-6 text-small text-slateSoft">
        No provider leads have been submitted yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white shadow-soft">
      <table className="min-w-full divide-y divide-sage/15 text-left text-small">
        <thead className="bg-cream/60 text-small font-semibold uppercase tracking-wide text-slateSoft">
          <tr>
            <th scope="col" className="px-4 py-3">Submitted</th>
            <th scope="col" className="px-4 py-3">Contact</th>
            <th scope="col" className="px-4 py-3">Email</th>
            <th scope="col" className="px-4 py-3">Organisation</th>
            <th scope="col" className="px-4 py-3">Postcode</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sage/10 text-small text-charcoal/80">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-cream/40">
              <td className="px-4 py-3 text-slateSoft">{formatDate(lead.created_at)}</td>
              <td className="px-4 py-3 font-medium text-charcoal">{lead.contact_name || "—"}</td>
              <td className="px-4 py-3">
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sage underline-offset-2 hover:underline"
                >
                  {lead.email}
                </a>
              </td>
              <td className="px-4 py-3">{lead.org_name || "—"}</td>
              <td className="px-4 py-3 uppercase tracking-wide">{lead.postcode || "—"}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-sage/15 px-3 py-1 text-small font-semibold text-sage">
                  {lead.status || "new"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  className="rounded-full border border-sage px-4 py-2 text-small font-semibold text-sage transition hover:bg-sage/10"
                  aria-label={`View details for ${lead.contact_name || lead.org_name || "lead"}`}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


