import { useSiteContent } from "../context/SiteContentContext";
import { getServiceBySlug } from "../data/services";
import ServiceDetailLayout from "./ServiceDetailLayout";

function ServicePageView({ slug }) {
  const { services } = useSiteContent();
  const service = getServiceBySlug(services, slug);

  return <ServiceDetailLayout service={service} />;
}

export default ServicePageView;
