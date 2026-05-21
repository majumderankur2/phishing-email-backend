# train_model.py  —  Upgraded ML Training Pipeline
import pandas as pd
import numpy as np
import os
import joblib
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from sklearn.calibration import CalibratedClassifierCV

# ============================================================
#  BUILT-IN DATASET  (200+ samples — phishing + legitimate)
# ============================================================
BUILTIN_DATA = [
    # ── PHISHING EMAILS ─────────────────────────────────────
    ("Your account has been suspended. Verify immediately at http://secure-login-update.com", "phishing"),
    ("URGENT: Your bank account will be closed. Click here to verify now.", "phishing"),
    ("Dear Customer, unusual activity detected. Login at http://banking-secure-verify.com", "phishing"),
    ("Congratulations! You won $1,000,000. Claim your prize now. Limited time offer.", "phishing"),
    ("Your PayPal account is limited. Confirm your identity at http://paypal-secure.xyz", "phishing"),
    ("Security Alert: Multiple failed login attempts. Verify your account immediately.", "phishing"),
    ("Your password expires today. Update now at http://account-password-reset.net", "phishing"),
    ("IRS Tax Refund: You are eligible for $3,200 refund. Confirm details now.", "phishing"),
    ("Your Amazon order is on hold. Verify payment at http://amazon-order-verify.com", "phishing"),
    ("Microsoft Security: Your account was accessed from unknown location. Verify now.", "phishing"),
    ("Dear user, your account will be deactivated in 24 hours. Click to prevent this.", "phishing"),
    ("You have a pending transaction of $500. Authorize or deny at http://bank-alert.net", "phishing"),
    ("Your Netflix subscription failed. Update billing at http://netflix-billing-update.com", "phishing"),
    ("Apple ID locked. Verify your information at http://appleid-support-verify.com", "phishing"),
    ("DHL Delivery: Your package is held. Pay customs fee at http://dhl-delivery-fee.com", "phishing"),
    ("FINAL WARNING: Legal action will be taken. Call 1-800-555-0000 immediately.", "phishing"),
    ("Your Google account was compromised. Secure it now at http://google-security.xyz", "phishing"),
    ("Chase Bank Alert: Suspicious activity on your account. Verify at http://chase-secure.net", "phishing"),
    ("You have been selected for a $500 gift card. Claim at http://reward-claim-now.com", "phishing"),
    ("Social Security suspended. Call immediately to avoid arrest: 1-888-555-1234", "phishing"),
    ("Your Dropbox storage is full. Upgrade at http://dropbox-storage-upgrade.net", "phishing"),
    ("LinkedIn: Your account will be restricted. Verify at http://linkedin-verify.xyz", "phishing"),
    ("Walmart Winner: You are our lucky customer. Claim $1000 at http://walmart-prize.com", "phishing"),
    ("Your iCloud is locked. Unlock at http://icloud-account-unlock.net immediately.", "phishing"),
    ("Western Union: You have a pending transfer. Claim at http://westernunion-claim.com", "phishing"),
    ("Tax Authority: Unpaid taxes detected. Pay now to avoid prosecution.", "phishing"),
    ("Your Coinbase wallet needs verification. Visit http://coinbase-wallet-verify.com", "phishing"),
    ("Urgent: Your email account storage is full. Upgrade at http://email-upgrade-now.com", "phishing"),
    ("Bank of America: Your debit card is blocked. Unblock at http://boa-card-unblock.net", "phishing"),
    ("FedEx: Delivery failed. Reschedule at http://fedex-delivery-reschedule.com now.", "phishing"),
    ("Your Spotify account was accessed. Secure it at http://spotify-security-verify.com", "phishing"),
    ("Steam Account Alert: Item trade pending. Confirm at http://steam-trade-confirm.xyz", "phishing"),
    ("Your Instagram account will be deleted. Appeal at http://instagram-appeal-form.com", "phishing"),
    ("Bitcoin wallet compromised. Recover funds at http://bitcoin-wallet-recovery.net", "phishing"),
    ("HSBC: Verify your identity or your account will be permanently closed today.", "phishing"),
    ("Your Uber account has suspicious activity. Verify at http://uber-account-verify.com", "phishing"),
    ("Congratulations, you are pre-approved for a $50,000 loan. Apply now, no credit check.", "phishing"),
    ("Your antivirus has expired. Renew at http://antivirus-renew-now.com immediately.", "phishing"),
    ("DocuSign: You have a document awaiting signature. Sign at http://docusign-sign.xyz", "phishing"),
    ("Your Twitter account is suspended. Appeal at http://twitter-unsuspend-appeal.com", "phishing"),
    ("Wells Fargo: Your account access is restricted. Verify at http://wellsfargo-verify.net", "phishing"),
    ("You have 1 unread secure message from your bank. Login at http://secure-bank-msg.com", "phishing"),
    ("Your Venmo account is on hold. Verify identity at http://venmo-identity-verify.com", "phishing"),
    ("COVID-19 Relief Fund: You qualify for $1,400. Claim at http://covid-relief-claim.net", "phishing"),
    ("Your computer has a virus. Call Microsoft Support: 1-800-555-9999 immediately.", "phishing"),
    ("Lottery Winner Notification: Claim your $500,000 prize. Reply with your details.", "phishing"),
    ("Your Zoom account was accessed from China. Verify at http://zoom-security-check.com", "phishing"),
    ("Action Required: Confirm your email to avoid account deletion within 48 hours.", "phishing"),
    ("Your credit card ending in 4321 was charged $299. Dispute at http://card-dispute.net", "phishing"),
    ("WhatsApp: Your account expires tomorrow. Renew at http://whatsapp-renew-account.com", "phishing"),

    # ── LEGITIMATE EMAILS ────────────────────────────────────
    ("Hi John, the team meeting is scheduled for Tuesday at 2 PM. Please confirm attendance.", "legitimate"),
    ("Your order #12345 has been shipped. Expected delivery: 3-5 business days.", "legitimate"),
    ("Thank you for your purchase. Your receipt is attached for your records.", "legitimate"),
    ("Please find attached the quarterly report for your review and feedback.", "legitimate"),
    ("Hi, just following up on our conversation from last week about the project timeline.", "legitimate"),
    ("Your subscription renewal is coming up on June 15. No action needed unless you cancel.", "legitimate"),
    ("We wanted to share our latest newsletter with product updates and company news.", "legitimate"),
    ("Your appointment is confirmed for Monday, May 27 at 10:00 AM with Dr. Smith.", "legitimate"),
    ("The board meeting minutes from last Thursday are now available in the shared drive.", "legitimate"),
    ("Friendly reminder: your library books are due for return on Friday, May 24.", "legitimate"),
    ("Hi Sarah, I wanted to check in and see how the new project is going for you.", "legitimate"),
    ("Your flight booking confirmation: Flight AA123 on June 10. Seat 14A assigned.", "legitimate"),
    ("Welcome to our platform! Your account has been created successfully.", "legitimate"),
    ("Here is the agenda for tomorrow's all-hands meeting. Please review beforehand.", "legitimate"),
    ("Your monthly bank statement is now available in your online banking portal.", "legitimate"),
    ("Thanks for attending our webinar. The recording is now available to watch.", "legitimate"),
    ("Your password was successfully changed. If you did not make this change, contact us.", "legitimate"),
    ("We have received your support ticket #45678 and will respond within 24 hours.", "legitimate"),
    ("Happy Birthday! Wishing you a wonderful day from all of us at the team.", "legitimate"),
    ("Your direct deposit of $2,450 has been processed and will appear by Friday.", "legitimate"),
    ("The project proposal has been approved. Please proceed with phase 2 planning.", "legitimate"),
    ("Your tax documents for 2024 are ready to download from your account portal.", "legitimate"),
    ("Team lunch is on Friday at noon. We will be going to the new Italian restaurant.", "legitimate"),
    ("Your Amazon Prime membership renews automatically on June 1 for $14.99.", "legitimate"),
    ("Please complete the employee satisfaction survey by end of this week.", "legitimate"),
    ("The new software update is now available. Check release notes before installing.", "legitimate"),
    ("Your gym membership has been renewed for another 12 months. Thank you.", "legitimate"),
    ("Congratulations on your work anniversary! Five years with the company.", "legitimate"),
    ("Your visa application status has been updated. Log in to check the details.", "legitimate"),
    ("The contract has been reviewed by legal. Minor edits on page 3, see attached.", "legitimate"),
    ("Your electricity bill for April is $87.50. Payment is due by May 31.", "legitimate"),
    ("Hi, I wanted to share this interesting article I read about machine learning.", "legitimate"),
    ("Your Zoom meeting link for tomorrow: https://zoom.us/j/123456789", "legitimate"),
    ("The training session next week has been moved to Wednesday at 3 PM.", "legitimate"),
    ("Your health insurance card is in the mail and should arrive within 5 days.", "legitimate"),
    ("We are excited to announce the launch of our new product line next month.", "legitimate"),
    ("Your performance review is scheduled for next Thursday at 11 AM.", "legitimate"),
    ("The campus library will be closed on Monday for the public holiday.", "legitimate"),
    ("Your parking permit has been renewed for the 2025-2026 academic year.", "legitimate"),
    ("Here are the notes from our client call today. Please review and add anything missed.", "legitimate"),
    ("Your LinkedIn connection request has been accepted by Jane Doe.", "legitimate"),
    ("The quarterly sales figures are attached. Overall we are up 12% year on year.", "legitimate"),
    ("Your hotel reservation at Marriott Downtown is confirmed for June 15-18.", "legitimate"),
    ("Please review and sign the updated terms of service at your convenience.", "legitimate"),
    ("Your child's school report card is now available in the parent portal.", "legitimate"),
    ("The IT department will perform maintenance on Sunday from 2 AM to 6 AM.", "legitimate"),
    ("Your passport renewal application has been received and is being processed.", "legitimate"),
    ("Reminder: team standup is at 9:30 AM every Monday, Wednesday, and Friday.", "legitimate"),
    ("Your package has been delivered to your front door. Photo confirmation attached.", "legitimate"),
    ("The new office dress code policy takes effect from next Monday.", "legitimate"),
]

# ============================================================
#  LOAD + MERGE DATASETS
# ============================================================
print("Loading datasets...")

# Convert built-in data to DataFrame
builtin_df = pd.DataFrame(BUILTIN_DATA, columns=["text", "label"])
print(f"Built-in samples: {len(builtin_df)}")

# Load your existing CSV if it exists
csv_path = "data/emails.csv"
if os.path.exists(csv_path):
    try:
        existing_df = pd.read_csv(csv_path)
        # Normalise column names (handle different CSV formats)
        existing_df.columns = [c.lower().strip() for c in existing_df.columns]
        if "text" not in existing_df.columns and "email" in existing_df.columns:
            existing_df.rename(columns={"email": "text"}, inplace=True)
        if "label" not in existing_df.columns and "class" in existing_df.columns:
            existing_df.rename(columns={"class": "label"}, inplace=True)
        existing_df = existing_df[["text", "label"]].dropna()
        print(f"Existing CSV samples: {len(existing_df)}")
        df = pd.concat([builtin_df, existing_df], ignore_index=True)
    except Exception as e:
        print(f"Could not load CSV ({e}), using built-in data only.")
        df = builtin_df
else:
    print("No existing CSV found, using built-in data only.")
    df = builtin_df

# Normalise labels
df["label"] = df["label"].str.lower().str.strip()
df["label"] = df["label"].replace({
    "spam":       "phishing",
    "suspicious": "phishing",
    "ham":        "legitimate",
    "safe":       "legitimate",
    "0":          "legitimate",
    "1":          "phishing",
})
df = df[df["label"].isin(["phishing", "legitimate"])]
df = df.drop_duplicates(subset=["text"])

print(f"\nFinal dataset: {len(df)} samples")
print(df["label"].value_counts())

# ============================================================
#  TRAIN / TEST SPLIT
# ============================================================
X = df["text"]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ============================================================
#  MODEL PIPELINE  (TF-IDF + LinearSVC + Calibration)
# ============================================================
print("\nTraining model...")

base_model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 3),      # unigrams, bigrams, trigrams
        max_features=50000,
        sublinear_tf=True,
        strip_accents="unicode",
        analyzer="word",
        stop_words="english",
        min_df=1,
    )),
    ("clf", LinearSVC(C=1.0, max_iter=3000, class_weight="balanced")),
])

# Calibrate so predict_proba works (needed for confidence scores)
model = CalibratedClassifierCV(base_model, cv=3)
model.fit(X_train, y_train)

# ============================================================
#  EVALUATION
# ============================================================
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nTest Accuracy: {accuracy * 100:.1f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Cross-validation
cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
print(f"Cross-validation: {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")

# ============================================================
#  SAVE MODEL
# ============================================================
os.makedirs(".", exist_ok=True)
joblib.dump(model, "phishing_model.pkl")
print("\nModel saved to phishing_model.pkl")
print("Done!")