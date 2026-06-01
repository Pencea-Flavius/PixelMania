const { Client, Pool } = require("pg");

/**
 * @typedef {object} ObiectConexiune
 * @property {string} init Tipul de conexiune ("local" etc.)
 */

/**
 * @typedef {object} ObiectQuerySelect
 * @property {string} tabel Numele tabelului
 * @property {string[]} campuri Lista coloanelor (poate cuprinde "*")
 * @property {(string[]|string[][])} [conditiiAnd] Lista de conditii pentru WHERE
 *   - vector de stringuri => toate concatenate cu AND
 *   - vector de vectori de stringuri => intern AND, extern OR (Bonus 1)
 */

/**
 * @typedef {object} ObiectQueryInsert
 * @property {string} tabel Numele tabelului
 * @property {Object} campuri Perechi cheie-valoare pentru coloane si datele de inserat
 */

/**
 * @typedef {object} ObiectQueryUpdate
 * @property {string} tabel Numele tabelului
 * @property {string[]} campuri Numele coloanelor care se actualizeaza
 * @property {any[]} valori Valorile noi pentru coloanele respective
 * @property {(string[]|string[][])} [conditiiAnd] Lista de conditii pentru WHERE
 */

/**
 * @typedef {object} ObiectQueryDelete
 * @property {string} tabel Numele tabelului
 * @property {(string[]|string[][])} [conditiiAnd] Lista de conditii pentru WHERE
 */

/**
 * @callback QueryCallBack
 * @param {Error} err Eventuala eroare in urma query-ului
 * @param {Object} rez Rezultatul query-ului (rows, rowCount, etc.)
 */

/**
 * BONUS 1: construieste clauza WHERE acceptand fie un vector de stringuri (AND),
 * fie un vector de vectori (AND intern, OR extern).
 * Exemple:
 *   ["a=1","b=2"]                     -> "where a=1 and b=2"
 *   [["a=1","b=2"], ["c=3","d=4"]]    -> "where a=1 and b=2 or c=3 and d=4"
 * @param {(string[]|string[][])} conditiiAnd
 * @returns {string}
 */
function construiesteWhere(conditiiAnd) {
    if (!conditiiAnd || conditiiAnd.length === 0) return "";
    // Detectam daca e vector de vectori (Bonus 1)
    if (Array.isArray(conditiiAnd[0])) {
        let grupuri = conditiiAnd.map(g => g.join(" and "));
        return `where ${grupuri.join(" or ")}`;
    }
    return `where ${conditiiAnd.join(" and ")}`;
}

/**
 * Clasa Singleton pentru accesul la baza de date PostgreSQL.
 * Se obtine instanta unica prin AccesBD.getInstanta().
 */
class AccesBD {
    static #instanta = null;
    static #initializat = false;

    /**
     * @throws {Error} Daca este apelat in afara `getInstanta` sau daca instanta exista deja.
     */
    constructor() {
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        } else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }

    /**
     * Initializeaza si conecteaza clientul `pg` cu setarile locale.
     * Salveaza obiectul de conexiune in `this.client`.
     * @returns {void}
     */
    initLocal() {
        this.client = new Client({
            database: "cti_2026",
            user: "flavius",
            password: "flavius",
            host: "localhost",
            port: 5432
        });
        this.client.connect();
    }

    /**
     * Getter pentru clientul de baza de date (obiectul `pg.Client`).
     * @returns {Client}
     * @throws {Error} daca clasa nu a fost instantiata
     */
    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }
        return this.client;
    }

    /**
     * Returneaza unica instanta a clasei. Daca nu exista, o creeaza si initializeaza conexiunea.
     * @param {ObiectConexiune} [config={init:"local"}]
     * @returns {AccesBD}
     */
    static getInstanta({ init = "local" } = {}) {
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();
            try {
                switch (init) {
                    case "local": this.#instanta.initLocal();
                }
            } catch (e) {
                console.error("Eroare la initializarea bazei de date!", e);
            }
        }
        return this.#instanta;
    }

    /**
     * Selecteaza inregistrari din tabel.
     * @param {ObiectQuerySelect} obj
     * @param {QueryCallBack} callback
     * @param {any[]} [parametriQuery=[]] Parametri pentru `$1, $2, ...`
     * @returns {void}
     */
    select({ tabel = "", campuri = [], conditiiAnd = [] } = {}, callback, parametriQuery = []) {
        let conditieWhere = construiesteWhere(conditiiAnd);
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        this.client.query(comanda, parametriQuery, callback);
    }

    /**
     * Versiunea asincrona a `select`. Returneaza rezultatul direct (sau null in caz de eroare).
     * @param {ObiectQuerySelect} obj
     * @returns {Promise<Object|null>}
     */
    async selectAsync({ tabel = "", campuri = [], conditiiAnd = [] } = {}) {
        let conditieWhere = construiesteWhere(conditiiAnd);
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        try {
            return await this.client.query(comanda);
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * Insereaza o noua inregistrare.
     * Accepta atat `campuri` ca obiect cat si forma {campuri:[...], valori:[...]}.
     * @param {ObiectQueryInsert} obj
     * @param {QueryCallBack} callback
     * @returns {void}
     */
    insert({ tabel = "", campuri = {}, valori } = {}, callback) {
        let nume, vals;
        if (Array.isArray(campuri) && Array.isArray(valori)) {
            nume = campuri;
            vals = valori;
        } else {
            nume = Object.keys(campuri);
            vals = Object.values(campuri);
        }
        let comanda = `insert into ${tabel}(${nume.join(",")}) values (${vals.map(x => `'${x}'`).join(",")})`;
        console.log(comanda);
        this.client.query(comanda, callback);
    }

    /**
     * Actualizeaza randuri din tabel.
     * Accepta atat `{campuri:[...], valori:[...]}` (cerinta etapei 7)
     * cat si `{campuri: {col1:val1, col2:val2}}` (forma scurta).
     * @param {ObiectQueryUpdate} obj
     * @param {QueryCallBack} callback
     * @returns {void}
     * @throws {Error} daca numarul de campuri difera de numarul de valori
     */
    update({ tabel = "", campuri = [], valori = [], conditiiAnd = [] } = {}, callback) {
        let perechi = [];
        if (Array.isArray(campuri)) {
            if (campuri.length !== valori.length) {
                throw new Error("Numarul de campuri difera de numarul de valori");
            }
            for (let i = 0; i < campuri.length; i++) {
                perechi.push(`${campuri[i]}='${valori[i]}'`);
            }
        } else {
            for (let prop in campuri) {
                perechi.push(`${prop}='${campuri[prop]}'`);
            }
        }
        let conditieWhere = construiesteWhere(conditiiAnd);
        let comanda = `update ${tabel} set ${perechi.join(", ")} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback);
    }

    /**
     * Sterge inregistrari din tabel.
     * @param {ObiectQueryDelete} obj
     * @param {QueryCallBack} callback
     * @returns {void}
     */
    delete({ tabel = "", conditiiAnd = [] } = {}, callback) {
        let conditieWhere = construiesteWhere(conditiiAnd);
        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback);
    }

    /**
     * Executa o comanda SQL brutea.
     * @param {string} comanda
     * @param {QueryCallBack} callback
     * @returns {void}
     */
    query(comanda, callback) {
        this.client.query(comanda, callback);
    }
}

module.exports = AccesBD;
