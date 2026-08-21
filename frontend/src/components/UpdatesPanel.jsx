import { useState } from "react";
import { ExternalLink, Paperclip } from "lucide-react";
import { useSiteContent } from "../context/SiteContentContext";
import { openReference } from "../utils/references";
import ReferenceModal from "./ReferenceModal";

function UpdatesPanel({ compact = false, title, description }) {
  const { notices, events } = useSiteContent();
  const [tab, setTab] = useState("notices");
  const [activeReference, setActiveReference] = useState(null);
  const tabs = [
    { id: "notices", label: "Notice Board", items: notices },
    // { id: "events", label: "Events", items: events },
  ];

  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];

  return (
    <>
      <section className={compact ? "" : "space-y-6"}>
        {title ? (
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {description ? (
              <p className="text-slate-600">{description}</p>
            ) : null}
          </div>
        ) : null}

        <div
          className={
            compact
              ? "flex h-full min-h-[560px] flex-col border-t border-white/15 bg-transparent"
              : "overflow-hidden rounded-2xl border bg-white shadow-sm"
          }
        >
          <div
            className={`flex ${compact ? "border-b border-white/15" : "border-b"}`}
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex-1 py-4 font-semibold ${
                  compact
                    ? tab === item.id
                      ? "border-b-2 border-cyan-200 text-white"
                      : "text-blue-100/60"
                    : tab === item.id
                      ? "border-t-4 border-cicBlue text-cicBlue"
                      : "text-gray-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            className={
              compact ? "flex-1 space-y-4 overflow-y-auto p-5" : "space-y-4 p-6"
            }
          >
            {activeTab.items.map((item, index) => (
              <article
                key={item.id ?? index}
                className={
                  compact
                    ? "w-full border-b border-white/10 pb-4 text-left"
                    : "w-full rounded-xl border p-5 text-left transition hover:border-cicBlue hover:shadow-md"
                }
              >
                <p
                  className={`text-sm ${compact ? "text-blue-100/65" : "text-gray-500"}`}
                >
                  {item.date}
                </p>
                <p
                  className={`mt-1 font-semibold ${compact ? "text-white" : "text-slate-900"}`}
                >
                  {item.title}
                </p>
                <p
                  className={`mt-2 text-sm ${compact ? "text-blue-100/80" : "text-gray-600"}`}
                >
                  {item.description}
                </p>
                {item.attachment?.url || item.reference?.url ? (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {item.attachment?.url ? (
                      <button
                        type="button"
                        onClick={() =>
                          openReference(item.attachment, setActiveReference, item.title)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${compact ? "border-cyan-200/40 text-cyan-200 hover:bg-white/10" : "border-blue-200 bg-blue-50 text-cicBlue hover:border-cicBlue"}`}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {item.attachment.label ?? "View attached PDF"}
                      </button>
                    ) : null}
                    {item.reference?.url ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            item.reference.url,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${compact ? "text-cyan-200 hover:bg-white/10" : "text-cicBlue hover:bg-blue-50"}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {item.reference.label ?? "Open reference"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}

            {!activeTab.items.length ? (
              <div
                className={`p-5 text-sm ${compact ? "border border-dashed border-white/20 text-blue-100/70" : "rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500"}`}
              >
                No updates published yet.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <ReferenceModal
        isOpen={Boolean(activeReference)}
        title={activeReference?.title ?? activeReference?.label ?? "Reference"}
        url={activeReference?.url}
        onClose={() => setActiveReference(null)}
      />
    </>
  );
}

export default UpdatesPanel;
