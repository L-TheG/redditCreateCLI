import * as dotenv from "dotenv";
import { copyFileSync, cpSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { getData, installDataGetter, installVideoCreator, renderVideo } from "./commands.js";
import { parseArgs, parseFlags } from "./handleArgs.js";
import { createConfigFile, createDir, createProjectDirName, selectBgVideo } from "./utils.js";
import { uploadYoutubeVideo } from "./youtubeUpload.js";

dotenv.config();

// TODO: Comment code
// TODO: Need better hook at beginning of video (viewership drops too fast)
// TODO: Auto upload to TikTok, Instagram
// TODO: Add translation to German, Spanish, Portuguese, Italian, maybe Russian
// TODO: Investigate glitches in background video
// TODO: Improve CLI output
// TODO: Censor swear words
// TODO: update remix and use dynamic links
// TODO: More diverse bg videos
// TODO: thinkof better hook

// Backlog
// TODO: Read comment threads
// TODO: Add flag to set which platform the video goes to (maybe desktop too?)
// TODO: Host assets somewhere else
// TODO: Add motion blur to posts sliding in
// TODO: Add long format posts
// TODO: Add image posts
// TODO: Add frontpage report
// TODO: Make it work in the cloud
// TODO: Dockerise

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

  createConfigFile(projectDirName, selectedBgVideo);
  await renderVideo(join(cwd(), args.workingDir, projectDirName, "out", projectDirName + ".mp4"), "RedditVid");
  if (flags.render) {
    process.exit(0);
  }
}
