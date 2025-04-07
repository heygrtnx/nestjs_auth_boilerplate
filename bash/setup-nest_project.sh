#!/bin/bash

# ========== CONFIG ==========
DEFAULT_REPO="https://github.com/thegrtnx/nestjs_auth_boilerplate"
DEFAULT_VERSION="1.0.0"

echo -e "\n"  
# Detect OS
OS=$(uname -s)
case "$OS" in
  Linux*)     OS_TYPE="Linux";;
  Darwin*)    OS_TYPE="macOS";;
  CYGWIN*|MINGW32*|MSYS*|MINGW*) OS_TYPE="Windows";;
  *)          OS_TYPE="Unknown";;
esac

echo -e "\nOperating System Detected: $OS_TYPE\n"

# ========== ASCII BANNER ==========
cat << "EOF"

| |_| |__   ___  __ _ _ __| |_ _ __ __  __
| __| '_ \ / _ \/ _` | '__| __| '_ \\ \/ /
| |_| | | |  __/ (_| | |  | |_| | | |>  < 
 \__|_| |_|\___|\__, |_|   \__|_| |_/_/\_\
                |___/   

Follow me on GitHub: https://github.com/thegrtnx

EOF

# ========== FUNCTIONS ==========
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

show_table() {
  local task=$1
  local status=$2
  local progress=$3
  local color_code=$4
  local report=$5

  printf "\n"
  printf "| %-35s | %-10s | %-10s | %-30s |\n" "$task" "$status" "$progress" "$report"
  printf "|%-37s|%-12s|%-12s|%-30s|\n" "----------------------------------" "------------" "------------" "------------------------------"
  colored_echo $color_code "$task - $status ($progress%) - $report"
}

colored_echo() {
  local color_code=$1
  shift
  echo -e "\033[${color_code}m$*\033[0m"
}

# ========== USER INPUT ==========
if [ -n "$1" ]; then
  PROJECT_NAME="$1"
  colored_echo 36 "🔧 Using project name from argument: $PROJECT_NAME"
else
  colored_echo 36 "🔧 Please enter the project name: "
  read -r PROJECT_NAME

  if [ -z "$PROJECT_NAME" ]; then
    colored_echo 33 "⚠ No project name provided. Using 'nestjs-auth' as default."
    PROJECT_NAME="nestjs-auth"
  fi
fi

colored_echo 36 "📦 Using version: $DEFAULT_VERSION"

# ========== CREATE PROJECT FOLDER ==========
colored_echo 36 "📂 Creating project folder: $PROJECT_NAME"
mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME" || exit 1

show_table "Cloning Repository" "In Progress" 10 33 "Cloning repository..."

# ========== CLONE THE REPO WITH SPARSE CHECKOUT ==========
colored_echo 36 "📦 Cloning default repository (excluding /bash folder)..."

{
  git clone --depth 1 --single-branch --branch master "$DEFAULT_REPO" . &>/dev/null
} & spinner $!

git config core.sparseCheckout true &>/dev/null
echo "/*" > .git/info/sparse-checkout
echo "!/bash/*" >> .git/info/sparse-checkout

{
  git fetch origin &>/dev/null
  git checkout $(git symbolic-ref --short HEAD || echo "master") &>/dev/null
  git pull origin $(git symbolic-ref --short HEAD || echo "master") &>/dev/null
} & spinner $!

rm -rf .git
colored_echo 32 "✔ Existing .git directory removed."

{
  git init &>/dev/null
} & spinner $!

colored_echo 32 "✔ New .git repository initialized."

show_table "Cloning Repository" "Completed" 100 32 "Cloning completed."

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

show_table "Updating package.json" "Completed" 30 32 "Updated package.json."

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

show_table "Detecting package manager" "Completed" 45 32 "Package manager detected."

# ========== INSTALL DEPENDENCIES ==========
colored_echo 36 "📥 Installing dependencies with $MANAGER..."

show_table "Installing dependencies" "In Progress" 60 33 "Installing dependencies..."

{
  case $MANAGER in
    yarn) yarn install &>/dev/null ;;
    pnpm) pnpm install &>/dev/null ;;
    bun) bun install &>/dev/null ;;
    npm) npm install &>/dev/null ;;
    *) colored_echo 31 "❌ Unknown package manager"; exit 1 ;;
  esac
} & spinner $!

show_table "Installing dependencies" "Completed" 80 32 "Dependencies installed."
echo ""

# ========== COPY .env FILE ==========
if [ -f ".env.sample" ]; then
  cp .env.sample .env
  colored_echo 32 "✔ .env file created from env.sample."
else
  colored_echo 33 "⚠ env.sample not found. Skipping .env creation."
fi

show_table "Copying .env file" "Completed" 100 32 ".env file created."

# ========== NEXT STEPS ==========
echo -e "\n\n"

colored_echo 32 "📋 Next Steps;"
echo -e "\n"
colored_echo 36 "1. cd into your project directory."
colored_echo 36 "2. Fill the .env file with your values."
colored_echo 36 "3. Run \`npm prisma:dev\` to start the database."
colored_echo 36 "4. Run \`npm run start:dev\` to start the server."
colored_echo 36 "5. Run \`npm run prisma:studio\` (optional) to start Prisma Studio."

echo -e "\n\n"
colored_echo 32 "🎉 Project setup complete! Navigate to $PROJECT_NAME and start coding."

echo -e "\n\n"
