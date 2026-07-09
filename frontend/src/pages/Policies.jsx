import { ExternalLink } from "lucide-react";
import { Navigate, NavLink, useParams } from "react-router-dom";
import { getDocumentViewerUrl } from "../utils/references";

const policyGroups = [
  {
    slug: "security-policies",
    title: "Security Policies",
    description:
      "Institute-level IT security policy documents and relevant government policy references.",
    items: [
      {
        slug: "institute-it-security-policy",
        title: "Institute IT Security Policy",
        description:
          "Official IIT Kharagpur IT Security Policy document for institutional cyber and IT usage expectations.",
        document: {
          title: "Institute IT Security Policy",
          url: "/resources/policies/IIT_Kharagpur_IT_Security_Policy.pdf",
        },
      },
      {
        slug: "government-policies",
        title: "Government Policies",
        description:
          "Digital Personal Data Protection Act reference document issued for government policy compliance.",
        document: {
          title: "Digital Personal Data Protection Act, 2023",
          url: "/resources/policies/DPDP Act.pdf",
        },
      },
    ],
  },
  {
    slug: "infrastructure-access-policies",
    title: "Infrastructure Access Policies",
    description:
      "SOPs for requesting, approving, and using CIC infrastructure, platforms, and operational services.",
    items: [
      "Mail",
      "Application Software",
      "VPN",
      "Server Access",
      "Outside IP Access",
      "Fixed IP",
      "OS",
      "WiFi",
      "PC Lab Booking",
      "CP&NMC",
    ].map((title) => ({
      slug: title
        .toLowerCase()
        .replace(/&/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      title,
      description: "SOP will be added here.",
    })),
  },
];

function getActivePolicy(sectionSlug, itemSlug) {
  const activeGroup =
    policyGroups.find((group) => group.slug === sectionSlug) ?? policyGroups[0];
  const activeItem = itemSlug
    ? activeGroup.items.find((item) => item.slug === itemSlug)
    : null;

  return {
    activeGroup,
    activeItem,
  };
}

function Policies() {
  const { section, item } = useParams();
  const { activeGroup, activeItem } = getActivePolicy(section, item);

  if (activeItem?.document && activeItem.openDocumentOnRoute) {
    return (
      <Navigate
        to={getDocumentViewerUrl(
          activeItem.document.url,
          activeItem.document.title,
        )}
        replace
      />
    );
  }

  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cicBlue">
              Policies
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              {activeItem?.title ?? activeGroup.title}
            </h1>

            <p className="mt-6 text-lg leading-9 text-slate-600">
              {activeItem?.description ?? activeGroup.description}
            </p>

            {activeItem?.document ? (
              <a
                href={getDocumentViewerUrl(
                  activeItem.document.url,
                  activeItem.document.title,
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-md border border-cicBlue/20 bg-cicBlue px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-blue-900"
              >
                Open Document
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>

          <div className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {policyGroups.map((group) => (
                <section key={group.slug}>
                  <NavLink
                    to={`/policies/${group.slug}`}
                    className={({ isActive }) =>
                      `block rounded-lg border p-4 transition ${
                        isActive && !item
                          ? "border-cicBlue bg-blue-50"
                          : "border-slate-200 bg-white hover:border-cicBlue"
                      }`
                    }
                  >
                    <h2 className="text-xl font-bold text-slate-950">
                      {group.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {group.description}
                    </p>
                  </NavLink>

                  <div className="mt-3 space-y-2">
                    {group.items.map((policyItem) => (
                      <NavLink
                        key={policyItem.slug}
                        to={`/policies/${group.slug}/${policyItem.slug}`}
                        className={({ isActive }) =>
                          `block rounded-md border px-4 py-3 text-sm font-semibold transition ${
                            isActive
                              ? "border-cicBlue bg-blue-50 text-cicBlue"
                              : "border-slate-200 text-slate-700 hover:border-cicBlue hover:text-cicBlue"
                          }`
                        }
                      >
                        {policyItem.title}
                      </NavLink>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {!activeItem ? (
              <div className="mt-10 min-h-[220px] border border-dashed border-slate-300 bg-slate-50" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Policies;
