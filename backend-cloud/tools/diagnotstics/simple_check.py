"""Simple check - just print consent value"""

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from api.session_manager import get_session_manager

session_id = "ae1537fa-650e-444f-8ed0-63668fccc363"
session_mgr = get_session_manager()
session = session_mgr.get_session(session_id)

if session:
    print(f"Session {session_id}:")
    print(f"  Consent: {session.get('consent')}")
    print(f"  Completed: {session.get('completed')}")
    print(f"  Has demographics: {session.get('demographics') is not None}")
    print(f"  Has predictions: {session.get('predictions') is not None}")
else:
    print(f"Session {session_id} not found or expired")
