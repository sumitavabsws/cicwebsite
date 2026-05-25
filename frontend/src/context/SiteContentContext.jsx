import { createContext, useContext, useEffect, useRef, useState } from "react";
import eventsSeed from "../data/events.json";
import noticesSeed from "../data/notices.json";
import teamsSeed from "../data/teams.json";
import { services as servicesSeed, serviceIconOptions } from "../data/services";
import { apiRequest, readStoredAdminSession } from "../lib/api";

const SiteContentContext = createContext(null);

function createId(prefix = "item") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
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

function normalizeReference(reference) {
  return {
    type: reference?.type === "html" ? "html" : "pdf",
    url: reference?.url?.trim() ?? "",
    label: reference?.label?.trim() ?? "Open reference",
  };
}

function normalizeOptionalReference(reference) {
  if (!reference) {
    return null;
  }

  if (typeof reference === "string") {
    return {
      label: "Open reference",
      url: reference.trim(),
      type: "link",
    };
  }

  if (typeof reference !== "object") {
    return null;
  }

  const normalizedReference = {
    label: reference.label?.trim() ?? "Open reference",
    url: reference.url?.trim() ?? "",
    type: reference.type?.trim() ?? "link",
  };

  return normalizedReference.url ? normalizedReference : null;
}

function hasRichItemContent(item) {
  if (typeof item === "string") {
    return item.length > 0;
  }

  if (!item || typeof item !== "object") {
    return false;
  }

  return Boolean(
    item.text ||
      item.references?.length ||
      item.children?.length,
  );
}

function normalizeNoticeOrEvent(item, index, prefix) {
  return {
    id: item?.id ?? createId(prefix ?? `entry-${index + 1}`),
    title: item?.title?.trim() ?? "",
    date: item?.date?.trim() ?? "",
    description: item?.description?.trim() ?? "",
    reference: normalizeReference(item?.reference),
  };
}

function normalizeRichItem(item) {
  if (typeof item === "string") {
    return item.trim();
  }

  if (!item || typeof item !== "object") {
    return "";
  }

  const normalizedItem = {
    text: item.text?.trim() ?? "",
  };

  if (item.moreText?.trim()) {
    normalizedItem.moreText = item.moreText.trim();
  }

  if (Array.isArray(item.moreItems)) {
    const normalizedMoreItems = item.moreItems
      .map((moreItem) => moreItem?.toString().trim() ?? "")
      .filter(Boolean);

    if (normalizedMoreItems.length) {
      normalizedItem.moreItems = normalizedMoreItems;
    }
  }

  if (item.moreItemsOrdered === true) {
    normalizedItem.moreItemsOrdered = true;
  }

  if (item.modal && typeof item.modal === "object") {
    normalizedItem.modal = {
      title: item.modal.title?.trim() ?? item.text?.trim() ?? "Details",
      items: Array.isArray(item.modal.items)
        ? item.modal.items
            .map((modalItem) => modalItem?.toString().trim() ?? "")
            .filter(Boolean)
        : [],
    };
  }

  const references = (Array.isArray(item.references) ? item.references : [])
    .map(normalizeOptionalReference)
    .filter(Boolean);

  if (references.length) {
    normalizedItem.references = references;
  }

  if (Array.isArray(item.children)) {
    const normalizedChildren = item.children
      .map(normalizeRichItem)
      .filter(hasRichItemContent);

    if (normalizedChildren.length) {
      normalizedItem.children = normalizedChildren;
    }
  }

  return normalizedItem;
}

function normalizeSection(section, index, fallbackPrefix) {
  return {
    title: section?.title?.trim() ?? `${fallbackPrefix} ${index + 1}`,
    items: Array.isArray(section?.items)
      ? section.items
          .map(normalizeRichItem)
          .filter(hasRichItemContent)
      : [],
    tables: Array.isArray(section?.tables)
      ? section.tables.map(normalizeTable).filter((table) => table.rows.length)
      : [],
    highPriorityNotes: Array.isArray(section?.highPriorityNotes)
      ? section.highPriorityNotes
          .map(normalizeNote)
          .filter((note) =>
            typeof note === "string" ? note.length > 0 : Boolean(note.text),
          )
      : [],
  };
}

function normalizeTable(table, index) {
  const columns = Array.isArray(table?.columns)
    ? table.columns.map((column) => column?.toString().trim() ?? "")
    : [];

  return {
    title: table?.title?.trim() ?? `Table ${index + 1}`,
    columns,
    rows: Array.isArray(table?.rows)
      ? table.rows
          .map((row) =>
            Array.isArray(row)
              ? row.map((cell) => cell?.toString().trim() ?? "")
              : [],
          )
          .filter((row) => row.some(Boolean))
      : [],
  };
}

function normalizeDocument(document, index) {
  return {
    title: document?.title?.trim() ?? `Document ${index + 1}`,
    description: document?.description?.trim() ?? "",
    assetName: document?.assetName?.trim() ?? "",
    fallbackUrl: document?.fallbackUrl?.trim() ?? "",
    kind: document?.kind?.trim() ?? "Open document",
  };
}

function normalizeContact(contact) {
  return {
    name: contact?.name?.trim() ?? "",
    role: contact?.role?.trim() ?? "",
    email: contact?.email?.trim() ?? "",
    phone: contact?.phone?.trim() ?? "",
    note: contact?.note?.trim() ?? "",
  };
}

function normalizeNote(note) {
  if (typeof note === "string") {
    return note.trim();
  }

  if (!note || typeof note !== "object") {
    return "";
  }

  return {
    text: note.text?.trim() ?? "",
  };
}

function normalizeService(service, index) {
  const title = service?.title?.trim() || `Service ${index + 1}`;
  const slug = slugify(service?.slug || title) || `service-${index + 1}`;
  const iconKey = serviceIconOptions.includes(service?.iconKey)
    ? service.iconKey
    : serviceIconOptions[0];

  return {
    id: service?.id ?? slug,
    slug,
    title,
    description: service?.description?.trim() ?? "",
    linkLabel: service?.linkLabel?.trim() ?? "Explore service",
    iconKey,
    eyebrow: service?.eyebrow?.trim() ?? "CIC Service",
    summary: service?.summary?.trim() ?? "",
    details: Array.isArray(service?.details)
      ? service.details.map((section, sectionIndex) =>
          normalizeSection(section, sectionIndex, "Detail Section"),
        )
      : [],
    instructions: Array.isArray(service?.instructions)
      ? service.instructions.map((section, sectionIndex) =>
          normalizeSection(section, sectionIndex, "Instruction Section"),
        )
      : [],
    documents: Array.isArray(service?.documents)
      ? service.documents.map(normalizeDocument)
      : [],
    importantNotes: Array.isArray(service?.importantNotes)
      ? service.importantNotes
          .map(normalizeNote)
          .filter((note) =>
            typeof note === "string" ? note.length > 0 : Boolean(note.text),
          )
      : [],
    highPriorityNotes: Array.isArray(service?.highPriorityNotes)
      ? service.highPriorityNotes
          .map(normalizeNote)
          .filter((note) =>
            typeof note === "string" ? note.length > 0 : Boolean(note.text),
          )
      : [],
    contact: normalizeContact(service?.contact),
  };
}

function normalizeNotices(items) {
  return Array.isArray(items)
    ? items.map((item, index) => normalizeNoticeOrEvent(item, index, "notice"))
    : [];
}

function normalizeEvents(items) {
  return Array.isArray(items)
    ? items.map((item, index) => normalizeNoticeOrEvent(item, index, "event"))
    : [];
}

function normalizeServices(items) {
  return Array.isArray(items) ? items.map(normalizeService) : [];
}

function normalizeTeams(items) {
  return Array.isArray(items)
    ? items.map((team, index) => ({
        id: team?.id ?? createId(`team-${index + 1}`),
        name: team?.name?.trim() ?? "",
        role: team?.role?.trim() ?? "",
        phone: team?.phone?.trim() ?? "",
        email: team?.email?.trim() ?? "",
        photo: team?.photo?.trim() ?? "",
      }))
    : [];
}

function normalizeContent(content) {
  return {
    notices: normalizeNotices(content?.notices),
    events: normalizeEvents(content?.events),
    services: normalizeServices(content?.services),
    teams: normalizeTeams(content?.teams),
  };
}

const defaultContent = normalizeContent({
  notices: noticesSeed,
  events: eventsSeed,
  services: servicesSeed,
  teams: teamsSeed,
});

function getStoredToken() {
  return readStoredAdminSession()?.token ?? "";
}

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const contentRef = useRef(defaultContent);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const applyContent = (nextContent) => {
    const normalizedContent = normalizeContent(nextContent);
    setContent(normalizedContent);
    setError("");
    return normalizedContent;
  };

  const refreshContent = async () => {
    try {
      const [contentResponse, teamsResponse] = await Promise.all([
        apiRequest("/content"),
        apiRequest("/teams"),
      ]);

      return applyContent({
        ...contentResponse,
        teams: teamsResponse,
      });
    } catch (requestError) {
      console.error("Unable to load CMS content.", requestError);
      setError(
        "Using bundled content because the CMS backend is not reachable.",
      );
      return defaultContent;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContent();
  }, []);

  const updateSection = async (section, nextValue, normalizer) => {
    const currentItems = contentRef.current[section];
    const resolvedItems =
      typeof nextValue === "function" ? nextValue(currentItems) : nextValue;
    const normalizedItems = normalizer(resolvedItems);
    const token = getStoredToken();

    const response = await apiRequest(`/content/${section}`, {
      method: "PUT",
      token,
      body: {
        items: normalizedItems,
      },
    });

    return applyContent({
      ...response,
      teams: contentRef.current.teams,
    });
  };

  const setNotices = (nextValue) =>
    updateSection("notices", nextValue, normalizeNotices);

  const setEvents = (nextValue) =>
    updateSection("events", nextValue, normalizeEvents);

  const setServices = (nextValue) =>
    updateSection("services", nextValue, normalizeServices);

  const setTeams = async (nextValue) => {
    const currentTeams = contentRef.current.teams;
    const resolvedTeams =
      typeof nextValue === "function" ? nextValue(currentTeams) : nextValue;
    const normalizedTeams = normalizeTeams(resolvedTeams);
    const token = getStoredToken();
    const response = await apiRequest("/teams", {
      method: "PUT",
      token,
      body: {
        items: normalizedTeams,
      },
    });

    const nextContent = {
      ...contentRef.current,
      teams: response,
    };

    return applyContent(nextContent);
  };

  const resetContent = async () => {
    const token = getStoredToken();
    const response = await apiRequest("/content/reset", {
      method: "POST",
      token,
    });

    return applyContent({
      ...response,
      teams: contentRef.current.teams,
    });
  };

  const resetTeams = async () => {
    const token = getStoredToken();
    const response = await apiRequest("/teams/reset", {
      method: "POST",
      token,
    });

    const nextContent = {
      ...contentRef.current,
      teams: response,
    };

    return applyContent(nextContent);
  };

  return (
    <SiteContentContext.Provider
      value={{
        notices: content.notices,
        events: content.events,
        services: content.services,
        teams: content.teams,
        setNotices,
        setEvents,
        setServices,
        setTeams,
        resetContent,
        resetTeams,
        refreshContent,
        loading,
        error,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);

  if (!context) {
    throw new Error("useSiteContent must be used inside SiteContentProvider.");
  }

  return context;
}
