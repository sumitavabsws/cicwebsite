import cyberPolicies from "../data/cyberPolicies.json";
import { openReference } from "../utils/references";

function CyberSecurity() {
  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.84fr_1.16fr]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cicBlue">
              CIC Cyber Security
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              Policy Documents and Security Guidance
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-9 text-slate-600">
              Access official cyber security policies, account protection
              guidance, and incident reporting procedures issued for the IIT
              Kharagpur community.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Policy Library
            </p>

            <div className="mt-8 space-y-5">
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
                      openReference(policy.reference, undefined, policy.title);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-cicBlue underline decoration-cicBlue/40 underline-offset-4 transition hover:text-blue-900"
                  >
                    {policy.reference?.label ?? "Open document"}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CyberSecurity;
