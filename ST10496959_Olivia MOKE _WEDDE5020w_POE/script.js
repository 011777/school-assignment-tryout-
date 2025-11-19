/* js/script.js
   Requires jQuery (loaded with defer) and Leaflet (for the map)
*/
(() => {
  // Use jQuery ready but ensure deferred scripts execute after DOM
  document.addEventListener('DOMContentLoaded', () => {
    // ---------- small feature helpers ----------
    const $ = window.jQuery;

    // Reveal on scroll
    const revealOnScroll = () => {
      document.querySelectorAll('.reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < (window.innerHeight - 80)) el.classList.add('visible');
      });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // Back to top
    const $btt = $('#back-to-top');
    $(window).on('scroll', () => {
      if ($(window).scrollTop() > 400) $btt.fadeIn();
      else $btt.fadeOut();
    });
    $btt.on('click', () => $('html,body').animate({scrollTop:0}, 500));

    // ---------- Dynamic posts (sample data) ----------
    const posts = [
      { id:1, title:'Scholarship recipients 2025', date:'2025-10-12', excerpt:'We awarded scholarships to 50 students...', img:'images/gallery1.jpg' },
      { id:2, title:'Monthly food drive success', date:'2025-09-25', excerpt:'Over 200 food parcels distributed...', img:'images/gallery2.jpg' },
      { id:3, title:'Skills workshop', date:'2025-08-15', excerpt:'Digital skills workshop for youth...', img:'images/gallery3.jpg' },
    ];

    const renderPosts = (items) => {
      const $list = $('#posts-list').empty();
      if (!items.length) $list.append('<p>No stories match your search.</p>');
      items.forEach(p => {
        const card = $(`
          <article class="service-box reveal" tabindex="0">
            <img src="${p.img}" alt="${p.title}" style="width:100%;height:140px;object-fit:cover;border-radius:6px;margin-bottom:10px;">
            <h3>${p.title}</h3>
            <small>${p.date}</small>
            <p>${p.excerpt}</p>
            <button class="open-post" data-id="${p.id}">Read more</button>
          </article>
        `);
        $list.append(card);
      });
      revealOnScroll();
    };

    // initial render
    renderPosts(posts);

    // Search & sort
    $('#post-search').on('input', function() {
      const q = this.value.toLowerCase().trim();
      const filtered = posts.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
      renderPosts(filtered);
    });

    $('#post-sort').on('change', function() {
      const val = this.value;
      let copy = [...posts];
      if (val === 'date-desc') copy.sort((a,b)=>b.date.localeCompare(a.date));
      if (val === 'date-asc') copy.sort((a,b)=>a.date.localeCompare(b.date));
      if (val === 'title-asc') copy.sort((a,b)=>a.title.localeCompare(b.title));
      if (val === 'title-desc') copy.sort((a,b)=>b.title.localeCompare(a.title));
      renderPosts(copy);
    });

    // Read more -> simple modal showing detail
    $(document).on('click', '.open-post', function(){
      const id = +$(this).data('id');
      const p = posts.find(x=>x.id===id);
      if (!p) return;
      const modalHtml = `
        <div class="modal" id="post-modal" style="display:flex;">
          <div style="background:white;padding:1rem;border-radius:8px;max-width:800px;width:100%;position:relative;">
            <button id="post-modal-close" style="position:absolute;right:10px;top:10px;background:none;border:none;font-size:1.6rem;cursor:pointer;">&times;</button>
            <h2>${p.title}</h2>
            <small>${p.date}</small>
            <img src="${p.img}" alt="${p.title}" style="width:100%;height:220px;object-fit:cover;border-radius:6px;margin:8px 0;">
            <p>${p.excerpt} Full story would go here — include more details, quotes and calls to action.</p>
          </div>
        </div>
      `;
      $('body').append(modalHtml);
      $('#post-modal-close').on('click', ()=>$('#post-modal').remove());
    });

    // ---------- Gallery Lightbox ----------
    const $thumbs = $('.gallery-grid .thumb');
    let galleryIndex = 0;
    const galleryImgs = Array.from($thumbs).map(img => ({src: img.dataset.full || img.src, alt: img.alt || ''}));

    const openLightbox = (index) => {
      galleryIndex = index;
      const item = galleryImgs[galleryIndex];
      $('#lightbox-img').attr('src', item.src);
      $('#lightbox-caption').text(item.alt);
      $('#lightbox').fadeIn().attr('aria-hidden','false');
    };
    const closeLightbox = () => {
      $('#lightbox').fadeOut().attr('aria-hidden','true');
    };
    $thumbs.on('click', function(){
      const idx = Array.prototype.indexOf.call($thumbs, this);
      openLightbox(idx);
    });
    $('#lightbox-close').on('click', closeLightbox);
    $('#prev-img').on('click', ()=> openLightbox((galleryIndex -1 + galleryImgs.length)%galleryImgs.length));
    $('#next-img').on('click', ()=> openLightbox((galleryIndex +1)%galleryImgs.length));
    $(document).on('keydown', (e) => {
      if ($('#lightbox').is(':visible')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') $('#prev-img').click();
        if (e.key === 'ArrowRight') $('#next-img').click();
      }
    });

    // ---------- Tabs (services) ----------
    $('.tab').on('click', function() {
      $('.tab').removeClass('active').attr('aria-selected','false');
      $(this).addClass('active').attr('aria-selected','true');
      const target = $(this).data('tab');
      $('.tab-panel').attr('hidden','hidden');
      $('#' + target).removeAttr('hidden');
    });

    // ---------- Leaflet Map init (if present) ----------
    if (typeof L !== 'undefined' && document.getElementById('map')) {
      try {
        const map = L.map('map').setView([-26.2041, 28.0473], 11); // Johannesburg coords
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        // sample marker(s)
        L.marker([-26.2041,28.0473]).addTo(map).bindPopup('<strong>Hope for Tomorrow</strong><br>Community HQ').openPopup();
      } catch (err) { console.warn('Leaflet map error', err); }
    }

    // ---------- Form handling: Contact (create mailto + simulate AJAX) ----------
    $('#contact-form').on('submit', function(e){
      e.preventDefault();
      const $form = $(this);
      if (!this.reportValidity()) return; // HTML5 constraint check
      const name = $('#c-name').val().trim();
      const email = $('#c-email').val().trim();
      const type = $('#c-type').val();
      const message = $('#c-message').val().trim();
      // compile mailto
      const subject = encodeURIComponent(`Website contact: ${type} - ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nType: ${type}\n\nMessage:\n${message}`);
      const mailto = `mailto:info@hopefortomorrow.org?subject=${subject}&body=${body}`;
      // show feedback and provide a clickable mailto (so user can send)
      $('#contact-feedback').removeClass().addClass('feedback success').text('Your message is validated. Click the button to open your email client to send: ').show();
      $('#contact-feedback').append(`<div style="margin-top:8px;"><a href="${mailto}" class="btn" target="_blank" rel="noopener">Open email client</a></div>`);
      // simulate AJAX POST to server (if you have a backend replace URL)
      fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name,email,type,message}) })
        .then(()=> console.log('Simulated POST success (no server)'))
        .catch(()=> console.log('Simulated POST fail (no server)'));
    });

    // ---------- Enquiry form: dynamic availability & cost calculation ----------
    $('#enquiry-form').on('submit', function(e){
      e.preventDefault();
      if (!this.reportValidity()) return;
      const name = $('#e-name').val().trim();
      const type = $('#e-type').val();
      const date = $('#e-date').val();
      // simple rule engine
      let response = '';
      if (type === 'volunteer') {
        response = `Thanks ${name}. Volunteer opportunities are available weekly. We'll email you with next steps. There's no cost.`;
      } else if (type === 'sponsor') {
        // basic cost estimate demonstration
        const estimate = Math.floor(Math.random()*5000) + 1000;
        response = `Thanks ${name}. Sponsorship packages start from R ${estimate.toLocaleString()}. We have availability; our coordinator will contact you.`;
      } else if (type === 'service') {
        response = `Thanks ${name}. Service availability depends on schedule; we have openings in the coming weeks. Preferred date: ${date || 'not specified'}. We'll follow up.`;
      } else {
        response = `Thanks ${name}. We'll follow up shortly.`;
      }
      $('#enquiry-response').removeClass().addClass('feedback success').text(response).show();
      // scroll to response
      $('html,body').animate({scrollTop: $('#enquiry-response').offset().top - 80}, 400);
    });

    // ---------- small animation: add reveal class to major sections ----------
    document.querySelectorAll('section').forEach(s => s.classList.add('reveal'));
    revealOnScroll();

    // ---------- Progressive enhancement: If no jQuery, fallback basic behavior done with vanilla earlier ----------
    // End DOMContentLoaded
  });
})();
