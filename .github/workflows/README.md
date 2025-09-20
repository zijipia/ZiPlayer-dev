# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automatically managing API documentation.

## 📋 Available Workflows

### 1. Generate API Documentation (`generate-api-docs.yml`)

**Trigger:** Push to main/develop branches, Pull Requests **Purpose:** Automatically generate API documentation when code changes

**Features:**

- ✅ Generates documentation from JSDoc comments
- ✅ Validates generated content
- ✅ Creates pull requests for documentation updates
- ✅ Only runs when relevant files are changed

### 2. Validate API Documentation (`validate-api-docs.yml`)

**Trigger:** Pull Requests affecting documentation files **Purpose:** Validate API documentation structure and content

**Features:**

- ✅ Validates JSON structure
- ✅ Checks required fields
- ✅ Tests documentation generation
- ✅ Verifies JSDoc comments in source files

### 3. Update Documentation on Change (`update-docs-on-change.yml`)

**Trigger:** Push to main/develop branches, Manual dispatch **Purpose:** Update documentation immediately when code changes

**Features:**

- ✅ Automatically commits changes
- ✅ Creates pull requests for non-main branches
- ✅ Provides detailed summaries
- ✅ Handles merge conflicts gracefully

### 4. Scheduled Documentation Update (`scheduled-docs-update.yml`)

**Trigger:** Daily at 2 AM UTC, Manual dispatch **Purpose:** Ensure documentation stays up-to-date

**Features:**

- ✅ Runs daily to catch any missed updates
- ✅ Creates pull requests for changes
- ✅ Provides comprehensive summaries
- ✅ Can be triggered manually

## 🚀 How It Works

### Automatic Workflow

1. **Code Push** → Triggers `update-docs-on-change.yml`
2. **Generate Docs** → Runs `npm run docs:build`
3. **Check Changes** → Compares with previous version
4. **Commit & Push** → If changes detected
5. **Create PR** → For non-main branches

### Validation Workflow

1. **PR Created** → Triggers `validate-api-docs.yml`
2. **Validate Structure** → Checks JSON format
3. **Test Generation** → Ensures scripts work
4. **Check JSDoc** → Verifies source comments
5. **Report Results** → Shows validation status

### Scheduled Workflow

1. **Daily Trigger** → Runs `scheduled-docs-update.yml`
2. **Generate Docs** → Updates from latest code
3. **Check Changes** → Compares with current version
4. **Create PR** → If any changes found
5. **Summary** → Reports update status

## 🔧 Configuration

### Required Secrets

No additional secrets are required. The workflows use the default `GITHUB_TOKEN`.

### File Paths

The workflows monitor these paths for changes:

- `core/**` - Core library files
- `extension/**` - Extension files
- `plugins/**` - Plugin files
- `page/scripts/**` - Documentation scripts

### Branch Protection

For optimal results, consider enabling branch protection rules:

- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

## 📊 Monitoring

### Workflow Status

Check the **Actions** tab in your GitHub repository to monitor workflow runs.

### Notifications

- ✅ Successful runs are logged
- ❌ Failed runs send notifications
- 📝 Pull requests are created for changes
- 📊 Summaries are provided in workflow runs

### Troubleshooting

Common issues and solutions:

1. **Workflow fails to run**

   - Check if files in monitored paths have changed
   - Verify Node.js version compatibility
   - Check for syntax errors in scripts

2. **Documentation not updating**

   - Ensure JSDoc comments are properly formatted
   - Check if `npm run docs:build` works locally
   - Verify file paths in workflow configuration

3. **Pull requests not created**
   - Check repository permissions
   - Verify branch protection rules
   - Ensure workflow has write access

## 🎯 Benefits

- **🔄 Automated Updates** - Documentation stays current
- **✅ Quality Assurance** - Validates content structure
- **📝 Change Tracking** - Clear history of updates
- **🚀 Easy Maintenance** - Minimal manual intervention
- **📊 Comprehensive Reporting** - Detailed status summaries

## 📚 Related Files

- `page/scripts/` - Documentation generation scripts
- `page/components/GeneratedApiContent.ts` - Generated documentation
- `page/package.json` - NPM scripts for documentation
- `page/scripts/README.md` - Detailed usage instructions
