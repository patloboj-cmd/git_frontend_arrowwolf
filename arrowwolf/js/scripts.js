/*
   SCRIPT DA SECTION 4 — PATTY SYSTEM
   ────────────────────────────────────
   Sem botões de navegação. Duas formas de troca de imagem:

   1. AUTO-PLAY: muda a cada 6s enquanto a section está
      visível (IntersectionObserver pausa quando fora da tela).

   2. HOVER nas colunas de texto:
      - Build (data-img="1")      → imagem índice 1
      - Gestão (data-img="2")     → imagem índice 2
      - Otimização (data-img="3") → imagem índice 3
      - Ao sair do hover, volta ao auto-play a partir do atual.

   3. SCROLL: IntersectionObserver detecta entrada/saída
      da section_4. Ao entrar ou sair → volta à imagem 0.
*/

(function () {

    const track    = document.getElementById('s4-track');
    const section  = document.getElementById('section_4');

    if (!track || !section) return;

    const cards   = Array.from(track.querySelectorAll('.s4-card'));
    const colunas = Array.from(section.querySelectorAll('.text_box_section_4'));
    const total   = cards.length;
    let   atual   = 0;
    let   timer   = null;
    let   pausado = false; /* true quando mouse está sobre uma coluna */

    /* ── ativa uma imagem pelo índice ────────────────────
       Remove .s4-card--ativo de todos e aplica no alvo.
       Atualiza a coluna de texto ativa (linha indicadora).
    */
    function mostrar(indice) {
        /* garante que o índice está dentro do range */
        indice = ((indice % total) + total) % total;

        /* troca de card */
        cards.forEach(function (c) { c.classList.remove('s4-card--ativo'); });
        cards[indice].classList.add('s4-card--ativo');

        /* destaca a coluna correspondente (índice 0 → nenhuma coluna ativa) */
        colunas.forEach(function (col) {
            col.classList.remove('text_box_section_4--ativa');
        });
        if (indice > 0) {
            /* data-img="1" corresponde ao índice 1, etc. */
            const col = section.querySelector('.text_box_section_4[data-img="' + indice + '"]');
            if (col) col.classList.add('text_box_section_4--ativa');
        }

        atual = indice;
    }

    /* ── auto-play ───────────────────────────────────────
       Avança para o próximo índice a cada 6000ms.
       Pausa quando o mouse está sobre uma coluna (pausado=true)
       ou quando a section sai da viewport (ver IntersectionObserver).
    */
    function iniciarTimer() {
        pararTimer();
        timer = setInterval(function () {
            if (!pausado) {
                mostrar((atual + 1) % total);
            }
        }, 6000);
    }

    function pararTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    /* ── hover nas colunas ───────────────────────────────
       mouseenter → mostra a imagem do data-img da coluna,
                    pausa o auto-play.
       mouseleave → retoma o auto-play a partir do slide atual.
    */
    colunas.forEach(function (col) {
        col.addEventListener('mouseenter', function () {
            pausado = true;
            const idx = parseInt(col.dataset.img, 10);
            if (!isNaN(idx)) mostrar(idx);
        });

        col.addEventListener('mouseleave', function () {
            pausado = false;
            /* retoma o timer sem resetar o índice atual */
            iniciarTimer();
        });
    });

    /* ── IntersectionObserver ────────────────────────────
       Monitora quando a section_4 entra ou sai da viewport.

       Ao ENTRAR (isIntersecting: true):
       → volta para a imagem 0 e inicia o auto-play.

       Ao SAIR (isIntersecting: false):
       → volta para a imagem 0 e pausa o auto-play.

       threshold: 0.1 → dispara quando 10% da section
       está visível — evita disparos com 1 pixel na borda.
    */
    const observer = new IntersectionObserver(function (entries) {
        const entry = entries[0];
        if (entry.isIntersecting) {
            mostrar(0);
            iniciarTimer();
        } else {
            mostrar(0);
            pararTimer();
        }
    }, { threshold: 0.1 });

    observer.observe(section);

    /* inicialização */
    mostrar(0);

})();

/*
   SCRIPT DA SECTION 5 — CARROSSEL DECK DE CARTAS
   ────────────────────────────────────────────────
   MUDANÇA PRINCIPAL em relação à versão anterior:
   O track NÃO se move mais com track.style.transform.
   O JS atribui classes de posição a cada card individualmente
   e o CSS anima via transition (transform + opacity).

   Classes gerenciadas:
   s5-card--ativo   → card na frente, centralizado, opacity 1
   s5-card--proximo → card imediatamente após, deslocado à direita
   s5-card--atras   → dois cards após, mais recuado e menor

   Fluxo:
   1. Gera dots dinamicamente (um por card)
   2. irPara(indice):
      a. Loop infinito via módulo
      b. limparClassesDeck() — remove todas as classes de todos os cards
      c. Redistribui: ativo / proximo / atras
      d. Atualiza dots
      e. Troca background-image do .s5-bg com fade
   3. Botões ← → chamam irPara(atual ± 1)
   4. Swipe touch para mobile
*/

(function () {

    const track    = document.getElementById('s5-track');
    const bg       = document.getElementById('s5-bg');
    const btnPrev  = document.getElementById('s5-prev');
    const btnNext  = document.getElementById('s5-next');
    const dotsWrap = document.getElementById('s5-dots');

    /* guarda de segurança — aborta se os elementos não existirem */
    if (!track || !bg) return;

    const cards = Array.from(track.querySelectorAll('.s5-card'));
    const total = cards.length;
    let   atual = 0;

    /* classes de posição gerenciadas por este script.
       Declaradas aqui para facilitar manutenção — se uma classe
       mudar de nome, basta alterar neste array. */
    const CLASSES_DECK = ['s5-card--ativo', 's5-card--proximo', 's5-card--atras'];

    /* ── gera dots dinamicamente ─────────────────────────
       Um <button class="s5-dot"> por card no #s5-dots.
       Cada dot chama irPara(i) com seu próprio índice.
    */
    cards.forEach(function (_, i) {
        const dot = document.createElement('button');
        dot.className = 's5-dot' + (i === 0 ? ' s5-dot--ativo' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', function () { irPara(i); });
        dotsWrap.appendChild(dot);
    });

    /* ── remove todas as classes de deck de todos os cards ──
       Chamada antes de aplicar a nova posição, garantindo que
       nenhum card fique com duas classes ao mesmo tempo.
    */
    function limparClassesDeck() {
        cards.forEach(function (c) {
            CLASSES_DECK.forEach(function (cls) { c.classList.remove(cls); });
        });
    }

    /* ── função principal ────────────────────────────────
       NÃO toca em track.style.transform.
       Apenas redistribui classes entre os cards.

       Loop infinito via módulo:
       - → no último (total-1): (total-1+1)%total = 0
       - ← no primeiro (0): (0-1+total)%total = total-1
       "+total" antes do segundo % corrige negativos em JS.
    */
    function irPara(indice) {

        indice = ((indice % total) + total) % total;

        limparClassesDeck();

        /* card ativo: frente do deck, centralizado */
        cards[indice].classList.add('s5-card--ativo');

        /* próximo card: espia pela direita */
        cards[(indice + 1) % total].classList.add('s5-card--proximo');

        /* dois cards à frente: mais atrás no deck */
        cards[(indice + 2) % total].classList.add('s5-card--atras');

        /* atualiza dots */
        Array.from(dotsWrap.querySelectorAll('.s5-dot')).forEach(function (d, i) {
            d.classList.toggle('s5-dot--ativo', i === indice);
        });

        /* ── troca fundo borrado ─────────────────────────
           data-bg deve ter o MESMO caminho do src da <img>.
           Primeira carga (backgroundImage vazio): aplica direto
           para evitar o flash cinza durante os 300ms do timeout.
           Trocas subsequentes: fade opacity 0 → troca → opacity 1.
        */
        const novoBg = cards[indice].dataset.bg;
        if (novoBg) {
            if (bg.style.backgroundImage === '') {
                /* primeira carga: aplica direto */
                bg.style.backgroundImage = 'url("' + novoBg + '")';
            } else {
                bg.style.opacity = '0';
                setTimeout(function () {
                    bg.style.backgroundImage = 'url("' + novoBg + '")';
                    bg.style.opacity = '1';
                }, 300);
            }
        }

        /* loop infinito — botões sempre habilitados */
        btnPrev.disabled = false;
        btnNext.disabled = false;

        atual = indice;
    }

    /* ── botões ──────────────────────────────────────────*/
    btnPrev.addEventListener('click', function () { irPara(atual - 1); });
    btnNext.addEventListener('click', function () { irPara(atual + 1); });

    /* ── swipe touch ─────────────────────────────────────
       Limiar de 50px evita ativações acidentais em scrolls suaves.
       passive:true → melhor performance (sem preventDefault).
    */
    let touchStartX = 0;
    track.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) irPara(diff > 0 ? atual + 1 : atual - 1);
    }, { passive: true });

    /* inicialização após tudo configurado — evita flash cinza inicial */
    irPara(0);

})();

/*
   SCRIPT DA SECTION 6 — CARROSSEL DO TIME
   ────────────────────────────────────────
   Mesma lógica do carrossel da section_5,
   adaptada para cards visíveis por vez.
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
       O JS detecta dinamicamente pela largura da tela.
    */
    function cardsPorVez() {
        const larguraTela = window.innerWidth;
        if (larguraTela <= 600) return 1;
        if (larguraTela <= 900) return 2;
        return 1;
    }

    function irPara(indice) {

        /*
           Loop infinito via módulo.
           ((indice % total) + total) % total corrige negativos.
        */
        const porVez = cardsPorVez();
        const maxIndice = total - porVez;

        /* clamp com loop: ao passar do fim volta ao início e vice-versa */
        if (indice > maxIndice) indice = 0;
        if (indice < 0)         indice = maxIndice;

        /*
           Translada o track.
           Cada card tem width: calc(38% - 12px) + gap: 16px.
           calc() no translateX combina as duas unidades.
        */
        track.style.transform =
            'translateX(calc(-' + indice + ' * (38% + 4px)))';

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


