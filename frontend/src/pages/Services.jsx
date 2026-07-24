import ServicesGrid from "../components/ServicesGrid";

function Services() {
  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Services
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              CIC services for access, infrastructure, and institutional support
            </h1>

            <p className="mt-8 text-lg leading-9 text-slate-600">
              Explore all CIC services from one place and open the dedicated
              page for internet access, Wi-Fi authentication, mail, labs,
              softwares, VPN, and NTP.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Announcements
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              The institute email ID will be deleted after one year of a
              student’s convocation process.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              One drive storage limit in MS Teams : 50 GB per user for faculty
              account only and 10 GB per user for all other accounts.
            </p>
          </div>
        </div>

        <div className="mt-14">
          <ServicesGrid dense />
        </div>
      </div>
    </div>
  );
}

export default Services;
