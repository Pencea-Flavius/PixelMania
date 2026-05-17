-- BONUS 17 ETAPA 6: tabele seturi + asociere_set

DROP TABLE IF EXISTS asociere_set CASCADE;
DROP TABLE IF EXISTS seturi CASCADE;

CREATE TABLE seturi (
    id SERIAL PRIMARY KEY,
    nume_set VARCHAR(100) NOT NULL,
    descriere_set TEXT
);

CREATE TABLE asociere_set (
    id SERIAL PRIMARY KEY,
    id_set INT REFERENCES seturi(id) ON DELETE CASCADE,
    id_produs INT REFERENCES console(id) ON DELETE CASCADE
);

INSERT INTO seturi (nume_set, descriere_set) VALUES
('Pachet Next-Gen Sony', 'Tot ce-ti trebuie din ecosistemul Sony de ultima generatie - PS5, varianta Pro si predecesorul PS4 Pro.'),
('Pachet Next-Gen Microsoft', 'Combinatia perfecta Xbox pentru gaming la rezolutii inalte si pret bun.'),
('Colectie Retro Sega', 'Pachet pentru pasionatii Sega - 3 generatii reprezentative de console.'),
('Familie Nintendo Switch', 'Toate variantele de Nintendo Switch intr-un singur pachet - original, OLED si noul Switch 2.'),
('Pachet Retro Anii 2000', 'Cele mai iubite console second-hand din epoca PS2 / Xbox 360 / Wii.'),
('Bundle Portabil + Premium', 'Steam Deck pentru gaming portabil + PS5 Pro pentru sesiuni acasa - cel mai puternic combo.');

INSERT INTO asociere_set (id_set, id_produs) VALUES
((SELECT id FROM seturi WHERE nume_set = 'Pachet Next-Gen Sony'), (SELECT id FROM console WHERE nume = 'PlayStation 5')),
((SELECT id FROM seturi WHERE nume_set = 'Pachet Next-Gen Sony'), (SELECT id FROM console WHERE nume = 'PlayStation 5 Pro')),
((SELECT id FROM seturi WHERE nume_set = 'Pachet Next-Gen Sony'), (SELECT id FROM console WHERE nume = 'PlayStation 4 Pro')),

((SELECT id FROM seturi WHERE nume_set = 'Pachet Next-Gen Microsoft'), (SELECT id FROM console WHERE nume = 'Xbox Series X')),
((SELECT id FROM seturi WHERE nume_set = 'Pachet Next-Gen Microsoft'), (SELECT id FROM console WHERE nume = 'Xbox Series S')),

((SELECT id FROM seturi WHERE nume_set = 'Colectie Retro Sega'), (SELECT id FROM console WHERE nume = 'Sega Genesis')),
((SELECT id FROM seturi WHERE nume_set = 'Colectie Retro Sega'), (SELECT id FROM console WHERE nume = 'Sega Dreamcast')),
((SELECT id FROM seturi WHERE nume_set = 'Colectie Retro Sega'), (SELECT id FROM console WHERE nume = 'Sega Saturn')),

((SELECT id FROM seturi WHERE nume_set = 'Familie Nintendo Switch'), (SELECT id FROM console WHERE nume = 'Nintendo Switch')),
((SELECT id FROM seturi WHERE nume_set = 'Familie Nintendo Switch'), (SELECT id FROM console WHERE nume = 'Nintendo Switch OLED')),
((SELECT id FROM seturi WHERE nume_set = 'Familie Nintendo Switch'), (SELECT id FROM console WHERE nume = 'Nintendo Switch 2')),

((SELECT id FROM seturi WHERE nume_set = 'Pachet Retro Anii 2000'), (SELECT id FROM console WHERE nume = 'PlayStation 2')),
((SELECT id FROM seturi WHERE nume_set = 'Pachet Retro Anii 2000'), (SELECT id FROM console WHERE nume = 'Xbox 360')),
((SELECT id FROM seturi WHERE nume_set = 'Pachet Retro Anii 2000'), (SELECT id FROM console WHERE nume = 'Nintendo Wii')),

((SELECT id FROM seturi WHERE nume_set = 'Bundle Portabil + Premium'), (SELECT id FROM console WHERE nume = 'Steam Deck')),
((SELECT id FROM seturi WHERE nume_set = 'Bundle Portabil + Premium'), (SELECT id FROM console WHERE nume = 'PlayStation 5 Pro'));
