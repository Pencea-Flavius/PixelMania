// Selectam videoclipul din pagina
const video = document.querySelector('#video-consola');

// Cand se termina, il resetam la inceput
video.addEventListener('ended', () => {
    video.load();
});

// La hover - pornim videoclipul automat
video.addEventListener('mouseenter', () => {
    video.play();
});

// Cand iesim cu mouse-ul - il oprim si resetam
video.addEventListener('mouseleave', () => {
    video.pause();
    video.load();
});
