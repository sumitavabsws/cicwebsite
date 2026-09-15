import { useEffect } from "react";
import { TicketCheck } from "lucide-react";

function HelpdeskNetworkNotice({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4"
      role="presentation"
      onClick={onClose}
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
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-cicBlue px-4 py-2.5 font-semibold text-white transition hover:bg-blue-900"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default HelpdeskNetworkNotice;
