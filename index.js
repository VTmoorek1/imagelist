var express = require("express");
var mongodb = require("mongodb");
var bodyParser = require("body-parser");
var http = require("http");
//var dotenv = require("dotenv");
//dotenv.load();

var app = express();
var mongoClient = mongodb.MongoClient;
var port = process.env.PORT || 5000;
var dburl = process.env.MONGO_URI;


function getImageJSONFromGoogle(url,response) {
    
    http.get({host:"www.googleapis.com",
        path: "/customsearch/v1?key=AIzaSyDbwr3Ph9LWubv7YQzCch84opBLRm_oyCY&cx=000687856936516543823:oiassqnloma&q=cars&searchType=image"
    }, function (res) {
       var body = "";
       res.setEncoding("utf-8");
       
       res.on("data", function (data) {
           body += data;
       });
       
       res.on("end", function () {
           response.send(body);
       });
       
       res.on('error', function(err) {
        response.send('error: ' + err.message);
    });
       
    });
};

app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/api/imagesearch/", function(request, response) {
    
    getImageJSONFromGoogle("",response);
    
});

app.get("*", function(request, response) {
        response.send("404!");
});

app.listen(port, function() {
    console.log("App listening on port " + port);
});
