import { useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import { useSiteContent } from "../context/SiteContentContext";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

const formerTeamMemberNames = new Set(["Mr. Sumanta Bhattacharya"]);
const hiddenContactMemberNames = new Set(["Mr. Sumanta Bhattacharya"]);
const formerTeamMembers = [
  {
    name: "Sumanta Bhattacharya",
    designation: "Senior Accounts Officer",
    dateOfResignation: "2026-04-30",
  },
  {
    name: "Alokes Chattopadhyay",
    designation: "Deputy Chief System Manager",
    dateOfResignation: "2023-10-31",
  },
  {
    name: "Nanda Dulal Goswami",
    designation: "Junior Superintendent",
    dateOfResignation: "2015-01-31",
  },
  {
    name: "Nikhilesh Bhattacharya",
    designation: "Senior Assistant Engineer",
    dateOfResignation: "2015-01-31",
  },
  {
    name: "Dilip Kumar Nanda",
    designation: "Chief System Manager",
    dateOfResignation: "2014-08-31",
  },
  {
    name: "U Chandra Rao",
    designation: "Senior Attendant",
    dateOfResignation: "2014-05-31",
  },
  {
    name: "Bimal Kanti Dutta",
    designation: "Senior System Analyst",
    dateOfResignation: "2014-01-31",
  },
  {
    name: "Devshri Roy",
    designation: "Senior System Manager",
    dateOfResignation: "2011-07-08",
  },
  {
    name: "Bishnu Pada Bandoghati",
    designation: "Technical Superintendent",
    dateOfResignation: "2010-12-31",
  },
  {
    name: "Sushila Arjee",
    designation: "Senior Attendant",
    dateOfResignation: "2010-10-31",
  },
  {
    name: "Pramod Kumar Singh",
    designation: "Senior Network Engineer",
    dateOfResignation: "2010-03-24",
  },
  {
    name: "Sibendra Nath Bhattacharyya",
    designation: "Senior Technical Superintendent",
    dateOfResignation: "2010-01-31",
  },
  {
    name: "A Vadivel",
    designation: "Network Engineer",
    dateOfResignation: "2008-05-26",
  },
  {
    name: "Amit Kumar Pal",
    designation: "Senior Tech Asst (SG)",
    dateOfResignation: "2006-02-16",
  },
  {
    name: "Gopal Chandra Mazumder",
    designation: "Laboratory Attendant Gr-I",
    dateOfResignation: "2004-09-30",
  },
  {
    name: "Shyamaprasad Bandyopadhyay",
    designation: "Network Engineer",
    dateOfResignation: "2004-09-03",
  },
  {
    name: "Prachi Tiwari",
    designation: "Systems Analyst",
    dateOfResignation: "2003-09-02",
  },
  {
    name: "Nitya Nanda Das",
    designation: "Technical Assistant",
    dateOfResignation: "2002-07-31",
  },
  {
    name: "Churamani Hazra",
    designation: "Superintendent(Stores)",
    dateOfResignation: "2001-08-31",
  },
  {
    name: "Birendra Kumar Singh",
    designation: "Computer Network. Manager",
    dateOfResignation: "2001-07-14",
  },
  {
    name: "Santanu Chattopadhyay",
    designation: "Computer Network. Manager",
    dateOfResignation: "2000-05-19",
  },
  {
    name: "Timir Baran Mondal",
    designation: "Technical Assistant",
    dateOfResignation: "2000-02-24",
  },
  {
    name: "Rohil Muktibodh",
    designation: "Network Engineer",
    dateOfResignation: "1999-04-16",
  },
  {
    name: "Prithwish Kangsabanik",
    designation: "Programmer",
    dateOfResignation: "1998-03-24",
  },
  {
    name: "Dilip Narayan Bagchi",
    designation: "Technical Assistant",
    dateOfResignation: "1995-11-30",
  },
  {
    name: "Ram Chandra Kisku",
    designation: "Senior Mechanic",
    dateOfResignation: "1994-10-31",
  },
  {
    name: "Bishnu Pada Pathak",
    designation: "Assistant",
    dateOfResignation: "1992-02-29",
  },
  {
    name: "Ashis Kumar Maity",
    designation: "Engineer",
    dateOfResignation: "1991-10-31",
  },
];
const helpdeskTeamMembers = [
  "GOUR GOPAL PRADHAN",
  "RAJARSHI DUTTA GUPTA",
  "CHIRANJIT BISWAS",
  "VIJAY KUMAR SAW",
  "ARNAB MAITY",
  "ASISH MUKHOPADYAYA",
  "SUDARSHAN MAITY",
  "MILAN CHAKRABORTY",
  "PARTHA SARATHI BERA",
  "SANDIP SANTRA",
  "TOTAN DEY",
  "SOUVIK GIRI",
  "ASIT KUMAR GHOSH",
  "SUMANDEEP DAS",
  "PRASANTA GOLE",
  "SOUMEN SAMANTA",
  "SURAJIT PAUL",
  "SANJAY JANA",
  "NITYA NANDA NAG",
  "SAKIL SARKAR",
  "BIPUL SENI",
  "PALASH CHAKRABORTY",
];

function formatDisplayDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function TeamMemberCard({ member }) {
  const showContact = !hiddenContactMemberNames.has(member.name);

  return (
    <article className="border-t border-slate-200 pt-5">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          className="mb-4 h-28 w-28 rounded-2xl border border-slate-200 object-cover object-center shadow-sm"
        />
      ) : (
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-cicBlue">
          {getInitials(member.name)}
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-900">
        {member.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {member.role}
      </p>

      {showContact ? (
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        {member.phone ? (
          <div className="flex items-start gap-3">
            <Phone className="mt-1 h-4 w-4 flex-none text-cicBlue" />
            <span>{member.phone}</span>
          </div>
        ) : null}

        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            className="flex items-start gap-3 transition hover:text-cicBlue"
          >
            <Mail className="mt-1 h-4 w-4 flex-none text-cicBlue" />
            <span>{member.email}</span>
          </a>
        ) : null}
      </div>
      ) : null}
    </article>
  );
}

function Team() {
  const { teams } = useSiteContent();
  const [searchQuery, setSearchQuery] = useState("");
  const [head, ...members] = teams;
  const otherMembers = members.filter(
    (member) => !formerTeamMemberNames.has(member.name),
  );
  const currentMembers = head ? [head, ...otherMembers] : otherMembers;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleCurrentMembers = normalizedSearchQuery
    ? currentMembers.filter((member) =>
        [member.name, member.role, member.phone, member.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchQuery),
      )
    : currentMembers;

  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <section className="mb-10">
          <label className="relative block max-w-xl">
            <span className="sr-only">Search team members</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search team members"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cicBlue focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Team Members</h2>
              <p className="mt-2 text-slate-600">
                Engineering, software, systems, networking, and administrative
                members of CIC.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {currentMembers.length} members
            </div>
          </div>

          {visibleCurrentMembers.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleCurrentMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          ) : normalizedSearchQuery ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No current team members match your search.
            </div>
          ) : null}
        </section>

        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-slate-900">Helpdesk Team</h2>
              <p className="mt-2 text-slate-600">
                Support personnel assisting CIC operations and service delivery.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {helpdeskTeamMembers.length} members
            </div>
          </div>

          <div className="grid overflow-hidden border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {helpdeskTeamMembers.map((member) => (
              <div
                key={member}
                className="border-b border-r border-slate-200 px-4 py-3 text-sm font-semibold uppercase tracking-[0.04em] text-slate-800"
              >
                {member}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-slate-900">
                Former Team Members
              </h2>
              <p className="mt-2 text-slate-600">
                Members who have served CIC and have since retired or moved on
                from the office.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {formerTeamMembers.length} members
            </div>
          </div>

          <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[1.1fr_1fr_220px] bg-slate-950 px-5 py-3 text-sm font-bold text-white md:grid">
              <span>Name</span>
              <span>Last Designation</span>
              <span>Date of Resignation</span>
            </div>

            <div className="divide-y divide-slate-200">
              {formerTeamMembers.map((member) => (
                <article
                  key={`${member.name}-${member.dateOfResignation}`}
                  className="grid gap-2 px-5 py-4 md:grid-cols-[1.1fr_1fr_220px] md:items-center"
                >
                  <h3 className="font-semibold text-slate-950">{member.name}</h3>
                  <p className="text-sm text-slate-600">{member.designation}</p>
                  <p className="text-sm font-medium text-slate-700">
                    <span className="md:hidden">Relieved: </span>
                    {formatDisplayDate(member.dateOfResignation)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Team;
