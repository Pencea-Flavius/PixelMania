const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");

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
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), { recursive: true });
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"))
});

app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index", {
        ip: req.ip
    });
});

// app.get("/despre", function(req, res){
//     res.render("pagini/despre");
// });




function initErori() {
    let caleJson = path.join(__dirname, "resurse/json/erori.json");
    if (!fs.existsSync(caleJson)) {
        console.error("Eroare: Nu există fisierul erori.json");
        process.exit(1);
    }
    let continut = fs.readFileSync(caleJson).toString("utf-8");

    // Verificare pentru proprietati duplicate, folosind regex care parseaza blocurile JSON {...}
    const blocuri = continut.match(/\{[^}]+\}/g) || [];
    for (let bloc of blocuri) {
        let chei = bloc.match(/"([^"]+)"\s*:/g);
        if (chei) {
            let setKeys = new Set();
            for (let ch of chei) {
                if (setKeys.has(ch)) {
                    console.error("Eroare JSON: Proprietatea " + ch + " este specificată de mai multe ori.");
                }
                setKeys.add(ch);
            }
        }
    }

    let erori;
    try {
        erori = obGlobal.obErori = JSON.parse(continut);
    } catch (e) {
        console.error("Eroare parsare JSON erori:", e.message);
        return;
    }

    if (!erori.info_erori || !erori.cale_baza || !erori.eroare_default) {
        console.error("Eroare JSON: Lipsește una dintre proprietățile: info_erori, cale_baza, eroare_default din fisier.");
    }

    let err_default = erori.eroare_default;
    if (err_default && (!err_default.titlu || !err_default.text || !err_default.imagine)) {
        console.error("Eroare JSON: Pentru eroarea default lipsește una dintre proprietățile: titlu, text, imagine.");
    }

    let folderBazaPath = path.join(__dirname, erori.cale_baza || "");
    if (!fs.existsSync(folderBazaPath)) {
        console.error("Eroare JSON: Folderul specificat în cale_baza nu există: " + folderBazaPath);
    } else {
        if (err_default && err_default.imagine) {
            let imagineDefCale = path.join(folderBazaPath, err_default.imagine);
            if (!fs.existsSync(imagineDefCale)) {
                console.error("Eroare JSON: Imaginea pentru eroarea_default nu există la calea " + imagineDefCale);
            }
        }
        
        if (erori.info_erori) {
            let duplicateMap = {};
            let identificatoriUnici = [];
            
            for (let eroare of erori.info_erori) {
                if (eroare.imagine) {
                    let imgCalePath = path.join(folderBazaPath, eroare.imagine);
                    if (!fs.existsSync(imgCalePath)) {
                        console.error("Eroare JSON: Asociația de imagine pt eroarea " + eroare.identificator + " nu exista la calea " + imgCalePath);
                    }
                }
                
                if (identificatoriUnici.includes(eroare.identificator)) {
                    duplicateMap[eroare.identificator] = true;
                } else {
                    identificatoriUnici.push(eroare.identificator);
                }
            }
            
            for (let id of Object.keys(duplicateMap)) {
                console.error("Eroare JSON: Există mai multe erori cu identificatorul " + id);
                for (let e of erori.info_erori) {
                    if (e.identificator == id) {
                        let eLog = Object.assign({}, e);
                        delete eLog.identificator;
                        console.error("Eroare JSON info duplicat:", JSON.stringify(eLog));
                    }
                }
            }
        }
    }

    // Setam caile in functie de "cale_baza" asa cum facea codul original
    if (err_default) {
        err_default.imagine = path.join(erori.cale_baza || "", err_default.imagine || "");
    }
    if (erori.info_erori) {
        for (let eroare of erori.info_erori) {
            eroare.imagine = path.join(erori.cale_baza || "", eroare.imagine || "");
        }
    }
}
initErori()


function afisareEroare(res, identificator, titlu, text, imagine) {
    //TO DO cautam eroarea dupa identificator
    let eroare = obGlobal.obErori.info_erori.find((elem) =>
        elem.identificator == identificator
    )
    //daca sunt setate titlu, text, imagine, le folosim, 
    //altfel folosim cele din fisierul json pentru eroarea gasita
    //daca nu o gasim, afisam eroarea default
    let errDefault = obGlobal.obErori.eroare_default;
    if (eroare?.status)
        res.status(eroare.identificator)
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });

}


app.get("/eroare", function (req, res) {
    afisareEroare(res, 404, "Titlu!!!")
});


function initImagini() {
    var continut = fs.readFileSync(path.join(__dirname, "resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie

    let caleAbs = path.join(__dirname, caleGalerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    for (let imag of vImagini) {
        [numeFis, ext] = imag.fisier.split("."); //"ceva.png" -> ["ceva", "png"]
        let caleFisAbs = path.join(caleAbs, imag.fisier);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu = path.join("/", caleGalerie, "mediu", numeFis + ".webp")
        imag.fisier = path.join("/", caleGalerie, imag.fisier)

    }
    // console.log(obGlobal.obImagini)
}
initImagini();


function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {

        let numeFisExt = path.basename(caleScss); // "folder1/folder2/a.scss" -> "a.scss"
        let numeFis = numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss = numeFis + ".css"; // output: a.css
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss)
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss)

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true })
    }

    // la acest punct avem cai absolute in caleScss si  caleCss

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css", numeFisCss))// +(new Date()).getTime()
    }
    rez = sass.compile(caleScss, { 
        "sourceMap": true,
        quietDeps: true,
        silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"]
    });
    fs.writeFileSync(caleCss, rez.css)

}


//la pornirea serverului
vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
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
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404)
                }
                else {
                    afisareEroare(res);
                }
            }
            else {
                res.send(rezRandare);
                //console.log("Rezultat randare", rezRandare);
            }
        });
    }
    catch (err) {
        if (err.message.includes("Cannot find module")) {
            afisareEroare(res, 404)
        }
        else {
            afisareEroare(res);
        }
    }
});


app.listen(8080);
console.log("Serverul a pornit!");