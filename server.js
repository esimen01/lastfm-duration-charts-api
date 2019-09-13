const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const util = require('util');
const lastfmapi = require('lastfmapi');

const app = express();

const lfm = new lastfmapi({
  'api_key' : '7ac5e0e16558499056588c698ae15807',
  'secret' : '6da80b573eec3e7a9a770d608f1895ae'
});

app.use(bodyParser.json());
app.use(cors());

const database = {
  users: [
    {
      id: 123,
      username: 'a',
      email: 'a@gmail.com',
      password: '123',
      joindate: new Date()
    },
    {
      id: 124,
      username: 'b',
      email: 'b@gmail.com',
      password: '124',
      joindate: new Date()
    },
    {
      id: 125,
      username: 'c',
      email: 'c@gmail.com',
      password: '125',
      joindate: new Date()
    }
  ]
};

const trackdb = {
  tracks: []
}

app.get('/', (req, res) => {
  res.send(database.users);
});

app.post('/signin', (req, res) => {
  if (req.body.email === database.users[0].email &&
      req.body.password === database.users[0].password) {
    res.json('signin');
  } else {
    res.status(400).json('bad credentials');
  }
});

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  database.users.push({
    id: 126,
    username: username,
    email: email,
    password: password,
    joindate: new Date()
  });
  res.json(database.users[database.users.length - 1]);
});

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  let found = false;
  database.users.forEach(user => {
    if (user.id === id) {
      found = true;
      return res.json(user);
    }
  });
  if (!found) {
    res.status(400).json('not found');
  }
});

const userTopTracks = util.promisify(lfm.user.getTopTracks).bind(lfm.user);

app.get('/data/:id/:range/pagecount', (req, res) => {
  const { id, range } = req.params;
  const lfmParams = {
    'user': id,
    'period': range,
    'limit': 200
  };
  userTopTracks(lfmParams)
  .then(tracks => {
    const numPages = tracks['@attr'].totalPages;
    res.json({"pages": numPages});
  })
  .catch(err => {
    res.status(500).json('Unable to find user information');
  })
});

const trackInfo = (track) => {
  const totalDuration = track.duration * track.playcount;
  const trackInfo = {
    time: totalDuration.toString(),
    count: track.playcount,
    artist: track.artist.name,
    image: track.image[0]['#text'],
    name: track.name
  };
  return trackInfo;
};

app.post('/data/:id/:range/:page', (req, res) => {
  const { id, range, page } = req.params;
  const lfmParams = {
    'user': id,
    'period': range,
    'limit': 200,
    'page': page
  };
  userTopTracks(lfmParams)
  .then(tracks => {
    tracks.track.forEach(track => {
      trackdb.tracks.push(trackInfo(track))
    });
    res.status(200).json('Success');
  })
  .catch(err => {
    res.status(500).json('Unable to find user information');
  })
});

app.get('/tracks/:id', (req, res) => {
  res.send(trackdb);
}) 

app.listen(3000, () => {
  console.log('app is running on port 3000');
});

/*

  GET  / -> "this is working"
  POST /signin -> success/fail
  POST /register -> user
  GET  /profile/:id -> user
  GET  /data/:id/pagecount -> number
  POST /data/:id/:page -> success/fail
  GET  /tracks/:id -> json
  GET  /artists/:id -> json
  GET  /albums/:id -> json

*/