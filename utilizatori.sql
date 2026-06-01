CREATE TYPE roluri AS ENUM('admin', 'moderator', 'comun');

CREATE TABLE IF NOT EXISTS utilizatori (
   id serial PRIMARY KEY,
   username VARCHAR(50) UNIQUE NOT NULL,
   nume VARCHAR(100) NOT NULL,
   prenume VARCHAR(100) NOT NULL,
   parola VARCHAR(500) NOT NULL,
   rol roluri NOT NULL DEFAULT 'comun',
   email VARCHAR(100) NOT NULL,
   culoare_chat VARCHAR(50) NOT NULL,
   data_adaugare TIMESTAMP DEFAULT current_timestamp,
   cod character varying(200),
   confirmat_mail boolean DEFAULT false,
   poza VARCHAR(200)
);
