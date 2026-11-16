const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const sqlite = require("sqlite3")
const axios = require('axios');
const cheerio = require('cheerio');

const db = new sqlite.Database("./base/base.db", (err) => {
    if (err) return console.log(err)
    console.log("Подключение к БД успешно")
})

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.get("/ping", (req, res) => {
    console.log(req)
    scrapeGranovit();
    res.send("pong")
})


app.listen(3000, () => {
    console.log("Сервер стартанул!!!")
})


async function scrapeGranovit() {
  const url = 'https://novosibirsk.restate.ru/kupit-kvartiru-novosibirsk/';

  try {
    // 1. Fetch the HTML with a standard browser User-Agent
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    console.log(html)
    // 2. Load HTML into Cheerio
    const $ = cheerio.load(html);
    const listings = [];

    // 3. Loop through each property card (Update '.listing-card-class' to match the actual DOM)
    $('.sri').each((index, element) => {
      listings.push($(element).html())
      
    });

    console.log(`Found ${listings.length} listings:`, listings);
    return listings;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

scrapeGranovit();

