# Prettier Configuration Setup

## 🎨 **Prettier Configuration for Focus25**

This document outlines the Prettier configuration setup for the Focus25 React Native application.

## 📁 **Configuration Files**

### **1. `.prettierrc` - Prettier Configuration**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "proseWrap": "preserve"
}
```

### **2. `.prettierignore` - Files to Ignore**

- Node modules
- Build outputs
- Generated files
- IDE files
- Service account keys

### **3. `.vscode/settings.json` - VS Code Integration**

- Format on save enabled
- Prettier as default formatter
- ESLint integration
- Auto-organize imports

### **4. `.vscode/extensions.json` - Recommended Extensions**

- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- TypeScript support

## 🚀 **Setup Instructions**

### **1. Install Dependencies**

```bash
npm install --save-dev prettier prettier-plugin-tailwindcss husky lint-staged
```

### **2. Install VS Code Extensions**

Install the recommended extensions from `.vscode/extensions.json`:

- Open VS Code
- Go to Extensions (Ctrl+Shift+X)
- Install recommended extensions

### **3. Initialize Husky (for pre-commit hooks)**

```bash
npx husky init
```

### **4. Make pre-commit hook executable**

```bash
chmod +x .husky/pre-commit
```

## 📝 **Available Scripts**

### **Format Commands**

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check

# Format only staged files
npm run format:staged

# Run pre-commit checks
npm run pre-commit
```

### **Lint Commands**

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix
```

## 🔧 **Configuration Details**

### **Prettier Rules**

- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings, JSX
- **Trailing Commas**: ES5 compatible
- **Line Width**: 80 characters
- **Tab Width**: 2 spaces
- **Bracket Spacing**: Always add spaces
- **Arrow Parens**: Avoid when possible
- **End of Line**: LF (Unix style)

### **File Types Supported**

- JavaScript (.js)
- TypeScript (.ts)
- JSX (.jsx)
- TSX (.tsx)
- JSON (.json)
- Markdown (.md)
- YAML (.yml, .yaml)

## 🎯 **Format on Save Setup**

### **VS Code Settings**

The `.vscode/settings.json` file configures:

- ✅ Format on save enabled
- ✅ Prettier as default formatter
- ✅ ESLint auto-fix on save
- ✅ Auto-organize imports
- ✅ File trimming and newline handling

### **Pre-commit Hooks**

Husky + lint-staged ensures:

- ✅ Code is formatted before commit
- ✅ ESLint issues are fixed automatically
- ✅ Only staged files are processed
- ✅ Commit is blocked if formatting fails

## 🔄 **Workflow Integration**

### **1. Development Workflow**

1. Write code
2. Save file (auto-format triggers)
3. Stage changes
4. Commit (pre-commit hooks run)
5. Push to repository

### **2. Manual Formatting**

```bash
# Format specific file
npx prettier --write src/components/MyComponent.tsx

# Format specific directory
npx prettier --write src/components/

# Check formatting
npx prettier --check src/
```

### **3. CI/CD Integration**

Add to your CI pipeline:

```yaml
- name: Check formatting
  run: npm run format:check

- name: Run linting
  run: npm run lint
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Format on Save Not Working**

- Ensure Prettier extension is installed
- Check VS Code settings are applied
- Restart VS Code
- Check for conflicting formatters

#### **2. Pre-commit Hooks Not Running**

```bash
# Reinstall husky
rm -rf .husky
npx husky init
chmod +x .husky/pre-commit
```

#### **3. ESLint Conflicts**

- Ensure `eslint-config-prettier` is installed
- Check ESLint configuration
- Run `npm run lint:fix` to auto-fix issues

#### **4. File Not Being Formatted**

- Check `.prettierignore` file
- Verify file extension is supported
- Check Prettier configuration

### **Debug Commands**

```bash
# Check Prettier version
npx prettier --version

# Check configuration
npx prettier --find-config-path src/

# Debug specific file
npx prettier --debug-check src/components/MyComponent.tsx
```

## 📊 **Benefits**

### **1. Code Consistency**

- Consistent formatting across the team
- Reduced code review time
- Better readability

### **2. Developer Experience**

- Auto-formatting on save
- No manual formatting needed
- Consistent IDE behavior

### **3. Quality Assurance**

- Pre-commit hooks prevent bad formatting
- Automated code quality checks
- Reduced merge conflicts

### **4. Team Collaboration**

- Consistent code style
- Reduced formatting discussions
- Better code reviews

## 🎯 **Best Practices**

### **1. Team Setup**

- Share VS Code settings via `.vscode/` folder
- Use recommended extensions
- Document configuration changes

### **2. Configuration Management**

- Keep `.prettierrc` in version control
- Update `.prettierignore` as needed
- Document any custom rules

### **3. CI/CD Integration**

- Run format checks in CI
- Block PRs with formatting issues
- Automate quality checks

### **4. Code Reviews**

- Focus on logic, not formatting
- Let tools handle style consistency
- Review configuration changes

## 📚 **Additional Resources**

- [Prettier Documentation](https://prettier.io/docs/en/configuration.html)
- [VS Code Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)

This setup ensures consistent, high-quality code formatting across the Focus25 application! 🎉
