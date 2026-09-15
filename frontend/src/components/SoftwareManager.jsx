import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FilePlus2,
  GripVertical,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import ServiceDetailLayout from "./ServiceDetailLayout";
import { apiRequest } from "../lib/api";

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function softwareSection(service) {
  return (
    service?.details?.find(
      (section) => section.title === "Supported Software Families",
    ) ?? { title: "Supported Software Families", items: [] }
  );
}

function prepareReference(reference = {}) {
  return {
    ...reference,
    id: reference.id ?? createId("software-reference"),
    label: reference.label ?? "Open resource",
    url: reference.url ?? "",
    type: reference.type ?? "link",
    resourceKey: reference.resourceKey ?? "",
  };
}

function prepareNode(node = {}, prefix = "software-item") {
  const prepared = {
    ...node,
    id: node.id ?? createId(prefix),
    text: node.text ?? "",
    status: node.status === "draft" ? "draft" : "published",
  };
  if (Array.isArray(node.references)) {
    prepared.references = node.references.map(prepareReference);
  }
  if (Array.isArray(node.children)) {
    prepared.children = node.children.map((child) =>
      prepareNode(child, "software-link"),
    );
  }
  return prepared;
}

function cloneWithFreshIds(node, prefix = "software-item") {
  const copied = clone(node);
  copied.id = createId(prefix);
  if (Array.isArray(copied.references)) {
    copied.references = copied.references.map((reference) => ({
      ...reference,
      id: createId("software-reference"),
    }));
  }
  if (Array.isArray(copied.children)) {
    copied.children = copied.children.map((child) =>
      cloneWithFreshIds(child, "software-item"),
    );
  }
  return copied;
}

function prepareService(service) {
  if (!service) return null;
  const prepared = clone(service);
  const section = softwareSection(prepared);
  const families = (section.items ?? []).map((family) => {
    const preparedFamily = prepareNode(family, "software-family");
    preparedFamily.children = (preparedFamily.children ?? []).map((entry) => {
      if (!entry.references?.length) return entry;
      const directReferences = entry.references.map((reference) => ({
        id: createId("software-link"),
        text: reference.label || "Open resource",
        status: "published",
        references: [reference],
      }));
      const nextEntry = {
        ...entry,
        children: [...directReferences, ...(entry.children ?? [])],
      };
      delete nextEntry.references;
      return nextEntry;
    });
    return preparedFamily;
  });
  const sectionIndex = prepared.details.findIndex(
    (item) => item.title === "Supported Software Families",
  );
  const nextSection = { ...section, items: families };
  if (sectionIndex >= 0) prepared.details[sectionIndex] = nextSection;
  else prepared.details = [nextSection, ...(prepared.details ?? [])];
  return prepared;
}

function moveItem(items, sourceId, targetId) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function moveByOffset(items, id, offset) {
  const index = items.findIndex((item) => item.id === id);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function inputClass(extra = "") {
  return `rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cicBlue ${extra}`;
}

function statusClass(status) {
  return status === "draft"
    ? "bg-amber-100 text-amber-800"
    : "bg-emerald-100 text-emerald-800";
}

export default function SoftwareManager({
  services,
  setServices,
  adminToken,
  setMessage,
}) {
  const sourceService = services.find(
    (service) => service.slug === "software-support",
  );
  const [draft, setDraft] = useState(() => prepareService(sourceService));
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resources, setResources] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [dragged, setDragged] = useState(null);

  useEffect(() => {
    setDraft(prepareService(sourceService));
  }, [sourceService]);

  useEffect(() => {
    apiRequest("/admin/resources", { token: adminToken })
      .then((items) => setResources(Array.isArray(items) ? items : []))
      .catch((error) => setMessage({ type: "error", text: error.message }));
  }, [adminToken, setMessage]);

  const families = useMemo(
    () => softwareSection(draft).items ?? [],
    [draft],
  );
  const selectedFamily = families.find(
    (family) => family.id === selectedFamilyId,
  );
  const selectedEntry = selectedFamily?.children?.find(
    (entry) => entry.id === selectedEntryId,
  );
  const filteredFamilies = families.filter((family) =>
    `${family.text} ${(family.children ?? []).map((entry) => entry.text).join(" ")}`
      .toLowerCase()
      .includes(searchText.trim().toLowerCase()),
  );
  const filteredResources = resources.filter((resource) =>
    `${resource.displayName ?? ""} ${resource.key ?? ""} ${resource.mediaType ?? ""}`
      .toLowerCase()
      .includes(resourceSearch.trim().toLowerCase()),
  );

  const updateFamilies = (updater) => {
    setDraft((current) => {
      const next = clone(current);
      const index = next.details.findIndex(
        (section) => section.title === "Supported Software Families",
      );
      next.details[index].items = updater(next.details[index].items ?? []);
      return next;
    });
  };

  const updateFamily = (familyId, updater) => {
    updateFamilies((items) =>
      items.map((family) =>
        family.id === familyId ? updater(family) : family,
      ),
    );
  };

  const updateEntry = (entryId, updater) => {
    updateFamily(selectedFamilyId, (family) => ({
      ...family,
      children: (family.children ?? []).map((entry) =>
        entry.id === entryId ? updater(entry) : entry,
      ),
    }));
  };

  const addFamily = () => {
    const family = {
      id: createId("software-family"),
      text: "New software family",
      status: "draft",
      children: [],
    };
    updateFamilies((items) => [...items, family]);
    setSelectedFamilyId(family.id);
    setSelectedEntryId("");
  };

  const duplicateFamily = (family) => {
    const copy = cloneWithFreshIds(family, "software-family");
    copy.text = `${family.text} Copy`;
    copy.status = "draft";
    updateFamilies((items) => [...items, copy]);
    setSelectedFamilyId(copy.id);
    setSelectedEntryId("");
  };

  const deleteFamily = (family) => {
    if (!window.confirm(`Delete the software family “${family.text}”? Attached managed resources will be retained.`)) return;
    updateFamilies((items) => items.filter((item) => item.id !== family.id));
    if (selectedFamilyId === family.id) {
      setSelectedFamilyId("");
      setSelectedEntryId("");
    }
  };

  const addEntry = () => {
    if (!selectedFamily) return;
    const entry = {
      id: createId("software-entry"),
      text: "New software entry",
      status: "draft",
      version: "",
      platform: "General",
      moreText: "",
      moreItems: [],
      children: [],
    };
    updateFamily(selectedFamily.id, (family) => ({
      ...family,
      children: [...(family.children ?? []), entry],
    }));
    setSelectedEntryId(entry.id);
  };

  const duplicateEntry = (entry) => {
    const copy = cloneWithFreshIds(entry, "software-entry");
    copy.text = `${entry.text} Copy`;
    copy.status = "draft";
    updateFamily(selectedFamily.id, (family) => ({
      ...family,
      children: [...(family.children ?? []), copy],
    }));
    setSelectedEntryId(copy.id);
  };

  const deleteEntry = (entry) => {
    if (!window.confirm(`Delete “${entry.text}”? Its managed files will remain available in Resources.`)) return;
    updateFamily(selectedFamily.id, (family) => ({
      ...family,
      children: (family.children ?? []).filter((item) => item.id !== entry.id),
    }));
    setSelectedEntryId("");
  };

  const addAttachment = () => {
    if (!selectedEntry) return;
    updateEntry(selectedEntry.id, (entry) => ({
      ...entry,
      children: [
        ...(entry.children ?? []),
        {
          id: createId("software-link"),
          text: "New guide or link",
          status: "published",
          references: [
            {
              id: createId("software-reference"),
              label: "Open resource",
              type: "link",
              url: "",
              resourceKey: "",
            },
          ],
        },
      ],
    }));
  };

  const updateAttachment = (attachmentId, updater) => {
    updateEntry(selectedEntry.id, (entry) => ({
      ...entry,
      children: (entry.children ?? []).map((attachment) =>
        attachment.id === attachmentId ? updater(attachment) : attachment,
      ),
    }));
  };

  const setAttachmentResource = (attachment, resource) => {
    updateAttachment(attachment.id, (item) => ({
      ...item,
      references: [
        {
          ...(item.references?.[0] ?? {}),
          id: item.references?.[0]?.id ?? createId("software-reference"),
          label: item.references?.[0]?.label || `Open ${resource.displayName}`,
          type: resource.mediaType === "application/pdf" ? "pdf" : "link",
          url: resource.url,
          resourceKey: resource.key,
        },
      ],
    }));
  };

  const attachResource = (attachment, key) => {
    const resource = resources.find((item) => item.key === key);
    if (resource) setAttachmentResource(attachment, resource);
  };

  const uploadResource = async (attachment, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("displayName", file.name);
    setUploading(true);
    try {
      const resource = await apiRequest("/admin/resources", {
        method: "POST",
        token: adminToken,
        body: formData,
      });
      setResources((items) => [...items, resource]);
      setAttachmentResource(attachment, resource);
      setMessage({
        type: "success",
        text: "The document was uploaded and attached as a managed resource.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const replaceAttachmentResource = async (attachment, file) => {
    const reference = attachment.references?.[0];
    const resource = resources.find(
      (item) => item.key === reference?.resourceKey || item.url === reference?.url,
    );
    if (!resource || !file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("displayName", file.name);
    setUploading(true);
    try {
      const updated = await apiRequest(
        `/admin/resources/${encodeURIComponent(resource.key)}`,
        { method: "PUT", token: adminToken, body: formData },
      );
      setResources((items) =>
        items.map((item) => (item.key === updated.key ? updated : item)),
      );
      setAttachmentResource(attachment, updated);
      setMessage({
        type: "success",
        text: `Resource replaced. Its URL is unchanged and it is now version ${updated.version}.`,
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const saveCatalogue = async () => {
    if (!draft?.title?.trim()) {
      setMessage({ type: "error", text: "The software page title is required." });
      return;
    }
    if (families.some((family) => !family.text.trim())) {
      setMessage({ type: "error", text: "Every software family requires a name." });
      return;
    }
    setSaving(true);
    try {
      await setServices((items) =>
        items.map((service) =>
          service.slug === "software-support" ? draft : service,
        ),
      );
      setMessage({ type: "success", text: "Software catalogue saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        The software-support service is missing. Restore the default Services content before using this manager.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Software Manager</h2>
            <p className="mt-1 text-sm text-slate-600">Manage the public software catalogue without editing JSON.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPreviewing(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-cicBlue hover:text-cicBlue">
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button type="button" onClick={saveCatalogue} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-cicBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save catalogue"}
            </button>
          </div>
        </div>
      </section>

      <details className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer text-lg font-bold text-slate-900">Page settings</summary>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["title", "Page title"],
            ["eyebrow", "Eyebrow"],
            ["description", "Card description"],
            ["summary", "Page summary"],
          ].map(([field, label]) => (
            <label key={field} className="grid gap-2 text-sm font-medium text-slate-700">
              {label}
              <textarea rows={field === "summary" ? 3 : 2} value={draft[field] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} className={inputClass()} />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Important notes, one per line
            <textarea rows="4" value={(draft.importantNotes ?? []).map((note) => typeof note === "string" ? note : note.text).join("\n")} onChange={(event) => setDraft((current) => ({ ...current, importantNotes: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) }))} className={inputClass()} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            General instructions, one per line
            <textarea rows="4" value={(draft.instructions?.[0]?.items ?? []).map((item) => typeof item === "string" ? item : item.text).join("\n")} onChange={(event) => setDraft((current) => ({ ...current, instructions: [{ ...(current.instructions?.[0] ?? { title: "How To Proceed" }), items: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) }, ...(current.instructions ?? []).slice(1)] }))} className={inputClass()} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Software repository URL
            <input value={draft.documents?.find((item) => item.title === "Software Repository")?.fallbackUrl ?? ""} onChange={(event) => setDraft((current) => {
              const documents = [...(current.documents ?? [])];
              const index = documents.findIndex((item) => item.title === "Software Repository");
              const repository = { ...(index >= 0 ? documents[index] : { title: "Software Repository", description: "Repository route used for selected institute software workflows.", kind: "Open site" }), fallbackUrl: event.target.value };
              if (index >= 0) documents[index] = repository;
              else documents.push(repository);
              return { ...current, documents };
            })} className={inputClass()} />
          </label>
          {[["name", "Support unit"], ["role", "Support role"], ["email", "Email"], ["phone", "Phone"]].map(([field, label]) => (
            <label key={field} className="grid gap-2 text-sm font-medium text-slate-700">
              {label}
              <input value={draft.contact?.[field] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, contact: { ...(current.contact ?? {}), [field]: event.target.value } }))} className={inputClass()} />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Contact note
            <textarea rows="2" value={draft.contact?.note ?? ""} onChange={(event) => setDraft((current) => ({ ...current, contact: { ...(current.contact ?? {}), note: event.target.value } }))} className={inputClass()} />
          </label>
        </div>
      </details>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1fr_1.35fr]">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900">Software families</h3>
            <button type="button" onClick={addFamily} className="rounded-lg bg-cicBlue p-2 text-white" title="Add family"><Plus className="h-4 w-4" /></button>
          </div>
          <label className="relative mt-4 block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search catalogue" className={inputClass("w-full pl-9")} />
          </label>
          <div className="mt-4 max-h-[720px] space-y-2 overflow-y-auto">
            {filteredFamilies.map((family) => (
              <button key={family.id} type="button" draggable onDragStart={() => setDragged({ type: "family", id: family.id })} onDragOver={(event) => event.preventDefault()} onDrop={() => dragged?.type === "family" && updateFamilies((items) => moveItem(items, dragged.id, family.id))} onClick={() => { setSelectedFamilyId(family.id); setSelectedEntryId(""); }} className={`w-full rounded-xl border p-3 text-left ${selectedFamilyId === family.id ? "border-cicBlue bg-blue-50" : "border-slate-200 bg-white"}`}>
                <span className="flex items-center gap-2"><GripVertical className="h-4 w-4 text-slate-400" /><span className="min-w-0 flex-1 truncate font-semibold">{family.text}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(family.status)}`}>{family.status}</span></span>
                <span className="mt-1 block pl-6 text-xs text-slate-500">{family.children?.length ?? 0} entries</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedFamily ? <p className="text-sm text-slate-500">Select a software family to edit it.</p> : <>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-slate-900">Family details</h3>
              <div className="flex flex-wrap justify-end gap-1">
                <button type="button" onClick={saveCatalogue} disabled={saving || uploading} className="inline-flex items-center gap-1.5 rounded-lg bg-cicBlue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" title="Save software catalogue"><Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={() => duplicateFamily(selectedFamily)} className="p-2 text-slate-600" title="Duplicate"><Copy className="h-4 w-4" /></button>
                <button type="button" onClick={() => deleteFamily(selectedFamily)} className="p-2 text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium">Family name<input value={selectedFamily.text} onChange={(event) => updateFamily(selectedFamily.id, (family) => ({ ...family, text: event.target.value }))} className={inputClass()} /></label>
              <label className="grid gap-1 text-sm font-medium">Description<textarea rows="3" value={selectedFamily.moreText ?? ""} onChange={(event) => updateFamily(selectedFamily.id, (family) => ({ ...family, moreText: event.target.value }))} className={inputClass()} /></label>
              <label className="grid gap-1 text-sm font-medium">Publication status<select value={selectedFamily.status} onChange={(event) => updateFamily(selectedFamily.id, (family) => ({ ...family, status: event.target.value }))} className={inputClass()}><option value="published">Published</option><option value="draft">Draft</option></select></label>
            </div>
            <div className="mt-5 flex items-center justify-between"><h4 className="font-semibold text-slate-800">Versions and entries</h4><button type="button" onClick={addEntry} className="inline-flex items-center gap-1 rounded-lg bg-cicBlue px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add</button></div>
            <div className="mt-3 space-y-2">
              {(selectedFamily.children ?? []).map((entry) => (
                <button key={entry.id} type="button" draggable onDragStart={() => setDragged({ type: "entry", id: entry.id })} onDragOver={(event) => event.preventDefault()} onDrop={() => dragged?.type === "entry" && updateFamily(selectedFamily.id, (family) => ({ ...family, children: moveItem(family.children ?? [], dragged.id, entry.id) }))} onClick={() => setSelectedEntryId(entry.id)} className={`w-full rounded-xl border p-3 text-left ${selectedEntryId === entry.id ? "border-cicBlue bg-blue-50" : "border-slate-200"}`}>
                  <span className="flex items-center gap-2"><GripVertical className="h-4 w-4 text-slate-400" /><span className="flex-1 font-medium">{entry.text}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${statusClass(entry.status)}`}>{entry.status}</span></span>
                </button>
              ))}
            </div>
          </>}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedEntry ? <p className="text-sm text-slate-500">Select an entry to manage its information and documents.</p> : <>
            <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-slate-900">Entry details</h3><div className="flex gap-1"><button type="button" onClick={() => duplicateEntry(selectedEntry)} className="p-2 text-slate-600" title="Duplicate"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => deleteEntry(selectedEntry)} className="p-2 text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></button></div></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium md:col-span-2">Title<input value={selectedEntry.text} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, text: event.target.value }))} className={inputClass()} /></label>
              <label className="grid gap-1 text-sm font-medium">Version<input value={selectedEntry.version ?? ""} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, version: event.target.value }))} className={inputClass()} /></label>
              <label className="grid gap-1 text-sm font-medium">Platform<select value={selectedEntry.platform ?? "General"} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, platform: event.target.value }))} className={inputClass()}>{["General", "Windows", "Linux", "macOS", "Web", "Multiple"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="grid gap-1 text-sm font-medium">Status<select value={selectedEntry.status} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, status: event.target.value }))} className={inputClass()}><option value="published">Published</option><option value="draft">Draft</option></select></label>
              <div className="flex items-end gap-1"><button type="button" onClick={() => updateFamily(selectedFamily.id, (family) => ({ ...family, children: moveByOffset(family.children ?? [], selectedEntry.id, -1) }))} className="rounded-lg border p-2.5" title="Move up"><ChevronUp className="h-4 w-4" /></button><button type="button" onClick={() => updateFamily(selectedFamily.id, (family) => ({ ...family, children: moveByOffset(family.children ?? [], selectedEntry.id, 1) }))} className="rounded-lg border p-2.5" title="Move down"><ChevronDown className="h-4 w-4" /></button></div>
              <label className="grid gap-1 text-sm font-medium md:col-span-2">Description<textarea rows="4" value={selectedEntry.moreText ?? ""} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, moreText: event.target.value }))} className={inputClass()} /></label>
              <label className="grid gap-1 text-sm font-medium md:col-span-2">Notes or restrictions, one per line<textarea rows="4" value={(selectedEntry.moreItems ?? []).join("\n")} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, moreItems: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) }))} className={inputClass()} /></label>
              <label className="grid gap-1 text-sm font-medium md:col-span-2">Information panel title<input value={selectedEntry.modal?.title ?? ""} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, modal: { ...(entry.modal ?? {}), title: event.target.value, items: entry.modal?.items ?? [] } }))} className={inputClass()} /></label>
              <label className="grid gap-1 text-sm font-medium md:col-span-2">Information panel items, one per line<textarea rows="4" value={(selectedEntry.modal?.items ?? []).join("\n")} onChange={(event) => updateEntry(selectedEntry.id, (entry) => ({ ...entry, modal: { ...(entry.modal ?? {}), title: entry.modal?.title || entry.text, items: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) } }))} className={inputClass()} /></label>
            </div>

            <div className="mt-6 flex items-center justify-between"><div><h4 className="font-semibold text-slate-900">Guides and links</h4><p className="text-xs text-slate-500">Detaching never deletes the managed file.</p></div><button type="button" onClick={addAttachment} className="inline-flex items-center gap-1 rounded-lg bg-cicBlue px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Attach</button></div>
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder="Filter managed resources by name, key, or type" className={inputClass("w-full pl-9")} />
            </label>
            <div className="mt-3 space-y-3">
              {(selectedEntry.children ?? []).map((attachment) => {
                const reference = attachment.references?.[0] ?? {};
                const matchedResource = resources.find((item) => item.key === reference.resourceKey || item.url === reference.url);
                return <div key={attachment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-2">
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Document title
                      <input value={attachment.text ?? ""} onChange={(event) => updateAttachment(attachment.id, (item) => ({ ...item, text: event.target.value, references: [{ ...(item.references?.[0] ?? reference), label: event.target.value }] }))} placeholder="For example, SolidWorks 2022 installation guide" className={inputClass()} />
                    </label>
                    <select value={matchedResource?.key ?? ""} onChange={(event) => attachResource(attachment, event.target.value)} className={inputClass()}><option value="">Select an existing managed resource</option>{[...(matchedResource && !filteredResources.some((resource) => resource.key === matchedResource.key) ? [matchedResource] : []), ...filteredResources].map((resource) => <option key={resource.key} value={resource.key}>{resource.displayName}</option>)}</select>
                    <div className="grid gap-2 md:grid-cols-[auto_1fr]">
                      <select value={reference.type ?? "link"} onChange={(event) => updateAttachment(attachment.id, (item) => ({ ...item, references: [{ ...reference, type: event.target.value, resourceKey: event.target.value === "link" ? "" : reference.resourceKey }] }))} className={inputClass()}><option value="pdf">Managed PDF</option><option value="link">External link</option><option value="html">HTML reference</option></select>
                      <input value={reference.url ?? ""} onChange={(event) => updateAttachment(attachment.id, (item) => ({ ...item, references: [{ ...reference, url: event.target.value, resourceKey: "" }] }))} placeholder="Resource or external URL" className={inputClass()} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-cicBlue"><FilePlus2 className="h-3.5 w-3.5" /> Upload new<input type="file" className="sr-only" disabled={uploading} onChange={(event) => uploadResource(attachment, event.target.files?.[0])} /></label>
                      {matchedResource ? <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><Save className="h-3.5 w-3.5" /> Replace file<input type="file" className="sr-only" disabled={uploading} accept={`.${matchedResource.displayName.split(".").pop()}`} onChange={(event) => replaceAttachmentResource(attachment, event.target.files?.[0])} /></label> : null}
                      <button type="button" onClick={() => updateEntry(selectedEntry.id, (entry) => ({ ...entry, children: (entry.children ?? []).filter((item) => item.id !== attachment.id) }))} className="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-700"><X className="h-3.5 w-3.5" /> Detach</button>
                    </div>
                    {matchedResource ? <p className="text-xs text-slate-500">{matchedResource.key} · version {matchedResource.version}</p> : null}
                  </div>
                </div>;
              })}
            </div>
          </>}
        </section>
      </div>

      {previewing ? <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 p-4 md:p-8"><div className="mx-auto max-w-[1640px] overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-3"><div><p className="font-bold text-slate-900">Software page preview</p><p className="text-xs text-slate-500">Includes drafts so they can be reviewed before publishing.</p></div><button type="button" onClick={() => setPreviewing(false)} className="rounded-lg border p-2"><X className="h-5 w-5" /></button></div><ServiceDetailLayout service={draft} /></div></div> : null}
    </div>
  );
}
