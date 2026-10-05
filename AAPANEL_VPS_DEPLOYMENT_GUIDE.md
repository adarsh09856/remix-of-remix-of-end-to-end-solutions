# aaPanel VPS Production Deployment Guide: TakinMart E-Commerce

This guide explains how to install and host **TakinMart** directly inside aaPanel without any Docker complexity.

---

## 1. Database Credentials (Configured in aaPanel)

| Setting | Value |
| :--- | :--- |
| **Database Name** | `takinmart` |
| **Username** | `takinmart` |
| **Password** | `takinmart` |
| **Host** | `127.0.0.1` |
| **Port** | `5432` |
| **Connection URL** | `postgresql://takinmart:takinmart@127.0.0.1:5432/takinmart` |

---

## 2. Step 1: Clone Repository on your VPS

Connect via SSH as `root` to your server:

```bash
cd /www/wwwroot

# Clone the repository
git clone https://github.com/adarsh09856/remix-of-remix-of-end-to-end-solutions.git takinmart
cd takinmart
```

---

## 3. Step 2: Run the Automated Installer

Make executable and run:

```bash
chmod +x install.sh deploy.sh
./install.sh
```

### What this automatically does:
1. Writes the production `.env` with your `takinmart` database credentials.
2. Automatically imports the complete database schema and catalog (`database/aapanel-init.sql`) into the `takinmart` PostgreSQL database.
3. Installs dependencies and builds the standalone production server (`.output/server/index.mjs`).

---

## 4. Step 3: Add Website in aaPanel (30 Seconds)

1. Open your aaPanel Dashboard &rarr; **Website** &rarr; **Node project** tab.
2. Click **Add Node project**:
   - **Path**: `/www/wwwroot/takinmart`
   - **Run Opt**: `node .output/server/index.mjs`
   - **Port**: `3000`
   - **Domain name**: Your domain (e.g., `takinmart.bt`)
3. Click **Submit**.
4. In the project settings &rarr; **SSL** tab &rarr; Enable **Let's Encrypt** and toggle **Force HTTPS**.

🎉 **Your store is now live at `https://takinmart.bt`!**

---

## 5. How to Deploy Future Updates

Whenever you push updates to GitHub, simply run:

```bash
cd /www/wwwroot/takinmart
./deploy.sh
```

This single command:
- Pulls the latest git commits.
- Builds the updated production bundle.
- Restarts your website with zero downtime.
