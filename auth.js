const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const url = require('url');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
let credentials;

try {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
} catch (err) {
    console.error('Error loading credentials.json:', err.message);
    process.exit(1);
}

const { client_id, client_secret, redirect_uris } = credentials.web;

if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    console.error('No valid redirect URIs found in credentials.json');
    process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
    ],
});

console.log('Authorize this app by visiting this URL:\n', authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Paste the full URL you were redirected to here: ', (fullUrl) => {
    try {
        const parsedUrl = new url.URL(fullUrl); 
        const code = parsedUrl.searchParams.get('code'); 

        if (!code) {
            console.error('Error: No "code" parameter found in the URL.');
            rl.close();
            process.exit(1);
        }

        console.log('Authorization code extracted successfully.');

        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error retrieving access token:', err.message);
                rl.close();
                process.exit(1);
            }

            oAuth2Client.setCredentials(token);

            try {
                fs.writeFileSync('token.json', JSON.stringify(token));
                console.log('Token stored to token.json');
            } catch (err) {
                console.error('Error writing token.json:', err.message);
            }

            rl.close();
        });
    } catch (err) {
        console.error('Error parsing URL:', err.message);
        rl.close();
        process.exit(1);
    }
});
