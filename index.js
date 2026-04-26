const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");

app = express();
app.set("view engine", "ejs")
const pg = require("pg")


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

client = new pg.Client({
    database: "cti_2026",
    user: "flavius",
    password: "flavius",
    host: "localhost",
    port: 5432
})

client.connect()//transmite datele


let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"]
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), { recursive: true });
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/ico/favicon.ico"))
});


const caleEroriJson = path.join(__dirname, "resurse/json/erori.json");

function verificaExistentaFisierErori(cale) {
    if (!fs.existsSync(cale)) {
        console.error("Eroare: Fișierul erori.json nu există.");
        process.exit(1);
    }
}
//Nu există fisierul erori.json
verificaExistentaFisierErori(caleEroriJson);

const textJsonErori = fs.readFileSync(caleEroriJson).toString("utf-8");
const obiectEroriParsed = JSON.parse(textJsonErori);

function verificaProprietatiPrincipale(obiectJson) {
    if (!obiectJson.info_erori || !obiectJson.cale_baza || !obiectJson.eroare_default) {
        console.error("Eroare: Lipsesc una sau mai multe dintre proprietățile: info_erori, cale_baza, eroare_default.");
    }
}
// Nu există una dintre proprietățile: info_erori, cale_baza, eroare_default
verificaProprietatiPrincipale(obiectEroriParsed);

function verificaProprietatiEroareDefault(eroareDefault) {
    if (eroareDefault) {
        if (!eroareDefault.titlu || !eroareDefault.text || !eroareDefault.imagine) {
            console.error("Eroare: Pentru eroarea default lipsește una dintre proprietățile: titlu, text sau imagine.");
        }
    }
}
//Pentru eroarea default lipseste una dintre proprietățile: titlu, text sau imagine.
verificaProprietatiEroareDefault(obiectEroriParsed.eroare_default);

function verificaExistentaFolderCaleBaza(caleBaza) {
    if (caleBaza) {
        let caleAbsoluta = path.join(__dirname, caleBaza);
        if (!fs.existsSync(caleAbsoluta)) {
            console.error(`Eroare: Folderul specificat în "cale_baza" (${caleBaza}) nu există în sistemul de fișiere.`);
        }
    }
}
//Folderul specificat în "cale_baza" nu există în sistemul de fișiere
verificaExistentaFolderCaleBaza(obiectEroriParsed.cale_baza);

function verificaExistentaImagini(caleBaza, eroareDefault, infoErori) {
    if (caleBaza) {
        let caleAbsolutaBaza = path.join(__dirname, caleBaza);

        if (eroareDefault && eroareDefault.imagine) {
            let caleImgDefault = path.join(caleAbsolutaBaza, eroareDefault.imagine);
            if (!fs.existsSync(caleImgDefault)) {
                console.error(`Eroare: Fișierul imagine pentru eroarea default (${eroareDefault.imagine}) nu există.`);
            }
        }

        if (infoErori) {
            for (let eroare of infoErori) {
                if (eroare.imagine) {
                    let caleImg = path.join(caleAbsolutaBaza, eroare.imagine);
                    if (!fs.existsSync(caleImg)) {
                        console.error(`Eroare: Fișierul imagine (${eroare.imagine}) pentru eroarea cu identificatorul ${eroare.identificator} nu există.`);
                    }
                }
            }
        }
    }
}
//Nu există (în sistemul de fișiere) vreunul dintre fișierele imagine
verificaExistentaImagini(obiectEroriParsed.cale_baza, obiectEroriParsed.eroare_default, obiectEroriParsed.info_erori);

function verificaProprietatiDuplicateString(textJson) {
    const regexObiecte = /\{[^{}]*\}/g;
    const obiecte = textJson.match(regexObiecte);

    if (obiecte) {
        for (let obiectStr of obiecte) {
            let chei = [...obiectStr.matchAll(/"([^"]+)"\s*:/g)].map(match => match[1]);
            let cheiUnice = new Set(chei);

            if (chei.length !== cheiUnice.size) {
                console.error("Eroare: Există o proprietate specificată de mai multe ori într-un obiect din fișierul JSON.");
            }
        }
    }
}
//Pentru un obiect din fișier există o proprietate specificată de mai multe ori
verificaProprietatiDuplicateString(textJsonErori);

function verificaIdentificatoriDuplicati(infoErori) {
    if (infoErori) {
        let dictionarId = {};

        for (let eroare of infoErori) {
            if (!dictionarId[eroare.identificator]) {
                dictionarId[eroare.identificator] = [];
            }
            dictionarId[eroare.identificator].push(eroare);
        }

        for (let id in dictionarId) {
            if (dictionarId[id].length > 1) {
                let detalii = dictionarId[id].map(e =>
                    `[status: ${e.status}, titlu: "${e.titlu}", text: "${e.text}", imagine: "${e.imagine}"]`
                ).join(" vs ");
                console.error(`Eroare: Există mai multe erori cu identificatorul ${id}: ${detalii}`);
            }
        }
    }
}
//Există mai multe erori cu același identificator
verificaIdentificatoriDuplicati(obiectEroriParsed.info_erori);



function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut);

    let err_default = erori.eroare_default;
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine);

    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine);
    }
}

initErori();


function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find((elem) =>
        elem.identificator == identificator
    )
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


// --- BONUS 4: fix pentru fisiere cu puncte in nume ---
function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let lastDot = numeFisExt.lastIndexOf(".");
        let numeFis = lastDot !== -1 ? numeFisExt.substring(0, lastDot) : numeFisExt;
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss)
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss)

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true })
    }

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        // BONUS 3: timestamp in backup filename
        let lastDotCss = numeFisCss.lastIndexOf(".");
        let numeBase = lastDotCss !== -1 ? numeFisCss.substring(0, lastDotCss) : numeFisCss;
        let extCss = lastDotCss !== -1 ? numeFisCss.substring(lastDotCss) : ".css";
        let timestamp = Date.now();
        let numeFisBackup = numeBase + "_" + timestamp + extCss;
        try {
            fs.copyFileSync(caleCss, path.join(caleBackup, numeFisBackup));
        } catch (err) {
            console.error("[EROARE] Nu s-a putut copia fisierul CSS in backup:", err.message);
        }
    }

    try {
        let rez = sass.compile(caleScss, {
            "sourceMap": true,
            quietDeps: true,
            silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"]
        });
        fs.writeFileSync(caleCss, rez.css);
    } catch (err) {
        console.error("[EROARE] Compilare SCSS esuat pentru", caleScss, ":", err.message);
    }
}


// Compilare initiala la pornirea serverului
vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

// Compilare automata la modificare fisiere scss
fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
})


// --- GALERIE ---
function initImagini() {
    // BONUS 5: Verificare date din JSON
    const caleJson = path.join(__dirname, "resurse/json/galerie.json");
    if (!fs.existsSync(caleJson)) {
        console.error("[EROARE] Fisierul galerie.json nu a fost gasit la calea: " + caleJson);
        obGlobal.obImagini = { imagini: [], cale_galerie: "" };
        return;
    }

    var continut = fs.readFileSync(caleJson).toString("utf-8");
    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie;

    // BONUS 5: Verifica daca folderul galerie exista
    let caleAbs = path.join(__dirname, caleGalerie);
    if (!fs.existsSync(caleAbs) || !fs.statSync(caleAbs).isDirectory()) {
        console.error("[EROARE] Folderul specificat in 'cale_galerie' nu exista: " + caleAbs);
    }

    let caleAbsMediu = path.join(caleAbs, "mediu");
    let caleAbsMic = path.join(caleAbs, "mic");
    if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu, { recursive: true });
    if (!fs.existsSync(caleAbsMic)) fs.mkdirSync(caleAbsMic, { recursive: true });

    for (let imag of vImagini) {
        let caleFisier = imag.cale_fisier;

        // BONUS 5: Verifica daca fisierul imagine exista
        let caleFisAbs = path.join(caleAbs, caleFisier);
        if (!fs.existsSync(caleFisAbs)) {
            console.error("[EROARE] Fisierul imagine nu exista pe disk: " + caleFisAbs +
                " (specificat ca '" + caleFisier + "' in galerie.json)");
        }

        // BONUS 4: fix pentru fisiere cu puncte in nume
        let lastDot = caleFisier.lastIndexOf(".");
        let numeFis = lastDot !== -1 ? caleFisier.substring(0, lastDot) : caleFisier;

        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        let caleFisMicAbs = path.join(caleAbsMic, numeFis + ".webp");

        if (fs.existsSync(caleFisAbs)) {
            sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs).catch(err => {
                console.error("[EROARE] sharp mediu pentru " + caleFisier + ":", err.message);
            });
            sharp(caleFisAbs).resize(150).toFile(caleFisMicAbs).catch(err => {
                console.error("[EROARE] sharp mic pentru " + caleFisier + ":", err.message);
            });
        }

        imag.fisier_mediu = "/" + caleGalerie + "/mediu/" + numeFis + ".webp";
        imag.fisier_mic = "/" + caleGalerie + "/mic/" + numeFis + ".webp";
        imag.fisier = "/" + caleGalerie + "/" + caleFisier;
    }
}
initImagini();


function getAnotimpCurent(data) {
    let luna = data.getMonth(); // 0-11
    if (luna >= 2 && luna <= 4) return "primavara"; // mar-mai
    if (luna >= 5 && luna <= 7) return "vara";      // iun-aug
    if (luna >= 8 && luna <= 10) return "toamna";   // sep-nov
    return "iarna";                                  // dec-feb
}

function getImaginiSezon() {
    let anotimp = getAnotimpCurent(new Date());
    let imagini = obGlobal.obImagini.imagini.filter(i => i.anotimp === anotimp);
    return { imagini: imagini.slice(0, 10), anotimp };
}


app.get(["/", "/index", "/home"], function (req, res) {
    let { imagini, anotimp } = getImaginiSezon();
    res.render("pagini/index", {
        ip: req.ip,
        imagini,
        anotimp
    });
});

app.get("/galerie-statica", function (req, res) {
    let { imagini, anotimp } = getImaginiSezon();
    res.render("pagini/galerie-statica", {
        imagini,
        anotimp
    });
});


// --- GALERIE ANIMATA ---

function genereazaScssGalerieAnimata(imagini, n) {
    // Generam CSS pur animat prin interpolare de math-uri

    let scss = `/* Galerie animata — generat automat de server: ${n} imagini */\n\n`;
    scss += `$n-imagini: ${n};\n`;
    scss += `$durata-imagine: 3s;\n`;
    scss += `$durata-totala: calc($n-imagini * $durata-imagine);\n\n`;
    scss += `$border-img: url('/resurse/border-galerie.png');\n\n`;

    // Containerul galeriei animate
    scss += `.galerie-animata {\n`;
    scss += `  position: relative;\n`;
    scss += `  width: 100%;\n`;
    scss += `  max-width: 630px;\n`;
    scss += `  aspect-ratio: 1 / 1;\n`;
    scss += `  margin: 0 auto;\n`;
    scss += `  border: 15px solid transparent;\n`;
    scss += `  border-image: $border-img 30 stretch;\n`;
    scss += `  background: #0a0a1a;\n`;
    scss += `  cursor: pointer;\n`;
    scss += `\n`;
    scss += `  /* Opreste animatia la hover! */\n`;
    scss += `  &:hover figure {\n`;
    scss += `    animation-play-state: paused;\n`;
    scss += `  }\n`;
    scss += `}\n\n`;

    scss += `.galerie-animata figure {\n`;
    scss += `  position: absolute;\n`;
    scss += `  inset: 0;\n`;
    scss += `  margin: 0;\n`;
    scss += `  z-index: -1;\n`;
    scss += `  opacity: 0;\n`;
    scss += `  background: #0a0a1a; /* Opreste gaurile din PNG-uri sa afiseze consola de deasupra! */\n`;
    scss += `  animation: animatieGalerie $durata-totala linear infinite;\n`;
    scss += `}\n\n`;

    scss += `.galerie-animata figure img {\n`;
    scss += `  width: 100%;\n`;
    scss += `  height: 100%;\n`;
    scss += `  object-fit: cover;\n`;
    scss += `  display: block;\n`;
    scss += `}\n\n`;

    // Injectam delay-ul descrescător ca la Cafenea
    for (let i = 0; i < n; i++) {
        scss += `.galerie-animata figure:nth-child(${i + 1}) {\n`;
        scss += `  animation-delay: calc((${i} * $durata-imagine) - $durata-totala);\n`;
        scss += `}\n\n`;
    }

    // Matematica duratei (timpul real alocat in portiunea loop-ului pt 'fade in / base / clip')
    let p_start = (100 / n).toFixed(4); // Ex pt N=4: 25% (T=3s)
    let p_start_minus = (Math.max(0, (100 / n) - 0.001)).toFixed(4);
    let p_end = ((100 * 4) / (n * 3)).toFixed(4); // Fades out at t=4s
    let p_end_plus = (((100 * 4) / (n * 3)) + 0.001).toFixed(4);

    scss += `@keyframes animatieGalerie {\n`;
    scss += `  0% {\n`;
    scss += `    z-index: 1; /* Pozitie de baza (asteapta dedesubt ca imaginea veche sa dispara) */\n`;
    scss += `    opacity: 1;\n`;
    scss += `    clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%, 0 50%, 100% 50%, 100% 100%, 0 100%);\n`;
    scss += `  }\n`;

    scss += `  ${p_start_minus}% {\n`;
    scss += `    z-index: 1;\n`;
    scss += `    opacity: 1;\n`;
    scss += `    clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%, 0 50%, 100% 50%, 100% 100%, 0 100%);\n`;
    scss += `  }\n`;

    scss += `  ${p_start}% {\n`;
    scss += `    z-index: 2; /* Timpul ei a venit, ea face un pas in fata ca sa acopere ecranul in timp ce 'se taie' */\n`;
    scss += `    opacity: 1;\n`;
    scss += `    clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%, 0 50%, 100% 50%, 100% 100%, 0 100%);\n`;
    scss += `  }\n`;

    scss += `  ${p_end}% {\n`;
    scss += `    z-index: 2;\n`;
    scss += `    opacity: 1;\n`;
    scss += `    clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0%, 0 100%, 100% 100%, 100% 100%, 0 100%);\n`;
    scss += `  }\n`;

    scss += `  ${p_end_plus}% {\n`;
    scss += `    z-index: -1; /* Complet invizibila */\n`;
    scss += `    opacity: 0;\n`;
    scss += `    clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0%, 0 100%, 100% 100%, 100% 100%, 0 100%);\n`;
    scss += `  }\n`;

    scss += `  100% {\n`;
    scss += `    z-index: -1;\n`;
    scss += `    opacity: 0;\n`;
    scss += `    clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0%, 0 100%, 100% 100%, 100% 100%, 0 100%);\n`;
    scss += `  }\n`;
    scss += `}\n\n`;

    scss += `@media screen and (max-width: 1000px) {\n`;
    scss += `  #galerie-animata-sec { display: none !important; }\n`;
    scss += `}\n`;

    return scss;
}

app.get("/galerie-dinamica", function (req, res) {
    let toateImagini = obGlobal.obImagini.imagini;
    // ia primele imagini cu index par din JSON
    let imaginiPare = toateImagini.filter((_, idx) => idx % 2 === 0);

    // putere a lui 2: mai mare strict decat 1 si mai mic strict decat 17
    // filtrare la cele disponibile
    let puteri = [2, 4, 8, 16].filter(p => p <= imaginiPare.length);
    if (puteri.length === 0) puteri = [2];
    let n = puteri[Math.floor(Math.random() * puteri.length)];

    let imaginiAnimate = imaginiPare.slice(0, n);

    // generare SCSS si compilare
    let scssContent = genereazaScssGalerieAnimata(imaginiAnimate, n);
    let caleScssGen = path.join(obGlobal.folderScss, "galerie-animata-gen.scss");
    let caleCssGen = path.join(obGlobal.folderCss, "galerie-animata-gen.css");
    fs.writeFileSync(caleScssGen, scssContent);
    compileazaScss(caleScssGen, caleCssGen);

    res.render("pagini/galerie-dinamica", {
        imagini: imaginiAnimate,
        n
    });
});


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
