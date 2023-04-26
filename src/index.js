const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector');
// Endpoint for calculating total recovered patients across all states
app.get('/totalRecovered', async (req, res) => {
  const result = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        recovered: {
          $sum: '$recovered',
        },
      },
    },
  ]);
  res.json({ data: result });
});

// Endpoint for calculating total active patients across all states
app.get('/totalActive', async (req, res) => {
  const result = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        active: {
          $sum: { $subtract: ['$infected', '$recovered'] },
        },
      },
    },
  ]);
  res.json({ data: result });
});

// Endpoint for calculating total deaths across all states
app.get('/totalDeath', async (req, res) => {
  const result = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        death: {
          $sum: '$death',
        },
      },
    },
  ]);
  res.json({ data: result[0] });
});

// Endpoint for getting hotspot states
app.get('/ ', async (req, res) => {
  const result = await connection.aggregate([
    {
      $addFields: {
        rate: {
          $round: [
            {
              $divide: [
                { $subtract: ['$infected', '$recovered'] },
                '$infected',
              ],
            },
            5,
          ],
        },
      },
    },
    {
      $match: {
        rate: { $gt: 0.1 },
      },
    },
    {
      $project: {
        _id: 0,
        state: 1,
        rate: 1,
      },
    },
  ]);
  res.json({ data: result });
});

// Endpoint for getting healthy states
app.get('/healthyStates', async (req, res) => {
  const result = await connection.aggregate([
    {
      $addFields: {
        mortality: {
          $round: [
            {
              $divide: ['$death', '$infected'],
            },
            5,
          ],
        },
      },
    },
    {
      $match: {
        mortality: { $lt: 0.005 }
      }
    },
    {
      $project: {
        _id: 0,
        state: 1,
        mortality: 1,
      },
    },
  ]);
  res.json({ data: result });
});

app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;