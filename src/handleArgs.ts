export function parseFlags() {
  let render = false;
  let scrape = false;
  let all = false;
  let upload = false;
  process.argv.forEach((element) => {
    if (element.includes("--render")) {
      render = true;
    }
    if (element.includes("--scrape")) {
      scrape = true;
    }
    if (element.includes("--upload")) {
      upload = true;
    }
    if (element.includes("--all")) {
      all = true;
    }
  });

  let trueBooleans = 0;
  [render, scrape, all, upload].forEach((currentBool) => {
    if (currentBool) trueBooleans++;
  });

  let trueConstraintBooleans = 0;
  [render, scrape, upload].forEach((currentBool) => {
    if (currentBool) trueConstraintBooleans++;
  });

  if (trueBooleans > 1) {
    console.log("Can only contain one flag (--all/--render/--scrape/--upload)");
    process.exit(1);
  }

  if (trueBooleans < 1) {
    console.log("Must contain at least one flag (--all/--render/--scrape/--upload)");
    process.exit(1);
  }

  if (all && trueConstraintBooleans > 0) {
    console.log("If --all flag is set, no additional flags can be set (--render/--scrape/--upload)");
    process.exit(1);
  }

  return { render, scrape, all, upload };
}

export function parseArgs() {
  let bgVideosDir: string | undefined;
  let workingDir: string | undefined;
  let link: string | undefined;
  let duration: number | undefined;
  let title: string | undefined;
  let tags: string | undefined;

  process.argv.forEach((element) => {
    if (element.includes("--link=")) {
      link = element.split("=")[1];
    }
    if (element.includes("--workingDir=")) {
      workingDir = element.split("=")[1];
    }
    if (element.includes("--duration=")) {
      duration = parseInt(element.split("=")[1]);
    }
    if (element.includes("--title=")) {
      title = element.split("=")[1];
    }
    if (element.includes("--tags=")) {
      tags = element.split("=")[1];
    }
    if (element.includes("--bgVideosDir=")) {
      bgVideosDir = element.split("=")[1];
    }
  });

  if (link === undefined) {
    console.log("No post link provided (--link=www.post.link)");
    process.exit();
  }
  if (bgVideosDir === undefined) {
    console.log("No folder path to bgVideosDir directory was provided (--bgVideosDir=/path/to/folder)");
    process.exit();
  }
  if (workingDir === undefined) {
    console.log("No folder path to output/working directory was provided (--out=/path/to/folder)");
    process.exit();
  }
  if (duration === undefined) {
    console.log("No value for video duration was provided (--duration=durationInSeconds)");
    process.exit();
  }
  if (title === undefined) {
    console.log("No video title was provided (--title='Your Video Title')");
    process.exit();
  }
  if (tags === undefined) {
    console.log("No tags were provided (--tags=comma,seperated,tags)");
    process.exit();
  }

  return { bgVideosDir, workingDir, link, duration, title, tags };
}
