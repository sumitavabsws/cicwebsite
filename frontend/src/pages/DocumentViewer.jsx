import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";

function DocumentViewer() {
  const [searchParams] = useSearchParams();
  const title = searchParams.get("title") || "Document";
  const url = searchParams.get("url") || "";
  const isAllowedDocument =
    url.startsWith("/") || url.startsWith("https://") || url.startsWith("blob:");
  const isImageDocument = /\.(avif|gif|jpe?g|png|webp)$/i.test(url);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/cic-logo.png?v=2"
            alt="CIC"
            className="h-12 w-12 flex-none rounded-full bg-white object-contain"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cicBlue">
              CIC Document
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {title}
            </h1>
          </div>
        </div>

        {isAllowedDocument ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-cicBlue transition hover:border-cicBlue/30 hover:bg-blue-50"
          >
            Open Original
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </header>

      {isAllowedDocument ? (
        isImageDocument ? (
          <main className="flex min-h-[calc(100vh-5rem)] flex-1 items-center justify-center bg-slate-950 p-6">
            <img
              src={url}
              alt={title}
              className="max-h-[calc(100vh-8rem)] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </main>
        ) : (
          <iframe
            src={url}
            title={title}
            className="min-h-[calc(100vh-5rem)] flex-1 border-0 bg-white"
          />
        )
      ) : (
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Document unavailable
          </h2>
          <p className="mt-4 text-slate-600">
            The requested document link is missing or cannot be opened here.
          </p>
        </div>
      )}
    </div>
  );
}

export default DocumentViewer;
