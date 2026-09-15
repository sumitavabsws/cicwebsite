import { useMemo } from "react";
import ServiceDetailLayout from "../../components/ServiceDetailLayout";
import { useSiteContent } from "../../context/SiteContentContext";
import { getServiceBySlug } from "../../data/services";

function publishedItem(item) {
  if (!item || item.status === "draft") return null;
  if (typeof item === "string") return item;

  return {
    ...item,
    children: Array.isArray(item.children)
      ? item.children.map(publishedItem).filter(Boolean)
      : item.children,
  };
}

function SoftwareSupport() {
  const { services } = useSiteContent();
  const service = getServiceBySlug(services, "software-support");
  const publishedService = useMemo(() => {
    if (!service) return service;
    return {
      ...service,
      details: (service.details ?? []).map((section) => ({
        ...section,
        items: (section.items ?? []).map(publishedItem).filter(Boolean),
      })),
    };
  }, [service]);

  return <ServiceDetailLayout service={publishedService} />;
}

export default SoftwareSupport;
