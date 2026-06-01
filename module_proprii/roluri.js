const Drepturi = require('./drepturi.js');

/**
 * Clasa de baza pentru roluri. Subclasele suprascriu `tip` si `drepturi`.
 */
class Rol {
    /** @returns {string} codul rolului asa cum apare in tabelul utilizatori */
    static get tip() { return "generic"; }
    /** @returns {symbol[]} lista de drepturi asociate clasei de rol */
    static get drepturi() { return []; }

    constructor() {
        this.cod = this.constructor.tip;
    }

    /**
     * Verifica daca rolul curent are dreptul dat.
     * @param {symbol} drept Symbol din `drepturi.js`
     * @returns {boolean}
     */
    areDreptul(drept) {
        return this.constructor.drepturi.includes(drept);
    }
}

/**
 * Administratorul site-ului - are TOATE drepturile (areDreptul returneaza mereu true).
 */
class RolAdmin extends Rol {
    static get tip() { return "admin"; }
    constructor() { super(); }
    /** @returns {boolean} mereu true */
    areDreptul() { return true; }
}

/**
 * Moderator: gestioneaza utilizatorii. NU are dreptul de cumparare si NU are drepturi pe produse.
 */
class RolModerator extends Rol {
    static get tip() { return "moderator"; }
    static get drepturi() {
        return [
            Drepturi.vizualizareUtilizatori,
            Drepturi.modificareUtilizatori,
            Drepturi.stergereUtilizatori,
            Drepturi.adaugareUtilizatori
        ];
    }
    constructor() { super(); }
}

/**
 * Client comun: poate vizualiza si cumpara produse.
 */
class RolClient extends Rol {
    static get tip() { return "comun"; }
    static get drepturi() {
        return [
            Drepturi.cumparareProduse,
            Drepturi.vizualizareProduse
        ];
    }
    constructor() { super(); }
}

/**
 * Pattern Factory: creeaza instante de Rol in functie de codul primit (din BD).
 */
class RolFactory {
    /**
     * @param {string} tip Codul rolului ("admin" | "moderator" | "comun")
     * @returns {Rol|undefined}
     */
    static creeazaRol(tip) {
        switch (tip) {
            case RolAdmin.tip:     return new RolAdmin();
            case RolModerator.tip: return new RolModerator();
            case RolClient.tip:    return new RolClient();
        }
    }
}

module.exports = {
    Rol: Rol,
    RolAdmin: RolAdmin,
    RolModerator: RolModerator,
    RolClient: RolClient,
    RolFactory: RolFactory
};
