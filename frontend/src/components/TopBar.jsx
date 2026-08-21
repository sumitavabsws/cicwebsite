import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, TicketCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { apiRequest } from "../lib/api";
import IpAddressModal from "./IpAddressModal";

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
    href: "http://swrepo.iitkgp.ac.in/",
  },
  {
    label: "Raise a Ticket",
    href: "https://cichelpdesk.iitkgp.ac.in/",
    featured: true,
  },
];

const secondaryLinks = [
  {
    label: "Apna IIT KGP",
    href: "https://apna.iitkgp.ac.in/",
  },
  {
    label: "Paramshakti HPC Facility",
    href: "https://hpc.iitkgp.ac.in/",
  },
];

const anantaLoginUrl =
  import.meta.env.VITE_ANANTA_LOGIN_URL;

function TopBar() {
  const { adminUser, isAuthenticated, logout } = useAdminAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAdminLoginAllowed, setIsAdminLoginAllowed] = useState(false);
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const anantaHref = adminUser?.sso?.activation_url ?? anantaLoginUrl;
  const showAdminLink = isAuthenticated || isAdminLoginAllowed;
  const moreLinks = [...primaryLinks, ...secondaryLinks];

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
      <div className="mx-auto flex h-[42px] max-w-[1640px] items-center justify-end gap-x-3 px-4 text-xs sm:px-6 sm:text-sm lg:pr-2 2xl:px-10 2xl:pr-6">
        {primaryLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className={
              link.featured
                ? "group hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-cyan-300/45 bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.08)] transition hover:border-cyan-200/70 hover:bg-cyan-300/15 hover:text-white xl:inline-flex"
                : "hidden whitespace-nowrap transition hover:text-cyan-200 xl:inline"
            }
          >
            {link.featured ? (
              <TicketCheck
                className="h-3.5 w-3.5 text-cyan-300 transition group-hover:text-cyan-200"
                aria-hidden="true"
              />
            ) : null}
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
              {moreLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMoreOpen(false)}
                  className={`${primaryLinks.includes(link) ? "xl:hidden" : ""} ${link.featured ? "flex items-center gap-2 border border-cyan-100 bg-cyan-50 font-semibold text-cicBlue hover:border-cyan-200 hover:bg-cyan-100/70" : "block hover:bg-slate-50 hover:text-cicBlue"} rounded-xl px-4 py-3 text-sm transition`}
                >
                  {link.featured ? (
                    <TicketCheck className="h-4 w-4" aria-hidden="true" />
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

      <IpAddressModal isOpen={isIpModalOpen} onClose={closeIpModal} />
    </div>
  );
}

export default TopBar;
