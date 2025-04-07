#!/bin/bash

# ========== CONFIG ==========
DEFAULT_REPO="https://github.com/thegrtnx/nestjs_auth_boilerplate"
DEFAULT_VERSION="1.0.0"

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
# Spinner function to display a dynamic loading indicator
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

  printf "\n"
  printf "| %-35s | %-10s | %-10s |\n" "$task" "$status" "$progress"
  printf "|%-37s|%-12s|%-12s|\n" "----------------------------------" "------------" "------------"
  colored_echo $color_code "$task - $status ($progress%)"
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

show_table "Cloning Repository" "In Progress" 10 33

# ========== CLONE THE REPO WITH SPARSE CHECKOUT ==========

colored_echo 36 "📦 Cloning default repository (excluding /bash folder)..."

{
  git clone --depth 1 --single-branch --branch master "$DEFAULT_REPO" . &>/dev/null
} & spinner $!

# Enable sparse-checkout and exclude the /bash folder, suppress git output
git config core.sparseCheckout true &>/dev/null
echo "/*" > .git/info/sparse-checkout  # Include everything
echo "!/bash/*" >> .git/info/sparse-checkout  # Exclude the bash folder

# Fetch all branches and check out the default branch (either 'main' or 'master')
{
  git fetch origin &>/dev/null
  git checkout $(git symbolic-ref --short HEAD || echo "master") &>/dev/null
  git pull origin $(git symbolic-ref --short HEAD || echo "master") &>/dev/null
} & spinner $!

# Remove existing .git directory to clean the repository
rm -rf .git
colored_echo 32 "✔ Existing .git directory removed."

# Re-initialize a fresh .git repository and suppress output
{
  git init &>/dev/null
} & spinner $!

colored_echo 32 "✔ New .git repository initialized."

show_table "Cloning Repository" "Completed" 100 32

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

show_table "Updating package.json" "Completed" 30 32

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

show_table "Detecting package manager" "Completed" 45 32

# ========== INSTALL DEPENDENCIES ==========

colored_echo 36 "📥 Installing dependencies with $MANAGER..."

show_table "Installing dependencies" "In Progress" 60 33

# Redirecting stderr to /dev/null to hide npm warnings and git messages
{
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
} & spinner $!

show_table "Installing dependencies" "Completed" 80 32
echo ""

# ========== COPY .env FILE ==========

if [ -f ".env.sample" ]; then
  cp .env.sample .env
  colored_echo 32 "✔ .env file created from env.sample."
else
  colored_echo 33 "⚠ env.sample not found. Skipping .env creation."
fi

show_table "Copying .env file" "Completed" 100 32

# ========== NEXT STEPS ==========
echo -e "\n\n"  # two line breaks before next steps

colored_echo 32 "📋 Next Steps;"
echo -e "\n"  # one line breaks before next steps
colored_echo 36 "1. cd into your project directory."
colored_echo 36 "2. Fill the .env file with your values."
colored_echo 36 "3. Run \`npm prisma:dev\` to start the database."
colored_echo 36 "4. Run \`npm run start:dev\` to start the server."
colored_echo 36 "5. Run \`npm run prisma:studio\` (optional) to start Prisma Studio."

echo -e "\n\n"  # one line breaks before next steps

colored_echo 32 "🎉 Project setup complete! Navigate to $PROJECT_NAME and start coding."

echo -e "\n\n"  # one line breaks before next steps
