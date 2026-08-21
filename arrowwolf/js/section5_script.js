/*
   SCRIPT DA SECTION 5 — CARROSSEL COM FUNDO BORRADO
   ────────────────────────────────────────────────────
   Lógica:
   1. Lê todos os .s5-card e o .s5-bg
   2. Gera os dots dinamicamente
   3. Botões ← → movem o track com translateX
   4. Ao mudar slide: troca background-image do .s5-bg com fade
*/

(function () {

    const track    = document.getElementById('s5-track');
    const bg       = document.getElementById('s5-bg');
    const btnPrev  = document.getElementById('s5-prev');
    const btnNext  = document.getElementById('s5-next');
    const dotsWrap = document.getElementById('s5-dots');

    if (!track || !bg) return;

    const cards    = Array.from(track.querySelectorAll('.s5-card'));
    const total    = cards.length;
    let   atual    = 0;

    /* ── gera os dots ─────────────────────────────────── */

    cards.forEach(function (_, i) {
        const dot = document.createElement('button');
        dot.className = 's5-dot' + (i === 0 ? ' s5-dot--ativo' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', function () { irPara(i); });
        dotsWrap.appendChild(dot);
    });

    /* ── fundo inicial ────────────────────────────────── */

    const bgInicial = cards[0].dataset.bg;
    if (bgInicial) bg.style.backgroundImage = 'url("' + bgInicial + '")';

    /* ── função principal: ir para um slide ──────────── */

    function irPara(indice) {

        /*
           Loop infinito via módulo.
           Ex: total=4, último card=3, clica →: (3+1)%4 = 0 → volta ao primeiro.
           Ex: primeiro card=0, clica ←: (0-1+4)%4 = 3 → vai ao último.
           O "+ total" antes do segundo % corrige índices negativos em JS.
        */
        indice = ((indice % total) + total) % total;

        /* move o track:
           cada card ocupa (72% + 16px de gap).
           translateX negativo move para a esquerda.
           calc() combina % e px — necessário pois gap é px. */
        const deslocamento = indice * (72 + 1.5); /* aprox em % */
        track.style.transform = 'translateX(calc(-' + indice + ' * (72% + 16px)))';

        /* remove ativo de todos os cards e dots */
        cards.forEach(function (c) { c.classList.remove('s5-card--ativo'); });
        Array.from(dotsWrap.querySelectorAll('.s5-dot')).forEach(function (d) {
            d.classList.remove('s5-dot--ativo');
        });

        /* ativa o card e dot atual */
        cards[indice].classList.add('s5-card--ativo');
        dotsWrap.querySelectorAll('.s5-dot')[indice].classList.add('s5-dot--ativo');

        /* troca fundo com fade */
        const novoBg = cards[indice].dataset.bg;
        if (novoBg) {
            bg.style.opacity = '0';
            setTimeout(function () {
                bg.style.backgroundImage = 'url("' + novoBg + '")';
                bg.style.opacity = '1';
            }, 300);
        }

        /* loop infinito — botões sempre habilitados */
        btnPrev.disabled = false;
        btnNext.disabled = false;

        atual = indice;
    }

    /* ── eventos dos botões ──────────────────────────── */

    btnPrev.addEventListener('click', function () { irPara(atual - 1); });
    btnNext.addEventListener('click', function () { irPara(atual + 1); });

    /* ── swipe touch (mobile) ────────────────────────── */

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

    irPara(0);

})();
