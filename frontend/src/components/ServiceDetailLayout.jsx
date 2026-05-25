import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Cloud,
  Database,
  ExternalLink,
  FileText,
  FolderTree,
  Mail,
  Phone,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDocumentViewerUrl } from "../utils/references";

const serviceDocumentModules = import.meta.glob("../assets/service-docs/*", {
  eager: true,
  import: "default",
});

const serviceDocumentMap = Object.entries(serviceDocumentModules).reduce(
  (accumulator, [path, url]) => {
    const filename = path.split("/").pop();

    if (filename) {
      accumulator[filename] = url;
    }

    return accumulator;
  },
  {},
);

function normalizeUrlValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getServiceDocumentUrl(assetName, fallbackUrl) {
  const assetPath = normalizeUrlValue(assetName);
  const fallbackPath = normalizeUrlValue(fallbackUrl);

  if (assetPath && serviceDocumentMap[assetPath]) {
    return serviceDocumentMap[assetPath];
  }

  if (assetPath && /^(https?:)?\//.test(assetPath)) {
    return assetPath;
  }

  return fallbackPath;
}

function getReferenceUrl(reference) {
  if (typeof reference === "string") {
    return normalizeUrlValue(reference);
  }

  if (!reference || typeof reference !== "object") {
    return "";
  }

  return getServiceDocumentUrl(
    reference.href ?? reference.url ?? reference.assetName,
    reference.fallbackUrl ?? reference.url ?? reference.href,
  );
}

function normalizeReference(reference, fallbackLabel) {
  if (!reference) {
    return null;
  }

  if (typeof reference === "string") {
    return {
      label: fallbackLabel ?? "Open reference",
      href: getReferenceUrl(reference),
      type: "link",
    };
  }

  const href = getReferenceUrl(reference);

  return {
    label: reference.label ?? fallbackLabel ?? "Open reference",
    href,
    type: reference.type === "image" ? "image" : reference.type === "pdf" ? "pdf" : "link",
  };
}

function normalizeSectionItem(item) {
  if (typeof item === "string") {
    return {
      text: item,
      moreText: "",
      moreItems: [],
      modal: null,
      references: [],
      children: [],
    };
  }

  return {
    text: item?.text ?? "",
    moreText: item?.moreText ?? "",
    moreItems: Array.isArray(item?.moreItems) ? item.moreItems : [],
    moreItemsOrdered: item?.moreItemsOrdered === true,
    modal: item?.modal ?? null,
    childrenOrdered: item?.childrenOrdered === true,
    references: (Array.isArray(item?.references) ? item.references : [])
      .map((reference) => normalizeReference(reference, item?.text))
      .filter(Boolean),
    children: (Array.isArray(item?.children) ? item.children : [])
      .map(normalizeSectionItem)
      .filter(Boolean),
  };
}

function getReferenceOpenHref(reference, title = reference?.label ?? "Document") {
  if (!reference?.href) {
    return "#";
  }

  return reference.type === "pdf"
    ? getDocumentViewerUrl(reference.href, title)
    : reference.href;
}

function countDocumentLeaves(item) {
  if (!item?.children?.length) {
    return item?.references?.some((reference) => reference.href) ? 1 : 0;
  }

  return item.children.reduce(
    (total, child) => total + countDocumentLeaves(child),
    0,
  );
}

function getListClassName(ordered, depth) {
  if (ordered) {
    if (depth === 0) {
      return "list-decimal pl-5";
    }

    if (depth === 1) {
      return "list-[upper-alpha] pl-6";
    }

    return "list-[lower-roman] pl-6";
  }

  if (depth === 0) {
    return "list-disc pl-5";
  }

  if (depth === 1) {
    return "list-[circle] pl-6";
  }

  return "list-[square] pl-6";
}

function ItemReferences({ references }) {
  const linkReferences = references.filter(
    (reference) =>
      reference.href && (reference.type === "link" || reference.type === "pdf"),
  );

  if (!linkReferences.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {linkReferences.map((reference, index) => (
        <a
          key={`${reference.label}-${reference.href}-${index}`}
          href={getReferenceOpenHref(reference)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cicBlue transition hover:text-blue-900"
        >
          {reference.type === "pdf" ? (
            <FileText className="h-4 w-4" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {reference.label}
        </a>
      ))}
    </div>
  );
}

function ItemImages({ references }) {
  const imageReferences = references.filter(
    (reference) => reference.href && reference.type === "image",
  );

  if (!imageReferences.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {imageReferences.map((reference, index) => (
        <a
          key={`${reference.href}-${index}`}
          href={getDocumentViewerUrl(reference.href, reference.label ?? "Image")}
          target="_blank"
          rel="noreferrer"
          className="block transition hover:opacity-90"
        >
          <img
            src={reference.href}
            alt={reference.label}
            className="w-full rounded-xl border border-slate-200 bg-white object-cover shadow-sm"
          />
        </a>
      ))}
    </div>
  );
}

function ExpandableItemLabel({ item, hasChildren, depth, onOpenModal }) {
  if (!item.moreText && !item.moreItems?.length) {
    return null;
  }

  const MoreItemsTag = item.moreItemsOrdered ? "ol" : "ul";

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 marker:hidden">
        <span
          className={
            hasChildren && depth === 0
              ? "inline-flex rounded-xl bg-white px-3 py-2 font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200"
              : "font-semibold text-slate-900"
          }
        >
          {item.text}
        </span>
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cicBlue transition group-open:bg-cicBlue group-open:text-white">
          See More
        </span>
      </summary>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        {item.moreText ? (
          <p className="leading-7 text-slate-600">{item.moreText}</p>
        ) : null}

        {item.moreItems?.length ? (
          <MoreItemsTag
            className={`mt-3 space-y-2 pl-5 text-slate-600 ${
              item.moreItemsOrdered ? "list-decimal" : ""
            }`}
          >
            {item.moreItems.map((moreItem) => (
              <li
                key={moreItem}
                className={`${item.moreItemsOrdered ? "" : "list-disc"} leading-7`}
              >
                {moreItem}
              </li>
            ))}
          </MoreItemsTag>
        ) : null}

        <ItemModalButton modal={item.modal} onOpen={onOpenModal} />
      </div>
    </details>
  );
}

function ItemModalButton({ modal, onOpen }) {
  if (!modal?.items?.length) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(modal)}
      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-cicBlue shadow-sm transition hover:bg-blue-50 hover:text-blue-900"
    >
      <ExternalLink className="h-4 w-4" />
      Open list
    </button>
  );
}

function MoreDetailsButton({ item, onOpenModal }) {
  if (!item.moreText && !item.moreItems?.length) {
    return null;
  }

  const MoreItemsTag = item.moreItemsOrdered ? "ol" : "ul";

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 marker:hidden">
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cicBlue transition group-open:bg-cicBlue group-open:text-white">
          See More
        </span>
      </summary>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        {item.moreText ? (
          <p className="leading-7 text-slate-600">{item.moreText}</p>
        ) : null}

        {item.moreItems?.length ? (
          <MoreItemsTag
            className={`mt-3 space-y-2 pl-5 text-slate-600 ${
              item.moreItemsOrdered ? "list-decimal" : ""
            }`}
          >
            {item.moreItems.map((moreItem) => (
              <li
                key={moreItem}
                className={`${item.moreItemsOrdered ? "" : "list-disc"} leading-7`}
              >
                {moreItem}
              </li>
            ))}
          </MoreItemsTag>
        ) : null}

        <ItemModalButton modal={item.modal} onOpen={onOpenModal} />
      </div>
    </details>
  );
}

function SoftwareTreeButton({ item, depth, isExpanded, onClick }) {
  const documentCount = countDocumentLeaves(item);
  const countLabel = `${documentCount} ${documentCount === 1 ? "guide" : "guides"}`;

  if (depth === 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
          isExpanded
            ? "border-cicBlue/40 bg-blue-50/70 shadow-blue-100/80"
            : "border-slate-200 bg-white hover:border-cicBlue/35 hover:bg-slate-50 hover:shadow-md"
        }`}
        aria-expanded={isExpanded}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              isExpanded
                ? "bg-cicBlue text-white"
                : "bg-slate-100 text-cicBlue group-hover:bg-blue-50"
            }`}
          >
            <FolderTree className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-slate-900">
              {item.text}
            </span>
            <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Software family
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {documentCount ? (
            <span className="hidden rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-bold text-cicBlue sm:inline-flex">
              {countLabel}
            </span>
          ) : null}
          <span className="rounded-full bg-white p-1.5 text-cicBlue shadow-sm ring-1 ring-slate-200">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
        isExpanded
          ? "border-cicBlue/35 bg-white text-cicBlue shadow-sm"
          : "border-slate-200 bg-white/80 text-slate-900 hover:border-cicBlue/30 hover:text-cicBlue"
      }`}
      aria-expanded={isExpanded}
    >
      <span className="flex min-w-0 items-center gap-2">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-cicBlue" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-cicBlue" />
        )}
        <span className="truncate font-semibold">{item.text}</span>
      </span>
      {documentCount ? (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
          {countLabel}
        </span>
      ) : null}
    </button>
  );
}

function SoftwareDocumentLink({ item, reference }) {
  return (
    <a
      href={getReferenceOpenHref(reference, item.text)}
      target="_blank"
      rel="noreferrer"
      className="group flex w-full max-w-2xl items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-cicBlue/40 hover:bg-blue-50/50 hover:shadow-md"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-cicBlue ring-1 ring-blue-100">
          <FileText className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-slate-900 group-hover:text-cicBlue">
            {item.text}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-slate-500">
            Opens in a new tab
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {reference.type === "pdf" ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
            PDF
          </span>
        ) : null}
        <ExternalLink className="h-4 w-4 text-cicBlue" />
      </span>
    </a>
  );
}

function ServiceModal({ modal, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!modal) {
    return null;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleItems = normalizedQuery
    ? modal.items.filter((item) => item.toLowerCase().includes(normalizedQuery))
    : modal.items;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-8">
      <div className="max-h-full w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cicBlue">
              Software Catalog
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">{modal.title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-cicBlue hover:text-cicBlue"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <label className="relative mb-5 block">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cicBlue focus:bg-white focus:ring-4 focus:ring-blue-100"
              autoFocus
            />
          </label>

          {visibleItems.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
              <div
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
              >
                No products match your search.
              </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NestedSectionItems({
  items,
  ordered = false,
  depth = 0,
  hideMarkers = false,
  onOpenModal,
  collapsible = false,
  expandedPath = [],
  onToggleNode,
}) {
  if (!items?.length || depth > 2) {
    return null;
  }

  const ListTag = ordered ? "ol" : "ul";
  const listClassName = hideMarkers
    ? "list-none pl-0"
    : getListClassName(ordered, depth);

  return (
    <ListTag
      className={`text-slate-600 ${
        collapsible
          ? `list-none pl-0 ${depth === 0 ? "space-y-3" : "space-y-2.5"}`
          : `space-y-4 ${listClassName}`
      }`}
    >
      {items.map((item, index) => {
        const normalizedItem = normalizeSectionItem(item);
        const hasChildren = normalizedItem.children.length > 0;
        const nodeKey = `${index}-${normalizedItem.text}`;
        const isExpanded = expandedPath[depth] === nodeKey;
        const shouldShowChildren = hasChildren && (!collapsible || isExpanded);
        const primaryReference =
          !hasChildren && normalizedItem.references.length === 1
            ? normalizedItem.references[0]
            : null;

        return (
          <li
            key={`${normalizedItem.text}-${index}-${depth}`}
            className={`leading-7 ${
              depth > 0 && !collapsible && !hideMarkers
                ? "relative before:absolute before:-left-6 before:top-5 before:h-0.5 before:w-5 before:bg-cicBlue/35"
                : ""
            }`}
          >
            {collapsible && hasChildren ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SoftwareTreeButton
                    item={normalizedItem}
                    depth={depth}
                    isExpanded={isExpanded}
                    onClick={() => onToggleNode?.(nodeKey, depth)}
                  />
                </div>
                <MoreDetailsButton item={normalizedItem} onOpenModal={onOpenModal} />
              </div>
            ) : normalizedItem.text && (normalizedItem.moreText || normalizedItem.moreItems.length) ? (
              <ExpandableItemLabel
                item={normalizedItem}
                hasChildren={hasChildren}
                depth={depth}
                onOpenModal={onOpenModal}
              />
            ) : collapsible && normalizedItem.text && primaryReference?.href ? (
              <SoftwareDocumentLink item={normalizedItem} reference={primaryReference} />
            ) : normalizedItem.text && primaryReference?.href ? (
              <a
                href={getReferenceOpenHref(primaryReference, normalizedItem.text)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-semibold text-cicBlue shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 hover:text-blue-900"
              >
                {primaryReference.type === "pdf" ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {normalizedItem.text}
              </a>
            ) : normalizedItem.text ? (
              <p
                className={
                  hasChildren && depth === 0
                    ? "inline-flex rounded-xl bg-white px-3 py-2 font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : undefined
                }
              >
                {normalizedItem.text}
              </p>
            ) : null}
            {primaryReference || (collapsible && hasChildren) ? null : (
              <ItemReferences references={normalizedItem.references} />
            )}
            <ItemImages references={normalizedItem.references} />
            {normalizedItem.moreText || normalizedItem.moreItems.length || (collapsible && hasChildren) ? null : (
              <ItemModalButton modal={normalizedItem.modal} onOpen={onOpenModal} />
            )}

            {shouldShowChildren ? (
              <div
                className={
                  collapsible
                    ? `relative mt-3 ml-5 border-l-2 pl-5 ${
                        depth === 0 ? "border-cicBlue/30" : "border-slate-200"
                      }`
                    : "relative mt-4 border-l-2 border-cicBlue/25 pl-6"
                }
              >
                <NestedSectionItems
                  items={normalizedItem.children}
                  ordered={normalizedItem.childrenOrdered}
                  depth={depth + 1}
                  hideMarkers={hideMarkers}
                  onOpenModal={onOpenModal}
                  collapsible={collapsible}
                  expandedPath={expandedPath}
                  onToggleNode={onToggleNode}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ListTag>
  );
}

function SectionTables({ tables }) {
  if (!tables?.length) {
    return null;
  }

  return (
    <div className="mt-5 space-y-5">
      {tables.map((table) => (
        <div key={table.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
            <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
              {table.title}
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              {table.columns?.length ? (
                <thead className="bg-white">
                  <tr>
                    {table.columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-4 py-3 font-semibold text-slate-900"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}

              <tbody className="divide-y divide-slate-200 bg-white">
                {table.rows.map((row, rowIndex) => (
                  <tr key={`${table.title}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${table.title}-${rowIndex}-${cellIndex}`}
                        className={`px-4 py-3 align-top leading-6 ${
                          cellIndex === 0
                            ? "font-semibold text-slate-900"
                            : "whitespace-pre-line text-slate-600"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function MeghamalaServicesOffered({ items }) {
  const normalizedItems = (items ?? []).map(normalizeSectionItem);
  const serviceItems = normalizedItems.filter((item) => item.children.length);
  const actionItems = normalizedItems.filter((item) => item.references.length);
  const cardIcons = [Cloud, Database];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {serviceItems.map((item, index) => {
          const Icon = cardIcons[index] ?? Cloud;

          return (
            <article
              key={item.text}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-cicBlue ring-1 ring-blue-100">
                  <Icon className="h-5 w-5" />
                </span>
                <h4 className="text-lg font-bold text-slate-900">
                  {item.text}
                </h4>
              </div>

              <div className="space-y-3">
                {item.children.map((child) => (
                  <p
                    key={child.text}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                  >
                    {child.text}
                  </p>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {actionItems.map((item) => {
        const reference = item.references[0];

        if (!reference?.href) {
          return null;
        }

        return (
          <a
            key={item.text}
            href={getReferenceOpenHref(reference, item.text)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-cicBlue/20 bg-white px-5 py-4 shadow-sm transition hover:border-cicBlue/40 hover:bg-blue-50/60 hover:shadow-md"
          >
            <span>
              <span className="block text-base font-bold text-slate-900 group-hover:text-cicBlue">
                {item.text}
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Opens the Meghamala VM request workflow
              </span>
            </span>
            <ExternalLink className="h-5 w-5 flex-none text-cicBlue" />
          </a>
        );
      })}
    </div>
  );
}

function PriorityNotes({ notes, compact = false }) {
  if (!notes?.length) {
    return null;
  }

  return (
    <section
      className={
        compact
          ? "mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-5"
          : "rounded-3xl border border-amber-300 bg-amber-50 p-8 shadow-sm"
      }
    >
      <div className={`flex items-center gap-3 ${compact ? "mb-4" : "mb-5"}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">
            Notes / Warnings / Remarks
          </p>
          <h2 className={`${compact ? "text-lg" : "text-2xl"} font-bold text-slate-900`}>
            High Priority
          </h2>
        </div>
      </div>

      <ul className="space-y-4">
        {notes.map((note, index) => (
          <li
            key={`${typeof note === "string" ? note : note.text ?? index}`}
            className="rounded-2xl border border-amber-200 bg-white px-4 py-3 leading-7 text-slate-700"
          >
            {typeof note === "string" ? note : note.text ?? ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionBlock({
  title,
  section,
  ordered = false,
  hideMarkers = false,
  onOpenModal,
  collapsible = false,
  expandedPath = [],
  onToggleNode,
  variant = "default",
}) {
  if (!section?.items?.length && !section?.tables?.length && !section?.highPriorityNotes?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3>
      {/* <PriorityNotes notes={section.highPriorityNotes} compact /> */}
      {variant === "meghamala-services" ? (
        <MeghamalaServicesOffered items={section.items} />
      ) : (
        <NestedSectionItems
          items={section.items}
          ordered={ordered}
          hideMarkers={hideMarkers}
          onOpenModal={onOpenModal}
          collapsible={collapsible}
          expandedPath={expandedPath}
          onToggleNode={onToggleNode}
        />
      )}
      <SectionTables tables={section.tables} />
    </div>
  );
}

function ServiceDocuments({ documents }) {
  if (!documents?.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-5 text-2xl font-bold text-slate-900">
        Reference Documents
      </h2>

      <div className="space-y-4">
        {documents.map((document) => {
          const href = getServiceDocumentUrl(
            document.assetName,
            document.fallbackUrl,
          );

          return (
            <a
              key={document.title}
              href={getDocumentViewerUrl(href, document.title)}
              target="_blank"
              rel="noreferrer"
              className="flex rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cicBlue hover:bg-white"
            >
              <div className="mr-4 flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-blue-100 text-cicBlue">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {document.title}
                  </h3>

                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-cicBlue">
                    {document.kind ?? "Open PDF"}
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </div>

                {document.description ? (
                  <p className="mt-2 leading-7 text-slate-600">
                    {document.description}
                  </p>
                ) : null}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function ServiceDetailLayout({ service }) {
  const [activeModal, setActiveModal] = useState(null);
  const [expandedTreePath, setExpandedTreePath] = useState([]);

  const handleToggleTreeNode = (nodeKey, depth) => {
    setExpandedTreePath((previousPath) =>
      previousPath[depth] === nodeKey
        ? previousPath.slice(0, depth)
        : [...previousPath.slice(0, depth), nodeKey],
    );
  };

  if (!service) {
    return (
      <div className="bg-white py-24">
        <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
          <div className="max-w-3xl border-t border-slate-200 pt-8">
            <Link
              to="/services"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-cicBlue transition hover:text-blue-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all services
            </Link>

            <h1 className="text-3xl font-black text-slate-900">
              Service not found
            </h1>
            <p className="mt-4 leading-7 text-slate-600">
              This service is not currently published or may have been removed
              from the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hideListMarkers =
    service.slug === "software-support" || service.slug === "meghamala";
  const usesSoftwareAccordion = service.slug === "software-support";

  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 2xl:px-10">
        <Link
          to="/services"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-cicBlue transition hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all services
        </Link>

        <section className="grid gap-12 border-b border-slate-200 pb-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cicBlue">
              {service.eyebrow}
            </p>

            <h1 className="mb-4 text-4xl font-black text-slate-900 md:text-5xl">
              {service.title}
            </h1>

            <p className="max-w-3xl text-lg leading-8 text-slate-700">
              {service.summary}
            </p>
          </div>

          {/* <div className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Service Overview
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Official information, usage guidance, downloadable references,
              important notes, and support contacts for this CIC service.
            </p>
          </div> */}
        </section>

        {/* <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_0.8fr]"> */}
        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-8">
            {/* <PriorityNotes notes={service.highPriorityNotes} /> */}

            {/* <section className="border-t border-slate-200 pt-8"> */}
            <section className="pt-8">
              {/* <h2 className="mb-5 text-2xl font-bold text-slate-900">Details</h2> */}

              <div className="space-y-5">
                {(service.details ?? []).map((section) => {
                  const isSoftwareFamiliesSection =
                    usesSoftwareAccordion && section.title === "Supported Software Families";
                  const isMeghamalaServicesSection =
                    service.slug === "meghamala" && section.title === "Services Offered";

                  return (
                    <SectionBlock
                      key={section.title}
                      title={section.title}
                      section={section}
                      hideMarkers={hideListMarkers}
                      onOpenModal={setActiveModal}
                      collapsible={isSoftwareFamiliesSection}
                      expandedPath={isSoftwareFamiliesSection ? expandedTreePath : []}
                      onToggleNode={isSoftwareFamiliesSection ? handleToggleTreeNode : undefined}
                      variant={
                        isMeghamalaServicesSection
                          ? "meghamala-services"
                          : "default"
                      }
                    />
                  );
                })}
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="mb-5 text-2xl font-bold text-slate-900">
                Instructions
              </h2>

              <div className="space-y-5">
                {(service.instructions ?? []).map((section) => (
                  <SectionBlock
                    key={section.title}
                    title={section.title}
                    section={section}
                    ordered
                    hideMarkers={hideListMarkers}
                    onOpenModal={setActiveModal}
                  />
                ))}
              </div>
            </section>

            {/* <ServiceDocuments documents={service.documents} /> */}
          </div>

          <div className="space-y-8 lg:sticky lg:top-32 lg:self-start">
            <section className="border-t border-slate-200 pt-8">
              <h2 className="mb-5 text-2xl font-bold text-slate-900">
                Important Notes
              </h2>

              <ul className="space-y-4">
                {(service.importantNotes ?? []).map((note) => (
                  <li
                    key={typeof note === "string" ? note : note.text ?? note}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 leading-7 text-slate-600"
                  >
                    {typeof note === "string" ? note : note.text ?? ""}
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="mb-5 text-2xl font-bold text-slate-900">Contact</h2>

              <div className="space-y-4 text-slate-600">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cicBlue">
                    Support Unit
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {service.contact?.name}
                  </p>
                  {service.contact?.role ? (
                    <p className="mt-1">{service.contact.role}</p>
                  ) : null}
                </div>

                {service.contact?.email ? (
                  <a
                    href={`mailto:${service.contact.email}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-cicBlue"
                  >
                    <Mail className="h-4 w-4 text-cicBlue" />
                    {service.contact.email}
                  </a>
                ) : null}

                {service.contact?.phone ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Phone className="h-4 w-4 text-cicBlue" />
                    {service.contact.phone}
                  </div>
                ) : null}

                {service.contact?.note ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 leading-7">
                    {service.contact.note}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
      <ServiceModal modal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}

export default ServiceDetailLayout;
