const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
import { MeiliSearch } from "meilisearch";

var airportsArr: any = [];
var airportsDBPath: any = path.join(__dirname, "/airports.csv");

function readCsv() {
  return new Promise((resolve: any, reject) => {
    fs.createReadStream(airportsDBPath)
      .pipe(csv())
      .on("data", (data: any) => {
        airportsArr.push(data);
      })
      .on("end", () => {
        console.log("Read the CSV file successfully");
        resolve();
      })
      .on("error", reject);
  });
}
let millieClient = new MeiliSearch({
  host: "http://localhost:7700",
  apiKey: "MASTER_KEY",
});

(async () => {
  try {
    await readCsv();
  } catch (error) {
    console.log("Error while reading the CSV file!!!", "\n", error);
    return;
  }
  try {
    console.log("CREATING INDEX...");
    const indexCreationRes = millieClient.createIndex("airports", {
      primaryKey: "iata_code",
    });
    console.log("Response", "\n", indexCreationRes);
    console.log("Adding documents...");
    const addingDocsRes = await millieClient
      .index("airports")
      .addDocuments(airportsArr);
    console.log("Response", "\n", addingDocsRes);
    console.log("Updating searchable attributes...");
    const updateResponse = await millieClient.index("airports").updateSettings({
      searchableAttributes: ["municipality", "name", "country", "iata_code"],
    });
    console.log("Response", "\n", updateResponse);
    console.log("MilliSearch Setup Completed Successfully");
  } catch (error) {
    console.log("Error while setting up MilliSearch", "\n", error);
  }
  // const response = await millieClient
  //   .index("airports")
  //   .updateRankingRules([
  //     "attribute",
  //     "sort",
  //     "municipality",
  //     "name",
  //     "country",
  //   ]);
})();
