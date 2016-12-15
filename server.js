
const http = require('http');
const request = require('request-promise');
const express = require('express');
const log = require('winston');
const util = require('util');

const router = express();
const server = http.createServer(router);
const baseUri = "https://beta-meldingsutveksling.difi.no";

function getLatestAsync(environment){
    return new Promise((resolve, reject) =>{
        var service = util.format("service/local/lucene/search?a=integrasjonspunkt&repositoryId=%s", environment)
        var uri = util.format("%s/%s", baseUri, service)
        var options = getOptions(uri);
         request.get(options).then(function(body) {  
            var info = JSON.parse(body);
            var latest = info.data[0].version;
            resolve(latest);
        });
    });
}

function getMetaInfo(environment, version){
    return new Promise((resolve, reject) =>{
        var uri = getUri( util.format("service/local/artifact/maven/resolve?r=%s&g=no.difi.meldingsutveksling&a=integrasjonspunkt&v=%s", environment,version));
        var options = getOptions(uri);
        request.get(options).then(function(body){
            info = JSON.parse(body);
            var metaInfo = {version : info.data.version, sha1 : info.data.sha1};
            resolve(metaInfo);
        });
    });
}

function getUri(service){
    return util.format("%s/%s", baseUri, service);
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
    catch(err){
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
    
    getLatestAsync(environment)
    .then(latest => {
        latestVersion.baseVersion = latest.toString()
    
        getMetaInfo(environment,latest.toString())
            .then(meta => {
                latestVersion.version = meta.version;
                latestVersion.sha1 = meta.sha1;
                var json = JSON.stringify({ 
                        "baseVersion": latestVersion.baseVersion,
                        "version": latestVersion.version,
                        "sha1": latestVersion.sha1,
                        "environment": latestVersion.environment
                    });
                    res.send(json) ;
            })
    })
    .catch(err => console.log)   
});




server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

