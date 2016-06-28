var express = require("express");
var mongodb = require("mongodb");
var bodyParser = require("body-parser");
var https = require("https");
//var dotenv = require("dotenv");
//dotenv.load();

var app = express();
var mongoClient = mongodb.MongoClient;
var port = process.env.PORT || 5000;
var dburl = process.env.MONGO_URI;


function getImageJSONFromGoogle(url, response) {

    https.get({
        host: "www.googleapis.com",
        path: url
    }, function(res) {
        var body = "";
        res.setEncoding("utf-8");

        res.on("data", function(data) {
            body += data;
        });

        res.on("end", function() {
            var jsObj = JSON.parse(body);
            var items = [];

            if (!jsObj.error) {
                jsObj.items.forEach(function(data) {
                    items.push({
                        "url": data.link,
                        "snippet": data.snippet,
                        "thumbnail": data.image.thumbnailLink,
                        "context": data.image.contextLink
                    });
                });
                response.send(items);
            }
            else {
                response.send(jsObj.error);
            }


        });

        res.on('error', function(err) {
            response.send('error: ' + err.message);
        });

    });
};

app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/api/imagesearch/:SEARCH", function(request, response) {
    var searchTerm = request.params.SEARCH;
    var tempOff = request.query.offset;
    var url = "/customsearch/v1?key=AIzaSyDbwr3Ph9LWubv7YQzCch84opBLRm_oyCY&cx=000687856936516543823:oiassqnloma&q=[searcher]&searchType=image"
    var offsetStr = "";

    if (tempOff) {
        var pageOffset = (tempOff * 10) + 1;
        offsetStr = "&start=" + pageOffset;
    }

    url = url.replace("[searcher]", searchTerm) + offsetStr;

    getImageJSONFromGoogle(url, response);

    mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log(err);
        }
        else {
            var searches = db.collection("searches");

            // INSERT INTO MONGO
            searches.insert({
                term: searchTerm,
                when: new Date()
            }, function(err, ids) {
                if (err) {
                    console.log(err);
                }
                db.close();
            });
        }
    });

});

app.get("/api/latest/imagesearch/", function(request, response) {
    mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log(err);
        }
        else {
            var searches = db.collection("searches");
            var options = {
                "limit": 10,
                "sort": [
                    ["when","desc"]    
                ]
                
            };

            // fIND URL IF SHORT URL AND REDIRECT TO PAGE
            searches.find({}, options).toArray(function(err, items) {
                if (err) {
                    response.send(err);
                }
                else {
                    var searchItems = [];

                    items.forEach(function(data) {
                        searchItems.push({
                            "term": data.term,
                            "when": data.when
                        });
                    });

                    response.send(searchItems);
                }

                db.close();
            });
        }
    });
});

app.get("*", function(request, response) {
    response.send("404!");
});

app.listen(port, function() {
    console.log("App listening on port " + port);
});
