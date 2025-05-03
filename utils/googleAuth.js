const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL // The URL Google redirects TO on your backend
);

const getGoogleAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    console.log(
        process.env.GOOGLE_CLIENT_ID,
        "========",
        process.env.GOOGLE_CLIENT_SECRET,
        "========",
        process.env.GOOGLE_CALLBACK_URL 
    )

    return client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: scopes,
        prompt: 'consent', // Optional: Forces consent screen
    });
};

const getGoogleUserInfo = async (code) => {
    try {
        // Exchange authorization code for tokens
        console.log(code)
        const { tokens } = await client.getToken(code);
        // Set credentials on the client
        client.setCredentials(tokens);

        // Optionally store tokens.access_token and tokens.refresh_token if needed

        // Fetch user profile using the ID token or access token
        // Using ID token is generally preferred for profile info
        console.log(tokens)
        if (tokens.id_token) {
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            return {
                googleId: payload.sub, // Google's unique ID
                email: payload.email,
                name: payload.name,
                avatarUrl: payload.picture,
                isVerified: payload.email_verified,
            };
        } else {
             // Fallback or alternative: Use access token to call Google People API
             // Requires enabling People API in Google Cloud Console
             console.warn('ID token not found, cannot fetch user info via ID token.');
             // const people = google.people({ version: 'v1', auth: client });
             // const me = await people.people.get({ resourceName: 'people/me', personFields: 'names,emailAddresses,photos' });
             // // Extract info from 'me' response...
             return null;
        }
    } catch (error) {
        console.error('Error exchanging code or getting user info:', error);
        throw new Error('Failed to authenticate with Google');
    }
};

module.exports = {
    getGoogleAuthUrl,
    getGoogleUserInfo,
};