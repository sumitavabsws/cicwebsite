import { NavLink, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const isCyberSecurityActive = location.pathname.startsWith("/cyber-security");
  const isPoliciesActive = location.pathname.startsWith("/policies");
  const getLinkClassName = ({ isActive }) =>
    isActive
      ? "border-b-2 border-cicBlue pb-1 text-blue-900"
      : "border-b-2 border-transparent pb-1 text-gray-700 transition hover:border-cicBlue/40 hover:text-blue-900";
  const cyberSecurityClassName = isCyberSecurityActive
    ? "border-b-2 border-cicBlue pb-1 text-blue-900"
    : "border-b-2 border-transparent pb-1 text-gray-700 transition hover:border-cicBlue/40 hover:text-blue-900";
  const policiesClassName = isPoliciesActive
    ? "border-b-2 border-cicBlue pb-1 text-blue-900"
    : "border-b-2 border-transparent pb-1 text-gray-700 transition hover:border-cicBlue/40 hover:text-blue-900";

  return (
    <nav className="flex flex-wrap items-center gap-6 text-sm font-semibold uppercase tracking-[0.16em]">
      <NavLink end to="/" className={getLinkClassName}>
        Home
      </NavLink>

      <NavLink to="/infrastructure" className={getLinkClassName}>
        Infrastructure
      </NavLink>

      <NavLink to="/services" className={getLinkClassName}>
        Services
      </NavLink>

      <NavLink to="/team" className={getLinkClassName}>
        Team
      </NavLink>

      <NavLink to="/notices" className={getLinkClassName}>
        Notices
      </NavLink>

      <NavLink to="/tenders" className={getLinkClassName}>
        Tenders
      </NavLink>

      <NavLink to="/cyber-security" className={cyberSecurityClassName}>
        Cyber Security
      </NavLink>

      <NavLink to="/policies" className={policiesClassName}>
        Policies
      </NavLink>
    </nav>
  );
}

export default Navbar;
