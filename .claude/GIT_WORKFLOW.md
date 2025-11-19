# PillCare - Git Workflow Guide

## Branch Strategy (Git Flow)

We follow the **Git Flow** branching model for organized and scalable development.

### Branch Structure

```
main (production)
  └── develop (default branch)
       ├── feature/* (new features)
       ├── bugfix/* (bug fixes)
       ├── hotfix/* (urgent production fixes)
       └── release/* (release preparation)
```

---

## Branch Types

### 1. **main**
- **Purpose**: Production-ready code only
- **Protected**: Yes
- **Merge from**: `release/*` or `hotfix/*` branches
- **Never commit directly to main**

### 2. **develop** (Default Branch)
- **Purpose**: Integration branch for ongoing development
- **Protected**: Yes (recommended)
- **Merge from**: `feature/*`, `bugfix/*`, `release/*` branches
- **All new branches start from here**

### 3. **feature/** (Feature Branches)
- **Purpose**: Develop new features
- **Branch from**: `develop`
- **Merge to**: `develop`
- **Naming**: `feature/<feature-name>`
- **Examples**:
  - `feature/medication-reminder`
  - `feature/user-authentication`
  - `feature/family-connection`
  - `feature/push-notifications`

### 4. **bugfix/** (Bug Fix Branches)
- **Purpose**: Fix bugs found in develop
- **Branch from**: `develop`
- **Merge to**: `develop`
- **Naming**: `bugfix/<bug-description>`
- **Examples**:
  - `bugfix/notification-not-firing`
  - `bugfix/login-error`

### 5. **hotfix/** (Hotfix Branches)
- **Purpose**: Emergency fixes for production
- **Branch from**: `main`
- **Merge to**: `main` AND `develop`
- **Naming**: `hotfix/<issue-description>`
- **Examples**:
  - `hotfix/critical-crash-on-ios`
  - `hotfix/security-vulnerability`

### 6. **release/** (Release Branches)
- **Purpose**: Prepare for production release
- **Branch from**: `develop`
- **Merge to**: `main` AND `develop`
- **Naming**: `release/v<version>`
- **Examples**:
  - `release/v0.1.0`
  - `release/v1.0.0`

---

## Workflow Examples

### Starting a New Feature

```bash
# Make sure you're on develop
git checkout develop
git pull origin develop

# Create new feature branch
git checkout -b feature/medication-reminder

# Work on your feature...
git add .
git commit -m "feat: Add medication reminder notification"

# Push to remote
git push -u origin feature/medication-reminder

# Create Pull Request to develop
```

### Fixing a Bug

```bash
# From develop
git checkout develop
git pull origin develop

# Create bugfix branch
git checkout -b bugfix/notification-timing

# Fix the bug...
git add .
git commit -m "fix: Correct notification scheduling logic"

# Push and create PR
git push -u origin bugfix/notification-timing
```

### Hotfix for Production

```bash
# From main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/crash-on-startup

# Fix critical issue...
git add .
git commit -m "hotfix: Fix app crash on startup"

# Push
git push -u origin hotfix/crash-on-startup

# Create PR to main
# After merge to main, also merge to develop!
```

### Preparing a Release

```bash
# From develop
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v0.1.0

# Bump version, update changelog, final testing...
git add .
git commit -m "chore: Bump version to 0.1.0"

# Push
git push -u origin release/v0.1.0

# Create PR to main
# After merge to main, tag the release
# Also merge back to develop
```

---

## Commit Message Convention (Conventional Commits)

We follow **Conventional Commits** for clear and structured commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code formatting (no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Add or update tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD configuration changes

### Examples

```bash
# Feature
git commit -m "feat(medication): Add medication reminder notification"

# Bug fix
git commit -m "fix(auth): Resolve login timeout issue"

# Documentation
git commit -m "docs(readme): Update installation instructions"

# Refactoring
git commit -m "refactor(api): Simplify medication API endpoints"

# Performance
git commit -m "perf(list): Optimize medication list rendering"

# Tests
git commit -m "test(reminder): Add unit tests for reminder service"

# Chore
git commit -m "chore(deps): Update React Native to v0.73"

# With scope and body
git commit -m "feat(notifications): Implement push notification system

- Add FCM configuration
- Create notification service
- Add notification permission request
- Implement notification scheduling

Closes #123"
```

### Scope Examples for PillCare

- `medication`: Medication management features
- `reminder`: Reminder/notification features
- `auth`: Authentication/authorization
- `family`: Family connection features
- `ui`: UI/UX components
- `api`: Backend API changes
- `db`: Database schema changes
- `deps`: Dependency updates

---

## Pull Request Guidelines

### PR Title Format

Follow the same convention as commit messages:

```
feat(medication): Add medication reminder screen
fix(notification): Resolve iOS notification issue
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] New feature (feat)
- [ ] Bug fix (fix)
- [ ] Documentation (docs)
- [ ] Refactoring (refactor)
- [ ] Performance (perf)
- [ ] Test (test)
- [ ] Chore (chore)

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings
```

---

## Branch Protection Rules (Recommended)

### For `main` branch:
- ✅ Require pull request reviews (at least 1 approval)
- ✅ Require status checks to pass (CI/CD)
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Restrict who can push (only via PR)

### For `develop` branch:
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

---

## Quick Reference Commands

```bash
# Check current branch
git branch

# List all branches (including remote)
git branch -a

# Switch to develop
git checkout develop

# Create and switch to new feature branch
git checkout -b feature/my-feature

# Update current branch with latest from develop
git checkout develop
git pull origin develop
git checkout feature/my-feature
git merge develop

# Delete local branch
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature

# View commit history
git log --oneline --graph --all

# Stash changes
git stash
git stash pop
```

---

## Current Branch Status

```
✅ main           (production)
✅ develop        (default branch - integration)
✅ feature/project-setup (current - initial setup)
```

---

## Tips

1. **Always pull before creating a new branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **Keep feature branches small and focused**
   - One feature = one branch
   - Easier to review and merge

3. **Rebase vs Merge**
   - Use `merge` for PR merges (keeps history)
   - Use `rebase` for updating feature branch with develop (cleaner history)

4. **Delete branches after merge**
   - Keeps repository clean
   - GitHub can auto-delete after PR merge

5. **Commit early, commit often**
   - Small, atomic commits
   - Easier to track changes and revert if needed

---

**Last Updated**: 2025-11-19
**Workflow Type**: Git Flow
**Default Branch**: develop
