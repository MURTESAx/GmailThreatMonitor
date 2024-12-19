const axios = require('axios');
const qs = require('qs');
const fs = require('fs');

async function checkToken() {
    let tokens;
    
    try {
        tokens = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    } catch (error) {
        console.error('Error reading token from file:', token, error);
        return;
    }

    if (!tokens || !tokens.access_token) {
        console.log('No access token found or token is invalid.');
        return;
    }

    const { access_token, refresh_token, expiry_date } = tokens;
    
    const currentTime = Date.now();
    
    if (expiry_date && currentTime > expiry_date) {
        console.log('Access token has expired. Refreshing token...');
        
        await refreshAccessToken(refresh_token);
    } else {
        console.log('Access token is valid. Checking Gmail account...');
        await checkGmailAccount(access_token);
    }
}

async function refreshAccessToken(refresh_token) {
    const credentials = require('./credentials.json');
    const { client_id, client_secret, redirect_uris } = credentials.web;

    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const data = qs.stringify({
        refresh_token: refresh_token,
        client_id: client_id,
        client_secret: client_secret,
        grant_type: 'refresh_token',
    });

    try {
        const response = await axios.post(tokenUrl, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, expires_in } = response.data;

        const updatedTokens = {
            access_token,
            refresh_token,
            expiry_date: Date.now() + expires_in * 1000, 
        };

        fs.writeFileSync('token.json', JSON.stringify(updatedTokens, null, 2));

        console.log('Refreshed Access Token:', access_token);
        await checkGmailAccount(access_token);
    } catch (error) {
        console.error('Error refreshing the token:', error);
    }
}

async function checkGmailAccount(access_token) {
    try {
        const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/profile', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const { emailAddress } = response.data;
        console.log('Gmail Account Email:', emailAddress);
    } catch (error) {
        console.error('Error fetching Gmail account details:', error);
        if (error.response && error.response.status === 401) {
            console.log('Token may be invalid or expired.');
        }
    }
}

checkToken();
