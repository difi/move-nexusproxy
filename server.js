

var http = require('http');
var request = require('request-promise');
var express = require('express');
var log = require('winston');

var router = express();
var server = http.createServer(router);

var baseUri = "https://beta-meldingsutveksling.difi.no";

function getLatestAsync(){
    return new Promise((resolve, reject) =>{
         request.get(options).then(function(body) {  
            var info = JSON.parse(body);
            var latest = info.data[0].version;
            resolve(latest);
        });
    });
}

function getEnvrionment(env){
    switch (env) {
        case "prod": 
            return "releases";
        case "staging":
            return "staging";
        case "systest":
            return "systest"
        case "itest":
            return "itest";
        default:
            return "none";
    }
}

var options = {
    uri: 'https://beta-meldingsutveksling.difi.no/service/local/lucene/search?a=integrasjonspunkt&repositoryId=staging',
    headers: {
        'User-Agent': 'request',
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
    }
};

router.get('/latest', function (req, res) {    
    var repositoryId;
    var environment;
    var latestVersion = new Object();
    try{
        environment = req.query.env;
        repositoryId = getEnvrionment(environment);
    }
    catch(err)
    {
        log.error("feil !!");
    }
    if(repositoryId == "none"){
        log.error ("unexsisting repositoryId: " +repositoryId);
        res.statusCode = 400
        res.statusMessage = environment + " is not a valid environment";
        res.send();
        return;
    }

    latestVersion.repositoryId = repositoryId.toString();   
    
    Promise.all([getLatestAsync()])
        .then((latest) => {
            log.info("environment: "+ environment + "version: "+latest );
            latestVersion.baseVersion = latest.toString();            
            var latestV = { baseVersion: latest, version: "", sha1: "", repositoryId: environment };
            var json = JSON.stringify({ 
                latest: latestVersion
            });
            res.send(json)            //res.send(latest);
           
        })
        .catch((err) => log.error(err));
});


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

