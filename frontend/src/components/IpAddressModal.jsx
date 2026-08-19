import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, X } from "lucide-react";
import { apiRequest } from "../lib/api";

function IpAddressModal({ isOpen, onClose }) {
  const [ipAddress, setIpAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    let isMounted = true;
    setLoading(true);
    setIpAddress("");
    setError("");

    apiRequest("/client-ip")
      .then((response) => {
        if (isMounted) setIpAddress(response?.ip || "Unavailable");
      })
      .catch(() => {
        if (isMounted) setError("Unable to detect your IP address.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      isMounted = false;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 sm:items-center sm:py-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-ip-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cicBlue">
              Network Information
            </p>
            <h2
              id="my-ip-modal-title"
              className="mt-2 text-2xl font-black text-slate-950"
            >
              My IP
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Close My IP modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin text-cicBlue" />
              <span className="font-semibold">Detecting IP...</span>
            </div>
          ) : error ? (
            <p className="text-lg font-bold text-red-700">{error}</p>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Detected IP Address
              </p>
              <p className="mt-3 break-all text-3xl font-black tracking-tight text-slate-950">
                {ipAddress || "Unavailable"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default IpAddressModal;
