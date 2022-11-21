import { writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";
const charactersOfTitleToKeep = 23;

export function createConfigFile(contentPath: string, selectedBgVideo: string) {
  writeFileSync(join(cwd(), "VideoCreator/props.json"), JSON.stringify({ projectFolder: contentPath, selectedBgVideo: selectedBgVideo }));
}

export function createProjectDirName(link: string) {
  const dateString = createDateString();
  const subreddit = link.split("/")[4];
  const id = link.split("/")[6];
  const title = link.split("/")[7].substring(0, charactersOfTitleToKeep);
  return `${dateString}_${subreddit}_${id}_${title}`;
}

export function createDateString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  const dateString = dateLocal.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "_").substring(0, 10);
  return dateString;
}

export function createDir(dirToCreate: string) {
  if (!existsSync(dirToCreate)) {
    mkdirSync(dirToCreate, { recursive: true });
  }
}

export function selectBgVideo(absolutePathToBgVidDir: string) {
  const bgVideos = readdirSync(absolutePathToBgVidDir);
  return bgVideos[Math.floor(Math.random() * bgVideos.length)];
}

export function getGameplayTags(bgVideoName: string) {
  const tagDict = [
    { name: "gta", tags: "#gta #grandtheftauto #gameplay #driving #car #game #gaming" },
    { name: "minecraft", tags: "#minecraft #gameplay #parkour #indie #game #gaming" },
    { name: "clustertruck", tags: "#clustertruck #gameplay #parkour #indie #game #gaming" },
    { name: "subwaysurfers", tags: "#subwaysurfers #gameplay #parkour #mobile #game #gaming" },
    { name: "steep", tags: "#steep #gameplay #ski #skiing #ubisoft #game #gaming #sport" },
    { name: "csgo", tags: "#csgo #gameplay #counterstrike #surf #surfing #fps #gaming" },
  ];
  const gameName = bgVideoName.split("_")[0];
  return tagDict.find((tag) => tag.name === gameName)?.tags;
}
