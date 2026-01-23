# Quick instruction for Manual Fix

## Add these two lines to config/settings.py

Find this section (around line 82-84):
```python
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://thesis-project-5tu3.*\.vercel\.app$",  # Vercel preview deployments
]
```

Change it to:
```python
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://thesis-project-5tu3.*\.vercel\.app$",  # Vercel preview deployments
    r"^https://.*\.team3thesis\.dev$",  # Custom domain subdomains (www, api, etc.)
    r"^https://team3thesis\.dev$",  # Root custom domain
]
```

This will allow CORS from www.team3thesis.dev and any other subdomains.
