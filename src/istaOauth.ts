import readline from "readline";

// Requests access token that is usable for 80d
// After first request, you get a device verification token. (user_token)
// Enter that token into facebook.com/device
// Second request contains the aaccess token that is usable for 80d (access_token)
export async function testInsta() {
  const token = encodeURIComponent(`${process.env.IG_APP_ID}|${process.env.IG_CLIENT_TOKEN}`);

  const deviceAuthRes = await fetch(`https://graph.facebook.com/v2.6/device/login?access_token=${token}&scope=public_profile`, { method: "POST" });
  const deviceAuthJson = await deviceAuthRes.json();
  const idCode = deviceAuthJson.code;
  const userCode = deviceAuthJson.user_code;

  await askQuestion("visit 'https://facebook.com/device' and enter " + userCode + " after that, come back and press any key");

  const accessTokenRes = await fetch(`https://graph.facebook.com/v2.6/device/login_status?access_token=${token}&code=${idCode}`, { method: "POST" });
  const accessTokenJson = await accessTokenRes.json();
  console.log("Access token", accessTokenJson.access_token);
  console.log("Expires in", accessTokenJson.expires_in);
}

function askQuestion(query: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}
