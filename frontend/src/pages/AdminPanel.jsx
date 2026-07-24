import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useSiteContent } from "../context/SiteContentContext";
import { serviceIconOptions } from "../data/services";
import { apiRequest, uploadFile } from "../lib/api";

const MAX_TEAM_PHOTO_SIZE_BYTES = Number(
  import.meta.env.VITE_MAX_TEAM_PHOTO_SIZE_BYTES ?? 200 * 1024,
);

function createId(prefix = "entry") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatJson(value) {
  return JSON.stringify(value ?? [], null, 2);
}

function createEmptyUpdateDraft(type = "pdf") {
  return {
    id: "",
    title: "",
    date: "",
    description: "",
    reference: {
      type,
      url: "",
      label: "",
    },
  };
}

function formatNoticeDateFromIso(value) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}-${month}-${year}` : "";
}

function formatNoticeDateToIso(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return "";

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  return date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
    ? `${year}-${month}-${day}`
    : "";
}

function createServiceDraft() {
  return {
    id: "",
    slug: "",
    title: "",
    description: "",
    linkLabel: "Explore service",
    iconKey: serviceIconOptions[0],
    eyebrow: "CIC Service",
    summary: "",
    detailsJson: "[]",
    instructionsJson: "[]",
    documentsJson: "[]",
    importantNotesText: "",
    contact: {
      name: "",
      role: "",
      email: "",
      phone: "",
      note: "",
    },
  };
}

function createEmptyTeamDraft() {
  return {
    id: "",
    name: "",
    role: "",
    phone: "",
    email: "",
    photo: "",
    category: "current",
    formerDate: "",
    showContact: true,
  };
}

function createEmptyTenderDraft() {
  return {
    id: "",
    title: "",
    refNo: "",
    startDate: "",
    endDate: "",
    bidOpeningDate: "",
    corrigendumDetails: "",
    pdfUrl: "",
    pdfLabel: "View Tender PDF",
  };
}

function createServiceDraftFromService(service) {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    description: service.description,
    linkLabel: service.linkLabel,
    iconKey: service.iconKey,
    eyebrow: service.eyebrow,
    summary: service.summary,
    detailsJson: formatJson(service.details),
    instructionsJson: formatJson(service.instructions),
    documentsJson: formatJson(service.documents),
    importantNotesText: service.importantNotes.join("\n"),
    contact: {
      name: service.contact.name,
      role: service.contact.role,
      email: service.contact.email,
      phone: service.contact.phone,
      note: service.contact.note,
    },
  };
}

function createTeamDraftFromItem(team) {
  return {
    id: team.id,
    name: team.name,
    role: team.role,
    phone: team.phone,
    email: team.email,
    photo: team.photo ?? "",
    category: team.category ?? "current",
    formerDate: team.formerDate ?? "",
    showContact: team.showContact !== false,
  };
}

function createTenderDraftFromItem(tender) {
  return {
    id: tender.id ?? "",
    title: tender.title ?? "",
    refNo: tender.refNo ?? "",
    startDate: tender.startDate ?? "",
    endDate: tender.endDate ?? "",
    bidOpeningDate: tender.bidOpeningDate ?? "",
    corrigendumDetails: tender.corrigendumDetails ?? "",
    pdfUrl: tender.pdfUrl ?? "",
    pdfLabel: tender.pdfLabel ?? "View Tender PDF",
  };
}

function createUpdateDraftFromItem(item) {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    description: item.description,
    reference: {
      type: item.reference?.type ?? "pdf",
      url: item.reference?.url ?? "",
      label: item.reference?.label ?? "",
    },
  };
}

function parseJsonField(value, label) {
  try {
    const parsedValue = JSON.parse(value || "[]");

    if (!Array.isArray(parsedValue)) {
      throw new Error(`${label} must be an array.`);
    }

    return parsedValue;
  } catch (error) {
    throw new Error(`${label} must be valid JSON array content.`);
  }
}

function AdminShell({ title, description, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function ContentList({
  title,
  description,
  items,
  getMeta,
  onCreate,
  onEdit,
  onDelete,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search directory",
  scrollable = false,
}) {
  return (
    <div
      className={
        scrollable
          ? "flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 xl:h-[calc(100vh-12rem)]"
          : "rounded-3xl border border-slate-200 bg-slate-50 p-5"
      }
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-cicBlue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {onSearchChange ? (
        <label className="relative mb-4 block">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cicBlue focus:ring-4 focus:ring-blue-100"
          />
        </label>
      ) : null}

      <div
        className={
          scrollable
            ? "min-h-0 flex-1 space-y-3 overflow-y-auto pr-2"
            : "space-y-3"
        }
      >
        {items.length ? (
          items.map((item) => {
            const meta = getMeta(item);

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900">
                      {meta.title}
                    </h4>
                    {meta.subtitle ? (
                      <p className="mt-1 text-sm text-slate-500">
                        {meta.subtitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-cicBlue hover:text-cicBlue"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {meta.body ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {meta.body}
                  </p>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No items yet.
          </div>
        )}
      </div>
    </div>
  );
}

function NoticeEventManager({
  label,
  items,
  setItems,
  draft,
  setDraft,
  setMessage,
}) {
  const handleSave = async (event) => {
    event.preventDefault();

    if (
      !draft.title.trim() ||
      !draft.date.trim() ||
      (label !== "Notice" && !draft.reference.url.trim())
    ) {
      setMessage({
        type: "error",
        text:
          label === "Notice"
            ? "Notice requires a title and date."
            : `${label} requires a title, date, and reference URL.`,
      });
      return;
    }

    if (label === "Notice" && !formatNoticeDateToIso(draft.date)) {
      setMessage({
        type: "error",
        text: "Notice date must be a valid date in dd-mm-yyyy format.",
      });
      return;
    }

    const nextEntry = {
      id: draft.id || createId(label.toLowerCase()),
      title: draft.title.trim(),
      date: draft.date.trim(),
      description: draft.description.trim(),
      reference: {
        type: draft.reference.type === "html" ? "html" : "pdf",
        url: draft.reference.url.trim(),
        label: draft.reference.label.trim() || "Open reference",
      },
    };

    try {
      await setItems((previousItems) => {
        const existingIndex = previousItems.findIndex(
          (item) => item.id === nextEntry.id,
        );

        if (existingIndex >= 0) {
          const nextItems = [...previousItems];
          nextItems[existingIndex] = nextEntry;
          return nextItems;
        }

        return [nextEntry, ...previousItems];
      });

      setDraft(createEmptyUpdateDraft());
      setMessage({
        type: "success",
        text: `${label} saved successfully.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  const handleEdit = (item) => {
    setDraft(createUpdateDraftFromItem(item));
    setMessage(null);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    try {
      await setItems((previousItems) =>
        previousItems.filter((entry) => entry.id !== item.id),
      );
      setDraft((currentDraft) =>
        currentDraft.id === item.id ? createEmptyUpdateDraft() : currentDraft,
      );
      setMessage({
        type: "success",
        text: `${label} deleted.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr]">
      <ContentList
        title={`${label} Entries`}
        description={`Edit existing ${label.toLowerCase()} items or publish a new one.`}
        items={items}
        getMeta={(item) => ({
          title: item.title,
          subtitle: item.date,
          body: item.description,
        })}
        onCreate={() => {
          setDraft(createEmptyUpdateDraft());
          setMessage(null);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <form
        onSubmit={handleSave}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {draft.id ? `Update ${label}` : `Publish ${label}`}
          </h3>

          {draft.id ? (
            <button
              type="button"
              onClick={() => setDraft(createEmptyUpdateDraft())}
              className="text-sm font-semibold text-cicBlue"
            >
              Clear form
            </button>
          ) : null}
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Title
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                title: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Date
          {label === "Notice" ? (
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={draft.date}
                placeholder="dd-mm-yyyy"
                maxLength={10}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    date: event.target.value.replace(/[^\d-]/g, ""),
                  }))
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
                aria-label="Notice date in dd-mm-yyyy format"
              />
              <label className="relative inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-cicBlue transition hover:border-cicBlue hover:bg-blue-50">
                <CalendarDays className="h-5 w-5" />
                <span className="sr-only">Select notice date from calendar</span>
                <input
                  type="date"
                  value={formatNoticeDateToIso(draft.date)}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      date: formatNoticeDateFromIso(event.target.value),
                    }))
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Select notice date from calendar"
                />
              </label>
            </div>
          ) : (
            <input
              value={draft.date}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  date: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          )}
          {label === "Notice" ? (
            <span className="text-xs font-normal text-slate-500">
              Type the date as dd-mm-yyyy or select it from the calendar.
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Description
          <textarea
            rows="4"
            value={draft.description}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                description: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Reference type
            <select
              value={draft.reference.type}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  reference: {
                    ...currentDraft.reference,
                    type: event.target.value,
                  },
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            >
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Reference label
            <input
              value={draft.reference.label}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  reference: {
                    ...currentDraft.reference,
                    label: event.target.value,
                  },
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Reference URL {label === "Notice" ? "(optional)" : ""}
          <input
            value={draft.reference.url}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                reference: {
                  ...currentDraft.reference,
                  url: event.target.value,
                },
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-cicBlue px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
        >
          {draft.id ? "Update entry" : "Publish entry"}
        </button>
      </form>
    </div>
  );
}

function ServiceManager({
  services,
  setServices,
  draft,
  setDraft,
  setMessage,
}) {
  const handleSave = async (event) => {
    event.preventDefault();

    const title = draft.title.trim();
    const slug = slugify(draft.slug || title);

    if (!title || !slug) {
      setMessage({
        type: "error",
        text: "Service title and slug are required.",
      });
      return;
    }

    let details;
    let instructions;
    let documents;

    try {
      details = parseJsonField(draft.detailsJson, "Details");
      instructions = parseJsonField(draft.instructionsJson, "Instructions");
      documents = parseJsonField(draft.documentsJson, "Documents");
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
      return;
    }

    const nextService = {
      id: draft.id || createId("service"),
      slug,
      title,
      description: draft.description.trim(),
      linkLabel: draft.linkLabel.trim() || "Explore service",
      iconKey: draft.iconKey,
      eyebrow: draft.eyebrow.trim() || "CIC Service",
      summary: draft.summary.trim(),
      details,
      instructions,
      documents,
      importantNotes: draft.importantNotesText
        .split(/\r?\n/)
        .map((note) => note.trim())
        .filter(Boolean),
      contact: {
        name: draft.contact.name.trim(),
        role: draft.contact.role.trim(),
        email: draft.contact.email.trim(),
        phone: draft.contact.phone.trim(),
        note: draft.contact.note.trim(),
      },
    };

    const duplicateSlug = services.find(
      (service) =>
        service.slug === nextService.slug && service.id !== nextService.id,
    );

    if (duplicateSlug) {
      setMessage({
        type: "error",
        text: "Another service already uses that slug.",
      });
      return;
    }

    try {
      await setServices((previousServices) => {
        const existingIndex = previousServices.findIndex(
          (service) => service.id === nextService.id,
        );

        if (existingIndex >= 0) {
          const nextServices = [...previousServices];
          nextServices[existingIndex] = nextService;
          return nextServices;
        }

        return [...previousServices, nextService];
      });

      setDraft(createServiceDraft());
      setMessage({
        type: "success",
        text: "Service saved successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Delete the "${service.title}" service?`)) {
      return;
    }

    try {
      await setServices((previousServices) =>
        previousServices.filter((entry) => entry.id !== service.id),
      );
      setDraft((currentDraft) =>
        currentDraft.id === service.id ? createServiceDraft() : currentDraft,
      );
      setMessage({
        type: "success",
        text: "Service deleted.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
      <ContentList
        title="Services"
        description="Manage existing services or create a brand new one."
        items={services}
        getMeta={(service) => ({
          title: service.title,
          subtitle: `/services/${service.slug}`,
          body: service.description,
        })}
        onCreate={() => {
          setDraft(createServiceDraft());
          setMessage(null);
        }}
        onEdit={(service) => {
          setDraft(createServiceDraftFromService(service));
          setMessage(null);
        }}
        onDelete={handleDelete}
      />

      <form
        onSubmit={handleSave}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {draft.id ? "Update Service" : "Add Service"}
          </h3>

          {draft.id ? (
            <button
              type="button"
              onClick={() => setDraft(createServiceDraft())}
              className="text-sm font-semibold text-cicBlue"
            >
              Clear form
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Title
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  title: event.target.value,
                  slug: currentDraft.id
                    ? currentDraft.slug
                    : slugify(event.target.value),
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Slug
            <input
              value={draft.slug}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  slug: slugify(event.target.value),
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Short description
            <input
              value={draft.description}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  description: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Icon
            <select
              value={draft.iconKey}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  iconKey: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            >
              {serviceIconOptions.map((iconKey) => (
                <option key={iconKey} value={iconKey}>
                  {iconKey}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Eyebrow
            <input
              value={draft.eyebrow}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  eyebrow: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Card link label
            <input
              value={draft.linkLabel}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  linkLabel: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Summary
          <textarea
            rows="4"
            value={draft.summary}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                summary: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Details JSON
          <textarea
            rows="8"
            value={draft.detailsJson}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                detailsJson: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-cicBlue"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Instructions JSON
          <textarea
            rows="8"
            value={draft.instructionsJson}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                instructionsJson: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-cicBlue"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Documents JSON
          <textarea
            rows="8"
            value={draft.documentsJson}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                documentsJson: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-cicBlue"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Important notes
          <textarea
            rows="5"
            value={draft.importantNotesText}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                importantNotesText: event.target.value,
              }))
            }
            placeholder="One note per line"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Contact name
            <input
              value={draft.contact.name}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  contact: {
                    ...currentDraft.contact,
                    name: event.target.value,
                  },
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Contact role
            <input
              value={draft.contact.role}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  contact: {
                    ...currentDraft.contact,
                    role: event.target.value,
                  },
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Contact email
            <input
              value={draft.contact.email}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  contact: {
                    ...currentDraft.contact,
                    email: event.target.value,
                  },
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Contact phone
            <input
              value={draft.contact.phone}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  contact: {
                    ...currentDraft.contact,
                    phone: event.target.value,
                  },
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Contact note
          <textarea
            rows="4"
            value={draft.contact.note}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                contact: {
                  ...currentDraft.contact,
                  note: event.target.value,
                },
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-cicBlue px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
        >
          {draft.id ? "Update service" : "Add service"}
        </button>
      </form>
    </div>
  );
}

function TeamManager({
  teams,
  setTeams,
  draft,
  setDraft,
  setMessage,
  adminToken,
}) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const normalizedTeamSearch = teamSearch.trim().toLowerCase();
  const visibleTeams = normalizedTeamSearch
    ? teams.filter((teamMember) =>
        [
          teamMember.name,
          teamMember.role,
          teamMember.phone,
          teamMember.email,
          teamMember.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedTeamSearch),
      )
    : teams;
  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please upload a valid image file for the team photo.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_TEAM_PHOTO_SIZE_BYTES) {
      setMessage({
        type: "error",
        text: `Team photo must be ${MAX_TEAM_PHOTO_SIZE_BYTES / 1024} KB or smaller.`,
      });
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const response = await uploadFile(
        "/uploads/team-photo",
        file,
        adminToken,
      );
      setDraft((currentDraft) => ({
        ...currentDraft,
        photo: response.url,
      }));
      setMessage(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!draft.name.trim() || !draft.role.trim()) {
      setMessage({
        type: "error",
        text: "Team member name and role are required.",
      });
      return;
    }

    const nextTeamMember = {
      id: draft.id || createId("team"),
      name: draft.name.trim(),
      role: draft.role.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      photo: draft.photo ?? "",
      category: draft.category,
      formerDate: draft.category === "former" ? draft.formerDate : "",
      showContact: draft.showContact,
    };

    try {
      setSaving(true);
      await setTeams((previousTeams) => {
        const existingIndex = previousTeams.findIndex(
          (teamMember) => teamMember.id === nextTeamMember.id,
        );

        if (existingIndex >= 0) {
          const nextTeams = [...previousTeams];
          nextTeams[existingIndex] = nextTeamMember;
          return nextTeams;
        }

        return [...previousTeams, nextTeamMember];
      });

      setDraft(createEmptyTeamDraft());
      setMessage({
        type: "success",
        text: "Team member saved successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teamMember) => {
    if (!window.confirm(`Delete "${teamMember.name}" from the team list?`)) {
      return;
    }

    try {
      await setTeams((previousTeams) =>
        previousTeams.filter((entry) => entry.id !== teamMember.id),
      );
      setDraft((currentDraft) =>
        currentDraft.id === teamMember.id
          ? createEmptyTeamDraft()
          : currentDraft,
      );
      setMessage({
        type: "success",
        text: "Team member deleted.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <ContentList
        title="Team directory"
        description="Add people, update their details, or move them between the public directory groups."
        items={visibleTeams}
        searchValue={teamSearch}
        onSearchChange={setTeamSearch}
        searchPlaceholder="Search name, role, contact, or status"
        scrollable
        getMeta={(teamMember) => ({
          title: teamMember.name,
          subtitle: `${teamMember.role} · ${
            teamMember.category === "former"
              ? "Former employee"
              : teamMember.category === "helpdesk"
                ? "Helpdesk team"
                : "Current team"
          }`,
          body: [
            teamMember.showContact ? teamMember.phone : "",
            teamMember.showContact ? teamMember.email : "",
          ]
            .filter(Boolean)
            .join(" | "),
        })}
        onCreate={() => {
          setDraft(createEmptyTeamDraft());
          setMessage(null);
        }}
        onEdit={(teamMember) => {
          setDraft(createTeamDraftFromItem(teamMember));
          setMessage(null);
        }}
        onDelete={handleDelete}
      />

      <form
        onSubmit={handleSave}
        className="grid h-fit self-start content-start gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {draft.id ? "Update Team Member" : "Add Team Member"}
          </h3>

          <button
            type="button"
            onClick={() => setDraft(createEmptyTeamDraft())}
            className="text-sm font-semibold text-cicBlue"
          >
            Clear form
          </button>
        </div>

        <p className="-mt-3 text-sm leading-6 text-slate-600">
          A member remains in the same record when moved to another directory
          group.
        </p>

        <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-bold text-slate-900">
            Profile
          </legend>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Name
            <input
              required
              autoComplete="name"
              value={draft.name}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  name: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Role
            <input
              required
              value={draft.role}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  role: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-bold text-slate-900">
            Directory placement
          </legend>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Directory status
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  category: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            >
              <option value="current">Current team member</option>
              <option value="former">Former employee</option>
              <option value="helpdesk">Helpdesk team</option>
            </select>
          </label>

          {draft.category === "former" ? (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Date relieved
              <input
                type="date"
                value={draft.formerDate}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    formerDate: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
              />
            </label>
          ) : null}
        </fieldset>

        <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-bold text-slate-900">
            Public contact details
          </legend>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone
            <input
              type="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  phone: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  email: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.showContact}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  showContact: event.target.checked,
                }))
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cicBlue focus:ring-cicBlue"
            />
            <span>
              <span className="block font-semibold">
                Show contact details publicly
              </span>
              Hide the phone number and email address while retaining them in
              the directory record.
            </span>
          </label>
        </fieldset>

        <fieldset className="grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-700">
          <legend className="px-2 text-sm font-bold text-slate-900">
            Photo
          </legend>

          {draft.photo ? (
            <img
              src={draft.photo}
              alt={draft.name || "Team member preview"}
              className="h-28 w-28 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
              No photo
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handlePhotoChange}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-semibold file:text-cicBlue hover:file:bg-blue-200 focus:border-cicBlue"
          />

          <p className="text-xs leading-5 text-slate-500">
            Upload JPG, PNG, or WebP. Maximum file size:{" "}
            {MAX_TEAM_PHOTO_SIZE_BYTES / 1024} KB.
          </p>

          {uploading ? (
            <p className="text-sm text-cicBlue">Uploading photo…</p>
          ) : null}

          {draft.photo ? (
            <button
              type="button"
              onClick={() =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  photo: "",
                }))
              }
              className="w-fit text-sm font-semibold text-cicBlue"
            >
              Remove photo
            </button>
          ) : null}
        </fieldset>

        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center justify-center rounded-xl bg-cicBlue px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
        >
          {saving ? "Saving…" : draft.id ? "Save changes" : "Add team member"}
        </button>
      </form>
    </div>
  );
}

function TenderManager({
  tenders,
  setTenders,
  draft,
  setDraft,
  setMessage,
  adminToken,
}) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const persistTenders = async (nextTenders) => {
    const savedTenders = await apiRequest("/tenders", {
      method: "PUT",
      token: adminToken,
      body: {
        items: nextTenders,
      },
    });

    setTenders(savedTenders);
    return savedTenders;
  };

  const handlePdfChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage({
        type: "error",
        text: "Please upload a valid PDF file.",
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const uploadedFile = await uploadFile(
        "/uploads/tender-pdf",
        file,
        adminToken,
      );
      setDraft((currentDraft) => ({
        ...currentDraft,
        pdfUrl: uploadedFile.url,
        pdfLabel: currentDraft.pdfLabel || "View Tender PDF",
      }));
      setMessage({
        type: "success",
        text: "Tender PDF uploaded. Complete the tender details and save it.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const title = draft.title.trim();
    const pdfUrl = draft.pdfUrl.trim();

    if (!title || !pdfUrl) {
      setMessage({
        type: "error",
        text: "Tender title and PDF upload are required.",
      });
      return;
    }

    const nextTender = {
      id: draft.id || createId("tender"),
      title,
      refNo: draft.refNo.trim(),
      startDate: draft.startDate.trim(),
      endDate: draft.endDate.trim(),
      bidOpeningDate: draft.bidOpeningDate.trim(),
      corrigendumDetails: draft.corrigendumDetails.trim(),
      pdfUrl,
      pdfLabel: draft.pdfLabel.trim() || "View Tender PDF",
    };

    setSaving(true);

    try {
      const existingIndex = tenders.findIndex(
        (tender) => tender.id === nextTender.id,
      );
      const nextTenders =
        existingIndex >= 0
          ? tenders.map((tender) =>
              tender.id === nextTender.id ? nextTender : tender,
            )
          : [nextTender, ...tenders];

      await persistTenders(nextTenders);
      setDraft(createEmptyTenderDraft());
      setMessage({
        type: "success",
        text: draft.id
          ? "Tender updated successfully."
          : "New tender floated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    try {
      await persistTenders(tenders.filter((tender) => tender.id !== item.id));
      setDraft((currentDraft) =>
        currentDraft.id === item.id ? createEmptyTenderDraft() : currentDraft,
      );
      setMessage({
        type: "success",
        text: "Tender deleted.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr]">
      <ContentList
        title="Tender Entries"
        description="Edit published tenders or float a new tender."
        items={tenders}
        getMeta={(item) => ({
          title: item.title,
          subtitle: item.refNo ? `Ref No: ${item.refNo}` : "Ref No pending",
          body: item.pdfUrl,
        })}
        onCreate={() => {
          setDraft(createEmptyTenderDraft());
          setMessage(null);
        }}
        onEdit={(item) => {
          setDraft(createTenderDraftFromItem(item));
          setMessage(null);
        }}
        onDelete={handleDelete}
      />

      <form
        onSubmit={handleSave}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {draft.id ? "Update Tender" : "Float New Tender"}
          </h3>

          {draft.id ? (
            <button
              type="button"
              onClick={() => setDraft(createEmptyTenderDraft())}
              className="text-sm font-semibold text-cicBlue"
            >
              Clear form
            </button>
          ) : null}
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Title
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                title: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Ref No
          <input
            value={draft.refNo}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                refNo: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Start Date
            <input
              value={draft.startDate}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  startDate: event.target.value,
                }))
              }
              placeholder="23 Jun 2026 02:00 PM"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            End Date
            <input
              value={draft.endDate}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  endDate: event.target.value,
                }))
              }
              placeholder="21 Jul 2026 12:00 PM"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Bid Opening Date
            <input
              value={draft.bidOpeningDate}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  bidOpeningDate: event.target.value,
                }))
              }
              placeholder="22 Jul 2026 12:00 PM"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Corrigendum Details
          <textarea
            rows="4"
            value={draft.corrigendumDetails}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                corrigendumDetails: event.target.value,
              }))
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            PDF Label
            <input
              value={draft.pdfLabel}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  pdfLabel: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Tender PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePdfChange}
              disabled={uploading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-semibold file:text-cicBlue hover:file:bg-blue-200 focus:border-cicBlue"
            />
          </label>
        </div>

        {draft.pdfUrl ? (
          <a
            href={draft.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-cicBlue underline-offset-4 hover:underline"
          >
            Current PDF: {draft.pdfUrl}
          </a>
        ) : null}

        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center justify-center rounded-xl bg-cicBlue px-5 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving
            ? "Saving..."
            : draft.id
              ? "Update Tender"
              : "Float New Tender"}
        </button>
      </form>
    </div>
  );
}

function SafeguardsManager({ adminToken, setMessage }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/cyber-security-safeguards");
      setFiles(Array.isArray(response) ? response : []);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, [setMessage]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage({ type: "error", text: "Please upload a valid PDF file." });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      await uploadFile(
        "/uploads/cyber-security-safeguard",
        file,
        adminToken,
      );
      await loadFiles();
      setMessage({
        type: "success",
        text: "Safeguard PDF uploaded and published successfully.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;

    setDeletingName(file.name);
    setMessage(null);
    try {
      await apiRequest(
        `/cyber-security-safeguards?filename=${encodeURIComponent(file.name)}`,
        { method: "DELETE", token: adminToken },
      );
      setFiles((currentFiles) =>
        currentFiles.filter((item) => item.name !== file.name),
      );
      setMessage({ type: "success", text: "Safeguard PDF deleted." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setDeletingName("");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-cicBlue">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-slate-900">
          Upload Safeguard PDF
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Uploaded PDFs are published immediately under Cyber Security →
          Safeguards. Maximum file size: 25 MB.
        </p>
        <label className="mt-6 grid gap-2 text-sm font-medium text-slate-700">
          Select PDF
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-semibold file:text-cicBlue hover:file:bg-blue-200 focus:border-cicBlue"
          />
        </label>
        {uploading ? (
          <p className="mt-3 text-sm font-medium text-cicBlue">
            Uploading PDF...
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Published Safeguards
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Manage the PDFs currently visible on the public page.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Loading safeguards...</p>
        ) : files.length ? (
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {files.map((file) => (
              <div
                key={file.url}
                className="flex items-center justify-between gap-4 px-4 py-4"
              >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate font-semibold text-cicBlue hover:underline"
                >
                  {file.name.replace(/\.[^/.]+$/, "")}
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  disabled={deletingName === file.name}
                  className="inline-flex flex-none items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingName === file.name ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
            No safeguard PDFs have been uploaded yet.
          </p>
        )}
      </section>
    </div>
  );
}

function AdminPanel() {
  const {
    notices,
    events,
    services,
    teams,
    setNotices,
    setEvents,
    setServices,
    setTeams,
    resetContent,
    resetTeams,
    loading: contentLoading,
    error: contentError,
  } = useSiteContent();
  const {
    isAuthenticated,
    login,
    adminUser,
    loading: authLoading,
    sessionWarning,
  } = useAdminAuth();

  const [activeTab, setActiveTab] = useState("notices");
  const [message, setMessage] = useState(null);
  const [loginDraft, setLoginDraft] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState(createEmptyUpdateDraft());
  const [eventDraft, setEventDraft] = useState(createEmptyUpdateDraft());
  const [serviceDraft, setServiceDraft] = useState(createServiceDraft());
  const [teamDraft, setTeamDraft] = useState(createEmptyTeamDraft());
  const [tenders, setTenders] = useState([]);
  const [tenderDraft, setTenderDraft] = useState(createEmptyTenderDraft());
  const [tendersLoading, setTendersLoading] = useState(false);
  const [tendersError, setTendersError] = useState("");

  const tabs = useMemo(
    () => [
      { id: "notices", label: "Notices" },
      { id: "events", label: "Events" },
      { id: "services", label: "Services" },
      { id: "teams", label: "Teams" },
      { id: "tenders", label: "Tenders" },
      { id: "safeguards", label: "Safeguards" },
    ],
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;
    setTendersLoading(true);

    async function loadTenders() {
      try {
        const tenderItems = await apiRequest("/tenders");
        if (isMounted) {
          setTenders(Array.isArray(tenderItems) ? tenderItems : []);
          setTendersError("");
        }
      } catch (error) {
        if (isMounted) {
          setTendersError(error.message);
        }
      } finally {
        if (isMounted) {
          setTendersLoading(false);
        }
      }
    }

    loadTenders();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="bg-white py-24">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-xl border-t border-slate-200 pt-8 text-center">
            <p className="text-slate-600">Checking admin session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const handleAdminLogin = async (event) => {
      event.preventDefault();
      setLoginLoading(true);
      setMessage(null);

      try {
        await login(loginDraft);
        setLoginDraft({ username: "", password: "" });
      } catch (error) {
        setMessage({
          type: "error",
          text: error.message,
        });
      } finally {
        setLoginLoading(false);
      }
    };

    return (
      <div className="bg-white py-24">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <form
            onSubmit={handleAdminLogin}
            className="max-w-xl border-t border-slate-200 pt-8"
          >
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h1 className="text-3xl font-black text-slate-900">Admin Login</h1>
            <p className="mt-3 leading-7 text-slate-600">
              Sign in with your Ananta credentials to manage notices, events,
              and service content for the CIC website.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Username
                <input
                  value={loginDraft.username}
                  onChange={(event) =>
                    setLoginDraft((currentDraft) => ({
                      ...currentDraft,
                      username: event.target.value,
                    }))
                  }
                  autoComplete="username"
                  required
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  value={loginDraft.password}
                  onChange={(event) =>
                    setLoginDraft((currentDraft) => ({
                      ...currentDraft,
                      password: event.target.value,
                    }))
                  }
                  autoComplete="current-password"
                  required
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cicBlue"
                />
              </label>
            </div>

            {message ? (
              <div
                className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                  message.type === "error"
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {message.text}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-cicBlue px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
            >
              {loginLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <div className="mb-10 grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              Content Administration
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Manage website content
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Publish notices, update events, and manage service pages from one
              place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Signed in as{" "}
              <span className="font-semibold text-slate-900">
                {adminUser?.username}
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (
                  !window.confirm(
                    "Reset all notices, events, and services to their default seed data?",
                  )
                ) {
                  return;
                }

                try {
                  await Promise.all([resetContent(), resetTeams()]);
                  setNoticeDraft(createEmptyUpdateDraft());
                  setEventDraft(createEmptyUpdateDraft());
                  setServiceDraft(createServiceDraft());
                  setTeamDraft(createEmptyTeamDraft());
                  setMessage({
                    type: "success",
                    text: "All CMS content was reset to the default project data.",
                  });
                } catch (error) {
                  setMessage({
                    type: "error",
                    text: error.message,
                  });
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cicBlue hover:text-cicBlue"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset defaults
            </button>
          </div>
        </div>

        {message ? (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
              message.type === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        {sessionWarning ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your Ananta session is close to expiry. Interact with this page to
            keep working.
          </div>
        ) : null}

        {contentError ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {contentError}
          </div>
        ) : null}

        {tendersError ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {tendersError}
          </div>
        ) : null}

        <AdminShell
          title="Editor Workspace"
          description="Changes are saved through the Python CMS backend and reflected across the site."
        >
          {contentLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              Loading content from the backend...
            </div>
          ) : null}

          {tendersLoading ? (
            <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              Loading tenders from the backend...
            </div>
          ) : null}

          <div className="mb-6 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                }}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-cicBlue text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-cicBlue hover:text-cicBlue"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "notices" ? (
            <NoticeEventManager
              label="Notice"
              items={notices}
              setItems={setNotices}
              draft={noticeDraft}
              setDraft={setNoticeDraft}
              setMessage={setMessage}
            />
          ) : null}

          {activeTab === "events" ? (
            <NoticeEventManager
              label="Event"
              items={events}
              setItems={setEvents}
              draft={eventDraft}
              setDraft={setEventDraft}
              setMessage={setMessage}
            />
          ) : null}

          {activeTab === "services" ? (
            <ServiceManager
              services={services}
              setServices={setServices}
              draft={serviceDraft}
              setDraft={setServiceDraft}
              setMessage={setMessage}
            />
          ) : null}

          {activeTab === "teams" ? (
            <TeamManager
              teams={teams}
              setTeams={setTeams}
              draft={teamDraft}
              setDraft={setTeamDraft}
              setMessage={setMessage}
              adminToken={adminUser?.token ?? ""}
            />
          ) : null}

          {activeTab === "tenders" ? (
            <TenderManager
              tenders={tenders}
              setTenders={setTenders}
              draft={tenderDraft}
              setDraft={setTenderDraft}
              setMessage={setMessage}
              adminToken={adminUser?.token ?? ""}
            />
          ) : null}

          {activeTab === "safeguards" ? (
            <SafeguardsManager
              adminToken={adminUser?.token ?? ""}
              setMessage={setMessage}
            />
          ) : null}
        </AdminShell>
      </div>
    </div>
  );
}

export default AdminPanel;
