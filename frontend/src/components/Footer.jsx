import { useCallback, useEffect, useState } from "react";
import { getDocumentViewerUrl } from "../utils/references";
import { apiRequest } from "../lib/api";
import IpAddressModal from "./IpAddressModal";

function Footer() {
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [softwareRepositoryUrl, setSoftwareRepositoryUrl] = useState("");
  const closeIpModal = useCallback(() => setIsIpModalOpen(false), []);
  const itPolicyUrl = getDocumentViewerUrl(
    "/resources/policies/IIT_Kharagpur_IT_Security_Policy.pdf",
    "IT Policy Document",
  );

  useEffect(() => {
    let isMounted = true;

    apiRequest("/helpdesk-access")
      .then((response) => {
        if (isMounted && response?.allowed) {
          setSoftwareRepositoryUrl(response.softwareRepositoryUrl ?? "");
        }
      })
      .catch(() => {
        if (isMounted) setSoftwareRepositoryUrl("");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="bg-blue-950 py-8 text-white sm:py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>

          <ul className="space-y-0.5 text-sm text-gray-300">
            <li>
              <a
                href={itPolicyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center transition hover:text-cyan-200"
              >
                IT Security Policy
              </a>
            </li>
            <li>
              <a
                href="/forms-downloads"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center transition hover:text-cyan-200"
              >
                Forms & Downloads
              </a>
            </li>
            {softwareRepositoryUrl ? (
              <li>
                <a
                  href={softwareRepositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center transition hover:text-cyan-200"
                >
                  Software Repository
                </a>
              </li>
            ) : null}
            <li>
              <button
                type="button"
                onClick={() => setIsIpModalOpen(true)}
                className="inline-flex min-h-10 items-center transition hover:text-cyan-200"
              >
                Check My IP
              </button>
            </li>
            <li>
              <a
                href="https://hpc.iitkgp.ac.in/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center transition hover:text-cyan-200"
              >
                Paramshakti HPC
              </a>
            </li>
            <li>
              <a
                href="http://www.iitkgp.ac.in/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center transition hover:text-cyan-200"
              >
                Institute Website
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3 uppercase tracking-[0.16em]">
            Tenders
          </h3>

          <ul className="text-sm text-gray-300">
            <li>
              <a
                href="/tenders"
                className="inline-flex min-h-10 items-center transition hover:text-cyan-200"
              >
                CIC Tenders
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Contact</h3>

          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <strong className="font-semibold text-white">
                For reporting problems/complaints about CIC services or for
                making any service request:
              </strong>
            </p>

            <p>Helpdesk, Computer and Informatics Centre</p>

            <p>Email: helpdesk[at]cc.iitkgp.ac.in</p>

            <p>Ph: (91)-3222-282391</p>
          </div>
        </div>
      </div>
      <IpAddressModal isOpen={isIpModalOpen} onClose={closeIpModal} />
    </footer>
  );
}

export default Footer;
