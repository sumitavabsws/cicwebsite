function ReferenceModal({ isOpen, title, url, onClose }) {
  if (!isOpen || !url) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cicBlue">
              HTML Notice
            </p>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <iframe
          title={title}
          src={url}
          className="min-h-0 flex-1 bg-white"
        />
      </div>
    </div>
  );
}

export default ReferenceModal;
