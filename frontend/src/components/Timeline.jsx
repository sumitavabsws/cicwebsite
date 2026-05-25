const events = [
  {
    year: "1990",
    text: "CIC was established to support the institute's evolving computing infrastructure and digital operations.",
  },
  {
    year: "2005",
    text: "Campus-wide networking expanded significantly, deepening digital access across academic and administrative spaces.",
  },
  {
    year: "2015",
    text: "Central data-centre capabilities advanced to support more robust hosting and service delivery requirements.",
  },
  {
    year: "2023",
    text: "Research-oriented and high-speed network capabilities strengthened to meet modern institutional demands.",
  },
];

function Timeline() {
  return (
    <section className="flex min-h-[calc(100vh-156px)] items-center bg-white py-[81px]">
      <div className="mx-auto grid max-w-[1640px] gap-12 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
            Our Story
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
            A continuing evolution of campus computing and connectivity
          </h2>

          <p className="mt-8 text-lg leading-9 text-slate-600">
            The role of CIC has expanded alongside the institute's academic and
            operational needs. From foundational computing support to today's
            networked and service-heavy environment, its trajectory reflects the
            growing centrality of digital infrastructure at IIT Kharagpur.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-2 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
          {events.map((event) => (
            <article
              key={event.year}
              className="grid gap-4 border-b border-slate-200 py-6 last:border-b-0 md:grid-cols-[120px_1fr]"
            >
              <div className="flex items-start">
                <span className="text-lg font-black text-cicBlue">{event.year}</span>
              </div>

              <p className="text-lg leading-8 text-slate-600">{event.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Timeline;
