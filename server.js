require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const { Db } = require('mongodb');
// Basic Configuration
const port = process.env.PORT || 3000;

const urlencoded = app.use(bodyParser.urlencoded({ extended: false }))

//MongoDB structure
//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//Notify if connection whether success
const urlShortenDB = mongoose.connection
urlShortenDB.on('error', console.error.bind(console, 'connection error:'))
urlShortenDB.once('open', () => {
  console.log("Success DB connection!")
})
//Create schema
const shortURLSchema = new mongoose.Schema({
  url: String
})
//Create model from the schema we created above
const shortURLModel = mongoose.model('shortURLModel', shortURLSchema)

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl/new', async (req, res, next) => {
  function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
  }
  if (validURL(req.body.url)) {

    const newUrlDocumentInstance = new shortURLModel({ url: req.body.url })
    await newUrlDocumentInstance.save((err, urlDocumentInstance) => {
      if (err) {
        return console.error(err)
      } else {
        shortURLModel.findById(urlDocumentInstance._id, (err, existingDocumentInstances) => {
          if (err) {
            console.error(err)
          } else {
            return console.log("finded document instances id:", existingDocumentInstances._id)
          }
        })
      }
    })
    res.send({ original_url: req.body.url, short_url: newUrlDocumentInstance._id })
  } else {
    res.json({ error: 'invalid url' })
  }
  next()
})

app.get('/api/shorturl/:url_id', async (req, res, next) => {
  const { url_id } = req.params
  if (url_id != "new") {
    console.log(url_id)
    const getURLDocumentInstance = await shortURLModel.findById(url_id, (err, getDocumentInstance) => {
      if (err) {
        return console.log(err)
      } else {
        return getDocumentInstance
      }
    })
    await res.redirect(getURLDocumentInstance.url)
  }
  next()
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
