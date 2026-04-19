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
    res.sendFile(path.join(__dirname, "resurse/ico/favicon.ico"))
});


function verificaErori() {
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

    for (const prop of ["info_erori", "cale_baza", "eroare_default"]) {
        if (!(prop in erori)) {
            console.error("[EROARE] Proprietatea '" + prop + "' lipseste din erori.json.");
        }
    }

    for (const prop of ["titlu", "text", "imagine"]) {
        if (!(prop in erori.eroare_default)) {
            console.error("[EROARE] Proprietatea '" + prop + "' lipseste din obiectul 'eroare_default'.");
        }
    }

    const caleBaza = path.join(__dirname, erori.cale_baza);
    if (!fs.existsSync(caleBaza) || !fs.statSync(caleBaza).isDirectory()) {
        console.error("[EROARE] Folderul specificat in 'cale_baza' nu exista: " + caleBaza);
    }

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

    let lista_identificatori = [];
    for (let { identificator, status, titlu, text, imagine } of erori.info_erori) {
        if (lista_identificatori.includes(identificator)) {
            console.error("[EROARE] Exista mai multe erori cu identificatorul " + identificator +
                " — status: " + status + ", titlu: " + titlu + ", text: " + text + ", imagine: " + imagine);
        }
        lista_identificatori.push(identificator);
    }
}

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut);

    let err_default = erori.eroare_default;
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine);

    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine);
    }
}

verificaErori();
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
