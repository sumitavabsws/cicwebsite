import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const policyMenuGroups = [
  {
    label: "Security Policies",
    to: "/policies/security-policies",
    items: [
      {
        label: "Institute IT Security Policy",
        to: "/policies/security-policies/institute-it-security-policy",
      },
      {
        label: "Government Policies",
        to: "/policies/security-policies/government-policies",
      },
    ],
  },
  {
    label: "Infrastructure Access Policies",
    to: "/policies/infrastructure-access-policies",
    items: [
      { label: "Mail", to: "/policies/infrastructure-access-policies/mail" },
      {
        label: "Application Software",
        to: "/policies/infrastructure-access-policies/application-software",
      },
      { label: "VPN", to: "/policies/infrastructure-access-policies/vpn" },
      {
        label: "Server Access",
        to: "/policies/infrastructure-access-policies/server-access",
      },
      {
        label: "Outside IP Access",
        to: "/policies/infrastructure-access-policies/outside-ip-access",
      },
      {
        label: "Fixed IP",
        to: "/policies/infrastructure-access-policies/fixed-ip",
      },
      { label: "OS", to: "/policies/infrastructure-access-policies/os" },
      { label: "WiFi", to: "/policies/infrastructure-access-policies/wifi" },
      {
        label: "PC Lab Booking",
        to: "/policies/infrastructure-access-policies/pc-lab-booking",
      },
      {
        label: "CP&NMC",
        to: "/policies/infrastructure-access-policies/cp-nmc",
      },
    ],
  },
];

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

      <div className="group relative">
        <NavLink
          to="/policies"
          className={`${policiesClassName} inline-flex items-center gap-1`}
        >
          Policies
          <ChevronDown className="h-4 w-4 transition group-hover:rotate-180 group-focus-within:rotate-180" />
        </NavLink>

        <div className="invisible absolute right-0 top-[calc(100%+0.75rem)] z-50 grid w-[620px] max-w-[calc(100vw-2rem)] gap-3 rounded-lg border border-slate-200 bg-white p-3 text-slate-700 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 md:grid-cols-2">
          {policyMenuGroups.map((group) => (
            <div key={group.to}>
              <NavLink
                to={group.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                    isActive
                      ? "bg-blue-50 text-cicBlue"
                      : "text-slate-900 hover:bg-slate-50 hover:text-cicBlue"
                  }`
                }
              >
                {group.label}
              </NavLink>

              <div className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-xs font-semibold normal-case tracking-normal transition ${
                        isActive
                          ? "bg-blue-50 text-cicBlue"
                          : "text-slate-600 hover:bg-slate-50 hover:text-cicBlue"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
