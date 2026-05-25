import { ExternalLink, FileText } from "lucide-react";

const forms = [
  {
    label: "Internet access request form for event",
    url: "http://swrepo.iitkgp.ac.in/wifi/Form-internet-Events.pdf",
  },
  {
    label: "Internet access request form for guest",
    url: "http://swrepo.iitkgp.ac.in/wifi/Form-internet-Guest.pdf",
  },
  {
    label: "Internet access request form for officials",
    url: "http://swrepo.iitkgp.ac.in/wifi/Form-internet-Officials.pdf",
  },
  {
    label: "Wired only Internet access request form for officials",
    url: "http://swrepo.iitkgp.ac.in/wifi/Form-WIRED_only_internet-officials.pdf",
  },
  {
    label: "Private (static) IP request form",
    url: "http://swrepo.iitkgp.ac.in/wifi/Static-IP_final.pdf",
  },
  {
    label: "Lab booking request form",
    url: "http://swrepo.iitkgp.ac.in/Forms/PCLab-Booking-Form.pdf",
  },
  {
    label: "VPN access request form",
    url: "http://swrepo.iitkgp.ac.in/Forms/VPN-Access.pdf",
  },
  {
    label: "Remote access to outside IITKGP request form",
    url: "http://swrepo.iitkgp.ac.in/Forms/NAT-Access.pdf",
  },
  {
    label: "Undertaking for Website Hosting form",
    url: "http://swrepo.iitkgp.ac.in/Forms/Undertaking for Website Hosting.pdf",
  },
  {
    label:
      "Undertaking Regarding Use of Campus Licensed MS Office in Apple Mac (Students Only)",
    url: "http://swrepo.iitkgp.ac.in/Forms/Undertaking for MS Office in Apple Mac (Students Only).pdf",
  },
];

function FormsDownloads() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 2xl:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cicBlue">
          Forms & Downloads
        </p>

        <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-600">
          Access CIC service request forms and related downloadable documents.
        </p>

        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50">
          {forms.map((form) => (
            <a
              key={form.url}
              href={form.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-100 text-cicBlue">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="font-semibold text-slate-900 group-hover:text-cicBlue">
                  {form.label}
                </span>
              </span>
              <ExternalLink className="h-4 w-4 flex-none text-cicBlue" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FormsDownloads;
