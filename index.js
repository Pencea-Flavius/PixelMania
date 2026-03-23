const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");

app = express();
app.set("view engine", "ejs")

obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
}


console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"]

for (let folder of vect_foldere) {
    let cale_folder = path.join(__dirname, folder)
    if (!fs.existsSync(cale_folder)) {
        fs.mkdirSync(cale_folder)
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")));
//orice fisier din resurse il trimite si face send file
app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
})
app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index"), {
        ip: req.ip
    };
})
//<p>ip: <%-locals.ip %></p>
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

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut)
    let err_default = erori.eroare_default
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine)
    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()

function afisareEroare(res, identificator, titlu, text, imagine) {
    //TO DO cautam eroarea dupa identificator
    let eroare = obGlobal.obErori.info_erori.find(element => element.identificator == identificator)
    //daca sunt setate titlu, text, imagine, le folosim, 
    //altfel folosim cele din fisierul json pentru eroarea gasita
    //daca nu o gasim, afisam eroarea default
    let errDeafaukt = obGlobal.obErori.eroare_default
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDeafaukt.imagine,
        titlu: titlu || eroare?.titlu || errDeafaukt.titlu,
        text: text || eroare?.text || errDeafaukt.text,
    })
}



app.get("/eroare/:cod", function (req, res) {
    afisareEroare(res, 404, "Eroare 404");
})

app.get("/*pagina", function (req, res) {
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/resurse") && path.extname(req.url) == "") {
        afisareEroare(res, 403);
        return;
    }
    if (path.extname(req.url) == ".ejs") {
        afisareEroare(res, 400);
        return;
    }
    try {
        res.render("pagini/" + req.url, function (err, rezRandare) {
            if (err) {
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404);
                    return;
                }
                afisareEroare(res);
                return;
            }
            res.send(rezRandare);
        });
    } catch (err) {
        if (err.message.includes("Cannot find module")) {
            afisareEroare(res, 404);
            return;
        }
        afisareEroare(res);
        return;
    }
});

app.listen(8080);
console.log("Serverul a pornit!");