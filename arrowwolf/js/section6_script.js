/*
   SCRIPT DA SECTION 6 — CARROSSEL DO TIME
   ────────────────────────────────────────
   Mesma lógica do carrossel da section_5,
   adaptada para 4 cards visíveis por vez.
   Loop infinito via módulo.
*/

(function () {

    const track   = document.getElementById('s6-track');
    const btnPrev = document.getElementById('s6-prev');
    const btnNext = document.getElementById('s6-next');

    if (!track) return;

    const cards = Array.from(track.querySelectorAll('.s6-card'));
    const total = cards.length;
    let   atual = 0;

    /*
       Quantos cards cabem por vez?
       Lemos do CSS: em desktop são 4 (25% cada).
       O JS detecta dinamicamente pela largura do card.
    */
    function cardsPorVez() {
        const larguraTela = window.innerWidth;
        if (larguraTela <= 600) return 1;
        if (larguraTela <= 900) return 2;
        return 1;
    }

    function irPara(indice) {

        /*
           Loop infinito via módulo — igual ao section_5.
           ((indice % total) + total) % total corrige negativos.
        */
        const porVez = cardsPorVez();
        const maxIndice = total - porVez;

        /* clamp com loop: ao passar do fim volta ao início e vice-versa */
        if (indice > maxIndice) indice = 0;
        if (indice < 0)         indice = maxIndice;

        /*
           Translada o track.
           Cada card tem width: calc(25% - 12px) + gap: 16px.
           calc() no translateX combina as duas unidades.
        */
        track.style.transform =
            'translateX(calc(-' + indice + ' * (25% + 4px)))';

        /* atualiza estado visual dos botões nav */
        btnPrev.classList.remove('s6-nav--ativo');
        btnNext.classList.remove('s6-nav--ativo');

        if (indice === 0) {
            btnNext.classList.add('s6-nav--ativo');
        } else {
            btnPrev.classList.add('s6-nav--ativo');
        }

        atual = indice;
    }

    btnPrev.addEventListener('click', function () { irPara(atual - 1); });
    btnNext.addEventListener('click', function () { irPara(atual + 1); });

    /* swipe touch */
    let touchStartX = 0;

    track.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            irPara(diff > 0 ? atual + 1 : atual - 1);
        }
    }, { passive: true });

    /* recalcula ao redimensionar a janela */
    window.addEventListener('resize', function () { irPara(0); });

    /* estado inicial */
    irPara(0);

})();
