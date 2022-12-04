/* Documentation for the Google placeAutocomplete API:
https://developers.google.com/maps/documentation/places/web-service/autocomplete#maps_http_places_autocomplete_amoeba-txt

Airports Data is coming from: openflights.org
*/
import express from "express";
import { Client } from "@googlemaps/google-maps-services-js";
import axios from "axios";
import { MeiliSearch } from "meilisearch";
const { GOOGLE_KEY, AMADEUS_CLIENT, AMADEUS_SECRET, MeiliSearchKey } =
  process.env;
if (!(GOOGLE_KEY && AMADEUS_CLIENT && AMADEUS_SECRET && MeiliSearchKey)) {
  throw "Enviroment variables needed!! GOOGLE_KEY , AMADEUS_CLIENT, AMADEUS_SECRET, MeiliSearchKey";
}
const meiliClient = new MeiliSearch({
  host: "http://localhost:7700/",
  apiKey: MeiliSearchKey,
});

const airportsIndex = meiliClient.index("airports");
const hotelsIndex = meiliClient.index("hotels");

const Amadeus = require("amadeus");
const cors = require("cors");

const PORT = process.env.PORT || 8080;

const GoogleClient = new Client();
const app = express();
app.use(cors());

// app.use(checkJwt);

app.get("/autocomplete/hotels", async (req, res) => {
  if (typeof req.query.query !== "string") {
    res.send({ error: "What are you sending me mate?" });
    return;
  }
  if (req.query.query === "") {
    res.send({ error: "That's empty, mate!" });
    return;
  }

  try {
    const results = await GoogleClient.placeAutocomplete({
      params: {
        input: `${req.query.query}`,
        key: GOOGLE_KEY,
      },
    });
    res.send(results.data.predictions);
  } catch (error) {
    console.log("ERROOOOOOOR", error);
    res.send({ error: "ERROR, mate" });
  }
});

app.get("/autocomplete/airports", async (req, res) => {
  if (typeof req.query.query !== "string") {
    res.send({ error: "What are you sending me mate?" });
    return;
  }
  try {
    // const results = fuse.search(`${req.query.query}`, { limit: 5 });
    const results = await airportsIndex.search(req.query.query, {
      limit: 5,
    });
    res.send(results);
  } catch (error) {
    console.log("Something wrong with searching MeiliSearch" + error);
    res.send({ error: "Error happened mate! :(((" });
  }
});

app.get("/airportInfo", async (req, res) => {
  if (
    !(
      typeof req.query.iata_code === "string" &&
      req.query.iata_code.length === 3
    )
  ) {
    return res.send({ error: "Error: Pass the 3 letters IATA code" });
  }
  try {
    // const airportDetails = await index.getDocument(req.query.iata_code);
    const airportDetails = await airportsIndex.getDocument(req.query.iata_code);
    res.send(airportDetails);
  } catch (error) {
    console.log(error);
    res.send({ error: "Error: could't find the airport" });
  }
});
app.get("/searchResults/flights/", async (req, res) => {
  try {
    // const flightOffers = await amadeus.shopping.flightOffersSearch.get({
    //   originLocationCode: req.query.departure,
    //   destinationLocationCode: req.query.destination,
    //   departureDate: req.query.departureDate,
    //   returnDate: req.query.returnDate,
    //   adults: req.query.adultsNumber,
    //   children: req.query.childrenNumber,
    //   currencyCode: req.query.currency,
    //   nonStop: req.query.nonStop,
    //   maxPrice: req.query.maxPrice,
    //   max: req.query.max || "10",
    // });
    // res.send(flightOffers.data);
  } catch (error) {
    console.log("ERROOOOR", error);
    res.send({ error: "ERROOOR" });
  }
});
app.get("/searchResults/hotels/", async (req, res) => {
  try {
    const results: any = [];
    const { hits } = await hotelsIndex.search("", {
      attributesToRetrieve: [
        "name",
        "address",
        "issues",
        "facilities",
        "images",
      ],
      filter: [`_geoRadius(${req.query.lat}, ${req.query.long}, 2000)`],
      limit: 10,
    });
    (async () => {
      for (const { name, address, images, facilities, S2C, ranking } of hits) {
        const facilitiesOut: Array<string> = [];
        for (const facility of facilities) {
          const facilityID = `${facility.facilityCode}-${facility.facilityGroupCode}`;
          const { description } = await meiliClient
            .index("facilities")
            .getDocument(facilityID);
          facilitiesOut.push(description.content);
        }
        results.push({
          hotel: { name, address, images, S2C, ranking },
          facilities: facilitiesOut,
        });
      }
      res.send(results);
    })();
  } catch (error) {
    console.log(error);
  }
});

app.get("/recommendation", (req, res) => {
  // res.json(recommendations);
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
