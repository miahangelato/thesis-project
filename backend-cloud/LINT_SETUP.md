# Backend Linting & Formatting Setup

This Django backend uses **Ruff** for lightning-fast Python linting and formatting.

## 🚀 Quick Start

### Check for issues:
```bash
ruff check .
```

### Auto-fix issues:
```bash
ruff check --fix .
```

### Format code:
```bash
ruff format .
```

### Check formatting (dry run):
```bash
ruff format --check .
```

### Full lint + format (recommended before commit):
```bash
ruff check --fix . && ruff format .
```

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `ruff check .` | Check for linting errors |
| `ruff check --fix .` | Auto-fix linting errors |
| `ruff format .` | Format all Python files |
| `ruff format --check .` | Check if files are formatted (CI/CD) |
| `ruff check --watch .` | Watch mode (auto-check on file changes) |

---

## 🔧 Configuration

All configuration is in `pyproject.toml`:

### Rules Enabled:
- ✅ **E/W** - PEP 8 style (pycodestyle)
- ✅ **F** - Logical errors (pyflakes)
- ✅ **I** - Import sorting (isort)
- ✅ **N** - Naming conventions
- ✅ **UP** - Modern Python syntax (pyupgrade)
- ✅ **B** - Bug detection (bugbear)
- ✅ **DJ** - Django-specific rules
- ✅ **PL** - Pylint rules

### Ignored Directories:
- `migrations/` (auto-generated)
- `venv/`, `.venv/`
- `__pycache__/`
- `.pytest_cache/`

---

## 🎯 VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "[python]": {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll": true,
      "source.organizeImports": true
    },
    "editor.defaultFormatter": "charliermarsh.ruff"
  }
}
```

Install the **Ruff extension** in VS Code:
- Extension ID: `charliermarsh.ruff`

---

## 📝 Pre-commit Hook (Optional)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
echo "Running Ruff linter..."
ruff check --fix .
ruff format .
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## 🐛 Common Fixes

### Unused imports:
```bash
ruff check --select F401 --fix .
```

### Import sorting:
```bash
ruff check --select I --fix .
```

### Modernize Python syntax:
```bash
ruff check --select UP --fix .
```

---

## 📊 Current Status

Run `ruff check .` to see current linting status.
Run `ruff format --check .` to see formatting status.

---

## 🆘 Troubleshooting

**Issue:** Too many errors  
**Fix:** Run `ruff check --fix .` to auto-fix most issues

**Issue:** Line too long  
**Fix:** Handled automatically by `ruff format`

**Issue:** Import errors  
**Fix:** Run `ruff check --select I --fix .`

---

**Happy linting! 🎉**
