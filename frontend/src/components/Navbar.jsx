import { NavLink, useLocation } from "react-router-dom";
import { getDocumentViewerUrl } from "../utils/references";

const itSecurityPolicyViewerUrl = getDocumentViewerUrl(
  "/resources/policies/IIT_Kharagpur_IT_Security_Policy.pdf",
  "IIT Kharagpur IT Security Policy",
);

function Navbar({ mobile = false, onNavigate }) {
  const location = useLocation();
  const isCyberSecurityActive = location.pathname.startsWith("/cyber-security");
  const getLinkClassName = ({ isActive }) =>
    isActive
      ? "border-b-2 border-cicBlue pb-1 text-blue-900"
      : "border-b-2 border-transparent pb-1 text-gray-700 transition hover:border-cicBlue/40 hover:text-blue-900";
  const cyberSecurityClassName = isCyberSecurityActive
    ? "border-b-2 border-cicBlue pb-1 text-blue-900"
    : "border-b-2 border-transparent pb-1 text-gray-700 transition hover:border-cicBlue/40 hover:text-blue-900";

  return (
    <nav className={`${mobile ? "flex flex-col items-stretch gap-1" : "flex flex-wrap items-center gap-6"} text-sm font-semibold uppercase tracking-[0.16em]`}>
      <NavLink end to="/" onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : getLinkClassName}>
        Home
      </NavLink>

      <NavLink to="/infrastructure" onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : getLinkClassName}>
        Infrastructure
      </NavLink>

      <NavLink to="/services" onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : getLinkClassName}>
        Services
      </NavLink>

      <NavLink to="/team" onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : getLinkClassName}>
        Team
      </NavLink>

      <NavLink to="/notices" onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : getLinkClassName}>
        Notices
      </NavLink>

      <NavLink to="/tenders" onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : getLinkClassName}>
        Tenders
      </NavLink>

      <NavLink to="/cyber-security" onClick={onNavigate} className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : cyberSecurityClassName}>
        Cyber Security
      </NavLink>

      <NavLink
        to={itSecurityPolicyViewerUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={mobile ? "rounded-lg px-3 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-900" : getLinkClassName}
      >
        Policies
      </NavLink>
    </nav>
  );
}

export default Navbar;
