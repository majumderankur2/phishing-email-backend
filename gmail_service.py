import base64
import requests


def get_access_token(refresh_token, client_id, client_secret):
    """Exchange refresh token for a fresh access token."""
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
        }
    )
    data = response.json()
    if "access_token" not in data:
        raise Exception(f"Failed to refresh token: {data}")
    return data["access_token"]


def fetch_unread_emails(access_token, max_results=10):
    """Fetch list of unread email IDs from Gmail."""
    response = requests.get(
        "https://www.googleapis.com/gmail/v1/users/me/messages",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"labelIds": "UNREAD", "maxResults": max_results}
    )
    data = response.json()
    return data.get("messages", [])


def fetch_email_content(access_token, message_id):
    """Fetch full content of a single email."""
    response = requests.get(
        f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"format": "full"}
    )
    return response.json()


def extract_email_body(message):
    """Extract plain text body from Gmail message."""
    payload = message.get("payload", {})
    parts = payload.get("parts", [])

    # Try parts first
    for part in parts:
        if part.get("mimeType") == "text/plain":
            data = part.get("body", {}).get("data", "")
            if data:
                return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")

    # Try nested parts
    for part in parts:
        for subpart in part.get("parts", []):
            if subpart.get("mimeType") == "text/plain":
                data = subpart.get("body", {}).get("data", "")
                if data:
                    return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")

    # Fallback to top-level body
    data = payload.get("body", {}).get("data", "")
    if data:
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")

    return ""


def extract_email_headers(message):
    """Extract subject, from, date from email headers."""
    headers = message.get("payload", {}).get("headers", [])
    subject = next((h["value"] for h in headers if h["name"] == "Subject"), "(No subject)")
    from_addr = next((h["value"] for h in headers if h["name"] == "From"), "(Unknown)")
    date = next((h["value"] for h in headers if h["name"] == "Date"), "")
    return subject, from_addr, date