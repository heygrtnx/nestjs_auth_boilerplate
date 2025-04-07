# NestJS Auth Boilerplate Setup Script 🛠️

A simple interactive Bash script to quickly bootstrap a [NestJS Auth Boilerplate](https://github.com/thegrtnx/nestjs_auth_boilerplate) project — complete with environment setup, dependency installation, authentication, Swagger integration, built-in support for Paystack, Cloudinary, SMTP email, dynamic Handlebars templates, wallet and referral systems, and pre-configured project settings right out of the box.

---

## 🚀 Features

- Clone the default NestJS boilerplate repository.
- Customize the project name and version.
- Detect and install dependencies using the appropriate package manager (`npm`, `yarn`, `pnpm`, `bun`).
- Automatically updates `package.json` with your project name and version
- Copies `.env.sample` to `.env` if available

---

## 📦 Prerequisites

Before running this script, ensure you have the following dependencies installed:

- **Git**: Required to clone the repository.

- **Node.js**: Required for installing dependencies and running the project.

- **Package Managers**: One or more of the following package managers:

  - **npm**
  - **yarn**
  - **pnpm**
  - **bun**

---

## ⚡ Usage

### Option 1: Run directly with `curl` and `bash`

```bash
bash <(curl -s https://raw.githubusercontent.com/thegrtnx/nestjs_auth_boilerplate/master/bash/setup-nest_project.sh)
```

You’ll be prompted to enter a project name.

---

### Option 2: Provide project name as an argument

```bash
bash <(curl -s https://raw.githubusercontent.com/thegrtnx/nestjs_auth_boilerplate/master/bash/setup-nest_project.sh) my-new-app
```

This skips the prompt and uses `my-new-app` as the folder and project name.

---

## 📁 What It Does

- Clones the boilerplate repo
- Removes `.git` and re-initializes a clean repo
- Renames the project in `package.json`
- Installs dependencies using detected package manager
- Sets up a `.env` file if `.env.sample` exists

---

## Example Output

Here’s an example of how the output will look:

```
| Task                             | Status     | Progress   |
|-----------------------------------|------------|------------|
| Cloning Repository                | In Progress| 10%        |
|-----------------------------------|------------|------------|
✔ Existing .git directory removed.
✔ New .git repository initialized.
| Cloning Repository                | Completed  | 100%       |
|-----------------------------------|------------|------------|
| Updating package.json             | Completed  | 30%        |
|-----------------------------------|------------|------------|
| Detecting package manager         | Completed  | 45%        |
|-----------------------------------|------------|------------|
| Installing dependencies           | In Progress| 60%        |
|-----------------------------------|------------|------------|
✔ .env file created from env.sample.
| Copying .env file                 | Completed  | 100%       |
|-----------------------------------|------------|------------|
🎉 Project setup complete! Navigate to my-nest-project and start coding.
```

---

## 🧭 Next Steps

```bash
cd my-new-app
# Edit .env with your own values
npm run prisma:dev
npm run start:dev
npm run prisma:studio  # optional
```

---

## 👨‍💻 Author

**[@thegrtnx](https://github.com/thegrtnx)**  
Love it? ⭐ the [repo](https://github.com/thegrtnx/nestjs_auth_boilerplate) and follow for more!

---

## 🪪 License

MIT © [thegrtnx](https://github.com/thegrtnx)
