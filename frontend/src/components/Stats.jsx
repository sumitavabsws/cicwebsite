const stats = [
  {
    title: "Campus Users",
    value: "20,000+",
    description: "students, faculty, staff, and researchers",
  },
  {
    title: "Wi-Fi Access Points",
    value: "2000+",
    description: "distributed across academic and residential spaces",
  },
  {
    title: "Licensed Software",
    value: "8",
    description: "centrally enabled for institutional use",
  },
  {
    title: "PC Lab Nodes",
    value: "550+",
    description: "in six PC Labs",
  },
  {
    title: "Servers",
    value: "100+",
    description: "supporting services, compute, and operations",
  },
];

function Stats() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1640px] px-4 sm:px-6 2xl:px-10 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <article
            key={stat.title}
            className="border-b border-slate-200 px-0 py-8 md:px-6 xl:border-b-0 xl:border-r xl:last:border-r-0"
          >
            <p className="text-5xl font-black leading-none text-slate-950">
              {stat.value}
            </p>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {stat.title}
            </h3>

            <p className="mt-2 text-sm uppercase tracking-[0.12em] text-slate-500">
              {stat.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Stats;
