import { useEffect, useState } from "react";
import { Download, FileText, LoaderCircle } from "lucide-react";
import { NavLink, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { getDocumentViewerUrl } from "../utils/references";

const cyberSections = {
  // Safeguards is temporarily hidden. Keep the backend/Admin implementation
  // intact so this section can be restored later.
  // safeguards: {
  //   label: "Safeguards",
  //   heading: "Security Frameworks & Documents",
  //   summary:
  //     "Access official security frameworks, safeguards, and supporting documents issued for the IIT Kharagpur community.",
  // },
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
  const { section = "guideline" } = useParams();
  const activeSection = cyberSections[section] ? section : "guideline";
  const activeContent = cyberSections[activeSection];
  const [resourceFiles, setResourceFiles] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setResourceLoading(true);
    setResourceError("");

    apiRequest(
      activeSection === "guideline"
        ? "/cyber-security-guidelines"
        : activeSection === "awareness"
          ? "/cyber-security-awareness"
          : "/cyber-security-safeguards",
    )
      .then((files) => {
        if (isMounted) setResourceFiles(Array.isArray(files) ? files : []);
      })
      .catch(() => {
        if (isMounted)
          setResourceError("Unable to load the resource library.");
      })
      .finally(() => {
        if (isMounted) setResourceLoading(false);
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
                <NavLink
                  key={key}
                  to={`/cyber-security/${key}`}
                  className={() =>
                    `rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      activeSection === key
                        ? "border-cicBlue bg-blue-50 text-cicBlue"
                        : "border-slate-200 text-slate-600 hover:border-cicBlue hover:text-cicBlue"
                    }`
                  }
                >
                  {item.label}
                </NavLink>,
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            {["safeguards", "awareness", "guideline"].includes(activeSection) ? (
              <section>
                {/* <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeSection === "guideline"
                      ? "Guidelines Resource Library"
                      : activeSection === "awareness"
                        ? "Awareness Resource Library"
                        : "Safeguards Document Library"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    PDF files open in the CIC document viewer. Other file types
                    download directly.
                  </p>
                </div> */}

                {resourceLoading ? (
                  <div className="flex items-center gap-3 py-10 text-slate-600">
                    <LoaderCircle className="h-5 w-5 animate-spin text-cicBlue" />
                    Loading resources...
                  </div>
                ) : resourceError ? (
                  <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {resourceError}
                  </p>
                ) : resourceFiles.length ? (
                  <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
                    {resourceFiles.map((file) => {
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
                    {activeSection === "safeguards"
                      ? "No safeguard documents have been uploaded yet."
                      : `No ${activeSection} resources are available yet.`}
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
