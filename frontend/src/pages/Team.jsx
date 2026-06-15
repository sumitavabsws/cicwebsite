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

function TeamMemberCard({ member }) {
  const showContact = !hiddenContactMemberNames.has(member.name);

  return (
    <article className="border-t border-slate-200 pt-5">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          className="mb-4 h-24 w-20 rounded-2xl border border-slate-200 object-cover object-top shadow-sm"
        />
      ) : (
        <div className="mb-4 flex h-24 w-20 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-cicBlue">
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
  const formerMembers = members.filter((member) =>
    formerTeamMemberNames.has(member.name),
  );
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
  const visibleHead =
    head && visibleCurrentMembers.some((member) => member.id === head.id)
      ? head
      : null;
  const visibleOtherMembers = visibleCurrentMembers.filter(
    (member) => member.id !== head?.id,
  );

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

        {visibleHead ? (
          <section>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                {visibleHead.photo ? (
                  <img
                    src={visibleHead.photo}
                    alt={visibleHead.name}
                    className="h-32 w-28 rounded-3xl border border-slate-200 object-cover object-top shadow-sm"
                  />
                ) : (
                  <div className="flex h-32 w-28 items-center justify-center rounded-3xl bg-blue-100 text-2xl font-bold text-cicBlue shadow-sm">
                    {getInitials(visibleHead.name)}
                  </div>
                )}

                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {visibleHead.name}
                  </h2>
                  <p className="mt-2 text-lg text-slate-600">{visibleHead.role}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {visibleHead.phone ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                    <Phone className="h-4 w-4 text-cicBlue" />
                    {visibleHead.phone}
                  </div>
                ) : null}

                {visibleHead.email ? (
                  <a
                    href={`mailto:${visibleHead.email}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 transition hover:border-cicBlue hover:text-cicBlue"
                  >
                    <Mail className="h-4 w-4 text-cicBlue" />
                    {visibleHead.email}
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Team Members</h2>
              <p className="mt-2 text-slate-600">
                Engineering, software, systems, networking, and administrative
                members of CIC.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {visibleCurrentMembers.length} members
            </div>
          </div>

          {visibleOtherMembers.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleOtherMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          ) : normalizedSearchQuery && !visibleHead ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No current team members match your search.
            </div>
          ) : null}
        </section>

        {formerMembers.length ? (
          <section className="mt-16 border-t border-slate-200 pt-10">
            <div className="mb-6 max-w-3xl">
              <h2 className="text-2xl font-bold text-slate-900">
                Former Team Members
              </h2>
              <p className="mt-2 text-slate-600">
                Members who have served CIC and have since retired or moved on
                from the office.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {formerMembers.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default Team;
