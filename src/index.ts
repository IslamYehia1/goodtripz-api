import express from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import { Client } from "@googlemaps/google-maps-services-js";
import Fuse from "fuse.js";
import * as airportsDB from "./airports.json";
import { GOOGLE_KEY } from "./apiKeys";
const cors = require("cors");
const PORT = process.env.PORT || 8080;

const client = new Client();
const app = express();
const options = {
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
        return;
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
        console.log("ERROR, mate! " + error);
        res.send("Error happened mate! :(((");
    }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
