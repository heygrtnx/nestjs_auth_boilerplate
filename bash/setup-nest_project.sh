#!/bin/bash

# ========== CONFIG ==========
DEFAULT_REPO="https://github.com/thegrtnx/nestjs_auth_boilerplate"
DEFAULT_VERSION="1.0.0"

# ========== FUNCTIONS ==========

show_progress() {
  local progress=$1
  local total=100
  local bar_length=30
  local filled=$((progress * bar_length / total))
  local empty=$((bar_length - filled))

  printf "\r["
  for ((i = 0; i < filled; i++)); do printf "█"; done
  for ((i = 0; i < empty; i++)); do printf " "; done
  printf "] %d%%" "$progress"
}

colored_echo() {
  local color_code=$1
  shift
  echo -e "\033[${color_code}m$*\033[0m"
}

# ========== USER INPUT ==========
colored_echo 36 "🔧 Please enter the project name: "
read -r PROJECT_NAME

# Fallback to default if user doesn't provide input
if [ -z "$PROJECT_NAME" ]; then
  colored_echo 33 "⚠ No project name provided. Using 'nestjs-auth' as default."
  PROJECT_NAME="nestjs-auth"
fi

colored_echo 36 "📦 Using version: $DEFAULT_VERSION"

# ========== CREATE PROJECT FOLDER ==========

colored_echo 36 "📂 Creating project folder: $PROJECT_NAME"
mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME" || exit 1

# ========== CLONE THE REPO WITH SPARSE CHECKOUT ==========

colored_echo 36 "📦 Cloning default repository (excluding /bash folder)..."

# Clone the repo without initializing a new git repository and suppress output
git clone --depth 1 --single-branch --branch master "$DEFAULT_REPO" . &>/dev/null

# Enable sparse-checkout and exclude the /bash folder, suppress git output
git config core.sparseCheckout true &>/dev/null
echo "/*" > .git/info/sparse-checkout  # Include everything
echo "!/bash/*" >> .git/info/sparse-checkout  # Exclude the bash folder

# Fetch all branches and check out the default branch (either 'main' or 'master')
git fetch origin &>/dev/null
git checkout $(git symbolic-ref --short HEAD || echo "master") &>/dev/null
git pull origin $(git symbolic-ref --short HEAD || echo "master") &>/dev/null

# Remove existing .git directory to clean the repository
rm -rf .git
colored_echo 32 "✔ Existing .git directory removed."

# Re-initialize a fresh .git repository and suppress output
git init &>/dev/null
colored_echo 32 "✔ New .git repository initialized."

show_progress 10

# ========== UPDATE PACKAGE.JSON ==========

colored_echo 36 "📝 Updating package name and version in package.json..."
if [ -f "package.json" ]; then
  sed -i.bak "s/\"name\": \".*\"/\"name\": \"$PROJECT_NAME\"/" package.json
  sed -i.bak "s/\"version\": \".*\"/\"version\": \"$DEFAULT_VERSION\"/" package.json
  rm package.json.bak
  colored_echo 32 "✔ package.json updated."
else
  colored_echo 31 "❌ package.json not found after cloning."
  exit 1
fi

show_progress 30

# ========== DETECT PACKAGE MANAGER ==========

colored_echo 36 "🔍 Detecting package manager..."
if [ -f "yarn.lock" ]; then
  MANAGER="yarn"
elif [ -f "pnpm-lock.yaml" ]; then
  MANAGER="pnpm"
elif [ -f "bun.lockb" ]; then
  MANAGER="bun"
else
  MANAGER="npm"
fi
colored_echo 32 "✔ Detected: $MANAGER"

show_progress 45

# ========== INSTALL DEPENDENCIES ==========

colored_echo 36 "📥 Installing dependencies with $MANAGER..."

# Redirecting stderr to /dev/null to hide npm warnings and git messages
case $MANAGER in
  yarn)
    yarn install &>/dev/null
    ;;
  pnpm)
    pnpm install &>/dev/null
    ;;
  bun)
    bun install &>/dev/null
    ;;
  npm)
    npm install &>/dev/null
    ;;
  *)
    colored_echo 31 "❌ Unknown package manager"
    exit 1
    ;;
esac

show_progress 80
echo ""

# ========== COPY .env FILE ==========

if [ -f ".env.sample" ]; then
  cp .env.sample .env
  colored_echo 32 "✔ .env file created from env.sample."
else
  colored_echo 33 "⚠ env.sample not found. Skipping .env creation."
fi

show_progress 100
echo ""

colored_echo 32 "🎉 Project setup complete! Navigate to $PROJECT_NAME and start coding."
