import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import AdminAccessGate from "./components/AdminAccessGate";
import Home from "./pages/Home";
import Infrastructure from "./pages/Infrastructure";
import Services from "./pages/Services";
import CyberSecurity from "./pages/CyberSecurity";
import DocumentViewer from "./pages/DocumentViewer";
import FormsDownloads from "./pages/FormsDownloads";
import Notices from "./pages/Notices";
import Policies from "./pages/Policies";
import Team from "./pages/Team";
import AdminPanel from "./pages/AdminPanel";
import CheckMyIp from "./pages/CheckMyIp";
import DynamicService from "./pages/services/DynamicService";
import InternetAccess from "./pages/services/InternetAccess";
import Labs from "./pages/services/Labs";
import MailAccess from "./pages/services/MailAccess";
import MeghamalaRequest from "./pages/services/MeghamalaRequest";
import Ntp from "./pages/services/Ntp";
import SoftwareSupport from "./pages/services/SoftwareSupport";
import Vpn from "./pages/services/Vpn";
import WiFiAuthentication from "./pages/services/WiFiAuthentication";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/document" element={<DocumentViewer />} />
        <Route path="/check-my-ip" element={<CheckMyIp />} />
        <Route path="/forms-downloads" element={<FormsDownloads />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/internet-access" element={<InternetAccess />} />
          <Route
            path="/services/wifi-authentication"
            element={<WiFiAuthentication />}
          />
          <Route path="/services/mail-access" element={<MailAccess />} />
          <Route path="/services/labs" element={<Labs />} />
          <Route
            path="/services/software-support"
            element={<SoftwareSupport />}
          />
          <Route path="/services/vpn" element={<Vpn />} />
          <Route path="/services/ntp" element={<Ntp />} />
          <Route path="/services/meghamala/request" element={<MeghamalaRequest />} />
          <Route path="/services/:slug" element={<DynamicService />} />
          <Route path="/team" element={<Team />} />
          <Route path="/cyber-security" element={<CyberSecurity />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/notices" element={<Notices />} />
          <Route
            path="/admin/login"
            element={
              <AdminAccessGate>
                <AdminPanel />
              </AdminAccessGate>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminAccessGate>
                <AdminPanel />
              </AdminAccessGate>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
