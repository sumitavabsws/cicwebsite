import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, TicketCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { apiRequest } from "../lib/api";
import IpAddressModal from "./IpAddressModal";

const primaryLinks = [
  {
    label: "Raise A Ticket",
    featured: true,
  },
  {
    label: "Helpdesk Guide",
    guide: true,
  },
  {
    label: "Webmail for Faculty and Staff",
    href: "https://iitkgpmail.iitkgp.ac.in/",
  },
  {
    label: "Software Repository (Intranet)",
    internalRepository: true,
  },
];

const secondaryLinks = [
  {
    label: "ERP",
    href: "https://erp.iitkgp.ac.in/",
  },
  {
    label: "Apna IIT KGP",
    href: "https://apna.iitkgp.ac.in/",
  },
  {
    label: "Paramshakti HPC Facility",
    href: "https://hpc.iitkgp.ac.in/",
  },
  {
    label: "Institute Website",
    href: "http://www.iitkgp.ac.in/",
  },
];

const anantaLoginUrl = import.meta.env.VITE_ANANTA_LOGIN_URL;

function TopBar() {
  const { adminUser, isAuthenticated, logout } = useAdminAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAdminLoginAllowed, setIsAdminLoginAllowed] = useState(false);
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [isHelpdeskNoticeOpen, setIsHelpdeskNoticeOpen] = useState(false);
  const [helpdeskAccess, setHelpdeskAccess] = useState(null);
  const dropdownRef = useRef(null);
  const anantaHref = adminUser?.sso?.activation_url ?? anantaLoginUrl;
  const showAdminLink = isAuthenticated || isAdminLoginAllowed;
  const visiblePrimaryLinks = primaryLinks.filter(
    (link) =>
      (!link.guide && !link.internalRepository) || helpdeskAccess?.allowed,
  );
  const moreLinks = [...visiblePrimaryLinks, ...secondaryLinks];

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
        setIsHelpdeskNoticeOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    apiRequest("/helpdesk-access")
      .then((response) => {
        if (isMounted) setHelpdeskAccess(response);
      })
      .catch(() => {
        if (isMounted) setHelpdeskAccess({ allowed: false });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getLinkHref = (link) => {
    if (link.featured) return helpdeskAccess?.ticketUrl ?? "#";
    if (link.guide) return helpdeskAccess?.guideUrl ?? "#";
    if (link.internalRepository) {
      return helpdeskAccess?.softwareRepositoryUrl ?? "#";
    }
    return link.href;
  };

  const handleHelpdeskClick = (event, link) => {
    if (!link.featured) return;

    if (helpdeskAccess === null) {
      event.preventDefault();
      return;
    }

    if (helpdeskAccess.allowed) return;

    event.preventDefault();
    setIsMoreOpen(false);
    setIsHelpdeskNoticeOpen(true);
  };

  const openIpModal = () => {
    setIsMoreOpen(false);
    setIsIpModalOpen(true);
  };
  const closeIpModal = useCallback(() => setIsIpModalOpen(false), []);

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
      <div className="mx-auto flex min-h-[42px] max-w-[1640px] items-center justify-end gap-x-2 px-3 py-1 text-xs sm:gap-x-3 sm:px-6 sm:text-sm lg:pr-2 2xl:px-10 2xl:pr-6">
        {visiblePrimaryLinks.map((link) => (
          <a
            key={link.label}
            href={getLinkHref(link)}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => handleHelpdeskClick(event, link)}
            className={
              link.featured
                ? "group hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-cyan-300/45 bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-300/15 hover:text-white xl:inline-flex"
                : link.guide
                  ? "group hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 px-2.5 py-1 text-blue-100/85 transition hover:border-cyan-300/60 hover:bg-white/5 hover:text-cyan-100 xl:inline-flex"
                  : "hidden whitespace-nowrap transition hover:text-cyan-200 xl:inline"
            }
          >
            {link.featured ? (
              <TicketCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : link.guide ? (
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            ) : null}
            {link.label}
          </a>
        ))}

        {showAdminLink ? (
          <a
            href={anantaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center rounded-full border border-cyan-300/60 px-3 py-1.5 font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/10 hover:text-white sm:inline-flex"
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
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-white transition hover:border-cyan-300 hover:text-cyan-200"
          >
            More
            <ChevronDown
              className={`h-4 w-4 transition ${isMoreOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isMoreOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-4rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl sm:w-72">
              {moreLinks.map((link) => (
                <a
                  key={link.label}
                  href={getLinkHref(link)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    setIsMoreOpen(false);
                    handleHelpdeskClick(event, link);
                  }}
                  className={`${visiblePrimaryLinks.includes(link) ? "xl:hidden" : ""} ${link.featured ? "flex items-center gap-2 border border-cyan-100 bg-cyan-50 font-semibold text-cicBlue hover:border-cyan-200 hover:bg-cyan-100/70" : link.guide ? "flex items-center gap-2 font-medium text-cicBlue hover:bg-blue-50" : "block hover:bg-slate-50 hover:text-cicBlue"} rounded-xl px-4 py-3 text-sm transition`}
                >
                  {link.featured ? (
                    <TicketCheck className="h-4 w-4" aria-hidden="true" />
                  ) : link.guide ? (
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                  ) : null}
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
            className="whitespace-nowrap font-semibold transition hover:text-cyan-200"
          >
            <span className="hidden sm:inline">
              {isAuthenticated ? "Admin Panel" : "Admin Login"}
            </span>
            <span className="sm:hidden">Admin</span>
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

      <IpAddressModal isOpen={isIpModalOpen} onClose={closeIpModal} />

      {isHelpdeskNoticeOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4"
          role="presentation"
          onClick={() => setIsHelpdeskNoticeOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="helpdesk-network-title"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-cicBlue">
              <TicketCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2
              id="helpdesk-network-title"
              className="text-lg font-semibold text-slate-900"
            >
              IIT Network Required
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The function is allowed only within IIT-network. Kindly contact{" "}
              <a
                href="mailto:helpdesk@cc.iitkgp.ac.in"
                className="break-all font-semibold text-cicBlue hover:underline"
              >
                helpdesk@cc.iitkgp.ac.in
              </a>{" "}
              for further details.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setIsHelpdeskNoticeOpen(false)}
              className="mt-5 w-full rounded-xl bg-cicBlue px-4 py-2.5 font-semibold text-white transition hover:bg-blue-900"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TopBar;
