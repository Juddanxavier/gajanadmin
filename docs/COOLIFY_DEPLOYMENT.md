# Deploying GajanAdmin with Coolify (GitHub App)

This guide explains how to deploy the **GajanAdmin** application using [Coolify](https://coolify.io/) with the GitHub App integration.

## Prerequisites

- A **Coolify** instance installed and running.
- A **GitHub** account with access to the `Juddanxavier/gajanadmin` repository.
- A **Supabase** project (for database and auth).

## Step 1: Connect GitHub Source

1. Log in to your Coolify dashboard.
2. Navigate to **Sources**.
3. Click **+ Add** and select **GitHub**.
4. Create a new **GitHub App**:
    - Give it a name (e.g., "Coolify Gajan").
    - Use the pre-filled defaults provided by Coolify.
    - Click **Register Now** (this redirects you to GitHub).
5. **Install** the GitHub App on your account/organization:
    - Select `All repositories` or specifically `Juddanxavier/gajanadmin`.
    - Click **Install**.
6. Back in Coolify, you should see the new source connected.

## Step 2: Create the Project

1. Go to **Projects**.
2. Click **+ Add** to create a new project (e.g., "Gajan Logistics").
3. Select the project environment (e.g., "Production").
4. Click **+ New Resource**.
5. Select **Git Repository** (or "Public Repository" if public, but Private is better via App).
6. Select the **GitHub App** source you just created.
7. Choose the repository: `Juddanxavier/gajanadmin`.
8. Branch: `main` (or your preferred deployment branch).

## Step 3: Application Configuration

Coolify will detect the project type automatically.

- **Build Pack**: `Nixpacks` (Recommended for Next.js) or `Heroku Buildpacks`.
- **Port**: `3000` (Default Next.js port).
- **Network**: ensure the domain is configured if valid.

### ⚠️ Critical: Environment Variables

**The deployment will FAIL** if you do not set the required environment variables. This application has strict runtime validation.

Go to **Environment Variables** in your Coolify service and add the following keys. **Do not wrap values in quotes.**

| Variable Name | Description | Where to find it |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | Supabase Dashboard -> Settings -> API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Anon Key | Supabase Dashboard -> Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** Service Role Key | Supabase Dashboard -> Settings -> API |
| `CRON_SECRET` | Secret for Cron Jobs to authenticate | Generate a random strong string |
| `NODE_ENV` | Environment mode | Set to `production` |

> [!IMPORTANT]
> If you miss `SUPABASE_SERVICE_ROLE_KEY` or the public keys, the application will enter a **Restart Loop** because `lib/env.ts` enforces their presence at startup.

## Step 4: Deploy

1. Click **Deploy**.
2. Coolify will pull the code, build using Nixpacks, and start the container.
3. Watch the **Deployment Logs**.
    - If it fails during "Build", check for TypeScript errors.
    - If it completes "Build" but restarts repeatedly, check **Application Logs** and verify Environment Variables.

## Post-Deployment Verification

1. Open the deployed URL.
2. Login with your Admin credentials.
3. Check **Admin -> System Health** (if implemented) or just verify the Dashboard loads.
4. Test a "Create Shipment" flow to ensure Database connection is write-capable.

## Troubleshooting

- **Restart Loop**: almost always missing env vars. Check logs.
- **Build Fail**: usually linting errors. Run `npm run build` locally to debug.
