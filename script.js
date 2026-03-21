/* ========================================
   RAPPORT — Máquina de Demanda Solar
   Form Logic & Interactions
   ======================================== */

(function () {
  'use strict';

  // --- Fade-in-up on scroll ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger animation for sibling elements
          const siblings = entry.target.parentElement.querySelectorAll('.fade-in-up');
          const idx = Array.from(siblings).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, idx * 100);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-in-up').forEach((el) => {
    observer.observe(el);
  });

  // --- Multi-step Form Logic ---
  const formWrapper = document.getElementById('formWrapper');
  if (!formWrapper) return;

  const steps = formWrapper.querySelectorAll('.form-step[data-step]');
  const dots = formWrapper.querySelectorAll('.form-progress__dot');
  const progressBar = document.getElementById('formProgress');
  let currentStep = 1;
  const formData = {};

  function showStep(stepId) {
    steps.forEach((s) => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    const target = formWrapper.querySelector(`[data-step="${stepId}"]`);
    if (target) {
      target.style.display = 'block';
      // Slight delay for transition
      requestAnimationFrame(() => {
        target.classList.add('active');
      });
    }

    // Update progress dots
    if (typeof stepId === 'number' && stepId >= 1 && stepId <= 5) {
      progressBar.style.display = 'flex';
      dots.forEach((dot) => {
        const dotStep = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');
        if (dotStep === stepId) {
          dot.classList.add('active');
        } else if (dotStep < stepId) {
          dot.classList.add('completed');
        }
      });
    } else {
      // Hide progress for result screens
      progressBar.style.display = 'none';
    }
  }

  function goToStep(step) {
    currentStep = step;
    showStep(step);
  }

  // Handle radio option clicks (steps 1-4)
  formWrapper.addEventListener('change', function (e) {
    if (e.target.type !== 'radio') return;

    const stepEl = e.target.closest('.form-step');
    const step = parseInt(stepEl.dataset.step);

    // Store answer
    formData[e.target.name] = e.target.value;

    // Step 1: rejection path
    if (step === 1 && e.target.value === 'Não, atuo em outro segmento') {
      setTimeout(() => goToStep('rejected'), 400);
      return;
    }

    // Advance to next step after short delay
    if (step >= 1 && step <= 4) {
      setTimeout(() => goToStep(step + 1), 400);
    }
  });

  // Handle contact form submission (step 5)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validate required fields
      const nome = document.getElementById('nome');
      const whatsapp = document.getElementById('whatsapp');
      let valid = true;

      [nome, whatsapp].forEach((field) => {
        field.classList.remove('error');
        if (!field.value.trim()) {
          field.classList.add('error');
          valid = false;
        }
      });

      if (!valid) return;

      // Collect form data
      formData.nome = nome.value.trim();
      formData.empresa = document.getElementById('empresa').value.trim();
      formData.whatsapp = whatsapp.value.trim();
      formData.cidade = document.getElementById('cidade').value.trim();

      // Send to Google Sheets webhook
      sendToGoogleSheets(formData);

      // Show approved screen
      goToStep('approved');
    });
  }

  // --- Google Sheets Integration ---
  // TODO: Replace with actual Google Sheets Apps Script webhook URL
  const WEBHOOK_URL = '';

  function sendToGoogleSheets(data) {
    if (!WEBHOOK_URL) {
      console.log('Webhook URL not configured. Form data:', data);
      return;
    }

    fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => {
      console.error('Error sending form data:', err);
    });
  }

  // --- WhatsApp phone mask ---
  const whatsappInput = document.getElementById('whatsapp');
  if (whatsappInput) {
    whatsappInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);

      if (value.length > 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else if (value.length > 0) {
        value = `(${value}`;
      }

      e.target.value = value;
    });
  }

  // Initialize first step
  showStep(1);
})();
