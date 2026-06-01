/**
 * CERINTA ETAPA 7: lista drepturilor posibile pe site.
 * Valorile sunt Symbol (unice) - astfel comparatiile cu === sunt sigure
 * si nu se pot confunda cu un string sau cu alt drept.
 * Aceste drepturi sunt folosite de clasele Rol* pentru a stabili ce poate face
 * fiecare tip de utilizator (admin / moderator / client comun).
 */
const Drepturi = {
    // --- drepturi pe utilizatori ---
    vizualizareUtilizatori: Symbol("vizualizareUtilizatori"),
    modificareUtilizatori:  Symbol("modificareUtilizatori"),
    stergereUtilizatori:    Symbol("stergereUtilizatori"),
    adaugareUtilizatori:    Symbol("adaugareUtilizatori"),

    // --- drepturi pe produse (console) ---
    vizualizareProduse:     Symbol("vizualizareProduse"),
    modificareProduse:      Symbol("modificareProduse"),
    adaugareProduse:        Symbol("adaugareProduse"),
    stergereProduse:        Symbol("stergereProduse"),

    // --- altele ---
    cumparareProduse:       Symbol("cumparareProduse"),
    vizualizareGrafice:     Symbol("vizualizareGrafice")
};

module.exports = Drepturi;
