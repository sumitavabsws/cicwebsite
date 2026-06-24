import { Monitor, Server, Users, Wifi } from "lucide-react";

const stats = [
  {
    title: "Campus Users",
    value: "20,000+",
    description: "students, faculty, staff, and researchers",
    icon: Users,
  },
  {
    title: "Wi-Fi Access Points",
    value: "4500+",
    description: "distributed across academic and residential spaces",
    icon: Wifi,
  },
  // {
  //   title: "Licensed Software",
  //   value: "8",
  //   description: "centrally enabled for institutional use",
  //   icon: BadgeCheck,
  // },
  {
    title: "PC Lab Nodes",
    value: "550+",
    description: "in six PC Labs",
    icon: Monitor,
  },
  {
    title: "Servers",
    value: "100+",
    description: "supporting services, compute, and operations",
    icon: Server,
  },
];

function Stats() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1640px] gap-px bg-slate-200 px-4 sm:px-6 2xl:px-10 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
          <article
            key={stat.title}
            className="item wow zoomIn flex min-h-[112px] items-center gap-4 bg-white px-4 py-5 md:px-6"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-cicBlue">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>

            <div>
              <h4 className="text-3xl font-black leading-none text-slate-950">
                <span title={stat.title} className="counter">
                  {stat.value}
                </span>
              </h4>

              <h5 className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
                {stat.title}
              </h5>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {stat.description}
              </p>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

export default Stats;
