import { useState } from "react";
import { Link } from "react-router-dom";
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
        className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5 shadow-sm md:h-20 md:w-20"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-blue-900 text-sm font-bold text-white shadow-sm md:h-20 md:w-20">
      {fallback}
    </div>
  );
}
function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <TopBar />

      <div className="bg-white/95">
        <div className="mx-auto flex max-w-[1640px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-start 2xl:px-10">
          <Link to="/" className="flex -translate-x-[15px] items-center gap-3 lg:flex-none">
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

            <div>
              <h1 className="text-xl font-bold text-blue-900">
                Computer &amp; Informatics Center
              </h1>

              <p className="text-sm text-gray-500">IIT Kharagpur</p>
            </div>
          </Link>

          <div className="lg:ml-auto">
            <Navbar />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
