// Copyright 2016 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Usage: node upload.js PATH_TO_VIDEO_FILE
 */

import { createReadStream, statSync } from "fs";
import { join } from "path";
import { clearLine, cursorTo } from "readline";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import { cwd } from "process";

// initialize the Youtube API library
const youtube = google.youtube("v3");

// very basic example of uploading a video to youtube
export async function runSample(fileName: string) {
  // Obtain user credentials to use for the request
  const auth = await authenticate({
    keyfilePath: join(cwd(), "client_secret.json"),
    scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
  });
  google.options({ auth });

  const fileSize = statSync(fileName).size;
  const res = await youtube.videos.insert(
    {
      part: ["id,snippet", "status"],
      notifySubscribers: false,
      requestBody: {
        snippet: {
          title: "Node.js YouTube Upload Test",
          description: "Testing YouTube upload via Google APIs Node.js Client",
        },
        status: {
          privacyStatus: "private",
        },
      },
      media: {
        body: createReadStream(fileName),
      },
    },
    {
      // Use the `onUploadProgress` event from Axios to track the
      // number of bytes uploaded to this point.
      onUploadProgress: (evt) => {
        const progress = (evt.bytesRead / fileSize) * 100;
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0, undefined);
        process.stdout.write(`${Math.round(progress)}% complete`);
      },
    }
  );
  console.log("\n\n");
  console.log(res.data);
  return res.data;
}
