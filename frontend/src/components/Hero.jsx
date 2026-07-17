import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroPoster from "../assets/cic_home.jpeg";

const heroVideoSrc = "/videos/cic-hero.mp4";
const focusAreas = [
  "Central computing support for academic laboratories and workstation environments.",
  "Institute-wide wired and wireless networking, authentication, and internet access services.",
  "Shared digital systems including mail, software enablement, private cloud, VPN, and network time services.",
  "Operational reliability, support workflows, and policy-backed campus IT stewardship.",
];

function Hero({ compact = false }) {
  const [hasVideo, setHasVideo] = useState(true);
  const sectionClassName = compact
    ? "relative isolate flex min-h-0 flex-1 overflow-hidden"
    : "relative isolate min-h-[70vh] overflow-hidden";
  const contentClassName = compact
    ? "relative mx-auto grid min-h-0 w-full max-w-[1640px] items-center gap-8 px-4 py-8 sm:px-6 2xl:px-10 lg:grid-cols-[1.18fr_0.82fr]"
    : "relative mx-auto grid min-h-[70vh] max-w-[1640px] items-end gap-12 px-4 py-24 sm:px-6 2xl:px-10 lg:grid-cols-[1.18fr_0.82fr]";
  const headingClassName = compact
    ? "mb-4 text-4xl font-black leading-tight text-blue-50 drop-shadow-[0_8px_24px_rgba(15,23,42,0.5)] md:text-5xl xl:text-6xl"
    : "mb-6 text-5xl font-black leading-tight text-blue-50 drop-shadow-[0_8px_24px_rgba(15,23,42,0.5)] md:text-6xl xl:text-7xl";
  const focusItemClassName = compact
    ? "border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
    : "border-b border-white/10 pb-5 last:border-b-0 last:pb-0";

  return (
    <section className={sectionClassName}>
      <div className="absolute inset-0">
        {hasVideo ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={heroPoster}
            onError={() => setHasVideo(false)}
          >
            <source src={heroVideoSrc} type="video/mp4" />
          </video>
        ) : (
          <img
            src={heroPoster}
            alt="Computer & Informatics Centre at IIT Kharagpur"
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,24,64,0.88)_0%,rgba(8,47,73,0.72)_42%,rgba(15,23,42,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_36%)]" />
      </div>

      <div className={contentClassName}>
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-100 backdrop-blur-sm"
          >
            IIT Kharagpur Digital Infrastructure
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={headingClassName}
          >
            <span className="block text-blue-100">Computer &amp;</span>
            <span className="block text-cyan-200">Informatics Center</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className={`${compact ? "max-w-2xl text-base leading-7 md:text-lg" : "max-w-2xl text-lg leading-8 md:text-xl"} text-slate-100`}
          >
            Maintaining the central computing, networking, and software
            infrastructure that powers academics, research, and digital services
            across IIT Kharagpur.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className={`${compact ? "mt-6" : "mt-8"} flex flex-wrap gap-4`}
          >
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Explore Services
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/team"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-blue-50 backdrop-blur-sm transition hover:bg-white/15"
            >
              Meet The Team
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="border-t border-white/20 pt-6 text-white lg:justify-self-end lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
        >
          <p className="text-xl font-semibold uppercase tracking-[0.24em] text-yellow-400">
            FOCUS AREA
          </p>

          <div className={`${compact ? "mt-4 space-y-3" : "mt-5 space-y-6"}`}>
            {focusAreas.map((area, index) => (
              <div key={area} className={focusItemClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">
                  0{index + 1}
                </p>
                <p
                  className={`${compact ? "mt-1.5 text-sm leading-6" : "mt-2 text-lg leading-7"} text-blue-50`}
                >
                  {area}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
