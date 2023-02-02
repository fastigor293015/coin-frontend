import { el, mount, unmount } from 'redom';

import closeIcon from '../assets/images/close.svg';

export default function createAlert(alertText, alertType = 'error') {
  const alert = el(`.alert.${alertType}-alert.hidden`, [
    el('button.btn.alert__close-btn', { innerHTML: closeIcon, onclick() {
      hideAlert(alert, true);
    } }),
    el('span.alert__text', `${alertText}`),
  ])

  const existingAlert = document.querySelector('.alert');

  if (existingAlert) {
    hideAlert(existingAlert);
  }

  showAlert(alert);
}

function showAlert(alert, hidingClass = 'hidden') {
  mount(window.document.body, alert);
  setTimeout(() => {
    alert.classList.remove('hidden');
  }, 200);
  setTimeout(() => {
    hideAlert(alert, true);
  }, 3000);
}

function hideAlert(alert, mustAnimate = false, hidingClass = 'hidden') {
  if (mustAnimate) {
    alert.classList.add('hidden');
    setTimeout(() => {
      unmount(window.document.body, alert);
    }, 200);
  } else {
    unmount(window.document.body, alert);
  }

}
