const stage = process.env.STAGE || 'dev';
const 
serverless  = require('serverless-http'),
express     = require('express'),
bodyParser  = require('body-parser'),
config      = require(`./config/${stage}.json`),
crypto      = require('crypto');

const app = express();

app.use( ( req, res, next) => {
    var data = '';
    req.on('data', function(chunk) { 
        data += chunk;
    });
    req.on('end', function() {
        req.rawBody = data;
    });
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use( (req, res, next) => {
    const timestamp = req.headers['x-slack-request-timestamp'];
    const sig_basestring = 'v0:' + timestamp + ':' + req.rawBody;
    const req_signature = 'v0=' + crypto.createHmac(
        "sha256", 
        config.slack_signing_secret
    ).update(sig_basestring).digest("hex");
    
    const slack_signature = req.headers['x-slack-signature'];

    if(req_signature !== slack_signature){
        res.send(400);
    }else{
        next();
    }
});

app.post('/', (req, res) => {
    const { text } = req.body;
    const response = {
        "response_type": "in_channel",
        "text": "Join me on Fres.co :)",
        "attachments": [{
            text: 'https://fres.co/' + (!text ? 'office' : text.toLowerCase().replace(' ', '/')),
        }]
    };
    res.send(response);
});

module.exports.handler = serverless(app);