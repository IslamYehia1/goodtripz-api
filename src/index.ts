/* Documentation for the Google placeAutocomplete API:
https://developers.google.com/maps/documentation/places/web-service/autocomplete#maps_http_places_autocomplete_amoeba-txt

Airports Data is coming from: openflights.org
*/
import express from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import { Client } from "@googlemaps/google-maps-services-js";
import { MongoClient } from "mongodb";
import axios from "axios";
const Amadeus = require("amadeus");
const cors = require("cors");

const { GOOGLE_KEY, AMADEUS_CLIENT, AMADEUS_SECRET, MONGO_URL } = process.env;
if (!(GOOGLE_KEY && AMADEUS_CLIENT && AMADEUS_SECRET && MONGO_URL)) {
  throw "Enviroment variables needed!! GOOGLE_KEY , AMADEUS_CLIENT, AMADEUS_SECRET , MONGO_URL";
}
const PORT = process.env.PORT || 8080;

const mongoClient = new MongoClient(MONGO_URL);
(async () => {
  try {
    await mongoClient.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Couldn't connect to MongdoDB ::: ", error);
  }
})();
const airportsDB = mongoClient.db("Goodtripz").collection("airports");

const amadeus = new Amadeus({
  clientId: AMADEUS_CLIENT,
  clientSecret: AMADEUS_SECRET,
});
const client = new Client();
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
    const results = await client.placeAutocomplete({
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
    const results = await airportsDB
      .find(
        { $text: { $search: `${req.query.query}` } },
        //@ts-ignore
        { score: { $meta: "textScore" } }
      )
      .sort({ sort: { $meta: "textScore" } })
      .limit(5)
      .toArray();
    res.send(results);
  } catch (error) {
    console.log("Something wrong with the fuuuuse" + error);
    res.send({ error: "Error happened mate! :(((" });
  }
});

app.get("/airportInfo", async (req, res) => {
  if (!(typeof req.query.iata === "string" && req.query.iata.length === 3)) {
    return res.send("Error: Pass the 3 letters IATA code");
  }
  const airport = await airportsDB.findOne({
    IATA: req.query.iata.toUpperCase(),
  });
  res.send(airport);
});
app.get("/searchResults/flights/", async (req, res) => {
  try {
    const flightOffers = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: req.query.departure,
      destinationLocationCode: req.query.destination,
      departureDate: req.query.departureDate,
      returnDate: req.query.returnDate,
      adults: req.query.adultsNumber,
      children: req.query.childrenNumber,
      currencyCode: req.query.currency,
      nonStop: req.query.nonStop,
      maxPrice: req.query.maxPrice,
      max: req.query.max || "10",
    });
    res.send(flightOffers.data);
  } catch (error) {
    console.log("ERROOOOR", error);
    res.send({ error: "ERROOOR" });
  }
});
app.get("/searchResults/hotels/", async (req, res) => {
  try {
    var options: any = {
      method: "GET",
      url: "https://travel-advisor.p.rapidapi.com/hotels/list-by-latlng",
      params: {
        latitude: "12.91285",
        longitude: "100.87808",
        lang: "en_US",
        hotel_class: "1,2,3",
        limit: "30",
        adults: "1",
        amenities: "beach,bar_lounge,airport_transportation",
        rooms: "1",
        child_rm_ages: "7,10",
        currency: "USD",
        checkin: "2021-11-08",
        zff: "4,6",
        subcategory: "hotel,bb,specialty",
        nights: "2",
      },
      headers: {
        "x-rapidapi-host": "travel-advisor.p.rapidapi.com",
        "x-rapidapi-key": "b04186e5b2msh4cd80cbf8dffd74p1706a6jsn84f316389bc5",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        res.send(response.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
