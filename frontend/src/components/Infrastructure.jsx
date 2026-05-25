const items = [
  {
    title: "Campus Data Centre",
    description:
      "Core hosting environment for institute-level applications, digital services, and backend operations.",
  },
  {
    title: "High Speed Network",
    description:
      "The network backbone that links departments, labs, offices, and student access environments.",
  },
  {
    title: "Meghamala Cloud",
    description:
      "Cloud-oriented infrastructure support for scalable digital services and future-ready provisioning models.",
  },
];

function Infrastructure() {
  return (
    <section className="flex min-h-[calc(100vh-156px)] items-center bg-slate-50 py-[81px]">
      <div className="mx-auto grid max-w-[1640px] gap-12 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
            CIC Infrastructure
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
            The systems layer that supports teaching, research, and operations
          </h2>

          <p className="mt-8 text-lg leading-9 text-slate-600">
            CIC's infrastructure is more than a list of facilities. It is the
            operating fabric behind network access, hosted services, academic
            support environments, and computational capability for the
            institute.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-2 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
          {items.map((item) => (
            <article
              key={item.title}
              className="border-b border-slate-200 py-6 last:border-b-0"
            >
              <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Infrastructure;
