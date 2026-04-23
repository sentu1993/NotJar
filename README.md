# NotJar 🚀
### The Open-Source, Self-Hosted User Behavior Analytics Tool

NotJar is a powerful, fully open-source alternative to Hotjar, designed for developers and privacy-conscious teams. It allows you to monitor user behavior on your own servers, giving you full control over your data.

---

## ✨ Key Features

### 🕵️‍♂️ Session Recording & Replay
- **Pixel-Perfect Replays**: Watch exactly what your users see, including mouse movements, clicks, and scrolls.
- **Event Timeline**: A chronological log of every interaction within a session.
- **Privacy Controls**: Automatically masks sensitive data fields.

### 🔥 Heatmaps (Coming Soon)
- **Click Heatmaps**: See where users are clicking most.
- **Scroll Heatmaps**: Understand how far down users are scrolling.
- **Move Heatmaps**: Track user attention through mouse movement.

### 🛠 Project Management
- **Multi-Tenant System**: Manage multiple websites/projects from a single dashboard.
- **Dynamic Script Generation**: Each project gets a unique, lightweight tracking snippet.
- **Geographic Data**: Insights into where your users are coming from (Country/City).

### 🚀 Self-Hosted & Privacy First
- **Full Data Ownership**: Your data stays on your infrastructure.
- **GDPR Friendly**: Easy IP anonymization and cookie-less tracking options.
- **No Hidden Costs**: No monthly fees or recording limits.

---

## 🏗 Tech Stack

- **Backend**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/) and [TypeScript](https://www.typescriptlang.org/).
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/).
- **Frontend**: [Next.js 15](https://nextjs.org/) with [Tailwind CSS](https://tailwindcss.com/).
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/).
- **Icons**: [Lucide React](https://lucide.dev/).

---

## 🛠 Detailed Installation Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Docker** (v20.10.0 or higher)
- **Docker Compose** (v2.0.0 or higher)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/notjar.git
cd notjar
```

### 3. Environment Configuration
Create a `.env` file from the example:
```bash
cp .env.example .env
```
*Note: For production, make sure to change the `JWT_SECRET` and database credentials in `.env` and `docker-compose.yml`.*

### 4. One-Click Launch
Start all services using Docker Compose:
```bash
docker-compose up -d --build
```
This command will:
1. Spin up a **PostgreSQL** database.
2. Start the **Express API** (Backend) on port `5000`.
3. Start the **Next.js Dashboard** (Frontend) on port `3000`.

### 5. Database Initialization
Once the containers are running, run the Prisma migrations:
```bash
docker-compose exec api npx prisma migrate dev --name init
```

---

## 🚀 Getting Started Steps

### Step 1: Create an Account
Navigate to `http://localhost:3000/register` and create your admin account.

### Step 2: Add a Project
In your dashboard, click **"Add Project"**. Provide a name (e.g., "My Blog") and the domain where you'll install the script (e.g., `myblog.com`).

### Step 3: Install the Tracker
Copy the generated tracking script from the project settings page. Paste it into the `<head>` section of your target website:

```html
<script>
  (function(n,o,t,j,a,r){
    n.NotJarId=j; a=o.getElementsByTagName('head')[0];
    r=o.createElement('script'); r.async=1;
    r.src='http://your-server-ip:5000/tracker.js?id='+j;
    a.appendChild(r);
  })(window,document);
</script>
```

### Step 4: Monitor Behavior
Open your website in a new tab, move around, and click some buttons. Go back to the NotJar dashboard, click on your project, and you'll see your session appear under **"Recent Sessions"**. Click **"Replay"** to watch the magic!

---

## 📂 Project Structure

```text
notjar/
├── backend/          # Express API & Prisma Schema
├── frontend/         # Next.js Dashboard UI
├── tracker/          # Vanilla JS tracking script
├── docker-compose.yml # Docker orchestration
└── .env.example      # Template for environment variables
```

---

## 🛡 Security & Privacy
- **JWT Auth**: All dashboard endpoints are secured with JSON Web Tokens.
- **CORS**: Configurable cross-origin resource sharing.
- **Data Scrubbing**: The tracker can be configured to ignore specific input fields to protect PII (Personally Identifiable Information).

---

## 📄 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or new features.

---

**Built with ❤️ for the Open Source Community.**
