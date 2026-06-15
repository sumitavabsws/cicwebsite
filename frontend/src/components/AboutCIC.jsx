import { useEffect, useRef, useState } from "react";
import { Play, RefreshCcw, RotateCcw, RotateCw, X } from "lucide-react";
import Updates from "./Updates";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const videoBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
const cicVideoSrc = `${videoBaseUrl}/videos/cicvideo.mp4`;

function AboutCIC() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const videoRef = useRef(null);

  const skipVideo = (seconds) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = Math.min(
      Math.max(video.currentTime + seconds, 0),
      video.duration || Number.MAX_SAFE_INTEGER,
    );
  };

  const restartVideo = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = 0;
    video.play().catch(() => {});
  };

  useEffect(() => {
    if (!isVideoOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsVideoOpen(false);
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVideoOpen]);

  return (
    <section className="flex min-h-[calc(100vh-156px)] items-center bg-white py-[81px]">
      <div className="mx-auto grid max-w-[1640px] gap-12 px-4 sm:px-6 2xl:px-10 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="max-w-4xl">
          <button
            type="button"
            onClick={() => setIsVideoOpen(true)}
            className="mb-8 inline-flex items-center gap-3 bg-cicBlue px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-cyan-200"
            aria-haspopup="dialog"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            Watch CIC Video
          </button>

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

      {isVideoOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cic-video-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsVideoOpen(false);
            }
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 text-white">
              <h3 id="cic-video-title" className="text-base font-semibold md:text-lg">
                Computer and Informatics Center
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={restartVideo}
                  className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-cyan-300/40"
                  aria-label="Restart video"
                  title="Restart video"
                >
                  <RefreshCcw className="h-5 w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => skipVideo(-10)}
                  className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-cyan-300/40"
                  aria-label="Go back 10 seconds"
                  title="Back 10 seconds"
                >
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => skipVideo(10)}
                  className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-cyan-300/40"
                  aria-label="Go forward 10 seconds"
                  title="Forward 10 seconds"
                >
                  <RotateCw className="h-5 w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-cyan-300/40"
                  aria-label="Close video"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <video
              ref={videoRef}
              className="aspect-video w-full bg-black"
              controls
              controlsList="nodownload"
              autoPlay
              playsInline
              preload="metadata"
              disablePictureInPicture
              onEnded={(event) => event.currentTarget.pause()}
            >
              <source src={cicVideoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AboutCIC;
