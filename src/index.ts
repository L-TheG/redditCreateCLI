import * as dotenv from "dotenv";
import concurrently from "concurrently";
import path from "path";
import { cwd } from "process";

import { cpSync, readdirSync, writeFileSync } from "fs";

dotenv.config();
await main();

async function main() {
  const dataPath = path.join(cwd(), "/DataGetter/screenshots");
  const oldFolders = getAllFilesInDir(dataPath);

  const postLink = parseArgs();
  await installVideoCreator();
  await installDataGetter();
  await getData(postLink);

  const newFolder = (await getNewFolder(dataPath, oldFolders))[0];

  // Copy content to Remotion public directory
  cpSync(path.join(cwd(), "/DataGetter/screenshots/" + newFolder), path.join(cwd(), "/VideoCreator/public/" + newFolder), { recursive: true });
  createConfigFile(newFolder);

  await renderVideo(path.join(cwd(), "/DataGetter/screenshots" + newFolder + "/out/" + newFolder + ".mp4"), "RedditVid");
}

function createConfigFile(contentPath: string) {
  writeFileSync(path.join(cwd(), "VideoCreator/props.json"), JSON.stringify({ projectFolder: contentPath }));
}

function parseArgs() {
  let postLink: string | undefined;
  process.argv.forEach((element) => {
    if (element.includes("postLink=")) {
      postLink = element.split("=")[1];
    }
  });
  if (postLink === undefined) {
    console.log("No post link provided");
    process.exit();
  }
  return postLink;
}

async function installVideoCreator() {
  const command = concurrently([{ command: "npm i", name: "Install VideoCreator" }], {
    prefix: "name",
    killOthers: ["success", "failure"],
    restartTries: 0,
    cwd: path.join(cwd(), "/VideoCreator"),
  });
  await command.result;
}

async function installDataGetter() {
  const command = concurrently([{ command: "npm i", name: "Install DataGetter" }], {
    prefix: "name",
    killOthers: ["success", "failure"],
    restartTries: 0,
    cwd: path.join(cwd(), "/DataGetter"),
  });
  await command.result;
}

async function getData(postLink: string) {
  const command = concurrently(
    [
      {
        command: "npm run build && node build/index.js postLink=" + postLink,
        name: "Get Data",
        env: {
          MS_SPEECH_SERVICE_KEY: process.env.MS_SPEECH_SERVICE_KEY as string,
          MS_SPEECH_SERVICE_REGION: process.env.MS_SPEECH_SERVICE_REGION as string,
        },
      },
    ],
    {
      prefix: "name",
      killOthers: ["success", "failure"],
      restartTries: 0,
      cwd: path.join(cwd(), "/DataGetter"),
    }
  );

  await command.result;
}

async function renderVideo(outputLocation: string, compositionID: string) {
  const command = concurrently(
    [
      {
        command: "npx remotion render --props=./props.json " + compositionID + " " + outputLocation + " --concurrency=16 --gl=angle",
        name: "Remotion Render",
      },
    ],
    {
      prefix: "name",
      killOthers: ["success", "failure"],
      restartTries: 0,
      cwd: path.join(cwd(), "/VideoCreator"),
    }
  );

  await command.result;
}

async function getNewFolder(path: string, oldFolders: string[]) {
  const currentFolders = getAllFilesInDir(path);
  return currentFolders.filter((x) => !oldFolders.includes(x)).concat(oldFolders.filter((x) => !currentFolders.includes(x)));
}

function getAllFilesInDir(dir: string) {
  return readdirSync(dir);
}
