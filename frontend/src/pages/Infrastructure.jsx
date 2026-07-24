import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight,
  Cloud,
  Headphones,
  MonitorCog,
  Network as NetworkIcon,
  Server,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import networkOverviewImage from "../assets/infrastructure/iit-kgp-network-overview.png";
const networkScale = [
  "~50,000 Information Outlets across the campus",
  "~25,000 Outlets dedicated to Academic areas (Labs, Classrooms)",
  "~20,000 Outlets serving the Student Halls of Residence",
  "~5,000 Outlets serving the Residential areas",
  "Over 1,800 Access Switches and 4,500+ Wi-Fi Access Points",
  "20 Gbps of Internet Connectivity with a 10 Gbps Core Backbone",
];

const networkBannerImages = [
  {
    src: "/media/infrastructure/physical/networkroom1.jpg",
    alt: "CIC central network room infrastructure",
  },
  {
    src: "/media/infrastructure/physical/networkroom2.jpg",
    alt: "Network racks and routing equipment inside CIC",
  },
  {
    src: "/media/infrastructure/physical/networkroom3.jpg",
    alt: "Campus network room equipment row",
  },
  {
    src: "/media/infrastructure/physical/networkroom4.jpg",
    alt: "Core network facility at CIC",
  },
];

const pcLabBannerImages = [1, 2, 3, 4, 5, 6, 7, 8].map((imageNumber) => ({
  src: `/media/infrastructure/physical/pclab${imageNumber}.jpg`,
  alt: `CIC PC Lab facility view ${imageNumber}`,
}));

const networkInlineImages = [
  {
    src: "/media/infrastructure/physical/splicetray1.jpg",
    alt: "Fiber splice tray in the CIC network facility",
    caption: "Fiber splice tray supporting campus backbone connectivity.",
  },
  {
    src: "/media/infrastructure/physical/switch.jpg",
    alt: "Network switch infrastructure in the CIC network room",
    caption:
      "Switching infrastructure supporting access and distribution layers.",
  },
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

const firewallSecuritySections = [
  {
    title: "Strengthening the Digital Perimeter",
    body: "As part of our ongoing institutional commitment to fostering a secure, resilient, and ultra-high-speed digital ecosystem for our students, faculty, and research scholars, the Institute has successfully implemented perimeter defence through the strategic deployment of a sophisticated Next-Generation Firewall (NGFW) architecture. This upgrade marks a significant step forward in safeguarding the campus network against an increasingly complex and evolving threat landscape.",
  },
  {
    title: "Beyond Traditional Inspection",
    body: "Unlike traditional security systems that merely inspect standard network headers such as IP addresses and port numbers, the newly integrated Next-Generation Firewalls operate with deep contextual intelligence, examining traffic at the application layer to identify the true nature of the data passing through the network. This enables the system to actively shield the entire campus from highly sophisticated, multi-vector contemporary cyber threats, including malware, intrusion attempts, and application-level exploits, that would otherwise go undetected by conventional packet filtering alone.",
  },
  {
    title: "A Segmented, High-Capacity Architecture",
    body: "To seamlessly support this substantial computational security overhead without introducing network latency or operational bottlenecks, the network topology physically segments the campus into two specialised, high-capacity traffic zones, both directly linked to the central Core Switch infrastructure. This segmentation ensures that the distinct traffic patterns of residential and academic users are handled independently, allowing each zone to be optimised for its own specific load characteristics.",
  },
  {
    title: "Wireless and Residential Zone - 45 Gbps",
    body: "The first segment consists of a high-density firewall cluster boasting an exceptional 45 Gbps of Threat Protection throughput. This cluster is specifically engineered to manage the immense concurrent traffic loads generated by personal mobile devices and heavy multimedia streaming across the campus-wide wireless networks and student residential sectors, where the sheer number of connected devices demands significantly greater throughput capacity.",
  },
  {
    title: "Academic and Administrative Zone - 10 Gbps",
    body: "The second segment utilises a dedicated 10 Gbps Threat Protection firewall cluster that exclusively services the core academic departments, administrative buildings, research laboratories, and student hostel networks. By isolating this zone from the higher-volume residential traffic, the Institute ensures that high-priority academic communication and localised institutional services remain heavily secured and are fully insulated from fluctuations in external, recreational traffic.",
  },
  {
    title: "Built-In Redundancy: High Availability",
    body: "Crucially, to eliminate any single point of failure and guarantee maximum operational continuity, both of these firewall zones are deployed in a strict High Availability (HA) configuration. Under this configuration, each active cluster is paired with a redundant twin that operates in perfect synchronisation, continuously mirroring its state so that, in the unlikely event of a hardware failure, the standby unit can seamlessly take over without any interruption to network connectivity or campus services.",
  },
];

const firewallTopologyParagraphs = [
  "The accompanying diagram illustrates how traffic moves through this architecture, from the outermost edge of the network down to the end users it serves.",
  "All external traffic first arrives at the Institute through the Internet Gateway, the single point of entry connecting the campus to the outside world. From there, traffic is immediately split and routed to one of the two parallel NGFW clusters based on its destination, rather than being funnelled through a single inspection point.",
  "Traffic destined for wireless and residential users is directed to the 45 Gbps Threat Protection cluster, while traffic bound for academic and administrative services is routed to the 10 Gbps Threat Protection cluster. Each cluster independently inspects and filters its traffic stream before passing it onward, ensuring that a surge in one zone, such as heavy streaming activity in the hostels, has no bearing on the performance or security posture of the other.",
  "Once inspected, both streams converge at the Core Switch Layer, the central hub that distributes traffic to its final destination. From here, wireless and residential traffic is routed out to the Wireless & Residence zone, covering hostel networks and campus-wide Wi-Fi, while academic traffic is routed to the Academic & Hostels zone, covering departments, administrative buildings, and research laboratories.",
  "This design means every packet entering or leaving the campus passes through a dedicated, appropriately sized firewall cluster before it ever reaches the Core Switch, ensuring that inspection happens as close to the network edge as possible and that no single cluster is overwhelmed by traffic it was not designed to handle.",
];

const helpdeskOperationsSections = [
  {
    title: "Overview",
    body: "The Campus Network Helpdesk serves as the primary technical support and operations unit responsible for ensuring uninterrupted network connectivity across the academic, residential, and hostel areas of the campus.",
  },
  {
    title: "Scope of Network Infrastructure",
    body: "The team manages and supports a diverse, large-scale network infrastructure comprising Layer 1, Layer 2, and Layer 3 architectures, delivering reliable wired, wireless, and GPON-based connectivity to students, faculty, staff, laboratories, offices, classrooms, guest houses, and residential complexes.",
  },
  {
    title: "Continuous Monitoring and Coordination",
    body: "The team continuously monitors network health, bandwidth utilization, device status, and service availability while coordinating with multiple stakeholders during planned maintenance activities, infrastructure upgrades, and new deployments.",
  },
  {
    title: "Support for Institute Events",
    body: "Support is also extended to institute events, conferences, workshops, seminars, and visiting delegates by establishing temporary or permanent network connectivity tailored to operational requirements.",
  },
];

const helpdeskOperationsParagraphs = [
  "Day-to-day activities include the installation, configuration, commissioning, monitoring, maintenance, and troubleshooting of network devices such as core, distribution, and access switches, wireless controllers, access points, GPON OLTs and ONTs, routers, and associated passive infrastructure.",
  "The Helpdesk also undertakes structured cabling, fiber optic connectivity, rack management, VLAN provisioning, IP address allocation, network security implementation, firmware and software upgrades, preventive maintenance, and continuous performance monitoring to ensure high availability and optimal network performance.",
  "By adhering to industry best practices and established operational procedures, the team maintains a secure, scalable, and resilient campus network that supports the institute's diverse academic and administrative requirements.",
];

const helpdeskSupportParagraphs = [
  "Beyond routine operations, the Campus Network Helpdesk plays a vital role in providing prompt technical assistance and resolving network-related issues reported by students, faculty members, researchers, administrative offices, and campus residents.",
  "Service requests are handled by diagnosing the issue, isolating the fault, and resolving it promptly, minimizing downtime and ensuring continued access to digital learning resources, research facilities, online examinations, enterprise applications, high-performance computing resources, video conferencing, and internet services.",
];

const helpdeskImages = [
  {
    src: "/media/infrastructure/physical/heldesk1.jpg",
    alt: "Campus Network Helpdesk team supporting network operations",
    caption: "Helpdesk operations supporting campus network services.",
  },
  {
    src: "/media/infrastructure/physical/heldesk2.jpg",
    alt: "Helpdesk systems and network operations workspace",
    caption: "Operational workspace for monitoring and support activities.",
  },
  {
    src: "/media/infrastructure/physical/heldesk3.jpg",
    alt: "Technical support and classroom network assistance",
    caption: "Technical support during classroom and lab network activities.",
  },
];

const pcLabOverviewParagraphs = [
  "Welcome to the CIC, the Institute's centralized computing infrastructure, where state-of-the-art software laboratories are designed to meet diverse academic and professional needs.",
  "Equipped with over 500 nodes, including labs with high-performance PCs, CIC offers a dual-environment setup featuring both Windows and Linux platforms to ensure versatility for all users.",
  "These dynamic spaces serve as hubs for regular academic classes while also providing the robust infrastructure required to host specialized workshops, conferences, and high-stakes All India entrance examinations such as GATE, JEE, and NEET.",
  "CIC also conducts online semester examinations on the Moodle platform along with the Moodle team. The labs encourage the use of free and open-source software while integrating licensed versions of essential commercial applications tailored to support specialized courses.",
];

const pcLabPlatforms = ["Windows 11", "Linux (Ubuntu 22.04)"];

const pcLabSoftware = [
  "MATLAB",
  "IBM-SPSS",
  "ATOM SK",
  "ANSYS",
  "CODE-BLOCKS",
  "SOLIDWORKS",
  "GHC",
  "MS-OFFICE",
  "GAUSSIAN",
  "ABAQUS",
  "GROMACS",
  "TRENDMICRO",
  "PACKMOL",
  "ARC GIS PRO",
  "PYMOL",
  "MAX SURF",
  "LATEX",
  "MEGA",
  "R",
  "QGIS",
  "R STUDIO",
  "REFPROPE",
  "VMD",
  "ERDAS IMAGINE",
  "PARAVIEW",
  "STATA",
  "PQL",
  "RAY SUM",
  "SEISAN",
];

const pcLabConfigurations = [
  {
    model: "HP Elite Tower 800G9",
    details: [
      "Processor: Intel i7 13th Gen",
      "Storage: 1 TB SSD",
      "RAM: 32 GB DDR5",
      "GPU: 12 GB NVIDIA",
      "Monitor: 27 inches",
    ],
  },
  {
    model: "HP Elite Tower 800 G9",
    details: [
      "Processor: Intel i7 14th Gen",
      "Storage: 1 TB SSD",
      "RAM: 16 GB DDR5",
      "Monitor: 22 inches",
    ],
  },
  {
    model: "ACER Veriton M66 90G",
    details: [
      "Processor: Intel i5 12th Gen",
      "Storage: 256 GB SSD and 1 TB HDD",
      "RAM: 16 GB DDR5",
      "Monitor: 21 inches",
    ],
  },
  {
    model: "HP ProDesk 600G6",
    details: [
      "Processor: Intel i5 10th Gen",
      "Storage: 256 GB SSD and 1 TB HDD",
      "RAM: 16 GB DDR5",
      "Monitor: 22 inches",
    ],
  },
];

const pcLabContacts = [
  {
    label: "Lab In-Charge",
    value: "Mr. Surid Kumar Das",
  },
  {
    label: "Lab Support Technicians",
    value: "Mr. Sunil Patra, Mr. Bishnu Paria, Mr. Atanu Maity",
  },
  {
    label: "Lab Booking Mail-ID",
    value: "labbooking@cc.iitkgp.ac.in",
    href: "mailto:labbooking@cc.iitkgp.ac.in",
  },
];

const smartRackImages = {
  rackRow: [
    {
      src: "/media/infrastructure/physical/smartrack1.jpg",
      alt: "Vertiv SmartRow enclosed rack row in operation",
      caption: "SmartRow enclosed rack row in operation.",
    },
    {
      src: "/media/infrastructure/physical/smartrack2.jpg",
      alt: "SmartRow rack containment and cooling aisle",
      caption:
        "Integrated rack containment supporting separated hot and cold aisles.",
    },
  ],
  ups: [
    {
      src: "/media/infrastructure/physical/ups1.jpg",
      alt: "Vertiv Liebert APM Plus UPS cabinet",
      caption: "Liebert APM Plus modular UPS cabinet.",
    },
    {
      src: "/media/infrastructure/physical/ups2.jpg",
      alt: "UPS monitoring and control panel",
      caption: "UPS control and monitoring panel.",
    },
  ],
  battery: [
    {
      src: "/media/infrastructure/physical/ups3.jpg",
      alt: "VRLA battery rack for data centre backup",
      caption: "VRLA battery rack for backup power.",
    },
    {
      src: "/media/infrastructure/physical/ups4.jpg",
      alt: "Battery bank and interlink cabling",
      caption: "Battery bank with interlink cabling and isolation systems.",
    },
  ],
};

const smartRackFacilitySections = [
  {
    title: "Academic & Research Computing Laboratories",
    body: "The department hosts six high-performance PC laboratories engineered for student and research workloads. Each laboratory is equipped with a dedicated Central Air Conditioning system for continuous climate control, along with an independent UPS system so a localized power disruption in one lab has no effect on the others.",
  },
  {
    title: "Computer & Informatics Centre Server Room",
    body: "The main CIC Server Room houses core operational servers and enterprise hardware, protected by specialized online UPS systems and a combined cooling matrix using Central AC, Cassette AC, and Tower AC units to eliminate hotspot risks across uneven heat loads.",
  },
  {
    title: "Dedicated Cloud & NDL Server Room",
    body: "A specialized isolated server room houses the National Digital Library hardware together with the Institute's Private Cloud infrastructure. This zone operates on an independent UPS system and a dedicated standalone 12TR Air Conditioning system tailored for high-density server heat dissipation.",
  },
  {
    title: "Central Network Facility",
    body: "The Central Network Room anchors the campus backbone with core routing equipment, security appliances, and GPON OLT devices. Redundant online UPS systems and an independent 21TR Air Conditioning system maintain campus-wide connectivity and continuous telecommunication routing.",
  },
];

const nknFeatureSections = [
  {
    title: "High-Definition Video Conferencing",
    body: "Equipped with multi-camera setups, omnidirectional tracking microphones, and high-fidelity sound systems, these rooms capture and relay lectures with crisp clarity, ensuring that participants joining remotely feel present in the room.",
  },
  {
    title: "Ultra-Low Latency Connectivity",
    body: "Leveraging NKN's high-speed, secure, gigabit-capable fiber-optic backbone, these rooms support uninterrupted, real-time interaction between students and global experts, even across long distances and multiple institutional networks.",
  },
  {
    title: "Dual-Screen Interactive Displays",
    body: "These dual-screen setups allow students to view high-resolution presentation slides or digital whiteboards on one screen while maintaining eye contact with the remote instructor on the other, preserving the natural feel of an in-person lecture.",
  },
];

const nknImpactSections = [
  {
    title: "Collaborative Academic Programs",
    body: "Enables the joint delivery of credit courses, Global Initiative of Academic Networks (GIAN) programs, and national webcasts with other top-tier IITs, IISc, and global universities, extending the classroom well beyond the physical campus.",
  },
  {
    title: "Virtual Expert Lectures",
    body: "Connects research scholars and students directly with distinguished scientists, global industry leaders, and policymakers, without the time and cost overheads of travel.",
  },
  {
    title: "Resource Sharing",
    body: "Breaks institutional barriers, allowing student cohorts from remote engineering colleges across India to tune into live, high-quality lectures originating from our campus, extending the benefit of IIT Kharagpur's faculty expertise to a much wider student base.",
  },
];

const infrastructureSections = [
  {
    id: "network",
    name: "Network",
    description:
      "Campus connectivity, backbone, wired access, wireless access, and gateway services.",
    icon: NetworkIcon,
    badgeClassName: "bg-blue-100 text-cicBlue",
  },
  {
    id: "firewall-security-systems",
    name: "Firewall and Security Systems",
    description:
      "NGFW security, segmented firewall zones, and HA threat protection.",
    icon: ShieldCheck,
    badgeClassName: "bg-rose-100 text-rose-700",
  },
  {
    id: "server-storage",
    name: "Server & Storage",
    description:
      "Server and storage infrastructure details will be added here.",
    icon: Server,
    badgeClassName: "bg-slate-100 text-slate-700",
  },
  {
    id: "pc-labs",
    name: "PC Labs",
    description:
      "High-performance software labs for classes, workshops, exams, and computing.",
    icon: MonitorCog,
    badgeClassName: "bg-violet-100 text-violet-700",
  },
  {
    id: "upport-helpdesk",
    name: "Support and Helpdesk",
    description:
      "Network support, operations, monitoring, issue resolution, and events.",
    icon: Headphones,
    badgeClassName: "bg-amber-100 text-amber-700",
  },
  {
    id: "nkn-rooms",
    name: "NKN Rooms",
    description:
      "Virtual classrooms for real-time collaboration, lectures, and resource sharing.",
    icon: Cloud,
    badgeClassName: "bg-cyan-100 text-cyan-700",
  },
  {
    id: "smart-rack-power-ac-systems",
    name: "Smart Rack, Power & AC Systems",
    description:
      "Smart racks, UPS, cooling, batteries, and server-room resilience.",
    icon: ServerCog,
    badgeClassName: "bg-emerald-100 text-emerald-700",
  },
];

// Server & Storage is temporarily hidden while its content is being decided.
const visibleInfrastructureSections = infrastructureSections.filter(
  (section) => section.id !== "server-storage",
);

function FirewallSecurityContent() {
  return (
    <>
      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Firewall and Security Systems
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              Campus Network Security: Next-Generation Firewall Deployment
            </h2>

            <p className="mt-5 text-xl font-semibold leading-8 text-slate-700">
              Strengthening the Institute's digital perimeter with segmented,
              high-capacity inspection.
            </p>
          </div>

          <figure className="border border-slate-200 bg-white p-3 shadow-sm">
            <img
              src="/media/infrastructure/firewall_setup.png"
              alt="Campus firewall network topology overview"
              className="mx-auto max-h-[520px] w-full object-contain"
            />
            <figcaption className="border-t border-slate-200 px-2 pt-3 text-sm leading-6 text-slate-500">
              Next-Generation Firewall deployment topology for segmented campus
              traffic inspection.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Security Architecture
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Deep inspection with segmented high-capacity zones
            </h2>
          </div>

          <div className="space-y-8 text-lg leading-9 text-slate-600">
            {firewallSecuritySections.slice(0, 3).map((section) => (
              <article key={section.title}>
                <h3 className="text-2xl font-bold leading-snug text-slate-950">
                  {section.title}
                </h3>
                <p className="mt-3">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Firewall Capacity at a Glance
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Zone-wise protection and continuity
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-3">
            {firewallSecuritySections.slice(3).map((section) => (
              <article key={section.title} className="bg-slate-950 p-6">
                <h3 className="text-xl font-bold leading-snug text-blue-50">
                  {section.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Network Topology Overview
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Dedicated firewall clusters before the core layer
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-9 text-slate-600">
            {firewallTopologyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function PcLabsContent({ bannerIndex }) {
  return (
    <>
      <section className="py-16">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="grid gap-10 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
                PC Labs
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                CIC PC Labs
              </h2>

              <p className="mt-5 text-xl font-semibold leading-8 text-slate-700">
                Centralized computing laboratories for teaching, training,
                examinations, and specialized software access.
              </p>
            </div>

            <figure className="overflow-hidden border border-slate-200 bg-white p-3 shadow-sm">
              <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                <AnimatePresence mode="sync">
                  <motion.img
                    key={pcLabBannerImages[bannerIndex].src}
                    src={pcLabBannerImages[bannerIndex].src}
                    alt={pcLabBannerImages[bannerIndex].alt}
                    initial={{ x: "-100%", opacity: 0.88 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0.88 }}
                    transition={{ duration: 0.75, ease: "easeInOut" }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 px-2 text-sm leading-6 text-slate-500">
                <figcaption>
                  CIC PC Lab teaching, training, and examination facility.
                </figcaption>

                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {pcLabBannerImages.map((image, index) => (
                    <span
                      key={image.src}
                      className={`h-1.5 w-4 rounded-full transition ${
                        index === bannerIndex ? "bg-cicBlue" : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Lab Overview
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Academic computing at institutional scale
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-9 text-slate-600">
            {pcLabOverviewParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Software Environment
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Windows, Linux, open-source, and licensed software support
            </h2>
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-[0.42fr_1fr]">
            <div className="border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-950">
                Operating Platforms
              </h3>

              <div className="mt-5 grid gap-3">
                {pcLabPlatforms.map((platform) => (
                  <p
                    key={platform}
                    className="border border-blue-100 bg-blue-50 px-4 py-3 text-base font-semibold text-cicBlue"
                  >
                    {platform}
                  </p>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-950">
                Software Used in Labs
              </h3>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {pcLabSoftware.map((software) => (
                  <span
                    key={software}
                    className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    {software}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              PC Configuration
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Available workstation configurations
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
            {pcLabConfigurations.map((configuration) => (
              <article key={configuration.model} className="bg-slate-950 p-6">
                <h3 className="text-xl font-bold leading-snug text-blue-50">
                  {configuration.model}
                </h3>

                <ul className="mt-5 space-y-3 text-base leading-7 text-slate-300">
                  {configuration.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Lab Operations
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Contact and booking support
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pcLabContacts.map((contact) => (
              <article
                key={contact.label}
                className="border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cicBlue">
                  {contact.label}
                </p>

                {contact.href ? (
                  <a
                    href={contact.href}
                    className="mt-3 block text-lg font-bold leading-7 text-slate-950 transition hover:text-cicBlue"
                  >
                    {contact.value}
                  </a>
                ) : (
                  <p className="mt-3 text-lg font-bold leading-7 text-slate-950">
                    {contact.value}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function SupportHelpdeskContent() {
  return (
    <>
      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.86fr_1.14fr] xl:items-start">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Support and Helpdesk
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              Campus Network Helpdesk: Support &amp; Operations
            </h2>

            <p className="mt-5 text-xl font-semibold leading-8 text-slate-700">
              Primary technical support and operations for reliable campus-wide
              network connectivity.
            </p>
          </div>

          <figure className="overflow-hidden border border-slate-200 bg-white p-3 shadow-sm">
            <img
              src={helpdeskImages[0].src}
              alt={helpdeskImages[0].alt}
              className="aspect-[3/2] w-full object-cover"
            />
            <figcaption className="border-t border-slate-200 px-2 pt-3 text-sm leading-6 text-slate-500">
              {helpdeskImages[0].caption}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Operations Mandate
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Connectivity support across academic, hostel, and residential
              areas
            </h2>
          </div>

          <div className="space-y-8 text-lg leading-9 text-slate-600">
            {helpdeskOperationsSections.slice(0, 2).map((section) => (
              <article key={section.title}>
                <h3 className="text-2xl font-bold leading-snug text-slate-950">
                  {section.title}
                </h3>
                <p className="mt-3">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Day-to-Day Operations
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Installation, monitoring, maintenance, and troubleshooting
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-9 text-slate-600">
            {helpdeskOperationsParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <ImageFeature image={helpdeskImages[1]} />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Support Coverage
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Issue resolution, monitoring, events, and service continuity
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-2">
            {helpdeskOperationsSections.slice(2).map((section) => (
              <article key={section.title} className="bg-slate-950 p-6">
                <h3 className="text-xl font-bold leading-snug text-blue-50">
                  {section.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Technical Support and Issue Resolution
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Prompt assistance for the campus community
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-9 text-slate-600">
            {helpdeskSupportParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Our Commitment
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Secure, high-performance, and future-ready networking services
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-lg leading-9 text-slate-600">
              With a strong commitment to service excellence, reliability, and
              technological innovation, the Campus Network Helpdesk remains
              dedicated to delivering secure, high-performance, and future-ready
              networking services that enable the institute's teaching,
              research, innovation, and administrative excellence while
              enhancing the overall digital experience of the campus community.
            </p>

            <ImageFeature image={helpdeskImages[2]} />
          </div>
        </div>
      </section>
    </>
  );
}

function ImagePair({ images }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {images.map((image) => (
        <figure
          key={image.src}
          className="overflow-hidden border border-slate-200 bg-white shadow-sm"
        >
          <img
            src={image.src}
            alt={image.alt}
            className="aspect-[3/2] w-full object-cover"
          />
          <figcaption className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-500">
            {image.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function ImageFeature({ image }) {
  return (
    <figure className="overflow-hidden border border-slate-200 bg-white p-3 shadow-sm">
      <img
        src={image.src}
        alt={image.alt}
        className="aspect-[3/2] w-full object-cover"
      />
      <figcaption className="border-t border-slate-200 px-2 pt-3 text-sm leading-6 text-slate-500">
        {image.caption}
      </figcaption>
    </figure>
  );
}

function NknRoomsContent() {
  return (
    <>
      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.92fr_1.08fr] xl:items-end">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              NKN Rooms
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              Empowering Global Education: NKN Virtual Classrooms at IIT
              Kharagpur
            </h2>

            <p className="mt-5 text-xl font-semibold leading-8 text-slate-700">
              Three state-of-the-art virtual classrooms bridge geographical gaps
              between premier institutions through seamless, real-time knowledge
              sharing and collaborative learning.
            </p>
          </div>

          <div className="border border-cyan-100 bg-cyan-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              NKN PIU Initiative
            </p>
            <p className="mt-4 text-lg leading-9 text-slate-700">
              The National Knowledge Network initiative, executed by the NKN
              Project Implementation Unit, has established these high-tech
              facilities at IIT Kharagpur to support national academic
              collaboration.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Key Features & Capabilities
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              An immersive, interactive digital classroom experience
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 lg:grid-cols-3">
            {nknFeatureSections.map((section) => (
              <article key={section.title} className="bg-white p-7">
                <h3 className="text-xl font-bold leading-snug text-slate-950">
                  {section.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Impact on the Campus Ecosystem
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Extending IIT Kharagpur's classroom beyond the campus
            </h2>
          </div>

          <div className="space-y-8 text-lg leading-9 text-slate-600">
            {nknImpactSections.map((section) => (
              <article key={section.title}>
                <h3 className="text-2xl font-bold leading-snug text-slate-950">
                  {section.title}
                </h3>
                <p className="mt-3">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Facility Booking
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Centrally managed classroom access
            </h2>
          </div>

          <p className="text-lg leading-9 text-slate-300">
            Faculty members planning to host collaborative pan-India interactive
            sessions, thesis or project defense presentations, or virtual
            workshops can check availability and submit booking requests via the
            institutional internal portal.
          </p>
        </div>
      </section>
    </>
  );
}

function SmartRackPowerContent() {
  return (
    <>
      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.82fr_1.18fr] xl:items-start">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Smart Rack, Power &amp; AC Systems
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              Integrated Intelligent Micro Data Centre
            </h2>

            <p className="mt-5 text-xl font-semibold leading-8 text-slate-700">
              A high-density edge data centre combining rack, cooling, power,
              monitoring, and safety into a factory-integrated enclosed row.
            </p>

            <p className="mt-6 text-lg leading-9 text-slate-600">
              The Computer and Informatics Centre operates a Vertiv SmartRow
              SR-8-90 RC3 micro data centre paired with a scalable Vertiv
              Liebert APM Plus UPS system. This self-contained deployment
              reduces setup complexity and removes many failure points normally
              associated with traditional server room builds.
            </p>
          </div>

          <ImagePair images={smartRackImages.rackRow} />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              SmartRow Infrastructure &amp; Cooling
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Contained rack row with precision thermal control
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-9 text-slate-600">
            <p>
              The system deploys eight 1200mm-depth IT racks, each fitted with
              integrated hot and cold aisle containment. This separates exhaust
              heat from intake air and improves thermal efficiency across the
              high-density rack row.
            </p>

            <p>
              Cooling is handled by an In-Row PAC unit with an internal heater
              and humidifier, maintaining stable temperature and humidity bands
              regardless of external conditions. The system supports an 80 kW IT
              load with N+1 redundancy so a single cooling-unit failure does not
              affect uptime.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Security, Monitoring &amp; Safety
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Physical protection and intelligent operational visibility
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-9 text-slate-600">
            <p>
              An IP-based environmental monitoring system continuously tracks
              temperature, humidity, door status, smoke, and water leakage. It
              is complemented by an active rodent repellent system to protect
              cabling and hardware.
            </p>

            <p>
              Power distribution is handled through 16 IP PDUs, each providing
              24 C13 and 6 C19 sockets for granular, remotely monitorable power
              delivery. Automated fire detection, gas suppression, and biometric
              access control secure the facility physically and operationally.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Modular Power &amp; Energy Storage
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Scalable UPS and 30-minute full-load backup
            </h2>

            <div className="mt-6 space-y-5 text-lg leading-9 text-slate-300">
              <p>
                Power continuity is secured by a Vertiv Liebert APM Plus 150 kVA
                Modular UPS, pre-configured with three 50 kVA hot-swappable
                power modules and a communication card for remote monitoring and
                control. The chassis can scale up to 250 kVA as future load
                demands increase.
              </p>

              <p>
                Energy storage uses a VRLA battery bank delivering 30 minutes of
                backup at full 2 x 150 kVA load, with 40 200 AH batteries on
                dedicated racks, a Battery Circuit Breaker, and interlink
                cabling across the full bank.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <ImagePair images={smartRackImages.ups} />
            <ImagePair images={smartRackImages.battery} />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Departmental Infrastructure &amp; Facility Overview
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Independent power and cooling across critical facilities
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2">
            {smartRackFacilitySections.map((section) => (
              <article key={section.title} className="bg-white p-6">
                <h3 className="text-xl font-bold leading-snug text-slate-950">
                  {section.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Infrastructure() {
  const [activeSection, setActiveSection] = useState(null);
  const [networkBannerIndex, setNetworkBannerIndex] = useState(0);
  const [pcLabBannerIndex, setPcLabBannerIndex] = useState(0);
  const blogContentRef = useRef(null);
  const activeSectionData = visibleInfrastructureSections.find(
    (section) => section.id === activeSection,
  );
  const isBlogActive = Boolean(activeSectionData);
  const isNetworkActive = activeSection === "network";
  const isFirewallSecurityActive =
    activeSection === "firewall-security-systems";
  const isPcLabsActive = activeSection === "pc-labs";
  const isSupportHelpdeskActive = activeSection === "upport-helpdesk";
  const isNknRoomsActive = activeSection === "nkn-rooms";
  const isSmartRackPowerActive =
    activeSection === "smart-rack-power-ac-systems";

  useEffect(() => {
    if (!isBlogActive) {
      return;
    }

    window.requestAnimationFrame(() => {
      blogContentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [isBlogActive, activeSection]);

  useEffect(() => {
    if (!isNetworkActive) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNetworkBannerIndex(
        (currentIndex) => (currentIndex + 1) % networkBannerImages.length,
      );
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isNetworkActive]);

  useEffect(() => {
    if (!isPcLabsActive) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setPcLabBannerIndex(
        (currentIndex) => (currentIndex + 1) % pcLabBannerImages.length,
      );
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isPcLabsActive]);

  const handleSectionSelect = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    window.setTimeout(() => {
      setActiveSection(null);
    }, 520);
  };

  return (
    <LayoutGroup>
      <div className="bg-white">
        <AnimatePresence mode="popLayout">
          {!isBlogActive ? (
            <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 py-16">
              <img
                src="/media/infrastructure/physical/cic-lobby.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.92),rgba(15,23,42,0.7),rgba(15,23,42,0.46))]"
                aria-hidden="true"
              />

              <div className="relative z-10 mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
                <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
                  <div className="max-w-4xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
                      Infrastructure
                    </p>

                    <motion.h1
                      layoutId="infrastructure-page-title"
                      className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl"
                    >
                      CIC Infrastructure
                    </motion.h1>

                    <p className="mt-6 text-lg leading-9 text-blue-50">
                      Select an infrastructure area to view available details.
                    </p>
                  </div>

                  <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    {visibleInfrastructureSections.map((section) => {
                      const Icon = section.icon;

                      return (
                        <motion.div
                          key={section.id}
                          whileHover={{ y: -8, scale: 1.03 }}
                          transition={{ duration: 0.18 }}
                          className="h-full"
                        >
                          <motion.button
                            layoutId={`infrastructure-card-${section.id}`}
                            type="button"
                            onClick={() => handleSectionSelect(section.id)}
                            className="flex h-full min-h-[148px] w-full flex-col rounded-lg border border-white/90 bg-white/30 p-3.5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.24)] backdrop-blur-md transition hover:border-cyan-200 hover:bg-white/48 hover:shadow-[0_22px_55px_rgba(15,23,42,0.32)] focus:outline-none focus:ring-4 focus:ring-cyan-200"
                            transition={{
                              type: "spring",
                              stiffness: 360,
                              damping: 34,
                            }}
                          >
                            <motion.div
                              layoutId={`infrastructure-icon-${section.id}`}
                              className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${section.badgeClassName}`}
                            >
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </motion.div>

                            <h2 className="mb-1 text-base font-bold leading-snug text-slate-950">
                              {section.name}
                            </h2>

                            <p className="text-xs font-medium leading-5 text-slate-800">
                              {section.description}
                            </p>

                            <span className="mt-auto inline-flex items-center gap-2 pt-2 text-xs font-bold text-cicBlue">
                              View details
                              <ArrowRight
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </span>
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <motion.div
              key="compact-infrastructure-header"
              layout
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="sticky top-[156px] z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"
            >
              <div className="mx-auto flex max-w-[1640px] items-center justify-between gap-4 px-4 py-3 sm:px-6 2xl:px-10">
                <motion.p
                  layoutId="infrastructure-page-title"
                  className="text-lg font-black text-slate-950"
                >
                  CIC Infrastructure
                </motion.p>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {visibleInfrastructureSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <motion.button
                        key={section.id}
                        layoutId={`infrastructure-card-${section.id}`}
                        type="button"
                        title={section.name}
                        aria-label={section.name}
                        onClick={() => handleSectionSelect(section.id)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-4 focus:ring-cyan-200 ${
                          isActive
                            ? "border-cicBlue bg-blue-50 text-cicBlue"
                            : "border-slate-200 bg-white text-slate-600 hover:border-cicBlue hover:text-cicBlue"
                        }`}
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 34,
                        }}
                      >
                        <motion.span
                          layoutId={`infrastructure-icon-${section.id}`}
                          className="inline-flex h-5 w-5 items-center justify-center"
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isBlogActive ? (
          <div ref={blogContentRef} className="scroll-mt-[220px]">
            {isNetworkActive ? (
              <>
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
                          The IIT Kharagpur campus network is one of the largest
                          and most comprehensive academic networking
                          infrastructures in India, designed to support the
                          Institute's teaching, research, administration,
                          residential life, and digital services. Spanning
                          academic buildings, halls of residence, residential
                          quarters, libraries, laboratories, hospitals, sports
                          facilities, and common areas, the network provides
                          high-speed, reliable, and secure connectivity to
                          thousands of students, faculty, and staff. This robust
                          infrastructure supports a wide array of
                          mission-critical services, ensuring seamless
                          communication and resource access for all users across
                          the sprawling campus.
                        </p>
                      </div>

                      <figure className="overflow-hidden border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                          <AnimatePresence mode="sync">
                            <motion.img
                              key={networkBannerImages[networkBannerIndex].src}
                              src={networkBannerImages[networkBannerIndex].src}
                              alt={networkBannerImages[networkBannerIndex].alt}
                              initial={{ x: "-100%", opacity: 0.88 }}
                              animate={{ x: 0, opacity: 1 }}
                              exit={{ x: "100%", opacity: 0.88 }}
                              transition={{ duration: 0.75, ease: "easeInOut" }}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </AnimatePresence>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 px-2 text-sm leading-6 text-slate-500">
                          <figcaption>
                            Central network room and core infrastructure at CIC.
                          </figcaption>

                          <div
                            className="flex items-center gap-1.5"
                            aria-hidden="true"
                          >
                            {networkBannerImages.map((image, index) => (
                              <span
                                key={image.src}
                                className={`h-1.5 w-6 rounded-full transition ${
                                  index === networkBannerIndex
                                    ? "bg-cicBlue"
                                    : "bg-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </figure>
                    </div>
                  </div>
                </section>

                <section className="border-y border-slate-200 bg-slate-50 py-16">
                  <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
                    <div className="mb-8 max-w-3xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
                        Network Overview
                      </p>

                      <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                        Campus network flow and distribution structure
                      </h2>
                    </div>

                    <figure className="border border-slate-200 bg-white p-3 shadow-sm">
                      <img
                        src={networkOverviewImage}
                        alt="IIT Kharagpur campus network overview diagram"
                        className="mx-auto max-h-[620px] w-full object-contain"
                      />
                      <figcaption className="border-t border-slate-200 px-2 pt-3 text-sm leading-6 text-slate-500">
                        Network overview diagram from the IIT Kharagpur Network
                        Infrastructure document.
                      </figcaption>
                    </figure>
                  </div>
                </section>

                <section className="border-y border-slate-200 bg-slate-50 py-16">
                  <div className="mx-auto grid max-w-[1640px] gap-10 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[0.78fr_1.22fr]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
                        Network Topology &amp; Architecture
                      </p>

                      <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                        Core, Distribution, and Access Layers
                      </h2>
                    </div>

                    <div className="space-y-6 text-lg leading-9 text-slate-600">
                      <p>
                        The campus network is built upon a highly resilient
                        Three-Layer Hierarchical Model-comprising the Core,
                        Distribution, and Access layers. A massive 10
                        Gigabits-per-second (Gbps) optical backbone
                        interconnects the entire campus and serves as the
                        foundation for delivering reliable data, voice, video,
                        and wireless services. The architecture is designed with
                        redundancy and scalability to ensure high availability,
                        resilience, and uninterrupted operation of critical
                        academic and administrative services. The scale of the
                        network is vast, managing a robust 20 Gbps of Internet
                        connectivity through state-of-the-art gateway firewalls.
                      </p>

                      <p>
                        Beyond Internet access, the network serves as the
                        digital backbone for numerous institutional services,
                        including web hosting, email, authentication systems,
                        cloud services, research computing platforms, digital
                        learning resources, enterprise applications,
                        surveillance systems, utility monitoring, and other
                        mission-critical applications. The infrastructure
                        operates on a 24x7 basis and is continuously upgraded to
                        meet the growing demands of modern education, research,
                        innovation, and digital transformation.
                      </p>

                      <p>
                        Through its scale, reliability, and continuous
                        modernization, the IIT Kharagpur campus network provides
                        a world-class digital foundation that empowers academic
                        excellence, cutting-edge research, efficient
                        administration, and an enriched campus experience for
                        the entire Institute community.
                      </p>

                      <ImagePair images={networkInlineImages} />
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
                        To cater to the diverse needs of the campus community,
                        the network leverages a hybrid technology approach:
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
                      In its commitment to providing world-class infrastructure,
                      IIT Kharagpur continually upgrades its network. Recent
                      advancements include deploying smart data center
                      infrastructure, expanding high-capacity seamless wireless
                      coverage across all halls of residence, integrating major
                      healthcare facilities like the Dr. Syama Prasad Mookerjee
                      Super Specialty Hospital into the core network, and
                      supporting high-end research through the 'Meghamala'
                      private cloud services.
                    </p>
                  </div>
                </section>
              </>
            ) : isFirewallSecurityActive ? (
              <FirewallSecurityContent />
            ) : isPcLabsActive ? (
              <PcLabsContent bannerIndex={pcLabBannerIndex} />
            ) : isSupportHelpdeskActive ? (
              <SupportHelpdeskContent />
            ) : isNknRoomsActive ? (
              <NknRoomsContent />
            ) : isSmartRackPowerActive ? (
              <SmartRackPowerContent />
            ) : (
              <section className="min-h-[420px] bg-white py-16">
                <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
                  <div className="max-w-4xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
                      {activeSectionData.name}
                    </p>

                    <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                      {activeSectionData.name}
                    </h2>

                    <p className="mt-6 text-lg leading-9 text-slate-600">
                      {activeSectionData.description}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="border-t border-slate-200 bg-white py-12">
              <div className="mx-auto flex max-w-[1640px] justify-center px-4 sm:px-6 2xl:px-10">
                <button
                  type="button"
                  onClick={handleBackToTop}
                  className="inline-flex items-center justify-center rounded-lg bg-cicBlue px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-cyan-200"
                >
                  Back To Top
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </LayoutGroup>
  );
}

export default Infrastructure;
