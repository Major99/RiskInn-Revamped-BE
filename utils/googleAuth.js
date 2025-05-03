const { OAuth2Client } = require('google-auth-library');

// Load variables immediately
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL; // Backend callback

console.log("[Google Auth Util] Initializing with Client ID:", GOOGLE_CLIENT_ID ? "Loaded" : "MISSING!");
console.log("[Google Auth Util] Callback URL:", GOOGLE_CALLBACK_URL);

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    console.error("FATAL: Missing essential Google OAuth ENV VARS at initialization!");
}

const client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
);


const getGoogleAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    try {
        const url = client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
        });
         console.log("Generated Google Auth URL:", url); // Log the generated URL
         return url;
    } catch (error) {
        console.error("Error generating Google Auth URL:", error);
        throw new Error("Could not generate Google Auth URL");
    }
};

const getGoogleUserInfo = async (code) => {
    console.log("[Google Auth Util] Attempting to get tokens for code:", code ? code.substring(0, 10) + "..." : "No Code");
    try {
        // 1. Exchange authorization code for tokens
        const { tokens } = await client.getToken(code);
        console.log("[Google Auth Util] Tokens received from Google:", tokens ? Object.keys(tokens) : "No Tokens"); // Log received token keys

        if (!tokens || !tokens.id_token) {
             console.error("[Google Auth Util] ID token missing in Google's response.");
             throw new Error("ID token missing from Google response.");
        }

        client.setCredentials(tokens); // Set credentials for potential future API calls

        // 2. Verify ID token and get payload
        console.log("[Google Auth Util] Verifying ID token...");
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        console.log("[Google Auth Util] ID token payload verified successfully.");

        if (!payload || !payload.sub || !payload.email) {
            console.error("[Google Auth Util] Invalid payload received from ID token:", payload);
            throw new Error("Invalid user information in Google token.");
        }

        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            avatarUrl: payload.picture,
            isVerified: payload.email_verified,
        };

    } catch (error) {
        console.error('[Google Auth Util] Error during token exchange or verification:', error.message);
        // Log the specific error structure if available
        if (error.response?.data) {
             console.error('[Google Auth Util] Google API Error Response:', error.response.data);
        }
        // Don't throw the generic error here, let the controller handle it
        // throw new Error('Failed to authenticate with Google');
        return null; // Return null to indicate failure to the controller
    }
};

module.exports = {
    getGoogleAuthUrl,
    getGoogleUserInfo,
};
