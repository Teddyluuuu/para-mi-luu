/* Logica de la pagina. No hace falta tocar nada de aqui para cambiar textos. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var prefiereCalma = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Candado ---------------- */
  var intentos = 0;
  var paso = false;

  function abrir() {
    $('candado').classList.add('cerrado');
    $('sitio').classList.remove('oculto');
    window.setTimeout(function () { $('candado').style.display = 'none'; }, 900);
    /* Cada bloque va a su bola: si uno falla, el resto igual se pinta.
       Sin esto, un error en las fotos dejaba la pagina a medias. */
    [construirNombre, pintarCosasQueAmo, pintarHistoria, pintarContador,
      iniciarLluviaDeCorazones,
      function () { estallarCorazones(estallidoInicial); },
      cargarFotos,
      pintarCanciones
    ].forEach(function (hacer) {
      try { hacer(); } catch (err) {}
    });
  }

  function revisarClave() {
    var valor = ($('clave').value || '').replace(/\D/g, '');
    if (valor === CONFIG.clave) {
      try { sessionStorage.setItem('luz-abierta', '1'); } catch (err) {}
      $('msg-clave').textContent = 'ahi va, mi amor ♥';
      $('msg-clave').className = 'msg bien';
      window.setTimeout(abrir, 350);
      return true;
    }
    intentos++;
    $('msg-clave').textContent = CONFIG.frasesError[(intentos - 1) % CONFIG.frasesError.length];
    $('msg-clave').className = 'msg mal';
    var caja = document.querySelector('.candado-caja');
    caja.classList.remove('sacudida');
    void caja.offsetWidth;
    caja.classList.add('sacudida');
    $('clave').value = '';
    $('clave').focus();
    return false;
  }

  /* El click del boton ya dispara submit, pero en algunos celulares el submit
     no llega nunca: con los dos caminos asegurados, apretar siempre hace algo. */
  function intentar(e) {
    if (e) e.preventDefault();
    if (paso) return;
    paso = revisarClave();
  }

  $('form-clave').addEventListener('submit', intentar);
  $('btn-abrir').addEventListener('click', intentar);

  /* La reapertura automatica se lanza al final del todo: si no, abria antes de
     que las variables de mas abajo existan y la pagina se queda a medias. */
  var recordada = false;
  try { recordada = sessionStorage.getItem('luz-abierta') === '1'; } catch (err) {}

  /* ---------------- Nombre con corazones ---------------- */
  function construirNombre() {
    var letras = (CONFIG.nombre || 'L').toUpperCase().split('');
    $('nombre-grande').innerHTML = letras.map(function (l, i) {
      return '<span class="letra" style="--retardo:' + (i * 0.12) + 's">' + l +
             '<i class="mini-corazon" aria-hidden="true">♥</i></span>';
    }).join('');
  }

  /* ---------------- Corazones flotando ---------------- */
  var colores = ['#ff5b8a', '#e0174f', '#ff8fb0', '#f7c86b', '#ff3d6e'];

  function nuevoCorazon(x) {
    var b = document.createElement('b');
    b.className = 'corazon';
    b.textContent = Math.random() > 0.35 ? '♥' : '❤';
    b.style.left = (x == null ? Math.random() * 100 : x) + '%';
    b.style.color = colores[Math.floor(Math.random() * colores.length)];
    var escala = 0.5 + Math.random() * 1.4;
    b.style.fontSize = (14 * escala).toFixed(1) + 'px';
    b.style.animationDuration = (7 + Math.random() * 9).toFixed(1) + 's';
    b.style.setProperty('--deriva', ((Math.random() * 160) - 80).toFixed(0) + 'px');
    $('lluvia').appendChild(b);
    b.addEventListener('animationend', function () { b.remove(); });
  }

  /* El celu sufre con tantos nodos animados: menos corazones y mas espaciados. */
  var esCelular = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var pocosNucleos = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : esCelular;
  var topeLluvia = esCelular ? 9 : 22;
  var cadaLluvia = esCelular ? 1100 : 620;
  var estallidoInicial = pocosNucleos ? 12 : 34;

  function iniciarLluviaDeCorazones() {
    if (prefiereCalma) return;
    window.setInterval(function () {
      if (document.hidden) return;
      if ($('lluvia').children.length < topeLluvia) nuevoCorazon();
    }, cadaLluvia);
  }

  function estallarCorazones(cantidad) {
    if (prefiereCalma) return;
    for (var i = 0; i < cantidad; i++) {
      window.setTimeout(function () { nuevoCorazon(40 + Math.random() * 20); }, i * 45);
    }
  }

  /* ---------------- Contador de dias ---------------- */
  function pintarContador() {
    var inicio = new Date(CONFIG.fechaDeclaracion + 'T00:00:00');
    var hoy = new Date();
    var dias = Math.floor((hoy - inicio) / 86400000);
    $('contador').textContent = isNaN(dias) ? ''
      : 'ya van ' + dias.toLocaleString('es-BO') + ' días desde que me declaré... y contando, jsjsjs 💗';
  }

  /* ---------------- Cosas que amo ---------------- */
  function pintarCosasQueAmo() {
    $('amo').innerHTML = CONFIG.cosasQueAmo.map(function (t) {
      return '<li><span class="pin" aria-hidden="true">♥</span>' + t + '</li>';
    }).join('');
  }

  /* ---------------- Historia ---------------- */
  function pintarHistoria() {
    $('historia').innerHTML = CONFIG.historia.map(function (h) {
      return '<li><span class="cuando">' + h.cuando + '</span><p>' + h.que + '</p></li>';
    }).join('');
  }

  /* ---------------- Fotos ---------------- */
  var extensionesFoto = ['jpg', 'jpeg', 'png', 'webp'];

  function cargarFotos() {
    var encontradas = [];
    var vaciasSeguidas = 0;

    function probarNumero(n) {
      if (n > CONFIG.probarHasta || vaciasSeguidas >= 2) return Promise.resolve();
      return buscarPrimera(n, 0).then(function (src) {
        if (src) { encontradas.push(src); vaciasSeguidas = 0; }
        else { vaciasSeguidas++; }
        return probarNumero(n + 1);
      });
    }

    function buscarPrimera(n, i) {
      if (i >= extensionesFoto.length) return Promise.resolve(null);
      var ruta = CONFIG.rutaFotos + n + '.' + extensionesFoto[i];
      return probarImagen(ruta).then(function (ok) {
        return ok ? ruta : buscarPrimera(n, i + 1);
      });
    }

    probarNumero(1).then(function () {
      if (!encontradas.length) { $('galeria-vacia').classList.remove('oculto'); return; }
      $('galeria').innerHTML = encontradas.map(function (src) {
        var cartel = (CONFIG.carteles || {})[src.split('/').pop()] || '';
        return '<figure class="foto' + (cartel ? ' destacada' : '') + '">' +
          '<img src="' + src + '" alt="foto de nosotros" loading="lazy">' +
          (cartel ? '<figcaption>' + cartel + '</figcaption>' : '') +
          '</figure>';
      }).join('');
    });
  }

  function probarImagen(src) {
    return new Promise(function (resuelve) {
      var terminado = false;
      var img = new Image();
      function cerrar(ok) {
        if (terminado) return;
        terminado = true;
        window.clearTimeout(limite);
        img.onload = img.onerror = null;
        resuelve(ok);
      }
      /* Algunos hosting dejan la peticion colgada: sin tope, la galeria nunca aparece. */
      var limite = window.setTimeout(function () { cerrar(false); }, 3000);
      img.onload = function () { cerrar(img.naturalWidth > 0); };
      img.onerror = function () { cerrar(false); };
      img.src = src;
    });
  }

  $('galeria').addEventListener('click', function (e) {
    var img = e.target.closest('img');
    if (!img) return;
    var figura = img.closest('.foto');
    var cartel = figura && figura.querySelector('figcaption');
    $('lightbox-img').src = img.src;
    $('lightbox-cap').textContent = cartel ? cartel.textContent : '';
    $('lightbox').classList.remove('oculto');
  });
  $('lightbox').addEventListener('click', function () { $('lightbox').classList.add('oculto'); });

  /* ---------------- Playlist ---------------- */
  function pintarCanciones() {
    $('lista-canciones').innerHTML = CONFIG.canciones.map(function (c, i) {
      return '<li><button type="button" class="pista-boton" data-i="' + i + '">' +
        '<span class="ico" aria-hidden="true">▶</span>' +
        '<span class="datos"><b>' + c.titulo + '</b><small>' + c.artista + ' · ' + c.nota + '</small></span>' +
        '</button></li>';
    }).join('');
  }

  $('lista-canciones').addEventListener('click', function (e) {
    var boton = e.target.closest('.pista-boton');
    if (!boton) return;
    var c = CONFIG.canciones[+boton.getAttribute('data-i')];
    document.querySelectorAll('.pista-boton').forEach(function (b) { b.classList.remove('activa'); });
    boton.classList.add('activa');
    $('lector').innerHTML =
      '<iframe src="https://www.youtube.com/embed/' + c.video + '?autoplay=1&rel=0" title="' + c.titulo + ' - ' + c.artista + '"' +
      ' allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
      '<a class="por-si-acaso" href="https://www.youtube.com/watch?v=' + c.video + '" target="_blank" rel="noopener">no suena? ábrela en YouTube</a>';
    $('disco').classList.add('girando');
    $('aviso-canciones').classList.remove('oculto');
  });

  /* ---------------- La pregunta ---------------- */
  var escapa = 0;
  $('btn-no').addEventListener('mouseenter', esquivar);
  $('btn-no').addEventListener('click', esquivar);
  $('btn-no').addEventListener('touchstart', function (e) { e.preventDefault(); esquivar(); });

  function esquivar() {
    escapa++;
    var b = $('btn-no');
    b.style.transform = 'translate(' + ((Math.random() * 140) - 70).toFixed(0) + 'px,' + ((Math.random() * 60) - 30).toFixed(0) + 'px) rotate(' + ((Math.random() * 20) - 10).toFixed(0) + 'deg)';
    b.textContent = ['dejame pensarlo un poquito', 'no sé...', 'ahí estoy viendo', 'jsjsjs ya me perdiste', 'ok ok, sí 💗'][Math.min(escapa, 4)];
    if (escapa > 6) { b.classList.add('rendida'); b.textContent = 'está bien, SIIII'; }
  }

  $('btn-si').addEventListener('click', function () {
    $('respuesta').innerHTML = 'sabía, mi amor 💗 <b>nos vamos a casar</b>, serás mi esposa juasjuas.<br>y hoy, mientras tanto, feliz cumpleaños mi luu ❤💕';
    $('respuesta').classList.add('visible');
    $('btn-no').style.display = 'none';
    estallarCorazones(46);
  });

  if (recordada) abrir();
})();
