## CIC CMS Backend

Run the Python API:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 5500
```

For an existing environment, run only the last command from `backend`.
Calling Uvicorn as a Python module avoids the `uvicorn.exe` launcher, which
Windows Application Control may block. Virtual environment activation is optional
when using the explicit Python path above.

Run the React frontend so it is reachable from other devices on the same network:

```bash
cd ..
npm run dev:network
```

Then open the app from another device using:

```text
http://<your-host-ip>:5173
```

## Managed resources

Backend documents, images, and videos are published through opaque `/api/assets/<id>`
URLs. Do not add `/resources`, `/media`, or `/videos` links to frontend code or
CMS content.

Replace existing production resources through **Admin Panel -> Resources**.
Manage tender PDFs and corrigenda through **Admin Panel -> Tenders**. These are
the normal administrative workflows and do not require server commands.

The following backend commands are development and recovery utilities for
introducing new source-controlled resources or validating a deployment:

```powershell
.venv\Scripts\python.exe manage_resources.py list
.venv\Scripts\python.exe manage_resources.py sync
.venv\Scripts\python.exe manage_resources.py replace <resource-key> <updated-file>
.venv\Scripts\python.exe manage_resources.py validate
```

Replacing a registered file preserves its public URL.

Optional environment variables:

- `CIC_ALLOWED_ORIGINS`
- `ANANTA_BASE_URL` - Backend URL for Ananta passthrough auth and SSO session validation. Defaults to `http://10.72.14.39:5000/framework`.
- `ANANTA_CLIENT_SECRET` - Optional shared secret sent by the CIC backend to Ananta as `X-Ananta-Client-Secret`.
- `VITE_ANANTA_LOGIN_URL` - Ananta login URL for the top ribbon link. Defaults to `http://10.72.14.39:5000/framework/signin/?next=%2Fframework%2Flanding%2F`.

For Ananta-backed admin login, Ananta must allow the CIC website admin URL as a
safe redirect target, for example:

```text
SSO_ALLOWED_REDIRECT_HOSTS=localhost,127.0.0.1,<cic-website-host>:5173
SSO_API_CLIENT_SECRET=<same-value-as-ANANTA_CLIENT_SECRET>
```
