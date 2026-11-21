import { useEffect, useMemo } from 'react';
import sourceHtml from './page.html?raw';
import './styles.css';

function getBodyMarkup(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return (match ? match[1] : html).replace(/<script[\s\S]*?<\/script>/gi, '');
}

export default function App() {
  const bodyMarkup = useMemo(() => getBodyMarkup(sourceHtml), []);

  useEffect(() => {
    document.body.classList.add('has-js');
    const header = document.querySelector('[data-header]');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobileMenu = document.querySelector('#mobile-menu');
    const modal = document.querySelector('[data-tour-modal]');
    const modalTitle = document.querySelector('#tour-modal-title');
    const modalCopy = document.querySelector('#tour-modal-copy');
    const modalClose = modal?.querySelector('[data-tour-close]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const backgroundVideos = Array.from(document.querySelectorAll('[data-background-video]'));
    const listeners = [];
    const observers = [];
    let returnFocus = null;

    const listen = (node, type, handler, options) => {
      node?.addEventListener(type, handler, options);
      if (node) listeners.push([node, type, handler, options]);
    };

    const startBackgroundVideo = (video) => {
      if (reducedMotion.matches) return;
      const source = video.dataset.videoSrc;
      if (!source) return;
      if (video.dataset.loadedSource !== source) {
        video.dataset.loadedSource = source;
        video.src = source;
        video.load();
      }
      video.playbackRate = 0.75;
      video.play().catch((error) => {
        if (error.name !== 'AbortError') console.warn('Background video could not start.', error);
      });
    };
    const stopBackgroundVideo = (video) => video.pause();

    backgroundVideos.forEach((video) => {
      listen(video, 'loadedmetadata', () => {
        video.playbackRate = 0.75;
      });
      listen(video, 'loadeddata', () => {
        video.classList.add('is-ready');
        video.parentElement?.classList.remove('video-error');
      });
      listen(video, 'error', () => {
        video.parentElement?.classList.add('video-error');
        console.warn('Background video failed to load.', video.currentSrc || video.dataset.videoSrc);
      });
    });

    let videoObserver = null;
    if ('IntersectionObserver' in window) {
      videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) startBackgroundVideo(target);
          else stopBackgroundVideo(target);
        });
      }, { threshold: 0.08, rootMargin: '100px 0px' });
      backgroundVideos.forEach((video) => videoObserver.observe(video));
      observers.push(videoObserver);
    } else if (!reducedMotion.matches) {
      backgroundVideos.forEach(startBackgroundVideo);
    }

    const scrollMotionScenes = Array.from(document.querySelectorAll('[data-scroll-motion]'));
    let scrollMotionFrame = 0;
    const updateScrollMotion = () => {
      scrollMotionFrame = 0;
      if (reducedMotion.matches) return;
      scrollMotionScenes.forEach((scene) => {
        const media = scene.querySelectorAll('[data-scroll-media], [data-background-video]');
        if (!media.length) return;
        const bounds = scene.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
        const scale = 1.07 + progress * 0.06;
        const offset = (0.5 - progress) * 36;
        media.forEach((element) => {
          element.style.translate = `0px ${offset.toFixed(2)}px`;
          element.style.scale = scale.toFixed(4);
        });
      });
    };
    const requestScrollMotion = () => {
      if (!scrollMotionFrame) scrollMotionFrame = window.requestAnimationFrame(updateScrollMotion);
    };
    const resetScrollMotion = () => {
      scrollMotionScenes.forEach((scene) => {
        scene.querySelectorAll('[data-scroll-media], [data-background-video]').forEach((element) => {
          element.style.removeProperty('translate');
          element.style.removeProperty('scale');
        });
      });
    };
    listen(window, 'scroll', requestScrollMotion, { passive: true });
    listen(window, 'resize', requestScrollMotion, { passive: true });
    requestScrollMotion();

    const onMotionChange = (event) => {
      if (event.matches) {
        backgroundVideos.forEach(stopBackgroundVideo);
        resetScrollMotion();
      }
      else if (videoObserver) {
        backgroundVideos.forEach((video) => {
          const bounds = video.getBoundingClientRect();
          if (bounds.bottom >= 0 && bounds.top <= window.innerHeight) startBackgroundVideo(video);
        });
        requestScrollMotion();
      } else {
        backgroundVideos.forEach(startBackgroundVideo);
        requestScrollMotion();
      }
    };
    listen(reducedMotion, 'change', onMotionChange);
    listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        backgroundVideos.forEach(stopBackgroundVideo);
        return;
      }
      if (reducedMotion.matches) return;
      backgroundVideos.forEach((video) => {
        const bounds = video.getBoundingClientRect();
        if (bounds.bottom >= 0 && bounds.top <= window.innerHeight) startBackgroundVideo(video);
      });
    });

    const closeMenu = () => {
      if (!menuToggle || !mobileMenu) return;
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
      mobileMenu.hidden = true;
      document.body.classList.remove('menu-open');
    };
    const toggleMenu = () => {
      if (!menuToggle || !mobileMenu) return;
      const opening = mobileMenu.hidden;
      mobileMenu.hidden = !opening;
      menuToggle.setAttribute('aria-expanded', String(opening));
      menuToggle.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', opening);
    };
    listen(menuToggle, 'click', toggleMenu);
    mobileMenu?.querySelectorAll('a').forEach((link) => listen(link, 'click', closeMenu));

    const closeModal = () => {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      returnFocus?.focus();
    };
    document.querySelectorAll('[data-tour-open]').forEach((button) => {
      listen(button, 'click', () => {
        if (!modal || !modalTitle || !modalCopy) return;
        returnFocus = button;
        modalTitle.textContent = button.dataset.tourTitle || 'Explore Addis';
        modalCopy.textContent = button.dataset.tourCopy || '';
        modal.hidden = false;
        document.body.classList.add('modal-open');
        modalClose?.focus();
      });
    });
    listen(modalClose, 'click', closeModal);
    listen(modal, 'click', (event) => {
      if (event.target === modal) closeModal();
    });

    const filters = Array.from(document.querySelectorAll('[data-filter]'));
    const experienceCards = Array.from(document.querySelectorAll('[data-experience-card]'));
    filters.forEach((filter) => {
      listen(filter, 'click', () => {
        const category = filter.dataset.filter;
        filters.forEach((button) => button.setAttribute('aria-pressed', String(button === filter)));
        experienceCards.forEach((card) => {
          card.hidden = category !== 'all' && card.dataset.category !== category;
        });
      });
    });

    const planOptions = Array.from(document.querySelectorAll('[data-plan-option]'));
    const planStatus = document.querySelector('[data-plan-status]');
    const copyPlanButton = document.querySelector('[data-copy-plan]');
    const getPlanItems = () => planOptions.filter((option) => option.checked).map((option) => option.value);
    const updatePlanStatus = () => {
      const choices = getPlanItems();
      if (planStatus) {
        planStatus.textContent = choices.length
          ? `Your day is starting to take shape: ${choices.join(', ')}.`
          : 'Choose a few interests to start shaping your day.';
      }
    };
    planOptions.forEach((option) => listen(option, 'change', updatePlanStatus));
    listen(copyPlanButton, 'click', async () => {
      const choices = getPlanItems();
      if (!planStatus) return;
      if (!choices.length) {
        planStatus.textContent = 'Choose at least one interest before copying your trip notes.';
        return;
      }
      const message = `Hello! I am planning a visit to Addis Ababa and would love to explore: ${choices.join(', ')}. Can we plan a private tour?`;
      try {
        await navigator.clipboard.writeText(message);
        planStatus.textContent = 'Trip notes copied. Paste them into your Instagram message to @the_addisguide.';
      } catch {
        planStatus.textContent = 'Clipboard access is unavailable here. Please note your choices and message @the_addisguide on Instagram.';
      }
    });

    const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
    listen(window, 'scroll', onScroll, { passive: true });
    onScroll();

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -24px' });
      document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
      observers.push(revealObserver);
    } else {
      document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
    }

    const onDocumentClick = (event) => {
      if (mobileMenu && !mobileMenu.hidden && !event.target.closest('.site-header')) closeMenu();
    };
    listen(document, 'click', onDocumentClick);
    listen(document, 'keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        closeModal();
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
      listeners.forEach(([node, type, handler, options]) => node.removeEventListener(type, handler, options));
      backgroundVideos.forEach(stopBackgroundVideo);
      if (scrollMotionFrame) window.cancelAnimationFrame(scrollMotionFrame);
      document.body.classList.remove('has-js', 'menu-open', 'modal-open');
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}
