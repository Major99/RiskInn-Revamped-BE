    // utils/googleAuth.js
    const { OAuth2Client } = require('google-auth-library');

    // --- Log environment variables right before use ---
    console.log("--- Google Auth Util ---");
    console.log("Attempting to read GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Exists" : "MISSING or Undefined");
    console.log("Attempting to read GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Exists" : "MISSING or Undefined");
    console.log("Attempting to read GOOGLE_CALLBACK_URL:", process.env.GOOGLE_CALLBACK_URL ? "Exists" : "MISSING or Undefined");
    // --- End Log ---

    // Ensure variables are loaded before creating the client
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
        console.error("FATAL ERROR: Missing required Google OAuth environment variables!");
        // Optionally throw an error to prevent server start without proper config
        // throw new Error("Missing Google OAuth environment variables!");
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
        // ... (keep the rest of this function as before) ...
        try {
            const { tokens } = await client.getToken(code);
            client.setCredentials(tokens);
            if (tokens.id_token) {
                const ticket = await client.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: GOOGLE_CLIENT_ID, // Use variable here too
                });
                const payload = ticket.getPayload();
                return { /* ... user info ... */ };
            }
            return null;
        } catch (error) {
            console.error('Error exchanging code or getting user info:', error);
            throw new Error('Failed to authenticate with Google');
        }
    };

    module.exports = {
        getGoogleAuthUrl,
        getGoogleUserInfo,
    };
    