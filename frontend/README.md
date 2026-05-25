## CIC CMS Backend

Run the Python API:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Run the React frontend so it is reachable from other devices on the same network:

```bash
cd ..
npm run dev:network
```

Then open the app from another device using:

```text
http://<your-host-ip>:5173
```

Optional environment variables:

- `CIC_ADMIN_USERNAME`
- `CIC_ADMIN_PASSWORD`
- `CIC_ADMIN_SECRET`
- `CIC_ADMIN_TOKEN_TTL_SECONDS`
- `CIC_ALLOWED_ORIGINS`
