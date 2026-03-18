const express = require("express");
const path = require("path");

app = express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.use("/resurse", express.static(path.join(__dirname, "resurse")));
//orice fisier din resurse il trimite si face send file

app.get("/", function (req, res) {
    res.render("pagini/index");
})

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
})
app.get("/:a/:b", function (req, res) {
    //res.send("<h1>Calea <b style = 'color:red'>este:</b></h1>");
    res.sendFile(path.join(__dirname, "index.html"));
    console.log(parseInt(req.params.a) + parseInt(req.params.b));
})

app.get("/cale/:a/:b", function (req, res) {
    //res.send("<h1>Calea <b style = 'color:red'>este:</b></h1>");
    res.send(parseInt(req.params.a) + parseInt(req.params.b));
    console.log("Am primit o cerere Get pe /cale");
})



app.get("/cale2", function (req, res) {
    res.write("<h1>Calea este:</h1>");
    res.write("<p>A doua cale</p>");
    res.end();
})



app.listen(8080);
console.log("Serverul a pornit!");