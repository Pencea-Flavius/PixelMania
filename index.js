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




function verificaErori() {
    // (0.025) Verificam daca exista fisierul erori.json — daca nu, inchidem aplicatia
    const caleJson = path.join(__dirname, "resurse/json/erori.json");
    if (!fs.existsSync(caleJson)) {
        console.error("[EROARE CRITICA] Fisierul 'resurse/json/erori.json' nu a fost gasit. Aplicatia nu poate porni fara el.");
        process.exit(1);
    }

    let stringJson;
    let erori;
    try {
        stringJson = fs.readFileSync(caleJson).toString("utf-8");
        erori = JSON.parse(stringJson);
    } catch {
        console.error("[EROARE CRITICA] Fisierul 'erori.json' nu poate fi citit sau este invalid (JSON corupt).");
        process.exit(1);
    }

    // (0.025) Verificam daca exista proprietatile obligatorii la nivel de radacina
    for (const prop of ["info_erori", "cale_baza", "eroare_default"]) {
        if (!(prop in erori)) {
            console.error("[EROARE] Proprietatea '" + prop + "' lipseste din erori.json.");
        }
    }

    // (0.025) Verificam daca eroare_default are titlu, text si imagine
    for (const prop of ["titlu", "text", "imagine"]) {
        if (!(prop in erori.eroare_default)) {
            console.error("[EROARE] Proprietatea '" + prop + "' lipseste din obiectul 'eroare_default'.");
        }
    }

    // (0.025) Verificam daca folderul din cale_baza exista pe disk
    const caleBaza = path.join(__dirname, erori.cale_baza);
    if (!fs.existsSync(caleBaza) || !fs.statSync(caleBaza).isDirectory()) {
        console.error("[EROARE] Folderul specificat in 'cale_baza' nu exista: " + caleBaza);
    }

    // (0.05) Verificam daca toate imaginile (default + cele din info_erori) exista pe disk
    const toateErorile = [];
    toateErorile.push({ sursa: "eroare_default", imagine: erori.eroare_default.imagine });
    for (const e of erori.info_erori) {
        if (e.imagine) {
            toateErorile.push({ sursa: "eroare id=" + e.identificator, imagine: e.imagine });
        }
    }
    for (const { sursa, imagine } of toateErorile) {
        const caleImagine = path.join(caleBaza, imagine);
        if (!fs.existsSync(caleImagine)) {
            console.error("[EROARE] Imaginea '" + imagine + "' asociata lui '" + sursa + "' nu exista pe disk.");
        }
    }

    // (0.2) Verificam pe STRING daca vreo proprietate apare de doua ori intr-un obiect
    // Resetam lista la fiecare { nou gasit, si adaugam cheile rand cu rand
    let lista_dubluri = [];
    for (let linie of stringJson.split("\n")) {
        linie = linie.trim();
        if (linie.startsWith("{")) {
            lista_dubluri = [];
        }
        if (linie.startsWith('"')) {
            let cheie = linie.split('"')[1];
            if (lista_dubluri.includes(cheie)) {
                console.error("[EROARE] Proprietatea '" + cheie + "' apare de mai multe ori in acelasi obiect din erori.json.");
            }
            lista_dubluri.push(cheie);
        }
    }

    // (0.15) Verificam daca exista erori cu acelasi identificator
    // In mesaj afisam toate proprietatile in afara de identificator
    let lista_identificatori = [];
    for (let { identificator, status, titlu, text, imagine } of erori.info_erori) {
        if (lista_identificatori.includes(identificator)) {
            console.error("[EROARE] Exista mai multe erori cu identificatorul " + identificator + ":" +
                " titlu: " + titlu + ", text: " + text + ", imagine: " + imagine
            );
        }
        lista_identificatori.push(identificator);
    }
}

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut);

    // Prefixam caile imaginilor cu cale_baza pentru a le folosi direct in render
    let err_default = erori.eroare_default;
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine);

    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine);
    }
}

verificaErori();
initErori();


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