Gmail Security Bot

# Gmail Security Bot

A Node.js bot that automatically monitors your Gmail for malicious emails using VirusTotal's API and sends alerts via a Discord webhook.

## ⚡ Features
- Automatically scans Gmail inbox for malicious links or attachments.
- Utilizes VirusTotal API for advanced threat detection.
- Sends real-time alerts via a Discord webhook.
- 24/7 monitoring capability when deployed on a hosting service.

## 📋 Prerequisites

### Google Cloud Setup
1. Go to Google Cloud Console.
2. Create a new project.
3. Navigate to the API Library:
   - Search for "Gmail API."
   - Enable it.
4. Set up OAuth 2.0 credentials:
   - Add permission scopes for Gmail read/send access.
   - Download the credentials JSON file.
   - Save the file as \` credentials.json\` in your project folder.

### VirusTotal API
1. Create an account on VirusTotal.
2. Navigate to your profile and generate an API token.
3. Save the token in a \`.env\` file.

### Discord Webhook
1. Set up a Discord webhook from the desired channel settings.
2. Copy the webhook URL.
3. Save the URL in the \`.env\` file.

## 📦 Installation

### Clone the repository:
\`\`\`bash
git clone https://github.com/MURTESAx/GmailThreatMonitor.git
cd GmailThreatMonitor
\`\`\`

### Install dependencies:
\`\`\`bash
npm install
\`\`\`

### Set up environment variables:
Create a \`.env\` file in the root directory and add:
\`\`\`plaintext
VIRUSTOTAL_API=<your-virustotal-api-key>
DISCORD_WEBHOOK=<your-discord-webhook-url>
\`\`\`

## 🔑 Authentication

### Run the auth.js script:
\`\`\`bash
node auth.js
\`\`\`

### Follow the instructions to authenticate with Gmail.
### Verify the token:
\`\`\`bash
node check-token.js
\`\`\`

## 🚀 Usage

### Run the bot:
\`\`\`bash
node index.js
\`\`\`

## 🌐 Deployment

To ensure 24/7 monitoring, deploy the bot using services like:
- Heroku
- Replit
- AWS EC2

## 💻 UI Design

### Panel Overview
- Real-time scanning status of Gmail inbox.
- Displays malicious emails with sender, link, and VirusTotal analysis.

### Login Page
- Secure login with Gmail credentials (OAuth2).

### Settings
- Manage VirusTotal API key and Discord webhook.
- Reauthorize Gmail token if needed.

## 📚 About
- **Author**: Murtesa Gamer
- **Discord**: murtesa_gamer
- **GitHub**: [Project Link](https://github.com/MURTESAx/GmailThreatMonitor)
- **Purpose**: To help users avoid malicious links using VirusTotal.

## 🛠️ Support
If you encounter issues, contact via Discord: murtesa_gamer.

---

Thank you for using Gmail Security Bot! Don't forget to star the repository! ⭐
