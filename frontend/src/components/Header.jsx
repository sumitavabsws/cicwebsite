import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Navbar from "./Navbar";

const iitKgpLogoSrc = "/resources/logo/IITKGP_LOGO.png";
const iitKgp75LogoSrc = "/resources/logo/iitkgp75yrslogo.png";

function HeaderLogo({ src, alt, fallback }) {
  const [hasLogo, setHasLogo] = useState(true);

  if (hasLogo) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setHasLogo(false)}
        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1 shadow-sm sm:h-14 sm:w-14 xl:h-20 xl:w-20 xl:rounded-xl xl:p-1.5"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-blue-900 text-xs font-bold text-white shadow-sm sm:h-14 sm:w-14 xl:h-20 xl:w-20 xl:rounded-xl xl:text-sm">
      {fallback}
    </div>
  );
}
function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <TopBar />

      <div className="bg-white/95">
        <div className="relative mx-auto flex h-[80px] max-w-[1640px] items-center gap-3 px-4 sm:px-6 xl:h-[116px] xl:gap-5 xl:py-5 2xl:px-10">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 xl:-translate-x-[15px] xl:flex-none xl:gap-3"
          >
            <HeaderLogo
              src={iitKgpLogoSrc}
              alt="IIT Kharagpur logo"
              fallback="IIT"
            />

            <HeaderLogo
              src={iitKgp75LogoSrc}
              alt="IIT Kharagpur 75 years logo"
              fallback="75"
            />

            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight text-blue-900 sm:text-base xl:text-xl">
                Computer &amp; Informatics Center
              </h1>

              <p className="text-sm text-gray-500">IIT Kharagpur</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-site-navigation"
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            className="ml-auto inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-slate-200 text-blue-900 transition hover:border-cicBlue hover:bg-blue-50 xl:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="ml-auto hidden xl:block">
            <Navbar />
          </div>

          {isMobileMenuOpen ? (
            <div
              id="mobile-site-navigation"
              className="absolute inset-x-0 top-full max-h-[calc(100vh-122px)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-4 shadow-xl xl:hidden"
            >
              <Navbar mobile onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Header;
