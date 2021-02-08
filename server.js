const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
//const https = require('https');
const fs = require('fs');
const app = express();

//const port = 4443;
const requestId = uuidv4();
const region = 'eu-west-1';

const log = message => {
  console.log(`${new Date().toISOString()} ${message}`);
};

const chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const meetingCache = {};
const attendeeCache = {};

app.use(express.static(__dirname + '/dist'));

app.get('/',function(req,res) {
  res.sendFile('index.html');
});

app.post('/join', async (req, res) => {
  const query = req.query;
  const title = query.title;
  const name = query.name;
  try {
    if (!meetingCache[title]) {
      meetingCache[title] = await chime
      .createMeeting({
        ClientRequestToken: uuidv4(),
        MediaRegion: region,
      })
      .promise();
      attendeeCache[title] = {};  
    }
    const joinInfo = {
      JoinInfo: {
        Title: title,
        Meeting: meetingCache[title].Meeting,
        Attendee: (
          await chime
            .createAttendee({
              MeetingId: meetingCache[title].Meeting.MeetingId,
              ExternalUserId: uuidv4(),
            })
            .promise()
        ).Attendee,
      }
    };
    attendeeCache[title][joinInfo.JoinInfo.Attendee.AttendeeId] = name;
    res.status(201);
    res.type('application/json');
    res.send(JSON.stringify(joinInfo));
  }
  catch (err){
    console.log(err)
  }
});

app.post('/attendee', function (req, res) {
  res.send('Got a POST request')
});

app.post('/meeting', function (req, res) {
  res.send('Got a POST request')
});

app.post('/end', async (req, res) => {
  try {
    const query = req.query;
    const title = query.title;
    await chime
      .deleteMeeting({
        MeetingId: meetingCache[title].Meeting.MeetingId,
      })
      .promise();
      res.status(200);
      res.send();
  }
  catch{}
});

app.post('/logs', function (req, res) {
  res.status(200);
  res.type('application/json');
  res.send("");
});

app.use((req, res) => {
  res.type('text/plain')
  res.status(404)
  res.send('404 - Not Found')
})


app.listen(8080, function () {
  console.log('Chime app listening on port 8080!');
});

/*
const httpsServer = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
}, app);

httpsServer.listen(port, () => {
    console.log('HTTPS Server running on port '+port);
});
*/