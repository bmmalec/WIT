# WIT (Where Is It) - Getting Started Guide
## VS Code + Devcontainers + Claude Code + MongoDB Atlas

---

## Prerequisites

- [VS Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Git installed locally
- MongoDB Atlas account (you have this!)

---

## Step 1: Create Project

```bash
# Create and enter directory
mkdir wit-inventory
cd wit-inventory

# Run setup script (or create files manually - see below)
chmod +x setup-wit.sh
./setup-wit.sh
```

---

## Step 2: Copy Documentation

Copy all doc files to your `docs/` folder:

```
wit-inventory/docs/
├── PROJECT_STATE.md
├── STATUS.md
├── ARCHITECTURE.md
├── API_PATTERNS.md
├── GETTING_STARTED.md
├── AGENTS_GUIDE.md
├── agents/
│   ├── DATABASE_AGENT.md
│   ├── BACKEND_AGENT.md
│   ├── FRONTEND_AGENT.md
│   └── ARCHITECT_AGENT.md
├── milestones/
│   ├── MILESTONE_1.md
│   ├── MILESTONE_2.md
│   ├── MILESTONE_3.md
│   ├── MILESTONE_4.md
│   └── MILESTONE_5.md
└── interfaces/
    ├── models.md
    ├── api-endpoints.md
    └── api-requests.md
```

---

## Step 3: Configure Environment

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB Atlas connection:

```dotenv
# Server
NODE_ENV=development
PORT=3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://rallyadmin:h0Gsl9Eb25pU3ubi@rallydevcluster.nmgh40m.mongodb.net/WIT?retryWrites=true&w=majority&appName=RallyDevCluster

# JWT Authentication
JWT_SECRET=generate-a-secure-random-string-here
JWT_EXPIRE=30d

# Claude API (add when ready for Milestone 3)
ANTHROPIC_API_KEY=
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 4: Open in VS Code Devcontainer

```bash
code wit-inventory
```

When VS Code opens, you'll see a prompt:
> "Folder contains a Dev Container configuration file. Reopen folder to develop in a container?"

Click **"Reopen in Container"**

Wait for the container to build (first time takes 1-2 minutes).

---

## Step 5: Install Dependencies

Once inside the container, open a terminal (`Ctrl+`` `) and run:

```bash
npm install
```

---

## Step 6: Verify MongoDB Connection

Test your connection:

```bash
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB connected!'); process.exit(0); })
  .catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1); });
"
```

You should see: `✅ MongoDB connected!`

---

## Step 7: Initialize Git

```bash
git init
git add .
git commit -m "Initial WIT project setup"
```

---

## Step 8: Start First Claude Code Session

### Option A: ARCHITECT Agent (Recommended First)

Initialize the base Express application:

```
You are the ARCHITECT agent for WIT (Where Is It) inventory system.

Read: docs/agents/ARCHITECT_AGENT.md
Read: docs/milestones/MILESTONE_1.md
Read: docs/ARCHITECTURE.md

Task: Create the initial Express application structure.

1. Create server/config/database.js - MongoDB connection with mongoose
2. Create server/utils/AppError.js - Custom error class
3. Create server/middleware/errorHandler.js - Global error handler
4. Create server/app.js - Express app with middleware setup
5. Create server/server.js - Entry point that connects DB and starts server

Use dotenv for environment variables.
Follow the patterns in ARCHITECTURE.md.
```

### Option B: DATABASE Agent (First Model)

After base setup, create the User model:

```
You are the DATABASE agent for WIT (Where Is It) inventory system.

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_1.md

Task: Implement US-1.1.1 - Create the User model.

Create server/models/User.js with:
- email (unique, required, lowercase, validated)
- passwordHash (required)
- name (required, trimmed)
- avatar (optional URL)
- settings: { theme, defaultView, notifications }
- subscription: { tier, limits }
- timestamps

Include methods:
- comparePassword(candidatePassword) - async, returns boolean
- generateAuthToken() - returns JWT

After completion, update docs/interfaces/models.md with the User model interface.
```

---

## Project Structure

```
wit-inventory/
├── .devcontainer/
│   └── devcontainer.json     # Simple Node.js container
├── .env                       # Your secrets (git ignored)
├── .env.example              # Template
├── .gitignore
├── package.json
├── docs/                      # All documentation
│   ├── PROJECT_STATE.md
│   ├── STATUS.md
│   ├── agents/
│   ├── milestones/
│   └── interfaces/
├── server/
│   ├── config/
│   │   └── database.js       # MongoDB Atlas connection
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── seeds/
│   ├── app.js
│   └── server.js
├── client/
│   ├── css/
│   ├── js/
│   └── index.html
├── tests/
└── uploads/
```

---

## Development Workflow

### Daily Flow:

```bash
# 1. Open VS Code (opens in container automatically after first time)
code wit-inventory

# 2. Check current status
cat docs/STATUS.md

# 3. Start Claude Code with appropriate agent prompt

# 4. After completing work:
#    - Update docs/STATUS.md
#    - Update interface files if needed
#    - Commit with story ID

git add .
git commit -m "US-1.1.1: Implement User model"
```

### Running the Server:

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### Running Seeds:

```bash
# After creating seed files
npm run seed
```

---

## Agent Quick Reference

### DATABASE Agent
```
You are the DATABASE agent for WIT (Where Is It).
Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_X.md
Task: [describe model work]
```

### BACKEND Agent
```
You are the BACKEND agent for WIT (Where Is It).
Read: docs/agents/BACKEND_AGENT.md
Read: docs/interfaces/models.md
Task: [describe API work]
```

### FRONTEND Agent
```
You are the FRONTEND agent for WIT (Where Is It).
Read: docs/agents/FRONTEND_AGENT.md
Read: docs/interfaces/api-endpoints.md
Task: [describe UI work]
```

---

## Troubleshooting

### MongoDB Connection Failed
- Check your connection string in `.env`
- Verify your IP is whitelisted in MongoDB Atlas
- Check Atlas cluster is running

### Container Won't Start
- Ensure Docker Desktop is running
- Try: Command Palette → "Dev Containers: Rebuild Container"

### npm install Fails
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Port 3000 in Use
- Change PORT in `.env`
- Or kill the process: `lsof -ti:3000 | xargs kill`

---

## MongoDB Atlas Tips

### Whitelist Your IP
1. Go to Atlas → Network Access
2. Add your current IP (or 0.0.0.0/0 for development)

### View Data
1. Use the MongoDB VS Code extension
2. Connection string: your `MONGODB_URI` from `.env`
3. Browse collections in the sidebar

### Create Indexes
The DATABASE agent will create indexes in models, but you can also create them in Atlas UI for production optimization.

---

## Next Steps

1. ✅ Run setup script
2. ✅ Copy documentation files
3. ✅ Configure .env with MongoDB Atlas
4. ✅ Open in devcontainer
5. ✅ npm install
6. ✅ Verify MongoDB connection
7. ⬜ Run ARCHITECT agent for base setup
8. ⬜ Run DATABASE agent for User model (US-1.1.1)
9. ⬜ Run BACKEND agent for auth routes
10. ⬜ Run FRONTEND agent for login UI
11. ⬜ Test and commit!

**You're ready to build WIT!** 🚀
