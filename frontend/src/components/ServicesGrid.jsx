import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteContent } from "../context/SiteContentContext";
import { serviceIconMeta } from "../data/services";

function truncateWords(text, limit = 10) {
  const words = text.trim().split(/\s+/);

  if (words.length <= limit) {
    return text;
  }

  return `${words.slice(0, limit).join(" ")}...`;
}

function ServicesGrid({ compact = false, dense = false }) {
  const { services } = useSiteContent();
  // Internet Access is temporarily hidden until its future treatment is decided.
  const publishedServices = services.filter(
    (service) => service.slug !== "internet-access",
  );
  const visibleServices = compact
    ? publishedServices.slice(0, 5)
    : publishedServices;
  const cardMinHeight = dense ? "min-h-[184px]" : "min-h-[252px]";
  const cardPadding = dense ? "p-4" : "p-6";
  const iconSize = dense
    ? "mb-2.5 h-10 w-10 rounded-lg"
    : "mb-4 h-14 w-14 rounded-2xl";
  const iconInnerSize = dense ? "h-5 w-5" : "h-7 w-7";
  const titleClassName = dense
    ? "mb-1 text-base font-semibold leading-snug text-gray-800"
    : "mb-2 text-lg font-semibold text-gray-800";
  const descriptionLimit = dense ? 7 : 10;
  const ctaPadding = dense ? "pt-2.5" : "pt-4";
  const gridClassName = dense
    ? "gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    : "gap-6 md:grid-cols-3";

  return (
    <div className={`grid items-stretch ${gridClassName}`}>
      {visibleServices.map((service) => {
        const iconMeta = serviceIconMeta[service.iconKey] ?? {};
        const Icon = iconMeta.icon;

        return (
          <motion.div
            key={service.slug}
            whileHover={{ y: -8, scale: 1.03 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            <Link
              to={`/services/${service.slug}`}
              className={`flex h-full ${cardMinHeight} flex-col rounded-lg border border-gray-200 bg-white ${cardPadding} shadow-sm transition hover:border-cicBlue hover:shadow-lg`}
            >
              {Icon ? (
                <div
                  className={`inline-flex items-center justify-center ${iconSize} ${iconMeta.badgeClassName}`}
                >
                  <Icon
                    className={`${iconInnerSize} ${iconMeta.iconClassName}`}
                  />
                </div>
              ) : null}

              <h3 className={titleClassName}>{service.title}</h3>

              <p
                className={`${dense ? "text-xs leading-5" : "text-sm leading-6"} text-gray-600`}
              >
                {truncateWords(service.description, descriptionLimit)}
              </p>

              <span
                className={`mt-auto inline-flex items-center gap-2 ${ctaPadding} ${dense ? "text-xs" : "text-sm"} font-semibold text-cicBlue`}
              >
                {service.linkLabel}
                <ExternalLink className={dense ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </span>
            </Link>
          </motion.div>
        );
      })}

      {compact && publishedServices.length > 5 ? (
        <motion.div
          whileHover={{ y: -8, scale: 1.03 }}
          transition={{ duration: 0.18 }}
          className="h-full"
        >
          <Link
            to="/services"
            className="flex h-full min-h-[252px] flex-col justify-between rounded-lg border border-dashed border-cicBlue/40 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#dbeafe_100%)] p-6 shadow-sm transition hover:border-cicBlue hover:shadow-lg"
          >
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cicBlue">
                More Services
              </p>

              <h3 className="mb-2 text-2xl font-bold text-slate-900">
                Explore All {publishedServices.length} CIC Services
              </h3>

              <p className="text-sm leading-6 text-slate-600">
                View the full services directory and open the dedicated page for
                each CIC service.
              </p>
            </div>

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cicBlue">
              Go to full services page
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
      ) : null}
    </div>
  );
}

export default ServicesGrid;
