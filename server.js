const express = require('express')
const app = express()
const mongoose = require('mongoose'), Schema = mongoose.Schema;
const bodyParser = require("body-parser");
const cors = require('cors')
require('dotenv').config();
const mongoDB = process.env['ATLAS_URI']

app.use(cors())
app.use(express.static('public'))


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


mongoose
  .connect(
    mongoDB, { useNewUrlParser: true }, err => {
      if (err) throw err;
      console.log('Connected to MongoDB!!!')
    });


const userSchema = new Schema({
  username: {
    type: String
  }
  ,
  log: [{
    description: {
      type: String,
      required: true
    },

    duration: {
      type: Number,
      required: true
    },

    date: {
      type: String,
      required: false
    }
  }
  ]

});

var User = mongoose.model('user', userSchema);
module.exports = mongoose.model('user', userSchema);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users/', (req, res) => {

  const newUser = new User(
    {
      username: req.body.username,
      log: false[{
        description: false,
        duration: false,
        date: false,
      }]

    });




  newUser.save().then(storedUser => {
    User.findOneAndUpdate({ username: req.body.username }, { $unset: 'log' });
    res.json({
      username: storedUser.username, _id: storedUser._id
    })



  })
});

app.get('/api/users/', (req, res) => {

  User.find({}).select({ "username": 1, "id": 1, "__v": 1 }).then(result => {
    return res.json(result);
  })
});


app.post('/api/users/:_id/exercises', (req, res, err) => {
  var _id = req.params._id
  let dateQuery = req.body.date


  if (!dateQuery) {
    dateQuery = Date.now();
  }
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };
  let date = new Date(dateQuery).toLocaleDateString('en-US', options);
  date = date.replace(/,/g, '');

  const filter = { _id: _id };
  const update =
  {
    log: [{
      duration: req.body.duration,
      date: date,
      description: req.body.description
    }
    ]
  }
    ;



  User.findOneAndUpdate(filter, { $addToSet: update }, { new: true }).then(doc => {
    var i = doc.log.length - 1;
    return res.json({
      _id: doc._id,
      username: doc.username,
      date: doc.log[i]['date'],
      duration: doc.log[i]['duration'],
      description: doc.log[i]['description']
    })

  });
});



app.get('/api/users/:_id/exercises', (req, res) => {
  var _id = req.params._id
  User.findOne({ _id: _id }).lean().exec(function(err, exercises) {
    return res.json(exercises);
  })
});


app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };

  let from = new Date(req.query.from);
  let to = new Date(req.query.to);

  let fromDate = from.toLocaleDateString('en-US', options).replace(/,/g, '');
  let toDate = to.toLocaleDateString('en-US', options).replace(/,/g, '');
  let limit = req.query.limit



  User.findOne({ _id: _id }).then(results => {


    var dates = [];

    for (let i = 0; i < results.log.length; i++) {
      dates.push(results.log[i]);
    };




    if (fromDate && toDate ==! null) {
      dates = dates.filter((date) => {
        return (
          new Date(date["date"]) >= new Date(fromDate) &&
          new Date(date["date"]) <= new Date(toDate)
        );

      }
      )

      if (limit) {
        dates = dates.slice(0, limit);
      }
      return res.json({
        _id: results._id,
        username: results.username,
        from: fromDate,
        to: toDate,
        count: dates.length,
        log: dates
      })

    }
    else {
      if (limit) {
        dates = dates.slice(0, limit);
      }

      return res.json({
        _id: results._id,
        username: results.username,
        count: dates.length,
        log: dates
      })
    }
  }
  )
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
