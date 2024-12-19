require('dotenv').config();
const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

const VIRUSTOTAL_API = process.env.VIRUSTOTAL_API;
const discord_webhook = process.env.discord_webhook;

let credentials;
let token;

try {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
} catch (err) {
    console.error('Error loading credentials.json:', err.message);
    process.exit(1);
}

const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

try {
    token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
} catch (err) {
    console.error('Error loading token.json:', err.message);
    getAccessToken(oAuth2Client);
}

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.modify'],
    });
    console.log('Authorize this app by visiting this URL:', authUrl);
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error retrieving access token', err);
                process.exit(1);
            }
            oAuth2Client.setCredentials(token);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log('Token stored to', TOKEN_PATH);
            rl.close();
        });
    });
}

const processedMessages = new Set();

async function checkRecentMessages() {
    try {
        const now = Math.floor(Date.now() / 1000);
        const twoSecondsAgo = now - 2;

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: `after:${twoSecondsAgo}`,
        });

        if (!res.data.messages) {
            console.log('No new messages.');
            return;
        }

        for (const message of res.data.messages) {
            if (!processedMessages.has(message.id)) {
                processedMessages.add(message.id);
                await processMessage(message.id);
            }
        }
    } catch (err) {
        console.error('Error checking messages:', err.message);
    }
}

async function processMessage(messageId) {
    try {
        const res = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
        });

        const headers = res.data.payload.headers;
        const subject = headers.find((header) => header.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((header) => header.name === 'From')?.value || 'Unknown Sender';
        const body = getMessageBody(res.data.payload);

        console.log(`Processing message:
- Subject: ${subject}
- From: ${from}`);

        const links = [...new Set(extractLinks(body))]; // Remove duplicate links

        if (links.length > 0) {
            console.log('Unique links found:', links);
            for (const link of links) {
                await checkLinkWithVirusTotal(link, from, subject);
                await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
            }
        }
    } catch (err) {
        console.error('Error processing message:', err.message);
    }
}

function getMessageBody(payload) {
    let body = '';

    if (payload.body?.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
        payload.parts.forEach((part) => {
            if (part.body?.data) {
                body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
        });
    }

    return body;
}

function extractLinks(body) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return body.match(urlRegex) || [];
}

async function checkLinkWithVirusTotal(link, sender, subject) {
    try {
        const response = await axios.post(
            'https://www.virustotal.com/api/v3/urls',
            new URLSearchParams({ url: link }),
            {
                headers: { 'x-apikey': VIRUSTOTAL_API },
            }
        );

        const analysisId = response.data.data.id;

        const analysisResult = await axios.get(
            `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
            {
                headers: { 'x-apikey': VIRUSTOTAL_API },
            }
        );

        const malicious = Object.values(analysisResult.data.data.attributes.results).some(
            (result) => result.category === 'malicious'
        );

        if (malicious) {
            console.log(`Malicious link detected: ${link}`);
            await sendDiscordWebhook(link, sender, subject);
        }
    } catch (err) {
        console.error(`Error checking link with VirusTotal: ${link}`, err.message);
    }
}

async function sendDiscordWebhook(link, sender, subject) {
    try {
        await axios.post(discord_webhook, {
            content: `🚨 **Malicious Link Detected** 🚨
- **Link**: ${link}
- **Sender**: ${sender}
- **Subject**: ${subject}`,
        });
        console.log('Alert sent to Discord webhook.');
    } catch (err) {
        console.error('Error sending Discord webhook:', err.message);
    }
}

async function main() {
    setInterval(checkRecentMessages, 2000); // Check messages every 2 seconds
}

main();
