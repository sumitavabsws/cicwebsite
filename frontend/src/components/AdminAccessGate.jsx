import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

function AdminAccessGate({ children }) {
  const [accessState, setAccessState] = useState({
    loading: true,
    allowed: false,
  });

  useEffect(() => {
    let isMounted = true;

    apiRequest("/admin-access")
      .then((response) => {
        if (isMounted) {
          setAccessState({
            loading: false,
            allowed: Boolean(response?.allowed),
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccessState({
            loading: false,
            allowed: false,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (accessState.loading) {
    return (
      <div className="bg-white py-24">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-2xl border border-slate-200 bg-slate-50 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cicBlue">
              Admin Access
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Checking access
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!accessState.allowed) {
    return (
      <div className="bg-white py-24">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-2xl border border-slate-200 bg-slate-50 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
              Admin Access Restricted
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              This admin page is not available from your IP address.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Access to this page is limited to approved CIC network addresses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminAccessGate;
