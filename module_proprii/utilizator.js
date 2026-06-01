const AccesBD = require('./accesbd.js');
const parole = require('./parole.js');
const { RolFactory } = require('./roluri.js');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * Modeleaza un utilizator al site-ului. Asociaza cu tabelul `utilizatori`.
 *
 * Proprietatile reflecta coloanele tabelului (id, username, nume, prenume,
 * email, parola, rol, culoare_chat, poza, cod, confirmat_mail, ...).
 */
class Utilizator {
    static tipConexiune = "local";
    static tabel = "utilizatori";
    static parolaCriptare = "tehniciweb";
    static emailServer = "test.tweb.node@gmail.com";
    static lungimeCod = 64;
    static numeDomeniu = "localhost:8080";

    #eroare;

    /**
     * Construieste un utilizator. Toate proprietatile din obiectul-parametru sunt copiate
     * direct pe `this`. Poate fi apelat si fara parametri (`new Utilizator()`).
     * @param {Object} [obj]
     */
    constructor({ id, username, nume, prenume, email, parola, rol, culoare_chat = "black", poza } = {}) {
        this.id = id;
        try {
            if (this.verificaUsername(username)) this.username = username;
            else throw new Error("Username incorect");
        } catch (e) {
            this.#eroare = e.message;
        }

        // Copiem toate proprietatile primite
        if (arguments[0]) {
            for (let prop in arguments[0]) {
                this[prop] = arguments[0][prop];
            }
        }

        // Transformam string-ul de rol intr-o instanta de Rol
        if (this.rol) {
            this.rol = this.rol.cod
                ? RolFactory.creeazaRol(this.rol.cod)
                : RolFactory.creeazaRol(this.rol);
        }
        this.#eroare = "";
    }

    /**
     * Verifica daca numele respecta formatul: prima litera mare, restul mici.
     * @param {string} nume
     * @returns {boolean}
     */
    verificaNume(nume) {
        return nume != "" && !!nume && !!nume.match(/^[A-Z][a-z]+$/);
    }

    /**
     * Verifica formatul username-ului (alfanumerice + `#_./`).
     * @param {string} username
     * @returns {boolean}
     */
    verificaUsername(username) {
        return username != "" && !!username && !!username.match(/^[A-Za-z0-9#_./]+$/);
    }

    // Alias-uri pastrate pentru compatibilitate cu codul existent
    checkName(nume) { return this.verificaNume(nume); }
    checkUsername(username) { return this.verificaUsername(username); }

    set setareNume(nume) {
        if (this.verificaNume(nume)) this.nume = nume;
        else throw new Error("Nume gresit");
    }

    set setareUsername(username) {
        if (this.verificaUsername(username)) this.username = username;
        else throw new Error("Username gresit");
    }

    /**
     * Criptare parola cu scrypt si sare fixa.
     * @param {string} parola
     * @returns {string} hash hex
     */
    static criptareParola(parola) {
        return crypto.scryptSync(parola, Utilizator.parolaCriptare, Utilizator.lungimeCod).toString("hex");
    }

    /**
     * Verifica daca utilizatorul are dreptul specificat (deleaga la instanta de Rol).
     * @param {symbol} drept
     * @returns {boolean}
     */
    areDreptul(drept) {
        if (!this.rol) return false;
        return this.rol.areDreptul(drept);
    }

    /**
     * Modifica inregistrarea curenta din tabel cu noile date.
     * @param {Object} obiect Perechi camp->valoare
     * @throws {Error} daca utilizatorul nu are id (nu exista in BD)
     */
    modifica(obiect) {
        if (!this.id) throw new Error("Utilizatorul nu exista");
        AccesBD.getInstanta({ init: Utilizator.tipConexiune }).update({
            tabel: Utilizator.tabel,
            campuri: Object.keys(obiect),
            valori: Object.values(obiect),
            conditiiAnd: [`id=${this.id}`]
        }, function (err) {
            if (err) console.log("Eroare modifica:", err);
        });
    }

    /**
     * Sterge utilizatorul curent din tabel.
     * @throws {Error} daca utilizatorul nu are id
     */
    sterge() {
        if (!this.id) throw new Error("Utilizatorul nu exista");
        AccesBD.getInstanta({ init: Utilizator.tipConexiune }).delete({
            tabel: Utilizator.tabel,
            conditiiAnd: [`id=${this.id}`]
        }, function (err) {
            if (err) console.log("Eroare sterge:", err);
        });
    }

    /**
     * Salveaza utilizatorul in BD. Daca username-ul exista deja, arunca eroare.
     * Dupa insert trimite si un mail de confirmare cu token.
     * @throws {Error} daca username-ul este deja folosit
     */
    salvareUtilizator() {
        let utiliz = this;
        Utilizator.getUtilizDupaUsername(this.username, {}, function (u, _, eroare) {
            if (eroare === null && u && u.id) {
                throw new Error("Username-ul exista deja");
            }
            let parolaCriptata = Utilizator.criptareParola(utiliz.parola);
            let token = parole.genereazaToken(100);
            AccesBD.getInstanta({ init: Utilizator.tipConexiune }).insert({
                tabel: Utilizator.tabel,
                campuri: {
                    username: utiliz.username,
                    nume: utiliz.nume,
                    prenume: utiliz.prenume,
                    parola: parolaCriptata,
                    email: utiliz.email,
                    culoare_chat: utiliz.culoare_chat,
                    cod: token,
                    poza: utiliz.poza
                }
            }, function (err) {
                if (err) {
                    console.log("Eroare insert utilizator:", err);
                } else {
                    utiliz.trimiteMail(
                        "Te-ai inregistrat cu succes",
                        "Username-ul tau este " + utiliz.username,
                        `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}.</p>` +
                        `<p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`
                    ).catch(e => console.log("Eroare trimitere mail:", e.message));
                }
            });
        });
    }

    /**
     * Trimite un email utilizatorului.
     * @param {string} subiect
     * @param {string} mesajText Continut text-only
     * @param {string} mesajHtml Continut HTML
     * @param {Array} [atasamente=[]] Lista de atasamente (format nodemailer)
     * @returns {Promise<void>}
     */
    async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
        var transp = nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth: {
                user: Utilizator.emailServer,
                pass: "rwgmgkldxnarxrgu"
            },
            tls: { rejectUnauthorized: false }
        });
        await transp.sendMail({
            from: Utilizator.emailServer,
            to: this.email,
            subject: subiect,
            text: mesajText,
            html: mesajHtml,
            attachments: atasamente
        });
        console.log("trimis mail");
    }

    // ------------------------ Cautare ------------------------

    /**
     * Cauta un utilizator dupa username. Sincrona (cu callback).
     * @param {string} username
     * @param {Object} obparam Obiect transmis nemodificat la callback (ex: {parola:"x"})
     * @param {(u: Utilizator|null, obparam: Object, eroare: any) => void} proceseazaUtiliz
     */
    static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
        if (!username) {
            proceseazaUtiliz(null, obparam, -1);
            return;
        }
        let eroare = null;
        AccesBD.getInstanta({ init: Utilizator.tipConexiune }).select({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditiiAnd: [`username='${username}'`]
        }, function (err, rezSelect) {
            if (err) {
                console.error("Utilizator:", err);
                eroare = -2;
                proceseazaUtiliz(null, obparam, eroare);
                return;
            }
            if (rezSelect.rowCount == 0) {
                eroare = -1;
                proceseazaUtiliz(null, obparam, eroare);
                return;
            }
            let u = new Utilizator(rezSelect.rows[0]);
            proceseazaUtiliz(u, obparam, eroare);
        });
    }

    /**
     * Versiunea asincrona a `getUtilizDupaUsername`.
     * @param {string} username
     * @returns {Promise<Utilizator|null>}
     */
    static async getUtilizDupaUsernameAsync(username) {
        if (!username) return null;
        let rez = await AccesBD.getInstanta({ init: Utilizator.tipConexiune }).selectAsync({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditiiAnd: [`username='${username}'`]
        });
        if (!rez || rez.rowCount == 0) return null;
        return new Utilizator(rez.rows[0]);
    }

    /**
     * Cauta utilizatori dupa un obiect de criterii (sincron, cu callback).
     * Proprietatile undefined sunt ignorate.
     * @param {Object} obParam
     * @param {(err:any, listaUtiliz:Utilizator[]) => void} callback
     */
    static cauta(obParam, callback) {
        let conditii = [];
        for (let prop in obParam) {
            if (obParam[prop] !== undefined) {
                conditii.push(`${prop}='${obParam[prop]}'`);
            }
        }
        AccesBD.getInstanta({ init: Utilizator.tipConexiune }).select({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditiiAnd: conditii
        }, function (err, rez) {
            if (err) { callback(err, []); return; }
            let lista = rez.rows.map(r => new Utilizator(r));
            callback(null, lista);
        });
    }

    /**
     * Versiunea asincrona a `cauta`.
     * @param {Object} obParam
     * @returns {Promise<Utilizator[]>}
     */
    static async cautaAsync(obParam) {
        let conditii = [];
        for (let prop in obParam) {
            if (obParam[prop] !== undefined) {
                conditii.push(`${prop}='${obParam[prop]}'`);
            }
        }
        let rez = await AccesBD.getInstanta({ init: Utilizator.tipConexiune }).selectAsync({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditiiAnd: conditii
        });
        if (!rez || rez.rowCount == 0) return [];
        return rez.rows.map(r => new Utilizator(r));
    }
}

module.exports = { Utilizator: Utilizator };
