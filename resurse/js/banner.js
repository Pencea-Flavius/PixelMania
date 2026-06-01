/**
 * CERINTA ETAPA 7 (bootstrap_js_ + animatie-banner)
 * - Reincarca caruselul la fiecare 15 secunde cu 5 produse aleatoare.
 * - Gestioneaza bannerul cu disclaimer + cookie de acceptare.
 * - Expune deleteCookie(nume) si deleteAllCookies() pentru verificare in consola.
 */

// --------------------- Helpers pentru cookies ---------------------

/**
 * Seteaza un cookie cu durata in milisecunde.
 * @param {string} name Numele cookie-ului
 * @param {string} value Valoarea (va fi URL-encoded)
 * @param {number} ms Durata in milisecunde
 */
function setCookie(name, value, ms) {
    let d = new Date();
    d.setTime(d.getTime() + ms);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}

/**
 * Returneaza valoarea unui cookie sau null daca nu exista.
 * @param {string} name Numele cookie-ului
 * @returns {string|null}
 */
function getCookie(name) {
    let perechi = document.cookie ? document.cookie.split(";") : [];
    for (let p of perechi) {
        let [k, v] = p.trim().split("=");
        if (k === name) return decodeURIComponent(v || "");
    }
    return null;
}

/**
 * Sterge cookie-ul cu numele dat (setand data de expirare in trecut).
 * @param {string} name
 */
function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Sterge toate cookie-urile vizibile pentru JS.
 */
function deleteAllCookies() {
    let perechi = document.cookie ? document.cookie.split(";") : [];
    for (let p of perechi) {
        let nume = p.split("=")[0].trim();
        if (nume) deleteCookie(nume);
    }
}

// Expunere globala pentru verificare manuala in consola (cerinta explicita).
window.deleteCookie = deleteCookie;
window.deleteAllCookies = deleteAllCookies;
window.setCookie = setCookie;
window.getCookie = getCookie;

// --------------------- Banner cookies ---------------------

/**
 * Initializeaza bannerul cu disclaimer: ascunde-l daca cookie-ul exista,
 * altfel adauga handler pe butonul Ok pentru a-l seta si a inchide bannerul.
 */
function initBanner() {
    let banner = document.getElementById("banner");
    if (!banner) return;
    let btn = document.getElementById("ok_cookies");

    if (getCookie("cookies_accepted")) {
        banner.style.display = "none";
        return;
    }

    if (btn) {
        btn.addEventListener("click", function () {
            // 5000 ms la prezentare; in productie: 12h = 43_200_000 ms (jumatate de zi)
            setCookie("cookies_accepted", "true", 5000);
            banner.style.display = "none";
        });
    }
}

// --------------------- Carusel refresh la 15s ---------------------

/**
 * Reconstruieste continutul caruselului cu o noua lista de produse.
 * @param {Array<Object>} produse
 */
function actualizeazaCarusel(produse) {
    let carusel = document.getElementById("caruselProduse");
    if (!carusel || !produse || produse.length === 0) return;

    let inner = carusel.querySelector(".carousel-inner");
    let indicators = carusel.querySelector(".carousel-indicators");
    if (!inner || !indicators) return;

    inner.innerHTML = "";
    indicators.innerHTML = "";

    produse.forEach(function (p, i) {
        // indicator
        let btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-bs-target", "#caruselProduse");
        btn.setAttribute("data-bs-slide-to", String(i));
        btn.setAttribute("aria-label", "Slide " + (i + 1));
        if (i === 0) {
            btn.className = "active";
            btn.setAttribute("aria-current", "true");
        }
        indicators.appendChild(btn);

        // slide
        let item = document.createElement("div");
        item.className = "carousel-item" + (i === 0 ? " active" : "");

        let img = document.createElement("img");
        img.src = "/resurse/imagini630/" + p.imagine;
        img.className = "d-block w-100 carusel-img";
        img.alt = p.nume;
        item.appendChild(img);

        let cap = document.createElement("div");
        cap.className = "carousel-caption d-none d-md-block";
        cap.innerHTML =
            "<h5>" + p.nume + "</h5>" +
            "<p>" + p.marca + " &middot; " + p.an_lansare + " &middot; <strong>" + p.pret + " lei</strong></p>" +
            "<a href='/produs/" + p.id + "' class='btn btn-sm btn-light'>Detalii</a>";
        item.appendChild(cap);

        inner.appendChild(item);
    });

    // Reinitializeaza instanta Bootstrap Carousel ca sa stie de noile slide-uri
    if (window.bootstrap && window.bootstrap.Carousel) {
        let inst = window.bootstrap.Carousel.getInstance(carusel);
        if (inst) inst.dispose();
        new window.bootstrap.Carousel(carusel, { interval: 3000, ride: "carousel" });
    }
}

/**
 * Cere de la server 5 produse aleatoare si actualizeaza caruselul.
 */
function reincarcaProduseCarusel() {
    fetch("/api/produse-carusel")
        .then(function (r) { return r.json(); })
        .then(actualizeazaCarusel)
        .catch(function (e) { console.error("Eroare reincarcare carusel:", e); });
}

/**
 * Porneste reincarcarea automata la fiecare 15 secunde (cerinta explicita).
 */
function initCarusel() {
    if (document.getElementById("caruselProduse")) {
        setInterval(reincarcaProduseCarusel, 15000);
    }
}

// Initializare la load
window.addEventListener("DOMContentLoaded", function () {
    initBanner();
    initCarusel();
});
