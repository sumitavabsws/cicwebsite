export function isPdfReference(reference) {
  return reference?.type === "pdf";
}

export function isHtmlReference(reference) {
  return reference?.type === "html";
}

export function getDocumentViewerUrl(url, title = "Document", type = "") {
  if (!url) {
    return "#";
  }

  const parameters = new URLSearchParams({
    url,
    title,
  });
  if (type) {
    parameters.set("type", type);
  }

  return `/document?${parameters.toString()}`;
}

export function openReference(reference, openHtmlReference = () => {}, title) {
  if (!reference?.url) {
    return;
  }

  if (isPdfReference(reference)) {
    window.open(
      getDocumentViewerUrl(
        reference.url,
        title ?? reference.label ?? "Document",
      ),
      "_blank",
      "noopener,noreferrer",
    );
    return;
  }

  if (isHtmlReference(reference)) {
    if (typeof openHtmlReference === "function") {
      openHtmlReference({
        ...reference,
        title,
      });
    }
  }
}
