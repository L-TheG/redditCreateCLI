import * as dotenv from "dotenv";
import path from "path";
import { cwd } from "process";
import { constants, copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, symlinkSync, writeFileSync } from "fs";
import { installVideoCreator, installDataGetter, getData, renderVideo } from "./commands.js";
import { parseArgs, parseFlags } from "./handleArgs.js";
import { access } from "fs/promises";

dotenv.config();
const charactersOfTitleToKeep = 23;

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
// TODO: Improve CLI output
// TODO: Improve performance of audio generation

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

// create --all/--scrape/--render/--upload --bgVideosDir=/pathToAsetts --workingDir=/pathToOutFolder --link=www.post.link --duration=0 --title=title --tags=these,are,tags

const args = parseArgs();
const flags = parseFlags();
const projectDirName = createProjectDirName(args.link);
await main();

async function main() {
  createDir(path.join(cwd(), args.workingDir, projectDirName));
  createDir(path.join(cwd(), args.workingDir, projectDirName, "data"));
  createDir(path.join(cwd(), args.workingDir, projectDirName, "audio"));
  createDir(path.join(cwd(), args.workingDir, projectDirName, "out"));

  await installVideoCreator();
  await installDataGetter();

  if (flags.all || flags.scrape) {
    await getData(args.link, path.join(cwd(), args.workingDir, projectDirName), args.duration);
    if (flags.scrape) {
      return;
    }
  }

  if (flags.all || flags.render) {
    createDir(path.join(cwd(), "VideoCreator", "public", "assets", "bgVideos"));
    cpSync(path.join(cwd(), args.workingDir, projectDirName), path.join(cwd(), "VideoCreator", "public", projectDirName), {
      force: true,
      recursive: true,
    });
    const selectedBgVideo = selectBgVideo(path.join(cwd(), args.bgVideosDir));
    copyFileSync(
      path.join(cwd(), args.bgVideosDir, selectedBgVideo),
      path.join(cwd(), "VideoCreator", "public", "assets", "bgVideos", selectedBgVideo)
    );

    createConfigFile(projectDirName, selectedBgVideo);
    await renderVideo(path.join(cwd(), args.workingDir, projectDirName, "out", projectDirName + ".mp4"), "RedditVid");
    if (flags.render) {
      return;
    }
  }
}

function createConfigFile(contentPath: string, selectedBgVideo: string) {
  writeFileSync(path.join(cwd(), "VideoCreator/props.json"), JSON.stringify({ projectFolder: contentPath, selectedBgVideo: selectedBgVideo }));
}

function createProjectDirName(link: string) {
  const dateString = createDateString();
  const subreddit = link.split("/")[4];
  const id = link.split("/")[6];
  const title = link.split("/")[7].substring(0, charactersOfTitleToKeep);
  return `${dateString}_${subreddit}_${id}_${title}`;
}

function createDateString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  const dateString = dateLocal.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "_").substring(0, 10);
  return dateString;
}

function createDir(dirToCreate: string) {
  if (!existsSync(dirToCreate)) {
    mkdirSync(dirToCreate, { recursive: true });
  }
}

function selectBgVideo(absolutePathToBgVidDir: string) {
  const bgVideos = readdirSync(absolutePathToBgVidDir);
  return bgVideos[Math.floor(Math.random() * bgVideos.length)];
}
