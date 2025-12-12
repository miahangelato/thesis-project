# Backend Cloud (Django + Django Ninja)

Cloud-based backend deployed to Render.

## Stack
- Django 5.x
- Django Ninja (Fast async API)
- Supabase (PostgreSQL)
- LangChain (Report generation)

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Run development server
python manage.py runserver
```
