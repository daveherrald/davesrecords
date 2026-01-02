# Apple Sign In Setup Guide

This guide walks you through setting up Apple Sign In for Dave's Records.

## Prerequisites

- Apple Developer Account ($99/year)
- Access to your domain's DNS settings

## Step 1: Create an App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → Click **Continue**
5. Select **App** → Click **Continue**
6. Fill in:
   - **Description**: Dave's Records
   - **Bundle ID**: `com.davesrecords.app` (or your preferred identifier)
7. Under **Capabilities**, enable **Sign in with Apple**
8. Click **Continue** → **Register**

## Step 2: Create a Services ID

1. In **Identifiers**, click **+** button again
2. Select **Services IDs** → Click **Continue**
3. Fill in:
   - **Description**: Dave's Records Web
   - **Identifier**: `com.davesrecords.web` (this will be your `APPLE_CLIENT_ID`)
4. Enable **Sign in with Apple**
5. Click **Configure** next to Sign in with Apple
6. In the configuration:
   - **Primary App ID**: Select the App ID you created in Step 1
   - **Domains and Subdomains**: Add `davesrecords.com` (your domain)
   - **Return URLs**: Add `https://davesrecords.com/api/auth/callback/apple`
7. Click **Save** → **Continue** → **Register**

## Step 3: Create a Key

1. Navigate to **Keys** → Click **+** button
2. Fill in:
   - **Key Name**: Dave's Records Sign In Key
3. Enable **Sign in with Apple**
4. Click **Configure** next to Sign in with Apple
5. Select your **Primary App ID** from Step 1
6. Click **Save** → **Continue** → **Register**
7. **Download the key file** (.p8 file) - you can only download this once!
8. Note the **Key ID** shown on the page

## Step 4: Generate Client Secret

Apple Sign In requires a JWT token as the client secret. You'll need to generate this using your private key.

### Option 1: Use a JWT Generator Tool

Use an online tool or library to generate a JWT with these parameters:

**Header:**
```json
{
  "alg": "ES256",
  "kid": "YOUR_KEY_ID"
}
```

**Payload:**
```json
{
  "iss": "YOUR_TEAM_ID",
  "iat": 1234567890,
  "exp": 1234567890,
  "aud": "https://appleid.apple.com",
  "sub": "com.davesrecords.web"
}
```

**Sign with:** Your .p8 private key file

### Option 2: Use Node.js Script

Create a file `generate-apple-secret.js`:

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('./AuthKey_XXXXX.p8', 'utf8');

const token = jwt.sign(
  {
    iss: 'YOUR_TEAM_ID',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 180 days
    aud: 'https://appleid.apple.com',
    sub: 'com.davesrecords.web'
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: 'YOUR_KEY_ID'
    }
  }
);

console.log(token);
```

Run: `node generate-apple-secret.js`

## Step 5: Find Your Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Your **Team ID** is shown in the top right corner of the page
3. Or navigate to **Membership** to see it

## Step 6: Configure Environment Variables

Add these to your `.env.production` file:

```bash
# Apple Sign In
APPLE_CLIENT_ID="com.davesrecords.web"  # Your Services ID
APPLE_CLIENT_SECRET="eyJhbGciOi..."      # The JWT token you generated
```

## Step 7: Deploy and Test

1. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add Apple Sign In support"
   git push origin main
   ```

2. Verify environment variables are set in Vercel:
   - Go to your Vercel project settings
   - Add `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET`
   - Redeploy

3. Test the sign-in flow:
   - Visit your sign-in page
   - Click "Sign in with Apple"
   - Verify authentication works

## Troubleshooting

**"Invalid client"**
- Double-check your Services ID matches `APPLE_CLIENT_ID`
- Verify the redirect URI in Apple Developer Portal exactly matches your callback URL

**"Invalid grant"**
- Your JWT token may have expired (regenerate it)
- Check that your Team ID and Key ID are correct

**"Invalid token"**
- Ensure you're using the ES256 algorithm
- Verify the .p8 private key is correct
- Check the JWT payload fields

## Notes

- The JWT token expires after 6 months max - you'll need to regenerate it periodically
- Keep your .p8 private key file secure - never commit it to git
- The client secret (JWT) can be safely stored in environment variables

## Resources

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [NextAuth Apple Provider Docs](https://next-auth.js.org/providers/apple)
- [JWT.io Debugger](https://jwt.io/) - for debugging JWTs
