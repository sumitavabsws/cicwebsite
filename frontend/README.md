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
