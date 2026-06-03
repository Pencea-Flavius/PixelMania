const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");

const formidable = require("formidable");
const session = require("express-session");

const AccesBD = require("./module_proprii/accesbd.js");
const { Utilizator } = require("./module_proprii/utilizator.js");

app = express();
app.set("view engine", "ejs")
const pg = require("pg")

app.use(session({
    secret: 'pixelmania-secret',
    resave: true,
    saveUninitialized: false
}));


// CERINTA ETAPA 5: Pregatire cadru de lucru (folderScss, folderCss, folderBackup)
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


let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate", "poze_uploadate"]
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), { recursive: true });
    }
}
//folderul static de resurse 
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
//Etapa 5

// --- BONUS 4: fix pentru fisiere cu puncte in nume ---
// CERINTA ETAPA 5: Funcția de compilare a scss-urilor
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

    // CERINTA ETAPA 5: Salvare în backup (înainte de compilarea și suprascrierea css-ului asociat)
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


// CERINTA ETAPA 5: Compilare inițială. La pornirea serverului, toate fisierele scss sunt compilate.
// Compilare initiala la pornirea serverului
vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss" && !path.basename(numeFis).startsWith("_")) {
        compileazaScss(numeFis);
    }
}

// CERINTA ETAPA 5: Compilare pe parcurs. Se urmăresc modificările din folderul de fișiere scss cu fs.watch()
// Compilare automata la modificare fisiere scss
fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        if (numeFis && !path.basename(numeFis).startsWith("_")) {
            let caleCompleta = path.join(obGlobal.folderScss, numeFis);
            if (fs.existsSync(caleCompleta)) {
                compileazaScss(caleCompleta);
            }
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


// CERINTA ETAPA 7: helper pentru citirea cookie-urilor din headerul HTTP
function citesteCookie(req, nume) {
    let raw = req.headers.cookie;
    if (!raw) return null;
    let m = raw.match(new RegExp(`(?:^|; )${nume}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
}

// CERINTA ETAPA 7 (bootstrap_js_): selecteaza 5 produse aleatoare din BD
function getProduseCarusel(callback) {
    client.query("select count(*) as total from console", function (err, rezTotal) {
        if (err) { callback(err, null); return; }
        let total = parseInt(rezTotal.rows[0].total);
        let limit = Math.min(5, total);
        if (limit === 0) { callback(null, []); return; }
        // luam ids aleatoare in domeniul [1, total]; ne bazam pe ORDER BY random() ca alternativa robusta
        client.query("select * from console order by random() limit $1", [limit], function (err2, rez2) {
            if (err2) { callback(err2, null); return; }
            callback(null, rez2.rows);
        });
    });
}

app.get(["/", "/index", "/home"], function (req, res) {
    let { imagini, anotimp } = getImaginiSezon();
    // ETAPA 7 (animatie-banner): cititul cookie-ului "ultim_produs" si afisarea lui pe prima pagina
    let ultimulProdusAccesat = citesteCookie(req, "ultim_produs");
    getProduseCarusel(function (err, produseCarousel) {
        if (err) {
            console.log("Eroare BD carusel:", err);
            produseCarousel = [];
        }
        res.render("pagini/index", {
            ip: req.ip,
            imagini,
            anotimp,
            produseCarousel,
            ultimulProdusAccesat
        });
    });
});

// CERINTA ETAPA 7 (bootstrap_js_): endpoint JSON pentru refresh-ul caruselului la 15s
app.get("/api/produse-carusel", function (req, res) {
    getProduseCarusel(function (err, produse) {
        if (err) {
            res.status(500).json({ err: "Eroare BD" });
            return;
        }
        res.json(produse);
    });
});

app.get("/galerie-statica", function (req, res) {
    let { imagini, anotimp } = getImaginiSezon();
    res.render("pagini/galerie-statica", {
        imagini,
        anotimp
    });
});



// BONUS 1 (ETAPA 5): Galeria animată (Generarea CSS-ului prin node pe baza SASS-ului)
// --- GALERIE ANIMATA ---
function genCssKeyframes(n) {
    let caleScss = path.join(obGlobal.folderScss, "_galerie_animata_sabloane.scss");
    let caleCss = path.join(obGlobal.folderCss, "galerie-animata-gen.css");

    try {
        let continutScss = fs.readFileSync(caleScss, "utf8");
        let variabilaSass = `$n-imagini: ${n};\n`;

        let rezultat = sass.compileString(variabilaSass + continutScss, {
            style: "expanded",
            quietDeps: true
        });
        fs.writeFileSync(caleCss, rezultat.css);
        console.log(`[SASS-DINAMIC] Compilare galerie animata pentru n=${n} reusita.`);
    } catch (err) {
        console.error("[EROARE SASS-DINAMIC] Eroare la compilarea galeriei animate:", err.message);
    }
}

app.get("/galerie-dinamica", function (req, res) {
    let toateImagini = obGlobal.obImagini.imagini;
    let imaginiPare = toateImagini.filter((_, idx) => idx % 2 === 0);

    let puteri = [2, 4, 8, 16].filter(p => p <= imaginiPare.length);
    if (puteri.length === 0) puteri = [2];
    let n = puteri[Math.floor(Math.random() * puteri.length)];

    // Generam CSS-ul cu SCSS dinamic bazat pe N
    genCssKeyframes(n);

    res.render("pagini/galerie-dinamica", {
        imagini: imaginiPare.slice(0, n),
        n
    });
});




// CERINTA ETAPA 6: middleware care preia marcile (categoria mare) din enumeratia
// din BD si le ataseaza la res.locals pentru a fi disponibile in meniu pe orice pagina
app.use(function (req, res, next) {
    client.query("select unnest(enum_range(null::marca_consola)) as marca", function (err, rez) {
        if (err) {
            res.locals.marciMeniu = [];
        } else {
            res.locals.marciMeniu = rez.rows.map(r => r.marca);
        }
        next();
    });
});

// CERINTA ETAPA 6: pagina de produse - filtrare server-side dupa categoria mare (din meniu)
// + furnizare date pentru toate cele 8 tipuri de input
app.get("/produse", function (req, res) {
    let clauzaWhere = ""
    let marcaSelectata = null;
    if (req.query.marca && req.query.marca !== "toate") {
        marcaSelectata = req.query.marca;
        clauzaWhere = `where marca='${req.query.marca}'`
    }

    client.query(`select * from console ${clauzaWhere} order by id`, function (err, rez) {
        if (err) {
            console.log("Eroare BD", err);
            afisareEroare(res, 2);
            return;
        }
        client.query("select unnest(enum_range(null::marca_consola)) as val", function (err, rezMarci) {//functia care transforma un enum in coloana cu valori
            if (err) { afisareEroare(res, 2); return; }
            client.query("select unnest(enum_range(null::stare_consola)) as val", function (err, rezStari) {//functia care transforma un enum in coloana cu valori
                if (err) { afisareEroare(res, 2); return; }
                client.query("select unnest(enum_range(null::tip_livrare)) as val", function (err, rezLivrare) {//functia care transforma un enum in coloana cu valori
                    if (err) { afisareEroare(res, 2); return; }
                    // Extragerea limitelor si atributelor din BD pentru generarea dinamica a celor 8 filtre
                    client.query("select min(pret) as minp, max(pret) as maxp, min(an_lansare) as mina, max(an_lansare) as maxa, max(length(nume)) as maxlennume, max(length(descriere)) as maxlendesc from console", function (err, rezLimite) {
                        if (err) { afisareEroare(res, 2); return; }
                        // Bonus 1 ETAPA 6: pentru text input -> sugestii cu numele tuturor produselor
                        client.query("select nume from console order by nume", function (err, rezNume) {
                            if (err) { afisareEroare(res, 2); return; }
                            client.query("select distinct extract(month from data_adaugare) as luna from console order by luna", function (err, rezLuni) {
                                if (err) { afisareEroare(res, 2); return; }
                                let lim = rezLimite.rows[0];
                                res.render("pagini/produse", {
                                    produse: rez.rows,
                                    marci: rezMarci.rows.map(r => r.val),
                                    stari: rezStari.rows.map(r => r.val),
                                    tipuriLivrare: rezLivrare.rows.map(r => r.val),
                                    numeProduse: rezNume.rows.map(r => r.nume),
                                    minPret: Math.floor(parseFloat(lim.minp) || 0),
                                    maxPret: Math.ceil(parseFloat(lim.maxp) || 1000),
                                    minAn: parseInt(lim.mina) || 1970,
                                    maxAn: parseInt(lim.maxa) || 2025,
                                    maxLenNume: parseInt(lim.maxlennume) || 100,
                                    maxLenDescriere: parseInt(lim.maxlendesc) || 1000,
                                    anMediu: Math.round((parseInt(lim.mina) + parseInt(lim.maxa)) / 2) || 2010,
                                    luniExistente: rezLuni.rows.map(r => parseInt(r.luna) - 1),
                                    marcaSelectata: marcaSelectata
                                });
                            });
                        });
                    });
                });
            });
        });
    });
})

// BONUS 17 ETAPA 6: helper pentru calcul pret set cu reducere min(5,n)*5%
// PROF: Bonus 17 - Functia care calculeaza matematic reducerea pentru Seturi pe baza produselor componente
function calcPretSet(produseInSet) {
    let n = produseInSet.length;
    let reducere = Math.min(5, n) * 5;
    let suma = produseInSet.reduce((s, p) => s + parseFloat(p.pret), 0);
    let final = suma - (suma * reducere / 100);
    return {
        suma_initiala: suma.toFixed(2),
        reducere_procent: reducere,
        pret_final: final.toFixed(2)
    };
}

app.get("/produs/:id", function (req, res) {
    let id = parseInt(req.params.id);
    if (isNaN(id)) {
        afisareEroare(res, 404, "Produs inexistent");
        return;
    }
    client.query(`select * from console where id=${id}`, function (err, rez) {
        if (err) {
            console.log("Eroare BD", err);
            afisareEroare(res, 2);
            return;
        }
        if (rez.rowCount == 0) {
            afisareEroare(res, 404, "Produs inexistent");
            return;
        }
        // BONUS 17: seturi din care face parte produsul curent
        let qSeturi = `
            SELECT s.id, s.nume_set, s.descriere_set,
                   json_agg(json_build_object('id', p.id, 'nume', p.nume, 'pret', p.pret, 'imagine', p.imagine)) as produse
            FROM seturi s
            JOIN asociere_set as1 ON s.id = as1.id_set
            JOIN asociere_set as2 ON s.id = as2.id_set
            JOIN console p ON as2.id_produs = p.id
            WHERE as1.id_produs = ${id}
            GROUP BY s.id, s.nume_set, s.descriere_set
        `;
        client.query(qSeturi, function (errS, rezS) {
            let seturi = [];
            if (!errS) {
                seturi = rezS.rows.map(set => Object.assign(set, calcPretSet(set.produse)));
            }
            // CERINTA ETAPA 7 (animatie-banner): cookie ultim_produs setat server-side; 12h (43200s)
            res.setHeader(
                "Set-Cookie",
                `ultim_produs=${encodeURIComponent(rez.rows[0].nume)}; Max-Age=43200; Path=/`
            );
            res.render("pagini/produs", { prod: rez.rows[0], seturi });
        });
    });
})

// BONUS 17: pagina cu lista seturi
app.get("/seturi", function (req, res) {
    let q = `
        SELECT s.id, s.nume_set, s.descriere_set,
               json_agg(json_build_object('id', p.id, 'nume', p.nume, 'pret', p.pret, 'imagine', p.imagine)) as produse
        FROM seturi s
        JOIN asociere_set asoc ON s.id = asoc.id_set
        JOIN console p ON asoc.id_produs = p.id
        GROUP BY s.id, s.nume_set, s.descriere_set
        ORDER BY s.id
    `;
    client.query(q, function (err, rez) {
        if (err) { console.log(err); afisareEroare(res, 2); return; }
        let seturi = rez.rows.map(set => Object.assign(set, calcPretSet(set.produse)));
        res.render("pagini/seturi", { seturi });
    });
})

// BONUS 17: pagina set individual
app.get("/set/:id", function (req, res) {
    let id = parseInt(req.params.id);
    if (isNaN(id)) { afisareEroare(res, 404, "Set inexistent"); return; }
    let q = `
        SELECT s.id, s.nume_set, s.descriere_set,
               json_agg(json_build_object('id', p.id, 'nume', p.nume, 'pret', p.pret, 'imagine', p.imagine, 'marca', p.marca)) as produse
        FROM seturi s
        JOIN asociere_set asoc ON s.id = asoc.id_set
        JOIN console p ON asoc.id_produs = p.id
        WHERE s.id = ${id}
        GROUP BY s.id, s.nume_set, s.descriere_set
    `;
    client.query(q, function (err, rez) {
        if (err) { console.log(err); afisareEroare(res, 2); return; }
        if (rez.rowCount == 0) { afisareEroare(res, 404, "Set inexistent"); return; }
        let set = Object.assign(rez.rows[0], calcPretSet(rez.rows[0].produse));
        res.render("pagini/set", { set });
    });
})

// BONUS 20: pagina de comparare produse
// PROF: Bonus 20 - Endpointul server-side unde browser-ul trimite ambele ID-uri de comparat
app.get("/comparare", function (req, res) {
    let ids = [].concat(req.query.id || []).map(x => parseInt(x)).filter(x => !isNaN(x));
    if (ids.length < 2) {
        afisareEroare(res, 404, "Selectati minim 2 produse pentru comparare");
        return;
    }
    // Limitam la 2 produse
    ids = ids.slice(0, 2);
    client.query(`select * from console where id in (${ids.join(',')})`, function (err, rez) {
        if (err) { console.log(err); afisareEroare(res, 2); return; }
        res.render("pagini/comparare", { produse: rez.rows });
    });
});

// ------------------------- Inregistrare utilizatori (lab12) -------------------------

app.get("/inregistrare", function (req, res) {
    res.render("pagini/inregistrare");
});

app.post("/inregistrare", function (req, res) {
    var username, poza;
    var formular = new formidable.IncomingForm();
    formular.parse(req, function (err, campuriText, campuriFisier) {
        var eroare = "";
        try {
            var utilizNou = new Utilizator();
            utilizNou.setareNume = campuriText.nume[0];
            utilizNou.setareUsername = campuriText.username[0];
            utilizNou.email = campuriText.email[0];
            utilizNou.prenume = campuriText.prenume[0];
            utilizNou.parola = campuriText.parola[0];
            utilizNou.culoare_chat = campuriText.culoare_chat[0];
            utilizNou.poza = poza;
            Utilizator.getUtilizDupaUsername(campuriText.username[0], {}, function (u, parametru, eroareUser) {
                if (eroareUser == -1) {
                    utilizNou.salvareUtilizator();
                } else {
                    eroare += "Mai exista username-ul";
                }
                if (!eroare) {
                    res.render("pagini/inregistrare", { raspuns: "Inregistrare cu succes! Verifica mailul pentru confirmare." });
                } else {
                    res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
                }
            });
        }
        catch (e) {
            console.log(e);
            eroare += "Eroare site; reveniti mai tarziu";
            res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
        }
    });
    formular.on("field", function (nume, val) {
        if (nume == "username") username = val;
    });
    formular.on("fileBegin", function (nume, fisier) {
        if (!fisier.originalFilename) return;
        var folderUser = path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser, { recursive: true });
        fisier.filepath = path.join(folderUser, fisier.originalFilename);
        poza = fisier.originalFilename;
    });
});

app.get("/cod/:username/:token", function (req, res) {
    try {
        var parametriCallback = { req: req, token: req.params.token };
        Utilizator.getUtilizDupaUsername(req.params.username, parametriCallback, function (u, obparam) {
            if (!u) { afisareEroare(res, 3); return; }
            AccesBD.getInstanta().update({
                tabel: "utilizatori",
                campuri: { confirmat_mail: true },
                conditiiAnd: [`id=${u.id}`, `cod='${obparam.token}'`]
            }, function (err, rezUpdate) {
                if (err || rezUpdate.rowCount == 0) {
                    console.log("Cod:", err);
                    afisareEroare(res, 3);
                } else {
                    res.render("pagini/confirmare");
                }
            });
        });
    }
    catch (e) {
        console.log(e);
        afisareEroare(res, 2);
    }
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
