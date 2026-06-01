// CERINTA ETAPA 6: filtrare, sortare (2 chei), calcul, resetare cu validare inputuri

window.addEventListener("DOMContentLoaded", function () {

    const inpNume = document.getElementById("inp-nume");
    const inpDescriere = document.getElementById("inp-descriere");
    const inpMarca = document.getElementById("inp-marca");
    const inpLivrare = document.getElementById("inp-livrare");
    const inpPret = document.getElementById("inp-pret");
    const inpLuni = document.getElementById("inp-luni");
    const inpDiscount = document.getElementById("inp-discount");
    const infoRange = document.getElementById("infoRange");
    const tipuriLivrareValide = Array.from(inpLivrare?.list?.options || []).map(o => o.value.toLowerCase());

    // afisare valoare range
    if (inpPret) {
        inpPret.addEventListener("input", function () {
            infoRange.innerHTML = `(${this.value} lei)`;
        });
    }

    // ——— VALIDARE INPUTURI ———
    // text (nume): nu trebuie sa contina cifre. textarea (descriere): minim 3 caractere daca nu e gol, fara simboluri <>
    // BONUS 4: silentMode=true cand vine din onchange/oninput 
    function validareInputuri(silentMode) {
        let valid = true;
        let mesaje = [];

        if (inpNume && inpNume.value.trim() !== "" && /\d/.test(inpNume.value)) {
            inpNume.classList.add("is-invalid");
            valid = false;
            mesaje.push("Numele consolei nu poate contine cifre.");
        } else {
            inpNume?.classList.remove("is-invalid");
        }

        if (inpDescriere) {
            let v = inpDescriere.value.trim();
            if (v !== "" && (v.length < 3 || /[<>]/.test(v))) {
                inpDescriere.classList.add("is-invalid");
                valid = false;
                mesaje.push("Cuvintele cheie din descriere trebuie sa aiba minim 3 caractere si fara < sau >.");
            } else {
                inpDescriere.classList.remove("is-invalid");
            }
        }

        if (!valid && !silentMode) alert("Date invalide:\n" + mesaje.join("\n"));
        return valid;
    }

    // CERINTA: textarea isi pierde is-invalid cand devine valid (oninput)
    if (inpDescriere) {
        inpDescriere.addEventListener("input", function () {
            let v = this.value.trim();
            if (v === "" || (v.length >= 3 && !/[<>]/.test(v))) {
                this.classList.remove("is-invalid");
            }
        });
    }
    if (inpNume) {
        inpNume.addEventListener("input", function () {
            if (this.value.trim() === "" || !/\d/.test(this.value)) {
                this.classList.remove("is-invalid");
            }
        });
    }

    // BONUS 3 + 15 ETAPA 6: mesaj fara produse + contor
    function actualizeazaContorSiMesaj() {
        let total = document.getElementsByClassName("produs").length;
        let vizibile = 0;
        for (let p of document.getElementsByClassName("produs")) {
            if (p.style.display !== "none") vizibile++;
        }
        let span = document.getElementById("nr-afisate");
        if (span) span.textContent = vizibile;
        let mesaj = document.getElementById("mesaj-fara-produse");
        if (mesaj) mesaj.style.display = (vizibile === 0) ? "block" : "none";
    }

    // ——— FILTRARE ———
    function aplicaFiltre(silentMode) {
        if (!validareInputuri(silentMode)) return;

        let vNume = inpNume.value.trim().toLowerCase();
        let vDesc = inpDescriere.value.trim().toLowerCase();
        let vMarca = inpMarca.value;
        let vLivrare = inpLivrare.value.trim().toLowerCase();
        let vPretMax = parseFloat(inpPret.value);

        let starea = "toate";
        for (let r of document.getElementsByName("gr_stare")) {
            if (r.checked) { starea = r.value; break; }
        }

        let luniSelectate = [];
        for (let opt of inpLuni.options) {
            if (opt.selected) luniSelectate.push(parseInt(opt.value));
        }

        let doarDiscount = inpDiscount.checked;

        // datalist: daca valoare introdusa exista in lista o folosim ca filtru exact, altfel ignoram
        let livrareEValida = vLivrare === "" || tipuriLivrareValide.includes(vLivrare);

        let produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            let nume = prod.querySelector(".val-nume").textContent.trim().toLowerCase();
            let descriere = prod.querySelector(".descriere").textContent.trim().toLowerCase();
            let categ = prod.querySelector(".val-categorie").textContent.trim();
            let pret = parseFloat(prod.querySelector(".val-pret").textContent.trim());
            let an = parseInt(prod.querySelector(".val-an").textContent.trim());
            let livrare = prod.querySelector(".val-livrare").textContent.trim().toLowerCase();
            let luna = parseInt(prod.dataset.luna);

            let cond1 = nume.includes(vNume);
            let cond2 = vDesc === "" || descriere.includes(vDesc);
            let cond3 = vMarca === "toate" || categ === vMarca;
            let cond4 = !livrareEValida || vLivrare === "" || livrare === vLivrare;
            let cond5 = pret <= vPretMax;
            let cond6 = starea === "toate" || prod.querySelector(".val-stare").textContent.trim() === starea;
            let cond7 = luniSelectate.includes(luna);
            // CERINTA checkbox: discount pe baza criteriului console retro (an < 2010)
            let cond8 = !doarDiscount || an < 2010;

            if (cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7 && cond8) {
                prod.style.display = "";
            } else {
                prod.style.display = "none";
            }
        }
        actualizeazaContorSiMesaj();
    }

    // Click pe buton -> alert daca invalid
    document.getElementById("filtrare").addEventListener("click", function () { aplicaFiltre(false); });

    // BONUS 4 ETAPA 6: filtrare la onchange/oninput pe toate cele 8 inputuri (silent - fara alert agresiv)
    let silentFiltre = function () { aplicaFiltre(true); };
    inpNume.addEventListener("input", silentFiltre);
    inpDescriere.addEventListener("input", silentFiltre);
    inpMarca.addEventListener("change", silentFiltre);
    inpLivrare.addEventListener("input", silentFiltre);
    inpPret.addEventListener("input", silentFiltre);
    inpLuni.addEventListener("change", silentFiltre);
    inpDiscount.addEventListener("change", silentFiltre);
    for (let r of document.getElementsByName("gr_stare")) {
        r.addEventListener("change", silentFiltre);
    }

    // ——— SORTARE dupa 2 chei: pret + nr accesorii (multi-value) ———
    function sorteaza(semn) {
        if (!validareInputuri(false)) return;
        let grid = document.querySelector(".grid-produse");
        let vp = Array.from(document.getElementsByClassName("produs"));
        vp.sort(function (a, b) {
            let pretA = parseFloat(a.querySelector(".val-pret").textContent.trim());
            let pretB = parseFloat(b.querySelector(".val-pret").textContent.trim());
            if (pretA !== pretB) return semn * (pretA - pretB);
            let nrA = parseInt(a.dataset.nrAccesorii);
            let nrB = parseInt(b.dataset.nrAccesorii);
            return semn * (nrA - nrB);
        });
        for (let p of vp) grid.appendChild(p);
    }
    document.getElementById("sortCresc").addEventListener("click", function () { sorteaza(1); });
    document.getElementById("sortDescresc").addEventListener("click", function () { sorteaza(-1); });

    // ——— CALCUL: suma preturilor produselor vizibile. Div pozitie fixa, creat dinamic, dispare in 2s ———
    function calculSuma() {
        if (!validareInputuri(false)) return;
        let suma = 0;
        for (let prod of document.getElementsByClassName("produs")) {
            if (prod.style.display !== "none") {
                suma += parseFloat(prod.querySelector(".val-pret").textContent.trim());
            }
        }
        let vechi = document.getElementById("rez-calcul");
        if (vechi) vechi.remove();

        let div = document.createElement("div");
        div.id = "rez-calcul";
        div.style.position = "fixed";
        div.style.top = "50%";
        div.style.left = "50%";
        div.style.transform = "translate(-50%, -50%)";
        div.style.background = "var(--bs-primary, #7c3aed)";
        div.style.color = "#fff";
        div.style.padding = "1.5rem 2.5rem";
        div.style.borderRadius = "12px";
        div.style.fontSize = "1.4rem";
        div.style.fontWeight = "700";
        div.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
        div.style.zIndex = "9999";
        div.textContent = "Suma preturilor afisate: " + suma.toFixed(2) + " lei";
        document.body.appendChild(div);

        setTimeout(function () {
            let d = document.getElementById("rez-calcul");
            if (d) d.remove();
        }, 2000);
    }
    document.getElementById("calcul").addEventListener("click", calculSuma);

    // Alt+C tot disponibil ca shortcut
    window.addEventListener("keydown", function (e) {
        if (e.altKey && e.key === "c") calculSuma();
    });

    // ——— RESETARE cu confirm (anul 2 CTI) ———
    document.getElementById("resetare").addEventListener("click", function () {
        if (!confirm("Sigur vrei sa resetezi filtrele?")) return;

        inpNume.value = "";
        inpDescriere.value = "";
        inpMarca.value = "toate";
        inpLivrare.value = "";
        inpPret.value = inpPret.max;
        infoRange.innerHTML = `(${inpPret.max} lei)`;
        inpDiscount.checked = false;
        document.getElementById("rad-toate").checked = true;

        // selecteaza toate lunile
        for (let opt of inpLuni.options) opt.selected = true;

        // sterge is-invalid
        inpNume.classList.remove("is-invalid");
        inpDescriere.classList.remove("is-invalid");

        // afiseaza toate produsele si revine la ordinea initiala (dupa id_initial)
        let grid = document.querySelector(".grid-produse");
        let vp = Array.from(document.getElementsByClassName("produs"));
        vp.sort(function (a, b) {
            let ia = parseInt(a.id.replace("produs_", ""));
            let ib = parseInt(b.id.replace("produs_", ""));
            return ia - ib;
        });
        for (let p of vp) {
            p.style.display = "";
            grid.appendChild(p);
        }
        actualizeazaContorSiMesaj();
    });
});
