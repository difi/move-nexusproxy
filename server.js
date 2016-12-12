

var http = require('http');
var request = require('request-promise');
var express = require('express');
var log = require('winston');

var router = express();
var server = http.createServer(router);

function getLatestAsync(){
    return new Promise((resolve, reject) =>{
         request.get(options).then(function(body) {  
            var info = JSON.parse(body);
            var latest = info.data[0].latestSnapshot;
            resolve(latest);
        });
    });
}


var options = {
    uri: 'https://beta-meldingsutveksling.difi.no/service/local/lucene/search?a=integrasjonspunkt&repositoryId=staging',
    headers: {
        'User-Agent': 'request',
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
    }
};

function getLatest(){
    request.get(options).then(function(body) {  
        var info = JSON.parse(body);
        var latest = info.data[0].latestSnapshot;
        console.log(latest);
        return latest;
    });
}


router.get('/latest', function (req, res) {
    var latest = getLatest();
    console.log(latest);
    res.send(latest);
});

router.get('/latestasync', function (req, res) {
    env = req.query.env;
    log.info("env: "+env);
    Promise.all([getLatestAsync()])
        .then((latest) => {
            log.info("async-"+latest );
            res.send(latest);
        })
        .catch((err) => log.error(err));
});

router.get('/latestartifact', function(req, res){
    //var latest = await getLatest()
});

 
function callback(error, response, body, res) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    var latest = info.data[0].latestSnapshot;
    console.log(latest);
    res.send(latest);
  }
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

