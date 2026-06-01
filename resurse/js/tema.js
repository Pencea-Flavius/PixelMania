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
        
        // Salveaza in local storage
        localStorage.setItem('tema-pixelmania', nou);
        
        aplicaIcon();
    });
});
