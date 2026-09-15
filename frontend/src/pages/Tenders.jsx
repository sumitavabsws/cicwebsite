import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { apiRequest } from "../lib/api";

const MONTH_INDEX = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function parseTenderDate(value) {
  if (!value?.trim()) return null;

  const match = value.trim().match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i,
  );
  if (match) {
    const [, dayText, monthText, yearText, hourText, minuteText, meridiem] =
      match;
    const month = MONTH_INDEX[monthText.toLowerCase()];
    if (month === undefined) return null;

    let hour = Number(hourText ?? 0);
    const minute = Number(minuteText ?? 0);
    if (meridiem) {
      hour %= 12;
      if (meridiem.toUpperCase() === "PM") hour += 12;
    }

    const parsed = new Date(Number(yearText), month, Number(dayText), hour, minute);
    if (
      parsed.getFullYear() !== Number(yearText) ||
      parsed.getMonth() !== month ||
      parsed.getDate() !== Number(dayText) ||
      parsed.getHours() !== hour ||
      parsed.getMinutes() !== minute
    ) {
      return null;
    }
    return parsed;
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function organizeTenders(tenders, now = new Date()) {
  const todayTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const prepared = tenders.map((tender, originalIndex) => ({
    tender,
    originalIndex,
    openingTime: parseTenderDate(tender.bidOpeningDate)?.getTime() ?? null,
  }));

  const active = prepared
    .filter(
      ({ openingTime }) => openingTime === null || openingTime >= todayTime,
    )
    .sort((first, second) => {
      if (first.openingTime === null && second.openingTime === null) {
        return first.originalIndex - second.originalIndex;
      }
      if (first.openingTime === null) return 1;
      if (second.openingTime === null) return -1;
      return (
        first.openingTime - second.openingTime ||
        first.originalIndex - second.originalIndex
      );
    })
    .map(({ tender }) => tender);

  const archived = prepared
    .filter(
      ({ openingTime }) => openingTime !== null && openingTime < todayTime,
    )
    .sort(
      (first, second) =>
        second.openingTime - first.openingTime ||
        first.originalIndex - second.originalIndex,
    )
    .map(({ tender }) => tender);

  return { active, archived };
}

function tenderMatchesSearch(tender, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;

  return [
    tender.title,
    tender.refNo,
    tender.startDate,
    tender.endDate,
    tender.bidOpeningDate,
    tender.corrigendumDetails,
    tender.pdfFileName,
    tender.pdfLabel,
    tender.corrigendumFileName,
    tender.corrigendumLabel,
  ].some((value) =>
    String(value ?? "")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}

function TenderDateLine({ label, value }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-bold text-slate-950">{label}:</span> {value}
    </p>
  );
}

function TenderRows({ tenders }) {
  return tenders.map((tender, index) => (
    <tr
      key={tender.id ?? `${tender.title}-${index}`}
      className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}
    >
      <td className="px-4 py-5 align-middle text-slate-950">{index + 1}</td>
      <td className="px-6 py-5 align-top">
        {tender.pdfUrl ? (
          <a
            href={tender.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[1.05rem] font-semibold leading-7 tracking-[-0.01em] text-slate-900 transition hover:text-[#2e207f] hover:underline hover:decoration-2 hover:underline-offset-4"
          >
            {tender.title}
          </a>
        ) : (
          <p className="text-[1.05rem] font-semibold leading-7 tracking-[-0.01em] text-slate-900">
            {tender.title}
          </p>
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
        <TenderDateLine label="Bid Opening Date" value={tender.bidOpeningDate} />
      </td>
      <td className="px-6 py-5 align-top text-slate-700">
        <div className="flex flex-col items-start gap-3">
          {tender.corrigendumDetails ? (
            <p className="leading-6">{tender.corrigendumDetails}</p>
          ) : null}
          {tender.corrigendumUrl ? (
            <a
              href={tender.corrigendumUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[#2e207f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17107a] focus:outline-none focus:ring-2 focus:ring-[#2e207f] focus:ring-offset-2"
            >
              {tender.corrigendumLabel || "View Corrigendum"}
            </a>
          ) : null}
          {!tender.corrigendumDetails && !tender.corrigendumUrl ? (
            <span className="text-slate-400">—</span>
          ) : null}
        </div>
      </td>
    </tr>
  ));
}

function TenderTable({ tenders, loading = false, error = "", emptyMessage }) {
  return (
    <div className="mt-5 overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead className="bg-[#2e207f] text-white">
            <tr>
              <th className="w-20 px-4 py-4 text-sm font-black">Sl. No.</th>
              <th className="px-6 py-4 text-sm font-black">Title & Ref No</th>
              <th className="w-[330px] px-6 py-4 text-sm font-black">
                Critical Date
              </th>
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
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {!loading && !error ? <TenderRows tenders={tenders} /> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tenders() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTenderView, setSelectedTenderView] = useState("active");
  const [searchInput, setSearchInput] = useState("");

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
        if (isMounted) setError(requestError.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTenders();
    return () => {
      isMounted = false;
    };
  }, []);

  const organizedTenders = useMemo(() => organizeTenders(tenders), [tenders]);
  const selectedTenders =
    selectedTenderView === "archived"
      ? organizedTenders.archived
      : organizedTenders.active;
  const searchQuery = searchInput.trim();
  const visibleTenders = useMemo(
    () =>
      selectedTenders.filter((tender) =>
        tenderMatchesSearch(tender, searchQuery),
      ),
    [searchQuery, selectedTenders],
  );

  function submitSearch(event) {
    event.preventDefault();
  }

  function clearSearch() {
    setSearchInput("");
  }

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
            Informatics Centre.
          </p>
        </div>

        <section className="mt-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="inline-flex self-start rounded-xl border border-slate-200 bg-slate-100 p-1"
              role="tablist"
              aria-label="Tender lists"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedTenderView === "active"}
                onClick={() => setSelectedTenderView("active")}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  selectedTenderView === "active"
                    ? "bg-[#2e207f] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-[#2e207f]"
                }`}
              >
                Active Tenders
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedTenderView === "archived"}
                onClick={() => setSelectedTenderView("archived")}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  selectedTenderView === "archived"
                    ? "bg-[#2e207f] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-[#2e207f]"
                }`}
              >
                Archived Tenders
              </button>
            </div>

            <form
              onSubmit={submitSearch}
              role="search"
              className="flex w-full max-w-xl items-stretch"
            >
              <label htmlFor="tender-search" className="sr-only">
                Search {selectedTenderView} tenders
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="tender-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by title, reference no. or date"
                  className="h-full w-full rounded-l-lg border border-r-0 border-slate-300 bg-white py-3 pl-12 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2e207f] focus:ring-2 focus:ring-[#2e207f]/20"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear tender search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-r-lg bg-[#2e207f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#17107a] focus:outline-none focus:ring-2 focus:ring-[#2e207f] focus:ring-offset-2"
              >
                Search
              </button>
            </form>
          </div>

          {searchQuery ? (
            <p className="mt-4 text-sm text-slate-600" aria-live="polite">
              {visibleTenders.length} {visibleTenders.length === 1 ? "result" : "results"} for &ldquo;{searchQuery}&rdquo; in {selectedTenderView} tenders.
            </p>
          ) : null}

          <TenderTable
            tenders={visibleTenders}
            loading={loading}
            error={error}
            emptyMessage={
              searchQuery
                ? `No ${selectedTenderView} tenders match “${searchQuery}”.`
                : selectedTenderView === "archived"
                ? "No archived tenders are available."
                : "No active tenders are available right now."
            }
          />
        </section>
      </div>
    </div>
  );
}

export default Tenders;
