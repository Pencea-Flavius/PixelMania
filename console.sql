-- ETAPA 6: Schema cu toate proprietatile obligatorii pentru filtrare/sortare/calculare

DROP TABLE IF EXISTS console CASCADE;
DROP TYPE IF EXISTS marca_consola CASCADE;
DROP TYPE IF EXISTS stare_consola CASCADE;
DROP TYPE IF EXISTS tip_livrare CASCADE;

-- categoria mare (max 5 valori) - apare in meniu, generata din enumeratie
CREATE TYPE marca_consola AS ENUM ('PlayStation', 'Xbox', 'Nintendo', 'Sega', 'Altele');

-- caracteristica cu o singura valoare string (din set) - folosita la grup radio
CREATE TYPE stare_consola AS ENUM ('excelenta', 'buna', 'acceptabila', 'pentru piese');

-- mod de categorizare mai putin important (a doua enumeratie)
CREATE TYPE tip_livrare AS ENUM ('curier', 'posta', 'ridicare-personala');

CREATE TABLE IF NOT EXISTS console (
   id serial PRIMARY KEY,
   nume VARCHAR(100) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL,                        -- caracteristica numerica 1
   an_lansare INT NOT NULL,                           -- caracteristica numerica 2
   marca marca_consola NOT NULL DEFAULT 'Altele',     -- categoria mare (enum)
   livrare tip_livrare NOT NULL DEFAULT 'curier',     -- categoria mai putin importanta (enum)
   stare stare_consola NOT NULL DEFAULT 'buna',       -- caracteristica single-value (radio)
   accesorii VARCHAR(500),                            -- multi-value, separate prin virgula
   garantie_inclusa BOOLEAN NOT NULL DEFAULT FALSE,   -- caracteristica booleana
   imagine VARCHAR(300),
   data_adaugare DATE NOT NULL DEFAULT current_date
);

INSERT INTO console (nume, descriere, pret, an_lansare, marca, livrare, stare, accesorii, garantie_inclusa, imagine, data_adaugare) VALUES
('PlayStation 5', 'Consola Sony de ultima generatie, SSD ultrarapid, grafica 4K/120fps, controler DualSense cu feedback haptic.', 1200.00, 2020, 'PlayStation', 'curier', 'excelenta', 'controller DualSense, cablu HDMI, cablu alimentare, joc original', TRUE, 'ps5630.png', '2024-09-15'),
('PlayStation 5 Pro', 'Versiunea Pro a PS5 cu GPU imbunatatit, ray tracing avansat si AI upscaling. Performanta maxima.', 1500.00, 2024, 'PlayStation', 'curier', 'excelenta', 'controller DualSense, cablu HDMI, cablu alimentare', TRUE, 'ps5pro630.png', '2025-01-20'),
('PlayStation 4', 'Consola Sony last-gen, catalog imens de jocuri, raport calitate-pret excelent pentru bugetul limitat.', 350.00, 2013, 'PlayStation', 'curier', 'buna', 'controller, cablu HDMI, joc original', FALSE, 'ps4630.png', '2023-11-10'),
('PlayStation 4 Pro', 'Versiunea imbunatatita a PS4 cu suport 4K si HDR. Performanta mai buna decat PS4 standard.', 500.00, 2016, 'PlayStation', 'posta', 'buna', 'controller, cablu HDMI', FALSE, 'ps4pro630.png', '2024-02-05'),
('PlayStation 3', 'Clasicul Sony cu Blu-ray, Cell processor si jocuri memorabile. Retro gaming la pret mic.', 150.00, 2006, 'PlayStation', 'posta', 'acceptabila', 'controller, cabluri', FALSE, 'ps3630.png', '2023-06-18'),
('Xbox Series X', 'Consola Microsoft de ultima generatie, 4K/120fps, Quick Resume, compatibilitate retroactiva extinsa.', 1100.00, 2020, 'Xbox', 'curier', 'excelenta', 'controller Xbox Wireless, cablu HDMI, cablu alimentare, joc original', TRUE, 'xboxseriesx630.png', '2024-08-22'),
('Xbox One S', 'Xbox cu 4K Blu-ray si HDR, compatibilitate retroactiva cu jocuri Xbox 360. Buget mediu.', 280.00, 2016, 'Xbox', 'curier', 'buna', 'controller, cablu HDMI', FALSE, 'xboxones630.png', '2024-03-14'),
('Xbox One', 'Prima consola Xbox One, media center complet cu Kinect suport. Clasic accesibil.', 200.00, 2013, 'Xbox', 'ridicare-personala', 'acceptabila', 'controller', FALSE, 'xboxone630.png', '2023-07-30'),
('Xbox 360', 'Legendarul Xbox 360 cu biblioteca sa imensa. Halo, Gears of War, Forza - totul e aici.', 120.00, 2005, 'Xbox', 'posta', 'acceptabila', 'controller, cablu video, cablu alimentare', FALSE, 'xbox360630.png', '2023-05-12'),
('Nintendo Switch 2', 'Noua consola hibrida Nintendo cu ecran OLED mai mare si performanta imbunatatita fata de original.', 1300.00, 2025, 'Nintendo', 'curier', 'excelenta', 'Joy-Con stanga, Joy-Con dreapta, dock, cablu HDMI, alimentator, joc original', TRUE, 'switch2630.png', '2025-06-08'),
('Nintendo Switch OLED', 'Switch cu ecran OLED vibrant de 7 inci, sunet imbunatatit si dock alb elegant.', 700.00, 2021, 'Nintendo', 'curier', 'buna', 'Joy-Con stanga, Joy-Con dreapta, dock, cablu HDMI', TRUE, 'switcholed630.png', '2024-11-03'),
('Nintendo Switch', 'Consola hibrida originala Nintendo, perfecta pentru gaming acasa si in deplasare.', 500.00, 2017, 'Nintendo', 'curier', 'buna', 'Joy-Con stanga, Joy-Con dreapta, dock', FALSE, 'switch630.png', '2024-01-25'),
('Sega Genesis', 'Consola retro Sega Genesis/Mega Drive, originar din anii 90. Sonic, Streets of Rage, Mortal Kombat.', 80.00, 1988, 'Sega', 'posta', 'acceptabila', 'controller, cablu video', FALSE, 'genesis630.png', '2023-03-15'),
('Sega Dreamcast', 'Consola Sega din 1998, online gaming pionier. Soul Calibur, Crazy Taxi, Shenmue.', 220.00, 1998, 'Sega', 'posta', 'acceptabila', 'controller, cablu video, VMU', FALSE, 'dreamcast630.png', '2023-04-22'),
('Sega Saturn', 'Sega Saturn cu jocuri 2D si 3D legendare. Pentru pasionatii de retro.', 180.00, 1994, 'Sega', 'ridicare-personala', 'pentru piese', 'controller', FALSE, 'saturn630.png', '2023-02-10'),
('Atari 2600', 'Consola legendara din 1977, parintele gaming-ului home. Piesa de colectie.', 90.00, 1977, 'Altele', 'ridicare-personala', 'pentru piese', 'joystick, cartuse jocuri', FALSE, 'atari630.png', '2022-12-05'),
('Steam Deck', 'Consola portabila PC de la Valve cu acces complet la biblioteca Steam.', 1800.00, 2022, 'Altele', 'curier', 'excelenta', 'cablu USB-C, husa transport, microSD inclus', TRUE, 'steamdeck630.png', '2025-03-18'),
('Nintendo Wii', 'Consola Nintendo cu controllere motion. Wii Sports, Mario Galaxy, perfecta pentru familie.', 130.00, 2006, 'Nintendo', 'posta', 'buna', 'Wiimote, nunchuk, sensor bar, cablu video', FALSE, 'wii630.png', '2023-08-14'),
('Xbox Series S', 'Versiunea digitala mai mica si mai ieftina a generatiei actuale Xbox. 1440p gaming.', 650.00, 2020, 'Xbox', 'curier', 'buna', 'controller, cablu HDMI', TRUE, 'xboxseriess630.png', '2024-10-01'),
('PlayStation 2', 'Cea mai vanduta consola din toate timpurile. DVD player + jocuri iconice.', 110.00, 2000, 'PlayStation', 'posta', 'acceptabila', 'controller DualShock 2, cablu video, card memorie', FALSE, 'ps2630.png', '2023-09-20');
