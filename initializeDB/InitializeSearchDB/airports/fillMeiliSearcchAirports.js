"use strict";
exports.__esModule = true;
var csv = require("csv-parser");
var fs = require("fs");
var path = require("path");
var MeiliSearchKey = process.env.MeiliSearchKey;
var airportsArr = [];
var airportsDBPath = path.join(__dirname, "/airports.csv");
function readCsv() {
    return new Promise(function (resolve, reject) {
        fs.createReadStream(airportsDBPath)
            .pipe(csv())
            .on("data", function (data) {
            airportsArr.push(data);
        })
            .on("end", function () {
            console.log("Read the CSV file successfully");
            resolve();
        })
            .on("error", reject);
    });
}
readCsv().then(function () {
    console.log(airportsArr);
});
// let millieClient = new MeiliSearch({
//   host: "http://localhost:7700",
//   apiKey: MeiliSearchKey,
// });
// (async () => {
//   try {
//     await readCsv();
//   } catch (error) {
//     console.log("Error while reading the CSV file!!!", "\n", error);
//     return;
//   }
//   try {
//     console.log("CREATING INDEX...");
//     const indexCreationRes = millieClient.createIndex("airports", {
//       primaryKey: "iata_code",
//     });
//     console.log("Response", "\n", indexCreationRes);
//     console.log("Adding documents...");
//     const addingDocsRes = await millieClient
//       .index("airports")
//       .addDocuments(airportsArr);
//     console.log("Response", "\n", addingDocsRes);
//     console.log("Updating searchable attributes...");
//     const updateResponse = await millieClient.index("airports").updateSettings({
//       searchableAttributes: ["municipality", "name", "country", "iata_code"],
//     });
//     console.log("Response", "\n", updateResponse);
//     console.log("MilliSearch Setup Completed Successfully");
//   } catch (error) {
//     console.log("Error while setting up MilliSearch", "\n", error);
//   }
//   // const response = await millieClient
//   //   .index("airports")
//   //   .updateRankingRules([
//   //     "attribute",
//   //     "sort",
//   //     "municipality",
//   //     "name",
//   //     "country",
//   //   ]);
// })();
