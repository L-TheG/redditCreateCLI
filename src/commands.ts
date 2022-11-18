import { concurrently } from "concurrently";
import path from "path";
import { cwd } from "process";

export async function installVideoCreator() {
  const command = concurrently([{ command: "npm i" }], {
    cwd: path.join(cwd(), "/VideoCreator"),
    raw: true,
  });
  await command.result;
}

export async function installDataGetter() {
  const command = concurrently([{ command: "npm i" }], {
    cwd: path.join(cwd(), "/DataGetter"),
    raw: true,
  });
  await command.result;
}

export async function getData(link: string, workingDirAbsolutePath: string, duration: number) {
  console.log(`EXECUTING: npm run build && node build/index.js --link=${link} --workingDir=${workingDirAbsolutePath} --duration=${duration}`);
  const command = concurrently(
    [
      {
        command: `npm run build && node build/index.js --link=${link} --workingDir=${workingDirAbsolutePath} --duration=${duration}`,
        env: {
          MS_SPEECH_SERVICE_KEY: process.env.MS_SPEECH_SERVICE_KEY as string,
          MS_SPEECH_SERVICE_REGION: process.env.MS_SPEECH_SERVICE_REGION as string,
        },
      },
    ],
    {
      cwd: path.join(cwd(), "/DataGetter"),
      raw: true,
    }
  );

  await command.result;
}

export async function renderVideo(outputLocation: string, compositionID: string) {
  console.log(`EXECUTING: npx remotion render --props=./props.json ${compositionID} ${outputLocation} --concurrency=8 --gl=angle`);
  const command = concurrently(
    [
      {
        command: `npx remotion render --props=./props.json ${compositionID} ${outputLocation} --concurrency=8 --gl=angle`,
      },
    ],
    {
      cwd: path.join(cwd(), "/VideoCreator"),
      raw: true,
    }
  );

  await command.result;
}
