import { el, mount, setChildren } from 'redom';
import Choices from 'choices.js';
import JustValidate from 'just-validate';

import { getCurrenciesChanges, getUserCurrencies, getAllCurrencies, buyCurrency } from './api';
import createAlert from './show-alert';

import errorIcon from '../assets/images/error.svg';
import arrowExpandIcon from '../assets/images/pagination-arrow.svg';

export async function createCurrenciesPage() {
  const allCurrenciesRes = await getAllCurrencies();
  console.log(allCurrenciesRes);

  let userCurrenciesRes = JSON.parse(sessionStorage.getItem('/currencies'));

  if (!userCurrenciesRes) {
    userCurrenciesRes = await getUserCurrencies();
    sessionStorage.setItem('/currencies', JSON.stringify(userCurrenciesRes));
  } else {
    getUserCurrencies().then(backCurrenciesRes => {
      if (JSON.stringify(backCurrenciesRes) === JSON.stringify(userCurrenciesRes)) {
        return;
      }

      userCurrenciesList.innerHTML = '';

      for (const key in backCurrenciesRes.payload) {
        const prop = backCurrenciesRes.payload[key];

        if (prop.amount === 0) {
          continue;
        }

        const currencyItem = el('li.currencies__item.currencies-balance__item', { 'data-code': prop.code }, [
          el('span.currencies-item__title.currencies-balance-item__title', prop.code),
          el('span.currencies-item__value.currencies-balance-item__value', prop.amount.toLocaleString('ru-RU'))
        ])

        mount(userCurrenciesList, currencyItem);
      }
      sessionStorage.setItem('/currencies', JSON.stringify(backCurrenciesRes));
    })
  }
  console.log(userCurrenciesRes);

  const currenciesSocket = getCurrenciesChanges();

  currenciesSocket.onmessage = (e) => {
    const socketData = JSON.parse(e.data);

    const changesItem = el(`li.currencies__item.currencies-monitoring__item${socketData.change === 1 ? '.increased' : '.decreased'}.invisible.flattened`, [
      el('span.currencies-item__title.currencies-monitoring-item__title', `${socketData.from}/${socketData.to}`),
      el('span.currencies-item__value.currencies-monitoring-item__value', socketData.rate)
    ])
    setTimeout(() => {
      changesItem.classList.remove('flattened');
    }, 200)
    setTimeout(() => {
      changesItem.classList.remove('invisible');
    }, 400)
    mount(changesContainer, changesItem, changesContainer.firstChild);

    // Кол-во элементов, которые не влезают в контейнер
    const excessItemsCount = Math.ceil((changesContainer.scrollHeight - changesContainer.clientHeight) / changesItem.scrollHeight);
    if (excessItemsCount > 0) {
      for (let i = 0; i < excessItemsCount; i++) {
        changesContainer.childNodes[changesContainer.childNodes.length - 1].classList.add('invisible');
        setTimeout(() => {
          changesContainer.childNodes[changesContainer.childNodes.length - 1].classList.add('flattened');
        }, 200)
        setTimeout(() => {
          changesContainer.childNodes[changesContainer.childNodes.length - 1].remove();
        }, 400)
      }
    }
  }

  let userCurrenciesList,
      exchangeForm,
      selectFrom,
      selectTo,
      changesContainer;

  const currenciesPage = el('.container.currencies__container', [
    el('h1.title.currencies__title', 'Валютный обмен'),
    el('.currencies__bottom', [
      el('.card-white.currencies__balance', [
        el('h2.card__title.currencies-balance__title', 'Ваши валюты'),
        userCurrenciesList = el('ul.currencies-balance__list')
      ]),
      exchangeForm = el('form.card-white.currencies__form', [
        el('h2.card__title.currencies-form__title', 'Обмен валюты'),
        el('.form__row.currencies-form__row.currencies-form__row_from', [
          el('label.form__label.currencies-form__label', 'Из', { for: 'from' }),
          selectFrom = el('select#from'),
        ]),
        el('.form__row.currencies-form__row.currencies-form__row_to', [
          el('label.form__label.currencies-form__label', 'в', { for: 'to' }),
          selectTo = el('select#to'),
        ]),
        el('.form__row.currencies-form__row.currencies-form__row_amount', [
          el('label.form__label.currencies-form__label', 'Сумма', { for: 'amount' }),
          el('.form__input-wrapper.currencies-form__input-wrapper',
            el('input.form__input.currencies-form__input', { type: 'text', id: 'amount', name: 'amount', placeholder: '0.1235421' })
          )
        ]),
        el('button.btn.btn-primary.currencies-form__btn', 'Обменять', { type: 'submit' })
      ]),
      el('.card-gray.currencies__monitoring', [
        el('button.btn.btn-primary.currencies-monitoring__expand-btn', { innerHTML: arrowExpandIcon, onclick(e) {
          e.currentTarget.closest('.currencies__monitoring').classList.toggle('opened');
        } }),
        el('h2.card__title.currencies-monitoring__title', 'Изменение курсов в реальном времени'),
        changesContainer = el('ul.currencies-monitoring__list')
      ])
    ])
  ])

  for (const key in userCurrenciesRes.payload) {
    const prop = userCurrenciesRes.payload[key];

    if (prop.amount === 0) {
      continue;
    }

    const currencyItem = el('li.currencies__item.currencies-balance__item', { 'data-code': prop.code }, [
      el('span.currencies-item__title.currencies-balance-item__title', prop.code),
      el('span.currencies-item__value.currencies-balance-item__value', prop.amount.toLocaleString('ru-RU'))
    ])

    mount(userCurrenciesList, currencyItem);
  }

  const choicesFrom = new Choices(selectFrom, {
    choices: allCurrenciesRes.payload.map(item => {
      if (item === 'BTC') {
        return { label: item, value: item, selected: true }
      }
      return { label: item, value: item }
    }),
    allowHTML: true,
    searchEnabled: false,
    itemSelectText: '',
    shouldSort: false,
  });

  const choicesTo = new Choices(selectTo, {
    choices: allCurrenciesRes.payload.map(item => {
      if (item === 'ETH') {
        return { label: item, value: item, selected: true }
      }
      return { label: item, value: item }
    }),
    allowHTML: true,
    searchEnabled: false,
    itemSelectText: '',
    shouldSort: false,
  });

  const exchangeFormValidation = new JustValidate(exchangeForm, {
    errorLabelStyle: '',
  });

  exchangeFormValidation
    .addField('#amount', [
      {
        rule: 'required',
        errorMessage: `${errorIcon}Заполните это поле`
      },
      {
        rule: 'number',
        errorMessage: `${errorIcon}Введите число`
      },
    ])
    .onSuccess(async () => {
      const from = selectFrom.closest('.choices').querySelector('.choices__inner .choices__item.choices__item--selectable').dataset.value,
            to = selectTo.closest('.choices').querySelector('.choices__inner .choices__item.choices__item--selectable').dataset.value,
            amount = exchangeForm.querySelector('.form__input[name="amount"]').value;

      if (from.localeCompare(to) === 0) {
        createAlert('Счета списания и зачисления не должны совпадать');
        return;
      } else if (amount <= 0) {
        createAlert('Введите положительную сумму');
        return;
      }

      const exchangeRes = await buyCurrency(from, to, amount);
      console.log(exchangeRes);
      if (exchangeRes?.payload) {
        const fromCurrency = document.querySelector(`.currencies-balance__item[data-code="${from}"]`),
              toCurrency = document.querySelector(`.currencies-balance__item[data-code="${to}"]`);

        fromCurrency.classList.add('invisible');
        setTimeout(() => {
          setChildren(fromCurrency, [
            el('span.currencies-item__title.currencies-balance-item__title', exchangeRes.payload[from].code),
            el('span.currencies-item__value.currencies-balance-item__value', exchangeRes.payload[from].amount.toLocaleString('ru-RU'))
          ]);
          fromCurrency.classList.remove('invisible');
        }, 300)
        toCurrency.classList.add('invisible');
        setTimeout(() => {
          setChildren(toCurrency, [
            el('span.currencies-item__title.currencies-balance-item__title', exchangeRes.payload[to].code),
            el('span.currencies-item__value.currencies-balance-item__value', exchangeRes.payload[to].amount.toLocaleString('ru-RU'))
          ]);
          toCurrency.classList.remove('invisible');
        }, 300)

        console.log(exchangeRes.payload[from]);
        console.log(exchangeRes.payload[to]);
        createAlert('Обмен валюты успешно выполнен', 'success');
      } else if (exchangeRes.error === 'Unknown currency code') {
        createAlert('Передан неверный валютный код');
      } else if (exchangeRes.error === 'Invalid amount') {
        createAlert('Введите положительную сумму');
      } else if (exchangeRes.error === 'Not enough currency') {
        createAlert('На валютном счёте списания нет средств');
      } else if (exchangeRes.error === 'Overdraft prevented') {
        createAlert('Попытка перевести больше, чем доступно на счёте списания');
      }
    })

  return { currenciesPage, currenciesSocket };
}


export function createCurrenciesPageSkeleton() {
  let userCurrenciesList,
      changesContainer;

  const skeleton = el('.container.currencies__container.skeleton', [
    el('.title.currencies__title.skeleton-bg-color'),
    el('.currencies__bottom', [
      el('.card-white.currencies__balance', [
        el('.card__title.currencies-balance__title.skeleton-bg-color'),
        userCurrenciesList = el('.currencies-balance__list')
      ]),
      el('.card-white.currencies__form', [
        el('.card__title.currencies-form__title.skeleton-bg-color'),
        el('.form__row.currencies-form__row.currencies-form__row_from', [
          el('.form__label.currencies-form__label.skeleton-bg-color'),
          el('.currencies-form__select.skeleton-bg-color'),
        ]),
        el('.form__row.currencies-form__row.currencies-form__row_to', [
          el('.form__label.currencies-form__label.skeleton-bg-color'),
          el('.currencies-form__select.skeleton-bg-color'),
        ]),
        el('.form__row.currencies-form__row.currencies-form__row_amount', [
          el('.form__label.currencies-form__label.skeleton-bg-color'),
          el('.form__input-wrapper.currencies-form__input-wrapper',
            el('.form__input.currencies-form__input.skeleton-bg-color')
          )
        ]),
        el('.currencies-form__btn.skeleton-bg-color.primary')
      ]),
      el('.card-white.currencies__monitoring', [
        el('.currencies-monitoring__expand-btn.skeleton-bg-color.primary'),
        el('.card__title.currencies-monitoring__title.skeleton-bg-color'),
        changesContainer = el('.currencies-monitoring__list')
      ])
    ])
  ])

  for (let i = 0; i < 6; i++) {
    const currencyItem = el('.currencies__item.currencies-balance__item', [
      el('.currencies-item__title.currencies-balance-item__title.skeleton-bg-color'),
      el('.currencies-item__value.currencies-balance-item__value.skeleton-bg-color')
    ])

    mount(userCurrenciesList, currencyItem);
  }

  for (let i = 0; i < 12; i++) {
    const randomNumber = Math.round(Math.random());
    const changesItem = el(`.currencies__item.currencies-monitoring__item${randomNumber === 1 ? '.increased' : '.decreased'}`, [
      el('.currencies-item__title.currencies-monitoring-item__title.skeleton-bg-color'),
      el('.currencies-item__value.currencies-monitoring-item__value.skeleton-bg-color')
    ])

    mount(changesContainer, changesItem);
  }

  return skeleton;
}
