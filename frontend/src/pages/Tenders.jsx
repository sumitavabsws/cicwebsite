import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

function TenderDateLine({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <p>
      <span className="font-bold text-slate-950">{label}:</span> {value}
    </p>
  );
}

function Tenders() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTenders() {
      try {
        const tenderItems = await apiRequest("/tenders");
        if (isMounted) {
          setTenders(Array.isArray(tenderItems) ? tenderItems : []);
          setError("");
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTenders();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
            Tenders
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
            CIC tenders
          </h1>

          <p className="mt-8 text-lg leading-9 text-slate-600">
            Tender notices and related documents published by the Computer and
            Informatics Center.
          </p>
        </div>

        <div className="mt-12 overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full border-collapse text-left">
              <thead className="bg-[#2e207f] text-white">
                <tr>
                  <th className="w-20 px-4 py-4 text-sm font-black">Sl. No.</th>
                  <th className="px-6 py-4 text-sm font-black">Title & Ref No</th>
                  <th className="w-[330px] px-6 py-4 text-sm font-black">Critical Date</th>
                  <th className="w-[280px] px-6 py-4 text-sm font-black">
                    Corrigendum Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                      Loading tenders...
                    </td>
                  </tr>
                ) : null}

                {!loading && error ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : null}

                {!loading && !error && tenders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                      No tenders are available right now.
                    </td>
                  </tr>
                ) : null}

                {!loading && !error
                  ? tenders.map((tender, index) => (
                      <tr
                        key={tender.id ?? `${tender.title}-${index}`}
                        className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}
                      >
                        <td className="px-4 py-5 align-middle text-slate-950">
                          {index + 1}
                        </td>
                        <td className="px-6 py-5 align-top">
                          {tender.pdfUrl ? (
                            <a
                              href={tender.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-black text-[#17107a] transition hover:text-cicBlue"
                            >
                              {tender.title}
                            </a>
                          ) : (
                            <p className="font-black text-[#17107a]">{tender.title}</p>
                          )}

                          {tender.refNo ? (
                            <p className="mt-3 text-slate-950">
                              <span className="font-bold">Ref No:</span> {tender.refNo}
                            </p>
                          ) : null}

                          {tender.pdfUrl ? (
                            <a
                              href={tender.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-semibold text-cicBlue underline-offset-4 hover:underline"
                            >
                              {tender.pdfLabel || "View Tender PDF"}
                            </a>
                          ) : null}
                        </td>
                        <td className="space-y-3 px-6 py-5 align-top text-slate-950">
                          <TenderDateLine label="Start Date" value={tender.startDate} />
                          <TenderDateLine label="End Date" value={tender.endDate} />
                          <TenderDateLine
                            label="Bid Opening Date"
                            value={tender.bidOpeningDate}
                          />
                        </td>
                        <td className="px-6 py-5 align-top text-slate-700">
                          {tender.corrigendumDetails || ""}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tenders;
