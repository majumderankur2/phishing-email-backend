import os
import requests
import google.auth.transport.requests
from google.oauth2 import service_account


def get_fcm_access_token(service_account_info):
    """Get OAuth2 access token for FCM v1 API."""
    credentials = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=["https://www.googleapis.com/auth/firebase.messaging"]
    )
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    return credentials.token


def send_phishing_notification(fcm_token, subject, score, service_account_info, project_id):
    """Send FCM push notification to user's device."""
    try:
        access_token = get_fcm_access_token(service_account_info)

        url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

        payload = {
            "message": {
                "token": fcm_token,
                "notification": {
                    "title": "⚠️ Phishing Email Detected!",
                    "body": f"Subject: {subject[:60]}\nRisk Score: {round(score)}"
                },
                "webpush": {
                    "notification": {
                        "title": "⚠️ Phishing Email Detected!",
                        "body": f"Subject: {subject[:60]}\nRisk Score: {round(score)}",
                        "icon": "/icon-192.png",
                        "badge": "/icon-192.png",
                        "vibrate": [200, 100, 200],
                    },
                    "fcm_options": {
                        "link": "https://phishing-email-frontend.vercel.app/history"
                    }
                }
            }
        }

        response = requests.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code == 200:
            print(f"FCM notification sent successfully for: {subject[:40]}")
        else:
            print(f"FCM error: {response.status_code} — {response.text}")

    except Exception as e:
        print(f"FCM send error: {e}")