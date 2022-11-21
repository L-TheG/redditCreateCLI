import fs, { createReadStream, mkdirSync, statSync, writeFileSync } from "fs";
import readline, { clearLine, cursorTo } from "readline";
import { google } from "googleapis";
import path from "path";
import { cwd } from "process";
import { OAuth2Client } from "google-auth-library";
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"];
const TOKEN_DIR = path.join(cwd(), "credentials");
const TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

// Writes all important oauthData to file (refresh token too)
export async function obtainNewAccessData() {
  await authorize();
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize() {
  const clientSecret = process.env.YT_OAUTH_CLIENT_SECRET;
  const clientId = process.env.YT_OAUTH_CLIENT_ID;
  const redirectUrl = process.env.YT_OAUTH_REDIRECT_URL;
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, async function (err, token) {
    if (err) {
      getNewToken(oauth2Client);
    } else {
      oauth2Client.credentials = JSON.parse(token.toString());
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client: OAuth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err: any, token: any) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token: any) {
  try {
    mkdirSync(TOKEN_DIR);
  } catch (err: any) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  writeFileSync(TOKEN_PATH, JSON.stringify(token));
}
