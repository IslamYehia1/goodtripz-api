import * as crypto from "crypto";
import * as dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
dotenv.config();

const { writeFileSync } = require("fs");
const { MeiliSearchKey, HOTELBEDS_API_KEY, HOTELBEDS_API_SECRET } = process.env;
const existingFiles = [];
const hotelsDataFileReg = /hotels[0-9]*.json/;
let max = -1;
// const TEST_API = "https://api.test.hotelbeds.com";
const API_LINK = "https://api.hotelbeds.com";
fs.readdirSync("/mnt/hotels").forEach((file: string) => {
  // const filePath = __dirname + "/" + file;

  if (hotelsDataFileReg.test(file)) {
    // hotelsDataFiles.push(file);
    const latestBatch = +file.match(/\d/g)?.join("")!;
    if (latestBatch > max) max = latestBatch;
  }
});
console.log(max);
const getXSignature = () =>
  crypto
    .createHash("sha256")
    .update(
      `${HOTELBEDS_API_KEY}${HOTELBEDS_API_SECRET}${Math.round(
        Date.now() / 1000
      )}`
    )
    .digest("hex");
function config() {
  return {
    headers: {
      "Api-key": HOTELBEDS_API_KEY,
      "X-Signature": getXSignature(),
      Accept: "application/json",
      "Accept-Encoding": "application/json",
    },
  };
}

let from = max + 1,
  to = max + 1000,
  total;
(async () => {
  do {
    console.log("Downloading batch", to);
    const conf = config();
    console.log("CONF", conf.headers["X-Signature"]);
    const response = await axios(
      `${API_LINK}/hotel-content-api/1.0/hotels?fields=all&language=ENG&from=${from}&to=${to}&useSecondaryLanguage=false`,
      conf
    );
    console.log("Uploading to Azure storage" + to);
    // /mnt/hotels is an azure files storage mounted locally
    writeFileSync(
      `/mnt/hotels/hotels${to}.json`,
      JSON.stringify(response.data.hotels)
    );
    total = response.data.total;
    from += 1000;
    to += 1000;
  } while (to <= total);
})();
