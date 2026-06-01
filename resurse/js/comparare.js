// BONUS 20: Comparare produse - logica client-side (localStorage)

// --- Citire / scriere lista din localStorage ---
function getLista() {
    return JSON.parse(localStorage.getItem("comparare") || "[]");
}
function setLista(l) {
    localStorage.setItem("comparare", JSON.stringify(l));
    // salveaza si timestamp-ul ultimei interactiuni
    localStorage.setItem("comparare-ts", Date.now().toString());
}

// Daca a trecut mai mult de o zi fara click, stergem lista
(function verificaExpirare() {
    let ts = parseInt(localStorage.getItem("comparare-ts") || "0");
    if (ts && Date.now() - ts > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("comparare");
        localStorage.removeItem("comparare-ts");
    }
})();

function adauga(id, nume) {
    let l = getLista();
    if (l.find(x => x.id === id)) return; // deja e in lista
    if (l.length >= 2) return; // maxim 2 produse
    l.push({ id, nume });
    setLista(l);
    refreshUI();
}

function sterge(id) {
    let l = getLista().filter(x => x.id !== id);
    setLista(l);
    refreshUI();
}

// --- Redeseneaza containerul de comparare si starea butoanelor ---
function refreshUI() {
    let l = getLista();

    // 1. Container-ul fix de comparare
    let container = document.getElementById("container-comparare");
    if (!container) return;

    if (l.length === 0) {
        container.style.display = "none";
        activeazaToateButoanele();
        return;
    }

    container.style.display = "flex";

    // Goleste lista din container
    let listaEl = container.querySelector("#lista-comparare");
    listaEl.innerHTML = "";

    // Template pentru fiecare item
    let tpl = document.getElementById("tpl-item-comparare");
    for (let prod of l) {
        let clone = tpl.content.cloneNode(true);
        clone.querySelector(".cmp-nume").textContent = prod.nume;
        let btnSterge = clone.querySelector(".comparare-remove");
        btnSterge.dataset.id = prod.id;
        btnSterge.addEventListener("click", function () {
            sterge(parseInt(this.dataset.id));
        });
        listaEl.appendChild(clone);
    }

    // 2. Butonul "afiseaza comparare" - apare doar cand sunt 2 produse
    let btnAfiseaza = container.querySelector("#btn-afiseaza-comparare");
    if (l.length === 2) {
        btnAfiseaza.style.display = "inline-block";
        btnAfiseaza.onclick = function () {
            window.open("/comparare?id=" + l[0].id + "&id=" + l[1].id, "_blank");
        };
        // Dezactiveaza toate butoanele de pe pagina
        dezactiveazaToateButoanele();
    } else {
        btnAfiseaza.style.display = "none";
        activeazaToateButoanele();
    }

    // 3. Starea butoanelor "compara" - cele deja adaugate apar marcate
    document.querySelectorAll(".btn-compara").forEach(function (btn) {
        let bid = parseInt(btn.dataset.id);
        if (l.find(x => x.id === bid)) {
            btn.classList.add("active", "btn-warning");
            btn.classList.remove("btn-outline-info");
        } else {
            btn.classList.remove("active", "btn-warning");
            btn.classList.add("btn-outline-info");
        }
    });
}

function dezactiveazaToateButoanele() {
    document.querySelectorAll(".btn-compara").forEach(function (btn) {
        let l = getLista();
        let bid = parseInt(btn.dataset.id);
        // Nu dezactiva butonul pentru produsele deja in lista
        if (!l.find(x => x.id === bid)) {
            btn.disabled = true;
            btn.title = "stergeti un produs din lista de comparare";
        }
    });
}

function activeazaToateButoanele() {
    document.querySelectorAll(".btn-compara").forEach(function (btn) {
        btn.disabled = false;
        btn.title = "Adauga la comparare";
        btn.classList.remove("active", "btn-warning");
        btn.classList.add("btn-outline-info");
    });
}

// --- La incarcare pagina ---
document.addEventListener("DOMContentLoaded", function () {
    // Ataseaza click pe fiecare buton de comparare
    document.querySelectorAll(".btn-compara").forEach(function (btn) {
        btn.addEventListener("click", function () {
            let id = parseInt(this.dataset.id);
            let nume = this.dataset.nume;
            let l = getLista();
            // Daca e deja in lista, il scoatem (toggle)
            if (l.find(x => x.id === id)) {
                sterge(id);
            } else {
                adauga(id, nume);
            }
        });
    });

    // Deseneaza UI-ul initial pe baza a ce e deja in localStorage
    refreshUI();
});
