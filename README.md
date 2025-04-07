# ⚡ NestJS Auth Boilerplate Setup Script

A powerful, interactive Bash script that helps you **bootstrap a full-featured NestJS authentication project** in seconds — with **out-of-the-box support** for common third-party services, API documentation, environment setup, key generation, and more.

> 🔗 **Repo**: [thegrtnx/nestjs_auth_boilerplate](https://github.com/thegrtnx/nestjs_auth_boilerplate)

---

## 🚀 Features

✅ Automatically:

- Clones the boilerplate repo via Git
- Customizes project name (via prompt or argument)
- Sets up `.env` file from `.env.sample`
- Injects default environment values:
  - `EMAIL_PROVIDER=google`
  - `ENVIRONMENT=TEST`
- Generates secure keys for:
  - `SECRET_KEY` and `REFRESH_SECRET_KEY` via `openssl`
- Detects and uses your preferred package manager (`npm`, `yarn`, `pnpm`, `bun`)
- Installs dependencies
- Cleans up `.git` and reinitializes
- Provides clear visual feedback with tables and a spinner
- Warns you to install [`web-push`](https://www.npmjs.com/package/web-push) to generate `VAPID` keys for push notifications

---

## 📁 What’s Inside the Boilerplate?

Here’s what the [NestJS Auth Boilerplate](https://github.com/thegrtnx/nestjs_auth_boilerplate) includes out of the box:

### ✅ Core Features

- 🚀 **Auth System** — with JWT, Refresh tokens, email/password login
- 📦 **Pre-configured Prisma ORM** — ready for PostgreSQL or other databases
- 💌 **Email Service** — SMTP support with dynamic [Handlebars](https://handlebarsjs.com/) templates
- 🔐 **Access/Refresh Tokens** — generated via `openssl`
- 🧰 **Swagger Integration** — API docs at `/docs`
- 🌐 **CORS and Global Pipes**
- 📥 **Cloudinary Integration** — for image uploads
- 💳 **Paystack Integration** — for payment processing
- 👛 **Wallet System** — with transaction logs
- 🧬 **Referral System** — to track and reward invites

### 🧩 `src/lib` Folder Includes:

- **Custom Logger Service**
- **Google Auth Strategies**
- **Paystack Payment Utils**
- **Email Handler (with SMTP and Handlebars)**
- **OTP Generator**
- **Cloudinary SDK**
- **Utilities for handling pagination, validation, formatting, etc.**

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

| Tool              | Required?     | Install Link                                               |
| ----------------- | ------------- | ---------------------------------------------------------- |
| Git               | ✅            | https://git-scm.com/downloads                              |
| Node.js           | ✅            | https://nodejs.org/en/download                             |
| npm/yarn/pnpm/bun | ✅            | Choose one as your package manager                         |
| OpenSSL           | ✅            | Comes pre-installed on most Unix systems                   |
| `web-push`        | ⚠️ Optional\* | `npm install -g web-push` — used for generating VAPID keys |

> ⚠️ If `web-push` is not installed globally, the script will warn you and ask you to manually generate VAPID keys using:
>
> ```bash
> web-push generate-vapid-keys
> ```

---

## ⚡ How to Use

### ✅ Option 1 — Run With Prompt (Interactive)

```bash
bash <(curl -s https://raw.githubusercontent.com/thegrtnx/nestjs_auth_boilerplate/master/bash/setup-nest_project.sh)
```

This will prompt you to enter your desired project name.

---

### ✅ Option 2 — Provide Project Name Directly

```bash
bash <(curl -s https://raw.githubusercontent.com/thegrtnx/nestjs_auth_boilerplate/master/bash/setup-nest_project.sh) "My New Project"
```

This will skip the prompt and use `"My New Project"` as both the folder name and project name.

---

## 🧾 Example Script Output

```
| Cloning Repository                | Completed  | 100%       | Cloning completed.
✔ .env file created from env.sample.
✔ SECRET_KEY and REFRESH_SECRET_KEY generated.
⚠ web-push not found. Please install with: npm install -g web-push
✔ package.json updated.
✔ Dependencies installed with yarn.
🎉 Project setup complete! Navigate to your project and start building.
```

---

## 🧭 Next Steps

After setup, do the following:

```bash
cd "My New Project"

# Edit your .env file with actual values
nano .env

# Run database and start project
npm run prisma:dev
npm run start:dev

# Optional
npm run prisma:studio
```

---

## 💡 Tips

### 🔐 Generate VAPID Keys (If Missing)

If the script couldn't generate VAPID keys automatically, run this manually:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Then add the values to `.env` like:

```env
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
```

---

## 🖥️ Platform-Specific Notes

### 🪟 Windows Users

- Use **Git Bash** or **WSL** (Windows Subsystem for Linux) to run this script.
- Avoid running it in PowerShell or Command Prompt directly.

### 🍏 macOS Users

- Script runs natively in **Terminal**.
- Make sure `bash`, `openssl`, and `git` are available (pre-installed on macOS).

### 🐧 Linux Users

- Works out of the box on most distros.
- If missing `openssl`, install via `sudo apt install openssl` (Debian/Ubuntu) or equivalent.

---

## 🐞 Found a Bug or Have a Suggestion?

If you run into any problems, have ideas for improvements, or want to suggest a feature:

### 👉 [Create a GitHub Issue Here](https://github.com/thegrtnx/nestjs_auth_boilerplate/issues)

Whether it's a typo, a bug, or an enhancement — your feedback is welcome and appreciated! Just click the link above, select the appropriate issue template, and let us know how we can make this better.

> 💡 Tip: Be as descriptive as possible. Include steps to reproduce, logs if available, and your OS/environment details.

---

## 👨‍💻 Author

Made with ❤️ by [**@thegrtnx**](https://github.com/thegrtnx)  
⭐ Star the [repo](https://github.com/thegrtnx/nestjs_auth_boilerplate) and follow for updates!

---

## 🪪 License

MIT © [thegrtnx](https://github.com/thegrtnx)
