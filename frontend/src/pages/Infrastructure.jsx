import networkOverviewImage from "../assets/infrastructure/iit-kgp-network-overview.png";

const networkScale = [
  "~50,000 Information Outlets across the campus",
  "~25,000 Outlets dedicated to Academic areas (Labs, Classrooms)",
  "~20,000 Outlets serving the Student Halls of Residence",
  "~5,000 Outlets serving the Residential areas",
  "Over 1,800 Access Switches and 4,500+ Wi-Fi Access Points",
  "20 Gbps of Internet Connectivity with a 10 Gbps Core Backbone",
];

const technologyFramework = [
  {
    title: "Gigabit Ethernet",
    description:
      "The academic departments and student hostels are primarily driven by Gigabit Ethernet technology. This ensures rapid and uninterrupted data access for laboratories, e-learning, and administrative operations.",
  },
  {
    title: "Gigabit Passive Optical Network (GPON)",
    description:
      "The residential area utilizes advanced GPON technology. This framework supports Quadruple Play Network (QPN) features, enabling the simultaneous delivery of data, voice, and video services over a single optical fiber connection directly to homes.",
  },
  {
    title: "Centralized Wireless Infrastructure",
    description:
      "The wireless infrastructure extends connectivity throughout the campus using thousands of indoor and outdoor access points managed through centralized controllers. This extensive Wi-Fi deployment provides seamless mobility and secure access across classrooms, laboratories, libraries, hostels, auditoriums, open spaces, sports complexes, and residential zones.",
  },
];

const infrastructureSections = [
  {
    name: "Network",
    status: "Available",
    description:
      "Campus-wide optical backbone, wired access, wireless access, gateway firewalls, and digital service connectivity.",
  },
  {
    name: "Servers",
    status: "Future",
    description:
      "Reserved for server, hosting, data centre, and compute infrastructure details.",
  },
  {
    name: "Services",
    status: "Future",
    description:
      "Reserved for additional CIC infrastructure service sections.",
  },
];

function Infrastructure() {
  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
                Infrastructure
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                CIC infrastructure
              </h1>

              <p className="mt-6 text-lg leading-9 text-slate-600">
                The current section documents IIT Kharagpur's campus network,
                and future sections will be added here for servers, data centre
                systems, cloud platforms, and other CIC services.
              </p>
            </div>

            {/* <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-3">
              {infrastructureSections.map((section) => (
                <article key={section.name} className="bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-950">
                      {section.name}
                    </h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cicBlue">
                      {section.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {section.description}
                  </p>
                </article>
              ))}
            </div> */}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="grid gap-10 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
                Network
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                IIT Kharagpur Network Infrastructure
              </h2>

              <p className="mt-5 text-xl font-semibold leading-8 text-slate-700">
                A Comprehensive Overview of Our Campus Connectivity
              </p>

              <p className="mt-6 text-lg leading-9 text-slate-600">
                The IIT Kharagpur campus network is one of the largest and most
                comprehensive academic networking infrastructures in India,
                designed to support the Institute's teaching, research,
                administration, residential life, and digital services. Spanning
                academic buildings, halls of residence, residential quarters,
                libraries, laboratories, hospitals, sports facilities, and common
                areas, the network provides high-speed, reliable, and secure
                connectivity to thousands of students, faculty, and staff. This
                robust infrastructure supports a wide array of mission-critical
                services, ensuring seamless communication and resource access for
                all users across the sprawling campus.
              </p>
            </div>

            <figure className="border border-slate-200 bg-white p-3 shadow-sm">
              <img
                src={networkOverviewImage}
                alt="IIT Kharagpur campus network overview diagram"
                className="mx-auto max-h-[430px] w-full object-contain"
              />
              <figcaption className="border-t border-slate-200 px-2 pt-3 text-sm leading-6 text-slate-500">
                Network overview diagram from the IIT Kharagpur Network
                Infrastructure document.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Network Topology &amp; Architecture
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Core, Distribution, and Access layers
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-9 text-slate-600">
            <p>
              The campus network is built upon a highly resilient Three-Layer
              Hierarchical Model-comprising the Core, Distribution, and Access
              layers. A massive 10 Gigabits-per-second (Gbps) optical backbone
              interconnects the entire campus and serves as the foundation for
              delivering reliable data, voice, video, and wireless services. The
              architecture is designed with redundancy and scalability to ensure
              high availability, resilience, and uninterrupted operation of
              critical academic and administrative services. The scale of the
              network is vast, managing a robust 20 Gbps of Internet connectivity
              through state-of-the-art gateway firewalls.
            </p>

            <p>
              Beyond Internet access, the network serves as the digital backbone
              for numerous institutional services, including web hosting, email,
              authentication systems, cloud services, research computing
              platforms, digital learning resources, enterprise applications,
              surveillance systems, utility monitoring, and other
              mission-critical applications. The infrastructure operates on a
              24x7 basis and is continuously upgraded to meet the growing demands
              of modern education, research, innovation, and digital
              transformation.
            </p>

            <p>
              Through its scale, reliability, and continuous modernization, the
              IIT Kharagpur campus network provides a world-class digital
              foundation that empowers academic excellence, cutting-edge
              research, efficient administration, and an enriched campus
              experience for the entire Institute community.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Network Scale at a Glance
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Campus connectivity scale
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
            {networkScale.map((item) => (
              <div key={item} className="bg-slate-950 p-6">
                <p className="text-lg font-semibold leading-8 text-blue-50">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Technological Framework
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Hybrid technology approach
            </h2>

            <p className="mt-6 text-lg leading-9 text-slate-600">
              To cater to the diverse needs of the campus community, the network
              leverages a hybrid technology approach:
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {technologyFramework.map((technology) => (
              <article
                key={technology.title}
                className="border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-2xl font-bold text-slate-950">
                  {technology.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  {technology.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Continuous Evolution
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Continuous network modernization
            </h2>
          </div>

          <p className="text-lg leading-9 text-slate-600">
            In its commitment to providing world-class infrastructure, IIT
            Kharagpur continually upgrades its network. Recent advancements
            include deploying smart data center infrastructure, expanding
            high-capacity seamless wireless coverage across all halls of
            residence, integrating major healthcare facilities like the Dr. Syama
            Prasad Mookerjee Super Specialty Hospital into the core network, and
            supporting high-end research through the 'Meghamala' private cloud
            services.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Infrastructure;
