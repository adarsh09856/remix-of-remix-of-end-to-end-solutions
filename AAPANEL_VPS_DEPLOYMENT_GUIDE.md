# aaPanel VPS Production Deployment Guide: TakinMart E-Commerce

This guide explains how to install and host **TakinMart** on your VPS running **aaPanel** using automated Docker setup with zero manual database configuration.

---

## 1. Frequently Asked Questions

### Q1: Are we using Docker and do we need Docker images?
- **Yes, we use Docker:** Docker runs both the web application and PostgreSQL in isolated, high-performance containers.
- **Do you need external image accounts (like Docker Hub)?** **NO!** 
  - The application builds its own container image directly on your VPS from the local `Dockerfile`.
  - PostgreSQL uses the official free `postgres:16-alpine` image.
  - You do not need any Docker Hub account, API key, or external registry.

### Q2: How is the database automatically created?
- When Docker starts PostgreSQL for the first time, it automatically reads the script inside `database/aapanel-init.sql` (mounted to `/docker-entrypoint-initdb.d/01-init.sql`).
- PostgreSQL executes this script automatically:
  - It creates all tables (`categories`, `products`, `orders`, `profiles`, `cart_items`, `coupons`, `reviews`, `pos_sessions`, `crm_leads`).
  - It populates initial categories, artisan products, and coupon codes.
- **Zero manual SQL commands are required.**

### Q3: How should the website and PostgreSQL be shown in aaPanel?
- In aaPanel:
  - **Website Section:** This is where your domain (e.g. `takinmart.bt`) lives. You configure your domain, enable Free Let's Encrypt SSL, and set up an **Nginx Reverse Proxy** pointing to `http://127.0.0.1:3000`.
  - **Database Section:** Because PostgreSQL runs inside Docker on `127.0.0.1:5432`, the web container communicates with it directly. If you also want to view it inside aaPanel's Database manager, you can connect aaPanel's PostgreSQL manager to port 5432 or use DBeaver / TablePlus.

---

## 2. Server Requirements

- **VPS Specifications**:
  - Minimum: 2 GB RAM, 1 vCPU (e.g., Hostinger KVM / DigitalOcean / Hetzner).
  - Recommended: 4 GB RAM, 2 vCPUs.
- **Operating System**: Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11 / 12, or AlmaLinux.
- **Control Panel**: aaPanel with **Docker Manager** installed (from aaPanel App Store).

---

## 3. Step 1: Clone Repository on your VPS

Connect to your VPS via SSH as `root`:

```bash
cd /www/wwwroot

# Clone the repository
git clone https://github.com/adarsh09856/remix-of-remix-of-end-to-end-solutions.git takinmart
cd takinmart
```

---

## 4. Step 2: Run the Turnkey 1-Command Installer

Make the installer executable and run it:

```bash
chmod +x install.sh deploy.sh
sudo bash install.sh
```

### What this script automatically does:
1. **Scans Ports:** Checks if port `3000` (web) or `5432` (database) are in use. If another service is already using them, it automatically assigns free ports (e.g., `3001` or `5433`).
2. **Generates `.env`:** Creates `.env` with strong random database passwords.
3. **Builds Containers:** Compiles the application and starts the PostgreSQL database.
4. **Auto-Creates Database:** Runs `aapanel-init.sql` inside PostgreSQL, creating all tables and seed data.
5. **Verifies Health:** Checks that both the Web App and Database are running and healthy.

---

## 5. Step 3: Configure aaPanel Website & SSL (1 Minute)

Once `install.sh` finishes, link your domain to the running container:

1. **Add Website in aaPanel**:
   - Go to **Website** &rarr; **Add Site**.
   - **Domain**: Enter your domain (e.g., `takinmart.bt`).
   - **Database**: Select **None** (managed automatically by Docker).
   - **PHP Version**: Select **Pure Static**.
   - Click **Submit**.

2. **Enable Free SSL (Let's Encrypt)**:
   - Click your domain name to open **Site Settings**.
   - Go to the **SSL** tab &rarr; select **Let's Encrypt**.
   - Select your domain and click **Apply**.
   - Turn **Force HTTPS** toggle to **ON**.

3. **Configure Nginx Reverse Proxy**:
   - In **Site Settings**, go to **Reverse Proxy** &rarr; click **Add reverse proxy**.
   - **Proxy Name**: `takinmart_proxy`
   - **Target URL**: `http://127.0.0.1:3000` (or the port printed by `install.sh`)
   - Click **Save**.

🎉 **Your store is now fully live and accessible at `https://takinmart.bt`!**

---

## 6. How to Deploy Future Updates

Whenever you make changes or push updates to GitHub, simply run:

```bash
cd /www/wwwroot/takinmart
./deploy.sh
```

This single command:
- Pulls latest git commits.
- Rebuilds modified application containers.
- Prunes old Docker build caches to keep VPS disk space clean.
- Restarts services with zero downtime.
