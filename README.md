# NestJS Project Setup Script

This script automates the process of setting up a NestJS project by cloning a default repository, initializing a new Git repository, updating the `package.json` file, installing dependencies, and creating the `.env` file from the `.env.sample` file.

## Features

- Clone the default NestJS boilerplate repository.
- Customize the project name and version.
- Detect and install dependencies using the appropriate package manager (`npm`, `yarn`, `pnpm`, `bun`).
- Clean up the repository by removing the existing `.git` directory and re-initializing it.
- Display progress in a modern table-like format.
- Skip any warnings related to npm/yarn/pnpm.
- Automatically create a `.env` file from `.env.sample` if it exists.

## Prerequisites

Before running this script, ensure you have the following dependencies installed:

- **Git**: Required to clone the repository.
- **Node.js**: Required for installing dependencies and running the project.
- **Package Managers**: One or more of the following package managers:
  - **npm**
  - **yarn**
  - **pnpm**
  - **bun**

## Usage

1. **Run the script**:

   ```bash
   curl -sL https://tinyurl.com/29ehv83f | sh
   ```

2. **Enter the project name**: When prompted, enter the name of your project. If you leave it blank, the script will use `nestjs-auth` as the default project name.

   Example:

   ```bash
   🔧 Please enter the project name: my-nest-project
   📦 Using version: 1.0.0
   📂 Creating project folder: my-nest-project
   ```

3. **Wait for the script to complete**: The script will clone the repository, set up the project, and install dependencies. It will also create the `.env` file if the `.env.sample` file exists.

4. **Project Setup Complete**: Once finished, you can navigate into your project folder and start coding.

   Example:

   ```bash
   🎉 Project setup complete! Navigate to my-nest-project and start coding.
   ```

## Workflow

The script performs the following steps:

1. **Clone the repository**: It clones the [NestJS Boilerplate](https://github.com/thegrtnx/nestjs_auth_boilerplate) while excluding the `/bash` directory.
2. **Update `package.json`**: It modifies the `name` and `version` fields in the `package.json` file based on user input or defaults.
3. **Detect Package Manager**: It detects the package manager by checking for lock files (`yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`), or defaults to `npm` if none is found.
4. **Install Dependencies**: It installs project dependencies using the detected package manager.
5. **Create `.env` file**: If `.env.sample` exists, it creates the `.env` file by copying the contents.
6. **Progress Output**: It displays a table-like progress bar, showing the status of each task in the process.

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
