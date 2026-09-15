Production administration
-------------------------

Routine replacement of an existing PDF, image, video, or reference is available
in Admin Panel -> Resources. Search by display filename or readable key, choose a
replacement in the same file format, and click "Replace Resource Safely". The
backend preserves the opaque public URL and atomically refreshes the file and
registry metadata.

Tender PDFs and corrigenda must be managed only through Admin Panel -> Tenders.
Their files are submitted with the tender form, and superseded files are removed
only after the updated tender record has been committed successfully.

Development and recovery tools
------------------------------

When introducing a brand-new resource in source control, place it in the
appropriate managed content directory, then register it:

  .venv\Scripts\python.exe manage_resources.py sync

The registry assigns a readable developer key and a stable opaque `/api/assets/`
public URL.
Never link directly to this folder or its filenames.

Find a resource:

  .venv\Scripts\python.exe manage_resources.py list residential
  .venv\Scripts\python.exe manage_resources.py show resources.residential.captive.portal.authentication

Replace a resource without changing its public URL:

  .venv\Scripts\python.exe manage_resources.py replace resources.residential.captive.portal.authentication "D:\Updated Documents\Residential Guide.pdf"

Optionally change its displayed filename:

  .venv\Scripts\python.exe manage_resources.py replace resources.residential.captive.portal.authentication "D:\Updated Documents\Residential Guide.pdf" --title "Residential Internet Access Guide.pdf"

The same development workflow covers resources, images under content/images,
and videos under content/videos.
