import { useParams } from "react-router-dom";
import ServicePageView from "../../components/ServicePageView";

function DynamicService() {
  const { slug = "" } = useParams();

  return <ServicePageView slug={slug} />;
}

export default DynamicService;
