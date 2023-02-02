import { el, mount, setChildren } from 'redom';

let autocompleteTimer;

export default function initInputAutocomplete(input, key) {
  const autocompleteContainer = input.closest('.autocomplete-input-container'),
        autocompleteList = el('ul.autocomplete-list');

  mount(autocompleteContainer, autocompleteList);

  createAutocompleteList(input, autocompleteList, key);

  input.addEventListener('focus', () => {
    autocompleteContainer.classList.add('focused');
    createAutocompleteList(input, autocompleteList, key);
    clearTimeout(autocompleteTimer);
  })

  input.addEventListener('blur', () => {
    autocompleteTimer = setTimeout(() => {
      autocompleteContainer.classList.remove('focused');
    }, 100)
  })

  input.addEventListener('input', () => {
    createAutocompleteList(input, autocompleteList, key);
  })

  input.addEventListener('keydown', e => {
    if (autocompleteList.childNodes.length !== 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        autocompleteList.querySelector(`.autocomplete-item__btn[data-index="0"]`).focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        autocompleteList.querySelector(`.autocomplete-item__btn[data-index="${autocompleteList.childNodes.length - 1}"]`).focus();
      }
      clearTimeout(autocompleteTimer);
    }
  })
}

function createAutocompleteList(input, autocompleteList, key) {
  const autocompleteContainer = input.closest('.autocomplete-input-container'),
        autocompleteArr = JSON.parse(localStorage.getItem(`${key}`))?.filter(item => {
          return item.startsWith(input.value) && item.localeCompare(input.value) !== 0;
        });

  if (!autocompleteArr) {
    return;
  }

  if (autocompleteArr.length === 0) {
    autocompleteContainer.classList.remove('contains');
  } else {
    autocompleteContainer.classList.add('contains');
  }

  const autocompleteItems = autocompleteArr.map((number, index) => {
    return el('li.autocomplete-item',
      el('button.btn.autocomplete-item__btn', number, { type: 'button', tabIndex: -1, 'data-index': index, onkeydown(e) {
        const itemIndex = parseInt(e.currentTarget.dataset.index);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (itemIndex + 1 > autocompleteList.childNodes.length - 1) {
            input.focus();
          } else {
            autocompleteList.querySelector(`.autocomplete-item__btn[data-index="${itemIndex + 1}"]`).focus();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (itemIndex - 1 < 0) {
            input.focus();
          } else {
            autocompleteList.querySelector(`.autocomplete-item__btn[data-index="${itemIndex - 1}"]`).focus();
          }
        } else if (e.key === 'Tab') {
          autocompleteContainer.classList.remove('focused');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          input.value = e.currentTarget.textContent;
          input.focus();
          createAutocompleteList(input, autocompleteList, key);
          clearTimeout(autocompleteTimer);
        }
      }, onmousedown(e) {
        input.value = e.currentTarget.textContent;
        input.focus();
        createAutocompleteList(input, autocompleteList, key);
        clearTimeout(autocompleteTimer);
      }, onfocus() {
        clearTimeout(autocompleteTimer);
      }, onblur() {
        autocompleteTimer = setTimeout(() => {
          autocompleteContainer.classList.remove('focused');
        }, 100)
      } })
    )
  })

  setChildren(autocompleteList, autocompleteItems);
}
