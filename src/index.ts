import * as dotenv from "dotenv";
import { cwd } from "process";
import { copyFileSync, cpSync } from "fs";
import { installVideoCreator, installDataGetter, getData, renderVideo } from "./commands.js";
import { parseArgs, parseFlags } from "./handleArgs.js";
import { uploadYoutubeVideo } from "./youtubeUpload.js";
import { join } from "path";
import { createProjectDirName, createDir, selectBgVideo, getGameplayTags, createConfigFile } from "./utils.js";

dotenv.config();

// TODO: Comment code
// TODO: Auto upload to TikTok, Instagram
// TODO: Add translation to German, Spanish, Portuguese, Italian, maybe Russian
// TODO: Investigate glitches in background video
// TODO: Investigate Bell placement on post screen
// TODO: Add more background videos
// TODO: Improve CLI output
// TODO: Improve performance of audio generation
// TODO: Censor swear words

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

// create --all/--scrape/--render/--upload --bgVideosDir=/pathToAsetts --workingDir=/pathToOutFolder --link=www.post.link --duration=0 --title=title --tags=these,are,tags --description='your description here'

const args = parseArgs();
const flags = parseFlags();
const projectDirName = createProjectDirName(args.link);
await main();

async function main() {
  createDir(join(cwd(), args.workingDir, projectDirName));
  createDir(join(cwd(), args.workingDir, projectDirName, "data"));
  createDir(join(cwd(), args.workingDir, projectDirName, "audio"));
  createDir(join(cwd(), args.workingDir, projectDirName, "out"));

  await installVideoCreator();
  await installDataGetter();

  if (flags.all || flags.scrape) {
    await getData(args.link, join(cwd(), args.workingDir, projectDirName), args.duration);
    if (flags.scrape) {
      return;
    }
  }

  if (flags.all || flags.render) {
    await handleReder();
  }

  if (flags.all || flags.upload) {
    await uploadYoutubeVideo({
      fileName: join(cwd(), args.workingDir, projectDirName, "out", projectDirName + ".mp4"),
      tags: args.tags.split(","),
      description: args.description,
      title: args.title,
    });
  }
}

async function handleReder() {
  createDir(join(cwd(), "VideoCreator", "public", "assets", "bgVideos"));
  cpSync(join(cwd(), args.workingDir, projectDirName), join(cwd(), "VideoCreator", "public", projectDirName), {
    force: true,
    recursive: true,
  });
  const selectedBgVideo = selectBgVideo(join(cwd(), args.bgVideosDir));
  copyFileSync(join(cwd(), args.bgVideosDir, selectedBgVideo), join(cwd(), "VideoCreator", "public", "assets", "bgVideos", selectedBgVideo));

  const gameplayTags = getGameplayTags(selectedBgVideo);
  if (gameplayTags) {
    args.description += gameplayTags;
  }
  createConfigFile(projectDirName, selectedBgVideo);
  await renderVideo(join(cwd(), args.workingDir, projectDirName, "out", projectDirName + ".mp4"), "RedditVid");
  if (flags.render) {
    process.exit(0);
  }
}
