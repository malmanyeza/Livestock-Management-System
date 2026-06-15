# Privacy Policy for Zvipfuwo Livestock Management System

**Last Updated: June 15, 2026**  
**App Version: 1.0.0**

Welcome to Zvipfuwo. Zvipfuwo ("we", "us", or "our") operates the Zvipfuwo mobile application. We are committed to safeguarding the privacy and safety of our users ("you", "your", or "farmers") who utilize our Livestock Management System.

This Privacy Policy explains how we collect, use, process, store, and disclose your personal details and livestock records when you register and use the application. By downloading, signing up for, or using Zvipfuwo, you agree to the collection and use of information in accordance with this policy.

---

## 1. Information We Collect

To provide you with an effective and smart livestock logging experience, we collect specific information depending on how you use our app.

### A. Account & Profile Information
When you create an account, we collect your:
* Email address
* Full name
* Account password
* Account role (e.g., `farmer` or `admin`)

This information is essential to configure your secure environment and separate your data from other farmers.

### B. Livestock & Agricultural Records
We collect and store records you actively log within the application. This includes:
* **Animal Profiles:** Tag number, breed, gender, date of birth, status.
* **Weight & Production:** Weight records, growth milestones, production metrics (e.g., milk yield).
* **Health & Treatments:** Sickness records, vaccinations, medical treatments, and drug inventories.
* **Breeding & Reproduction:** Insemination records, pregnancy checks, and breeding logs.
* **Financials:** Sales, purchases, expenses, and transaction logs.
* **Inventory & Inspections:** Feed inventories, feed consumption logs, and farm inspections.

### C. Device & Diagnostics Information
We may collect standard device properties (e.g., operating system version, device model, or crash logs) to diagnose application bugs and enhance application performance.

---

## 2. How We Use Your Data

Zvipfuwo uses the collected data for the following purposes:
* **App Operation:** To manage your farmer profile, display analytics dashboards, track animal lineages, and calculate farm summaries.
* **Security & Authentication:** To verify your credentials when logging in and prevent unauthorized data modifications.
* **Breeding & Health Alarms:** To alert you of upcoming due dates, treatment dates, or health checkups based on your recorded calendars.
* **Performance Insights:** To display charts, reports, and weight fluctuations over time to aid your farming decisions.

---

## 3. Data Isolation & Security

Your livestock data is highly sensitive and represents your business. We treat security as our highest priority.

### PostgreSQL Row-Level Security (RLS)
The Zvipfuwo backend utilizes PostgreSQL Row-Level Security (RLS). Every table (`animals`, `health_records`, `breeding_records`, etc.) has strict RLS policies enabled.
* You can only read, write, or delete rows linked explicitly to your authenticated `user_id`.
* No other farmer can access or search your records.
* System administrators have administrative access to manage databases, but security restrictions remain in place to protect individual datasets.

### Security Best Practices Applied:
* **Data Encryption:** All communications between the mobile application and the database use encrypted Secure Socket Layer (SSL/HTTPS) protocols.
* **Secure Password Hashing:** Authentication is handled by industry-standard secure authentication channels. Passwords are salted and hashed cryptographically and are never stored in plain text.
* **Device Storage:** Local preferences and cache are isolated inside the device's sandbox partition, secured by the mobile OS.

---

## 4. Third-Party Services

We do not sell, rent, or trade your personal information or farming records. To operate the app, we work with select trusted third-party providers:
* **Supabase:** We use Supabase (built on AWS infrastructure) for authentication services, backend database hosting, and file storage. Supabase complies with strict cloud security requirements and GDPR frameworks.
* **Expo (Diagnostics):</strong> In development or crash-analysis states, standard debugging logs may be collected through Expo channels to resolve software crashes.

---

## 5. Device Permissions

To support specific logging features, Zvipfuwo may request access to the following hardware features on your phone. These are only requested when you trigger relevant features:
* **Camera Access:** We request camera permissions when you scan animal ear tag barcodes, QR codes, or if you capture animal photos for identification records.
* **Local Notifications:** We may request notification permissions to alert you on task events (e.g., upcoming vaccination dates, animal birth logs).
* **Local Storage:** We use local storage partitions (`AsyncStorage`) to cache preferences, local configurations, and speed up dashboard loads.

---

## 6. Your Rights

We believe in absolute data ownership. As a user of Zvipfuwo, you have the following rights concerning your data:
* **Right to Access:** You can see all your livestock and profile records at any time directly through the app interface.
* **Right to Rectification:** You can edit, update, or correct your records or profile details at any point.
* **Right to Erasure (Deletion):** You have the right to completely delete your profile and all associated livestock records. Deleting your account will invoke our cascades, permanently removing all database rows linked to your profile.

---

## 7. Contact Us & Updates

We may update this Privacy Policy from time to time. When updates occur, we will adjust the "Last Updated" date at the top of this page. We encourage you to review this page periodically for changes.

If you have any questions, concerns, or requests regarding this Privacy Policy or your data ownership, please contact us at:

**Zvipfuwo Support**  
* Email: [support@zvipfuwo.co.zw](mailto:support@zvipfuwo.co.zw)  
* GitHub: [malmanyeza/Livestock-Management-System](https://github.com/malmanyeza/Livestock-Management-System)
