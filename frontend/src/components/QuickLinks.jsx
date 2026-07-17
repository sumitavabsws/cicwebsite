import { Globe, Mail, Shield, Server, Laptop } from "lucide-react";

const links = [
  { title: "ERP", icon: <Server /> },
  { title: "Webmail", icon: <Mail /> },
  { title: "VPN", icon: <Shield /> },
  { title: "Internet Access", icon: <Globe /> },
  { title: "Software", icon: <Laptop /> },
];

function QuickLinks() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Quick Access</h2>

        <div className="grid md:grid-cols-5 gap-6">
          {links.map((item, index) => (
            <div
              key={index}
              className="p-6 border rounded-lg text-center hover:shadow-md transition"
            >
              <div className="flex justify-center mb-3">{item.icon}</div>

              <p>{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QuickLinks;
