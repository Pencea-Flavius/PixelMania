document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('btn-tema');
    if (!btn) return;

    function aplicaIcon() {
        var t = document.documentElement.getAttribute('data-tema');
        btn.innerHTML = t === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }
    
    aplicaIcon();
    
    btn.addEventListener('click', function () {
        var t = document.documentElement.getAttribute('data-tema');
        var nou = t === 'light' ? 'dark' : 'light';
        
        // Aplica tema in pagina
        document.documentElement.setAttribute('data-tema', nou);
        
        // PROF: Sectiunea 10 - Aici salvam tema in localStorage pentru a ramane "tinuta minte" la refresh/navigare
        // Salveaza in local storage
        localStorage.setItem('tema-pixelmania', nou);
        
        aplicaIcon();
    });
});
