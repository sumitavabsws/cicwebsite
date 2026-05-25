function LabNodesHighlight() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1640px] px-4 py-10 sm:px-6 2xl:px-10">
        <div className="flex flex-col gap-4 border-l-4 border-cicBlue bg-slate-50 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cicBlue">
              Lab Infrastructure
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">
              550+ Nodes in 6 PC Labs
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Shared computing capacity supporting academic labs, training,
            workshops, placements, and approved institute activities.
          </p>
        </div>
      </div>
    </section>
  );
}

export default LabNodesHighlight;
