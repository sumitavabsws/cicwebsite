import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

function CheckMyIp() {
  const [ipAddress, setIpAddress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Check My IP";

    apiRequest("/client-ip")
      .then((response) => {
        setIpAddress(response.ip || "Unavailable");
      })
      .catch(() => {
        setError("Unable to detect your IP address.");
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="text-center">
        <img
          src="/cic-logo.png?v=2"
          alt="CIC"
          className="mx-auto mb-8 h-20 w-20 rounded-full bg-white object-contain"
        />

        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cicBlue">
          Your IP Address
        </p>

        {error ? (
          <h1 className="text-3xl font-black text-red-700 md:text-5xl">
            {error}
          </h1>
        ) : (
          <h1 className="text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            {ipAddress || "Checking..."}
          </h1>
        )}
      </div>
    </main>
  );
}

export default CheckMyIp;
