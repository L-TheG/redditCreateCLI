import { createReadStream, statSync } from "fs";
import { clearLine, cursorTo } from "readline";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export async function uploadYoutubeVideo(vidSettings: { title: string; tags: string[]; fileName: string; description: string }) {
  const date = new Date();
  const test = date.setHours(date.getHours() + 2);
  const isodate = new Date(test).toISOString();

  const clientSecret = process.env.YT_OAUTH_CLIENT_SECRET;
  const clientId = process.env.YT_OAUTH_CLIENT_ID;
  const redirectUrl = process.env.YT_OAUTH_REDIRECT_URL;
  const service = google.youtube("v3");
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  const response = await fetch("https://www.googleapis.com/oauth2/v4/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: process.env.YT_OAUTH_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const token = await response.json();
  oauth2Client.setCredentials({ access_token: token.access_token });

  await service.videos.insert(
    {
      part: ["id,snippet", "status"],
      auth: oauth2Client,
      notifySubscribers: true,
      requestBody: {
        snippet: {
          title: vidSettings.title,
          description: vidSettings.description, // hashtags must be included here
          channelId: process.env.YT_FOLYVORA_CHANNEL_ID,
          channelTitle: "Folyvora",
          tags: vidSettings.tags, // Tags dont show up as hashtags
          categoryId: "24", // 24 = "Entertainment"
        },
        status: {
          publishAt: isodate,
          privacyStatus: "private",
          madeForKids: false,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(vidSettings.fileName),
      },
    },
    {
      // Use the `onUploadProgress` event from Axios to track the
      // number of bytes uploaded to this point.
      onUploadProgress: (evt) => {
        const progress = (evt.bytesRead / statSync(vidSettings.fileName).size) * 100;
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0, undefined);
        process.stdout.write(`${Math.round(progress)}% complete`);
      },
    }
  );
}
