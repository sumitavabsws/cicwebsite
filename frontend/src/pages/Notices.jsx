import UpdatesPanel from "../components/UpdatesPanel";

function Notices() {
  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Notices & Events
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              Current notices, references, and public CIC updates
            </h1>

            <p className="mt-8 text-lg leading-9 text-slate-600">
              Browse the latest notices and events from the Computer &amp;
              Informatics Centre.
            </p>
          </div>

          {/* <div className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Update Stream
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              References open either as PDFs or HTML-based documents depending
              on the source attached to each notice or event.
            </p>
          </div> */}
        </div>

        <div className="mt-14">
          <UpdatesPanel
            title="CIC Updates"
            description="Browse the latest notices and events from the Computer & Informatics Centre."
          />
        </div>
      </div>
    </div>
  );
}

export default Notices;
