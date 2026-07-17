import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { getDocumentViewerUrl } from "../../utils/references";

const vmTypes = {
  IITKGP_regular: ["1", "2", "3"],
  IITKGP_large: ["1", "2"],
  IITKGP_xlarge: ["1"],
};

const operatingSystems = ["Ubuntu 14.04", "Centos 7", "Fedora 20"];

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getMaxExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 60);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

function getTodayDisplayDate() {
  return formatDisplayDate(new Date().toISOString().slice(0, 10));
}

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value, maxLength) {
  const words = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

function createMeghamalaRequestPdf(formValues) {
  const commands = [];

  const add = (command) => {
    commands.push(command);
  };

  const text = (x, y, value, options = {}) => {
    const font = options.bold ? "F2" : "F1";
    const size = options.size ?? 10;
    add(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
  };

  const line = (x1, y1, x2, y2) => {
    add(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const rect = (x, y, width, height) => {
    add(`${x} ${y} ${width} ${height} re S`);
  };

  const wrappedText = (
    x,
    y,
    value,
    maxLength,
    lineHeight = 13,
    options = {},
  ) => {
    let nextY = y;

    wrapText(value, maxLength).forEach((lineText) => {
      text(x, nextY, lineText, options);
      nextY -= lineHeight;
    });

    return nextY;
  };

  add("0.75 w");
  text(86, 777, "IIT", { bold: true, size: 16 });
  text(72, 763, "Kharagpur", { size: 8 });
  rect(205, 760, 220, 24);
  text(238, 767, "Meghamala VM Request Form", { bold: true, size: 12 });
  text(438, 768, `Date : ${getTodayDisplayDate()}`, { bold: true, size: 12 });

  let y = 730;
  const fieldRows = [
    ["Name of faculty", formValues.name],
    ["Department", formValues.dept],
    ["Designation", formValues.designation],
    ["E-mail", formValues.email],
    ["Phone", formValues.phone],
    ["Purpose", formValues.purpose],
    ["VM Name", formValues.vmName],
    ["VM Type", formValues.vmType],
    ["Number of VMs", formValues.noOfVms],
    ["Operating System", formValues.os],
    ["Persistent storage of 20 GB required ?", formValues.persistent],
    ["VM expires after", formatDisplayDate(formValues.expiryDate)],
  ];

  fieldRows.forEach(([label, value]) => {
    y = wrappedText(78, y, `${label} : ${value}`, 84);
    y -= 6;
  });

  y -= 4;
  y = wrappedText(
    78,
    y,
    "The requested VM(s) will be used only for academic purposes. Neither the Meghamala team nor IIT Kharagpur is responsible for the contents of my VM(s). I understand that the presence of inappropriate material in the VM(s) may lead to their immediate termination.",
    100,
    12,
  );

  const signatureTop = y - 8;
  rect(330, signatureTop - 58, 190, 58);
  text(352, signatureTop - 76, "Signature of requesting faculty and date", {
    size: 9,
  });

  const subjectY = signatureTop - 105;
  text(78, subjectY, "SUBJECT : MEGHAMALA VM REQUEST", { size: 10 });
  text(78, subjectY - 28, "To,", { size: 10 });
  text(78, subjectY - 56, "Prof. Shamik Sural,", { size: 10 });
  text(78, subjectY - 70, "School of Information Technology, IIT Kharagpur", {
    size: 10,
  });
  text(78, subjectY - 84, "Phone:82330", { size: 10 });
  text(78, subjectY - 114, "(or)", { size: 10 });
  text(78, subjectY - 146, "Prof. Soumya K. Ghosh,", { size: 10 });
  text(78, subjectY - 160, "School of Information Technology, IIT Kharagpur", {
    size: 10,
  });
  text(78, subjectY - 174, "Phone:82332", { size: 10 });
  text(252, 34, "Meghamala - the IIT Kharagpur cloud", {
    size: 7,
  });

  const content = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    `<< /Title (${escapePdfText("Meghamala VM Request Form")}) /Creator (${escapePdfText("CIC Website")}) >>`,
  ];
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(chunks.join("").length);
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = chunks.join("").length;
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");

  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });

  chunks.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob(chunks, { type: "application/pdf" });
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cicBlue focus:ring-4 focus:ring-blue-100"
    />
  );
}

function MeghamalaRequest() {
  const [vmType, setVmType] = useState("IITKGP_regular");
  const [submitted, setSubmitted] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState("");
  const vmCountOptions = vmTypes[vmType];
  const minDate = useMemo(getTomorrowDate, []);
  const maxDate = useMemo(getMaxExpiryDate, []);

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formValues = Object.fromEntries(formData.entries());
    const pdfBlob = createMeghamalaRequestPdf(formValues);
    const pdfUrl = URL.createObjectURL(pdfBlob);

    if (generatedPdfUrl) {
      URL.revokeObjectURL(generatedPdfUrl);
    }

    setGeneratedPdfUrl(pdfUrl);
    setSubmitted(true);
    window.open(
      getDocumentViewerUrl(pdfUrl, "Meghamala VM Request Form"),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <Link
          to="/services/meghamala"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-cicBlue transition hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Meghamala
        </Link>

        <section className="grid gap-12 border-b border-slate-200 pb-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Meghamala
            </p>
            <h1 className="text-4xl font-black text-slate-900 md:text-5xl">
              VMs4U Request Form
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Submit the details required to request a Meghamala virtual machine
              for academic or research use. VM expiry must be within 60 days.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-7 text-slate-700">
            Please note that VMs should be used only for academic purposes.
            Neither the Meghamala team nor IIT Kharagpur is responsible for the
            contents of your VMs. Inappropriate material may lead to immediate
            termination of the VM.
          </div>
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Name of faculty">
                <TextInput name="name" required />
              </FormField>
              <FormField label="Department">
                <TextInput name="dept" required />
              </FormField>
              <FormField label="Designation">
                <TextInput name="designation" required />
              </FormField>
              <FormField label="Phone/Mobile no.">
                <TextInput name="phone" required />
              </FormField>
              <FormField label="E-mail">
                <TextInput name="email" type="email" required />
              </FormField>
              <FormField label="Preferred VM Name">
                <TextInput name="vmName" required />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField label="Purpose">
                <textarea
                  name="purpose"
                  required
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cicBlue focus:ring-4 focus:ring-blue-100"
                />
              </FormField>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormField label="VM Type">
                <div className="flex flex-wrap gap-3">
                  {Object.keys(vmTypes).map((type) => (
                    <label
                      key={type}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name="vmType"
                        value={type}
                        checked={vmType === type}
                        onChange={() => setVmType(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </FormField>

              <FormField label="Number of VMs">
                <select
                  name="noOfVms"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cicBlue focus:ring-4 focus:ring-blue-100"
                >
                  {vmCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Operating system">
                <select
                  name="os"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cicBlue focus:ring-4 focus:ring-blue-100"
                >
                  {operatingSystems.map((os) => (
                    <option key={os} value={os}>
                      {os}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="VM required till">
                <TextInput
                  id="date"
                  name="expiryDate"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  required
                />
              </FormField>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-slate-700">
                Persistent storage of 20 GB required
              </legend>
              <div className="mt-2 flex gap-3">
                {["Yes", "No"].map((value) => (
                  <label
                    key={value}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="persistent"
                      value={value}
                      defaultChecked={value === "No"}
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>

            {submitted ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                Request PDF generated. It has opened in a new tab for download
                or printing.
              </div>
            ) : null}

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cicBlue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
            >
              <FileText className="h-4 w-4" />
              Submit request
            </button>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <h2 className="text-2xl font-bold text-slate-900">
              Steps to follow
            </h2>
            {[
              [
                "Fill out this form",
                "Fill out the form on the left and click Submit.",
              ],
              [
                "Get hard copy signed",
                "Print the generated PDF and sign it. You may save a copy for future reference.",
              ],
              [
                "Submit signed hard copy",
                "Submit the signed hard copy to the professor-in-charge, Meghamala.",
              ],
            ].map(([title, text], index) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-cicBlue">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default MeghamalaRequest;
