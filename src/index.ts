import express from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import { Client } from "@googlemaps/google-maps-services-js";
import Fuse from "fuse.js";
import * as airportsDB from "./airports.json";
import { GOOGLE_KEY, amadeusClientID, amadeusClientSecret } from "./apiKeys";
/* Documentation for the Google placeAutocomplete API:
https://developers.google.com/maps/documentation/places/web-service/autocomplete#maps_http_places_autocomplete_amoeba-txt

Airports Data is coming from: openflights.org
*/
var Amadeus = require("amadeus");

var amadeus = new Amadeus({
    clientId: amadeusClientID,
    clientSecret: amadeusClientSecret,
});
var cors = require("cors");
var PORT = process.env.PORT || 8080;
var client = new Client();
var app = express();
var options = {
    includeScore: true,
    // Search in `author` and in `tags` array
    keys: [
        { name: "Name", weight: 0.5 },
        { name: "City", weight: 0.2 },
        { name: "Country", weight: 0.3 },
        { name: "IATA", weight: 0.9 },
    ],
};

const fuse = new Fuse(airportsDB.results, options);

// app.use(checkJwt);
app.use(cors());

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
        const results = fuse.search(`${req.query.query}`, { limit: 5 });
        res.send(results);
    } catch (error) {
        console.log("Something wrong with the fuuuuse" + error);
        res.send({ error: "Error happened mate! :(((" });
    }
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

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
