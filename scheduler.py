import os
import json
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from gmail_service import (
    get_access_token, fetch_unread_emails,
    fetch_email_content, extract_email_body, extract_email_headers
)
from fcm_service import send_phishing_notification

# These will be set from app.py
firestore_client = None
service_account_info = None
PROJECT_ID = "phishguard-ai-6e7ac"
BACKEND_URL = "https://phishing-email-backend-7a45.onrender.com"
CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")


def scan_all_users():
    """Main job — runs every 5 minutes. Scans Gmail for all registered users."""
    print("=== AUTO-SCAN JOB STARTED ===")

    if not firestore_client:
        print("Firestore not initialized — skipping scan")
        return

    try:
        # Get all users who have registered their Gmail token
        users_ref = firestore_client.collection("gmail_tokens")
        users = users_ref.stream()

        for user_doc in users:
            user_data = user_doc.to_dict()
            uid = user_doc.id
            refresh_token = user_data.get("refresh_token")
            fcm_token = user_data.get("fcm_token")

            if not refresh_token:
                continue

            print(f"Scanning Gmail for user: {uid[:8]}...")

            try:
                # Get fresh access token
                access_token = get_access_token(refresh_token, CLIENT_ID, CLIENT_SECRET)

                # Fetch unread emails
                messages = fetch_unread_emails(access_token, max_results=10)

                if not messages:
                    print(f"No unread emails for {uid[:8]}")
                    continue

                for msg_ref in messages:
                    msg = fetch_email_content(access_token, msg_ref["id"])
                    body = extract_email_body(msg)
                    subject, from_addr, date = extract_email_headers(msg)

                    if not body.strip():
                        continue

                    # Scan through your 6-engine backend
                    try:
                        scan_res = requests.post(
                            f"{BACKEND_URL}/api/scan",
                            json={"email_text": body},
                            timeout=30
                        )
                        scan_data = scan_res.json()
                    except Exception as e:
                        print(f"Scan error for {subject[:30]}: {e}")
                        continue

                    verdict = scan_data.get("verdict") or scan_data.get("label") or "unknown"
                    score = scan_data.get("score", 0)

                    print(f"  {subject[:40]} — {verdict} ({score})")

                    # Save to Firestore
                    firestore_client.collection("scans").add({
                        "uid": uid,
                        "subject": subject,
                        "from": from_addr,
                        "date": date,
                        "verdict": verdict,
                        "score": score,
                        "source": "gmail-background",
                        "timestamp": __import__("google.cloud.firestore", fromlist=["SERVER_TIMESTAMP"]).SERVER_TIMESTAMP
                    })

                    # Send push notification if phishing
                    if verdict == "phishing" and fcm_token and service_account_info:
                        send_phishing_notification(
                            fcm_token, subject, score,
                            service_account_info, PROJECT_ID
                        )

            except Exception as e:
                print(f"Error scanning user {uid[:8]}: {e}")
                continue

    except Exception as e:
        print(f"Auto-scan job error: {e}")

    print("=== AUTO-SCAN JOB COMPLETE ===")


def start_scheduler():
    """Start the background scheduler."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        scan_all_users,
        trigger="interval",
        minutes=5,
        id="gmail_auto_scan",
        replace_existing=True
    )
    scheduler.start()
    print("✅ Background scheduler started — scanning every 5 minutes")
    return scheduler