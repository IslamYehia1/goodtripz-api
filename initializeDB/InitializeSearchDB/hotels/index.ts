import * as dotenv from "dotenv";
const fs = require("fs");
import { MeiliSearch } from "meilisearch";

const { AZURE_SAS_URL, MeiliSearchKey } = process.env;
const HOTELS_DATA_DIR = "/mnt/hotels";
const HOTELS_CONTENT_DATA_DIR = HOTELS_DATA_DIR + "/hotelsData";
const HOTELS_TYPES_DATA_DIR = HOTELS_DATA_DIR + "/types";
dotenv.config();

let meilieClient = new MeiliSearch({
  host: "http://localhost:7700",
  apiKey: MeiliSearchKey,
});

//Find existing hotels data files named hotels + batch number + .json
const hotelsDataFileReg = /hotels[0-9]*.json/;
const hotelsDataFiles: Array<string> = [];

console.log("Discovering data files");
fs.readdirSync(HOTELS_CONTENT_DATA_DIR).forEach((file: string) => {
  if (hotelsDataFileReg.test(file)) {
    hotelsDataFiles.push(file);
  }
});

function print(msg: string) {
  console.log(msg);
}
const facilities = JSON.parse(
  fs.readFileSync(`${HOTELS_TYPES_DATA_DIR}/facilities.json`)
);

// async function loadFacilities() {
//   meilieClient.index("facilities").deleteAllDocuments();
//   meilieClient.index("facilityGroup").deleteAllDocuments();
//   meilieClient.deleteIndex("facilities");
//   meilieClient.deleteIndex("facilityGroup");
//   console.log("Reading facilities");
//   const facilities = fs.readFileSync(
//     HOTELS_TYPES_DATA_DIR + "/facilities.json"
//   );
//   const facilitiesJSON = JSON.parse(facilities);
//   facilitiesJSON.forEach((item: any) => {
//     item.id = `${item.code}-${item.facilityGroupCode}`;
//   });
//   const addDocRes = await meilieClient
//     .index("facilities")
//     .addDocuments(facilitiesJSON);
//   console.log("Added facilities to meilisearch, response: ", addDocRes);
// }

(async () => {
  // await loadFacilities();

  await meilieClient.index("hotels").deleteAllDocuments();
  await meilieClient.deleteIndex("hotels");
  print("Creating hotels index");
  const indexCreationRes = await meilieClient.createIndex("hotels", {
    primaryKey: "code",
  });
  console.log(`Response, "\n"`, indexCreationRes);
  // hotelsDataFiles.forEach(async (file) => {
  const file = hotelsDataFiles[0];
  print("Reading File \n" + file);
  let batchData = fs.readFileSync(`${HOTELS_CONTENT_DATA_DIR}/${file}`, "utf8");
  console.log("Processing");
  batchData = batchData.replaceAll('"coordinates":', '"_geo":');
  batchData = batchData.replaceAll('"longitude":', '"lng":');
  batchData = batchData.replaceAll('"latitude":', '"lat":');
  const batchJSON = JSON.parse(batchData);
  batchJSON.forEach((hotel: any) => {
    hotel.facilities.forEach((facility: any, index: number) => {
      hotel.facilities[index] =
        facilities[`${facility.facilityCode}-${facility.facilityGroupCode}`];
    });
  });
  print("Adding batch " + file + " to MeilieSearch");
  const addDocRes = await meilieClient.index("hotels").addDocuments(batchJSON);
  await meilieClient.index("hotels").updateFilterableAttributes(["_geo"]);
  console.log("Meilie response \n", addDocRes);
  // });
})();
