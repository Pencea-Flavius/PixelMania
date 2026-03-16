const express = require("express");
const path = require("path");

app = express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.get("/cale", function (req, res) {
    res.send("<h1>Calea <b style = 'color:red'>este:</b></h1>");
    console.log("Am primit o cerere Get pe /cale");
})

app.get("/cale2", function (req, res) {
    res.write("<h1>Calea este:</h1>");
    res.write("<p>A doua cale</p>");
    res.end();
})



app.listen(8080);
console.log("Serverul a pornit!");