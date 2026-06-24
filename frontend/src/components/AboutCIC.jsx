import Updates from "./Updates";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const videoBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
const cicVideoSrc = `${videoBaseUrl}/videos/cicvideo.mp4`;

function AboutCIC() {
  return (
    <section className="flex min-h-[calc(100vh-156px)] items-center bg-white py-[81px]">
      <div className="mx-auto grid max-w-[1640px] gap-12 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
            About CIC
          </p>

          <h2 className="max-w-4xl text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            The institute backbone for computing, connectivity, and shared
            digital infrastructure
          </h2>

          <p className="mt-8 max-w-4xl text-lg leading-9 text-slate-600">
            Computer &amp; Informatics Centre is responsible for maintaining the
            central computing and networking infrastructure of IIT Kharagpur. It
            supports academic laboratories, workstation and PC environments,
            institute-wide wired and wireless access, centralized messaging, and
            several other core digital services that enable teaching, research,
            administration, and campus-wide operations from the Ramanujan
            Academic Complex.
          </p>

          <p className="mt-8 max-w-4xl text-lg leading-9 text-slate-600">
            CIC operates as a shared institutional service layer connecting
            classrooms, offices, laboratories, research environments, and campus
            users. Its work spans network access, software enablement, data-centre
            operations, secure service delivery, and the digital reliability
            expected across IIT Kharagpur.
          </p>

          <div className="mt-8 max-w-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm">
            <video
              className="aspect-video w-full bg-black"
              controls
              controlsList="nodownload"
              autoPlay
              muted
              playsInline
              preload="metadata"
              disablePictureInPicture
            >
              <source src={cicVideoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <div className="flex h-full flex-col bg-slate-950 px-6 py-8 text-white md:px-8 xl:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Live Information
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            Updates
          </h2>

          <p className="mt-3 text-base leading-7 text-blue-100">
            Track current notices and event-linked references from a single place.
          </p>

          <div className="mt-8 flex-1">
            <Updates/>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutCIC;
