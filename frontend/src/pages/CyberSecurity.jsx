import { useEffect, useState } from "react";
import { Download, FileText, LoaderCircle } from "lucide-react";
import { NavLink, useParams } from "react-router-dom";
import cyberPolicies from "../data/cyberPolicies.json";
import { apiRequest } from "../lib/api";
import { getDocumentViewerUrl, openReference } from "../utils/references";

const policyGroups = [
  {
    id: "security-policies",
    title: "Security Policies",
    description:
      "Institute-level IT security policies and relevant government policy references.",
    items: [
      {
        title: "Institute IT Security Policy",
        description:
          "Institute IT security policy document will be added here.",
      },
      {
        title: "Government Policies",
        description:
          "Government policy references such as DPDP will be added here.",
      },
    ],
  },
  {
    id: "infrastructure-access-policies",
    title: "Infrastructure Access Policies",
    description:
      "SOPs for access to CIC infrastructure, platforms, and operational services.",
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
      title,
      description: "SOP will be added here.",
    })),
  },
];

const cyberSections = {
  policies: {
    label: "Policies",
    heading: "Policy Documents and Security Guidance",
    summary:
      "Access official cyber security policies, account protection guidance, and incident reporting procedures issued for the IIT Kharagpur community.",
  },
  guideline: {
    label: "Guideline",
    heading: "Cyber Security Guidelines",
    summary: "Guideline material will be added here.",
  },
  awareness: {
    label: "Awareness",
    heading: "Cyber Security Awareness",
    summary: "Awareness material will be added here.",
  },
};

function CyberSecurity() {
  const { section = "policies" } = useParams();
  const activeSection = cyberSections[section] ? section : "policies";
  const activeContent = cyberSections[activeSection];
  const [awarenessFiles, setAwarenessFiles] = useState([]);
  const [awarenessLoading, setAwarenessLoading] = useState(false);
  const [awarenessError, setAwarenessError] = useState("");

  useEffect(() => {
    if (!["awareness", "guideline"].includes(activeSection)) return undefined;

    let isMounted = true;
    setAwarenessLoading(true);
    setAwarenessError("");

    apiRequest(
      activeSection === "guideline"
        ? "/cyber-security-guidelines"
        : "/cyber-security-awareness",
    )
      .then((files) => {
        if (isMounted) setAwarenessFiles(Array.isArray(files) ? files : []);
      })
      .catch(() => {
        if (isMounted)
          setAwarenessError("Unable to load the awareness resource library.");
      })
      .finally(() => {
        if (isMounted) setAwarenessLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSection]);

  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.84fr_1.16fr]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cicBlue">
              CIC Cyber Security
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              {activeContent.heading}
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-9 text-slate-600">
              {activeContent.summary}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {Object.entries(cyberSections).map(([key, item]) =>
                key === "policies" ? (
                  <span
                    key={key}
                    title="Policies will be visible once its uploaded"
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500"
                  >
                    {item.label}
                  </span>
                ) : (
                  <NavLink
                    key={key}
                    to={`/cyber-security/${key}`}
                    className={({ isActive }) =>
                      `rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-cicBlue bg-blue-50 text-cicBlue"
                          : "border-slate-200 text-slate-600 hover:border-cicBlue hover:text-cicBlue"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            {activeSection === "policies" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {policyGroups.map((group) => (
                    <a
                      key={group.id}
                      href={`#${group.id}`}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cicBlue hover:shadow-md"
                    >
                      <h2 className="text-xl font-bold text-slate-900">
                        {group.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {group.description}
                      </p>
                    </a>
                  ))}
                </div>

                {policyGroups.map((group) => (
                  <section key={group.id} id={group.id} className="mt-12">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {group.title}
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {group.items.map((item) => (
                        <article
                          key={item.title}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                        >
                          <h3 className="text-lg font-semibold text-slate-900">
                            {item.title}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {item.description}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}

                <div className="mt-12 space-y-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Existing Policy Library
                  </p>

                  {cyberPolicies.map((policy, index) => (
                    <article
                      key={index}
                      className="border-b border-slate-200 pb-6 last:border-b-0"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-slate-900">
                          {policy.title}
                        </h2>

                        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {policy.date}
                        </span>
                      </div>

                      <p className="mb-4 max-w-3xl text-base leading-8 text-slate-600">
                        {policy.description}
                      </p>

                      <a
                        href={policy.reference?.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => {
                          event.preventDefault();
                          openReference(
                            policy.reference,
                            undefined,
                            policy.title,
                          );
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-cicBlue underline decoration-cicBlue/40 underline-offset-4 transition hover:text-blue-900"
                      >
                        {policy.reference?.label ?? "Open document"}
                      </a>
                    </article>
                  ))}
                </div>
              </>
            ) : ["awareness", "guideline"].includes(activeSection) ? (
              <section>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeSection === "guideline"
                      ? "Guidelines Resource Library"
                      : "Awareness Resource Library"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    PDF files open in the CIC document viewer. Other file types
                    download directly.
                  </p>
                </div>

                {awarenessLoading ? (
                  <div className="flex items-center gap-3 py-10 text-slate-600">
                    <LoaderCircle className="h-5 w-5 animate-spin text-cicBlue" />
                    Loading resources...
                  </div>
                ) : awarenessError ? (
                  <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {awarenessError}
                  </p>
                ) : awarenessFiles.length ? (
                  <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
                    {awarenessFiles.map((file) => {
                      const isPdf = file.type === "pdf";
                      const displayName = file.name.replace(/\.[^/.]+$/, "");
                      return (
                        <a
                          key={file.url}
                          href={
                            isPdf
                              ? getDocumentViewerUrl(file.url, file.name)
                              : file.url
                          }
                          target={isPdf ? "_blank" : undefined}
                          rel={isPdf ? "noreferrer" : undefined}
                          download={isPdf ? undefined : file.name}
                          className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-blue-50"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <FileText className="h-5 w-5 flex-none text-cicBlue" />
                            <span className="truncate font-semibold text-slate-800">
                              {displayName}
                            </span>
                          </span>
                          {isPdf ? (
                            <span className="text-sm font-semibold text-cicBlue">
                              Open PDF
                            </span>
                          ) : (
                            <Download className="h-5 w-5 flex-none text-cicBlue" />
                          )}
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                    No awareness resources are available yet.
                  </p>
                )}
              </section>
            ) : (
              <div className="min-h-[320px] border border-dashed border-slate-300 bg-slate-50" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CyberSecurity;
