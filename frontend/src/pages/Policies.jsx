import { getDocumentViewerUrl } from "../utils/references";

function Policies() {
  const policyUrl = "/resources/policies/IIT_Kharagpur_IT_Security_Policy.pdf";
  const policyTitle = "IT Policy Document";

  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 2xl:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cicBlue">
          Policies
        </p>

        <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-600">
          All institute policy documents will be made available here as and when
          they are released.
        </p>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <a
            href={getDocumentViewerUrl(policyUrl, policyTitle)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-md border border-cicBlue/20 bg-cicBlue px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-blue-900"
          >
            {policyTitle}
          </a>
        </div>
      </div>
    </div>
  );
}

export default Policies;
