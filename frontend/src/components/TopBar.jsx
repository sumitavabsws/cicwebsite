import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LoaderCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { apiRequest } from "../lib/api";

const primaryLinks = [
  {
    label: "Institute Website",
    href: "http://www.iitkgp.ac.in/",
  },
  {
    label: "Webmail for Faculty and Staff",
    href: "https://iitkgpmail.iitkgp.ac.in/",
  },
  {
    label: "ERP",
    href: "https://erp.iitkgp.ac.in/",
  },
  {
    label: "CIC Software Repository (Intranet)",
    href: "http://www.swrepo.cc.iitkgp.ernet.in/",
  },
  {
    label: "Lodge Your Complain",
    href: "https://cichelpdesk.iitkgp.ac.in/",
  },
];

const secondaryLinks = [
  {
    label: "Apna IIT KGP",
    href: "https://apna.iitkgp.ac.in/",
  },
  {
    label: "Paramshakti HPC Facility",
    href: "http://hpc.iitkgp.ac.in/HPCF/paramShakti",
  },
];

const anantaLoginUrl =
  import.meta.env.VITE_ANANTA_LOGIN_URL ??
  "http://10.72.14.39:5000/framework/signin/?next=%2Fframework%2Flanding%2F";

function TopBar() {
  const { adminUser, isAuthenticated, logout } = useAdminAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAdminLoginAllowed, setIsAdminLoginAllowed] = useState(false);
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [ipError, setIpError] = useState("");
  const [isIpLoading, setIsIpLoading] = useState(false);
  const dropdownRef = useRef(null);
  const anantaHref = adminUser?.sso?.activation_url ?? anantaLoginUrl;
  const showAdminLink = isAuthenticated || isAdminLoginAllowed;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
        setIsIpModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const openIpModal = () => {
    setIsMoreOpen(false);
    setIsIpModalOpen(true);
    setIsIpLoading(true);
    setIpAddress("");
    setIpError("");

    apiRequest("/client-ip")
      .then((response) => {
        setIpAddress(response?.ip || "Unavailable");
      })
      .catch(() => {
        setIpError("Unable to detect your IP address.");
      })
      .finally(() => {
        setIsIpLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    apiRequest("/admin-access")
      .then((response) => {
        if (isMounted) {
          setIsAdminLoginAllowed(Boolean(response?.allowed));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAdminLoginAllowed(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="border-b border-white/10 bg-slate-950 text-sm text-white">
      <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-end gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:pr-2 2xl:px-10 2xl:pr-6">
        {primaryLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-cyan-200"
          >
            {link.label}
          </a>
        ))}

        {showAdminLink ? (
          <a
            href={anantaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-cyan-300/60 px-3 py-1 font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/10 hover:text-white"
          >
            Ananta
          </a>
        ) : null}

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            aria-expanded={isMoreOpen}
            aria-label="Open more quick links"
            onClick={() => setIsMoreOpen((currentValue) => !currentValue)}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-white transition hover:border-cyan-300 hover:text-cyan-200"
          >
            More
            <ChevronDown
              className={`h-4 w-4 transition ${isMoreOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isMoreOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[240px] rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
              {secondaryLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMoreOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm transition hover:bg-slate-50 hover:text-cicBlue"
                >
                  {link.label}
                </a>
              ))}

              <button
                type="button"
                onClick={openIpModal}
                className="block w-full rounded-xl px-4 py-3 text-left text-sm transition hover:bg-slate-50 hover:text-cicBlue"
              >
                My IP
              </button>
            </div>
          ) : null}
        </div>

        {showAdminLink ? <div className="h-4 w-px bg-white/20" /> : null}

        {showAdminLink ? (
          <Link
            to={isAuthenticated ? "/admin" : "/admin/login"}
            className="font-semibold transition hover:text-cyan-200"
          >
            {isAuthenticated ? "Admin Panel" : "Admin Login"}
          </Link>
        ) : null}

        {isAuthenticated ? (
          <button
            type="button"
            onClick={logout}
            className="font-semibold transition hover:text-cyan-200"
          >
            Logout
          </button>
        ) : null}
      </div>

      {isIpModalOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 sm:items-center sm:py-12"
              role="dialog"
              aria-modal="true"
              aria-labelledby="my-ip-modal-title"
            >
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cicBlue">
                      Network Information
                    </p>
                    <h2
                      id="my-ip-modal-title"
                      className="mt-2 text-2xl font-black text-slate-950"
                    >
                      My IP
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsIpModalOpen(false)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                    aria-label="Close My IP modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                  {isIpLoading ? (
                    <div className="flex items-center justify-center gap-3 text-slate-600">
                      <LoaderCircle className="h-5 w-5 animate-spin text-cicBlue" />
                      <span className="font-semibold">Detecting IP...</span>
                    </div>
                  ) : ipError ? (
                    <p className="text-lg font-bold text-red-700">{ipError}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Detected IP Address
                      </p>
                      <p className="mt-3 break-all text-3xl font-black tracking-tight text-slate-950">
                        {ipAddress || "Unavailable"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default TopBar;
