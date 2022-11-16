import * as dotenv from "dotenv";
import concurrently from "concurrently";
import path from "path";
import { cwd } from "process";
import { cpSync, readdirSync, writeFileSync } from "fs";

// TODO: Comment code
// TODO: Add flags to only do certain parts of this pipeline
// TODO: Make Asset folder top level and pass as argument
// TODO: Auto upload to Youtube, TikTok, Instagram
// TODO: Add translation to German, Spanish, Portuguese, Italian, maybe Russian
// TODO: Investigate glitches in background video
// TODO: Randomise which part of which background video gets used
// TODO: Investigate Bell placement on post screen
// TODO: Centralise output of all components (public folder, datagetter output, videocreator in and output) in cli root
// TODO: Add option to set title at gen time
// TODO: Add more background videos

// Backlog
// TODO: Add flag to set which platform the video goes to (maybe desktop too?)
// TODO: Add flag to paremerise video length
// TODO: Host assets somewhere else
// TODO: Dockerise
// TODO: Add motion blur to posts sliding in
// TODO: Make waiting for audio clips more accurate
// TODO: Add long format posts
// TODO: Add image posts
// TODO: Add frontpage report
// TODO: Add auto thumbnail
// TODO: Add possibility for custom thumbnails

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

  await renderVideo(path.join(cwd(), "/DataGetter/screenshots/" + newFolder + "/" + newFolder + ".mp4"), "RedditVid");
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
        command: "npx remotion render --props=./props.json " + compositionID + " " + outputLocation + " --concurrency=8 --gl=angle",
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
