const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const axios = require('axios');
const cheerio = require('cheerio');

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.get("/ping", (req, res) => {
    console.log(req)
    res.send("pong")
})

app.get('/listings', async (req, res) => {
    const listings = await getListings()
    res.json(listings);
})

app.listen(3000, () => {
    console.log("Сервер стартанул!!!")
})


async function getListings() {
  const url = 'https://novosibirsk.restate.ru/kupit-kvartiru-novosibirsk/';

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const $ = cheerio.load(html);
    const listings = [];

    $('a.sri__common-link').each((_, element) => {
      const extracted = ($(element).attr('aria-label') || '').trim();
      if (extracted) {
        const title = extracted;
        const card = $(element).closest('.sri__inner');
        const addressParts = extracted.split(', ');
        const rooms = addressParts.shift() || '';
        const adress = addressParts.slice(0, 3).join(', ');
        const district = card.find('a.sri__area-link').last().text().trim();
        const images = card.find('.sri__slide img')
          .map((_, image) => $(image).attr('src'))
          .get()
          .filter(Boolean);
        const price = card.find('.sri__price').first().text().replace(/\D/g, '');
        const priceArea = card.find('.sri__price-quality').first().text().replace(/\D/g, '');
        const mortgage = card.find('.sri__mortgage, .sri__mortage')
          .first()
          .text()
          .replace(/\D/g, '');

        listings.push({ title, rooms, adress, district, images, price, priceArea, mortgage });
      }
    });

    console.log(`Found ${listings.length} listings:`);
    return listings;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}
