

const http = require('http');
const request = require('request-promise');
const express = require('express');
const log = require('winston');
const router = express();
const server = http.createServer(router);
const util = require('util');

const baseUri = "https://beta-meldingsutveksling.difi.no";

function getLatestAsync(environment){
    return new Promise((resolve, reject) =>{
        var service = util.format("service/local/lucene/search?a=integrasjonspunkt&repositoryId=%s", environment)
        var uri = util.format("%s/%s", baseUri, service)
        log.info(uri);
        var options = getOptions(uri);
         request.get(options).then(function(body) {  
            var info = JSON.parse(body);
            var latest = info.data[0].version;
            resolve(latest);
        });
    });
}

function getEnvrionment(env){
    switch (env) {
        case "releases": 
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


function getOptions(serviceUri){    
    var options = {        
        uri: serviceUri,
        headers: {
            'User-Agent': 'request',
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8',
        }
    };
    return options;
}

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
    
    Promise.all([getLatestAsync(environment)])
        .then((latest) => {
            log.info("environment: "+ environment + "version: "+latest );
            //var latestV = { baseVersion: latest, version: "", sha1: "", repositoryId: environment };
            latestVersion.baseVersion = latest.toString();
            latestVersion.sha1 = "";
            latestVersion.version = "";
            var json = JSON.stringify({ 
                "baseVersion": latestVersion.baseVersion,
                "version": latestVersion.version,
                "sha1": latestVersion.sha1,
                "environment": latestVersion.environment
            });
            res.send(json)            //res.send(latest);
           
        })
        .catch((err) => log.error(err));
});


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

