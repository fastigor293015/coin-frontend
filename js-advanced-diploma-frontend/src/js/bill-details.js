import { el, mount } from 'redom';
import JustValidate from 'just-validate';
import { Chart, registerables } from 'chart.js';

import { router } from './router';
import createAlert from './show-alert';
import initInputAutocomplete from './input-autocomplete';
import { getBillDetails, transferFunds } from './api';
import { chartAreaBorder, getBalanceStats } from './chartjs-plugins';

import arrowIcon from '../assets/images/arrow.svg';
import mailIcon from '../assets/images/mail.svg';
import errorIcon from '../assets/images/error.svg';

export async function createBillDetails(id) {
  const res = await getBillDetails(id);
  console.log(res);

  if (res.error === 'No such account') {
    setTimeout(() => {
      createAlert('Такого счёта не существует');
    }, 50);
    return;
  }

  const transactionsArr = res.payload.transactions;

  let transferForm,
      autocompleteInput,
      dynamicsCanvas;

  const billDetails = el('.container.details__container',
    el('.details__top', [
      el('.details__row.first', [
        el('h1.title.details__title', 'Просмотр счёта'),
        el('a.btn.btn-primary.btn-with-icon.details__btn_return', { href: '/bills', innerHTML: arrowIcon, onclick(e) {
          e.preventDefault();
          router.navigate(e.currentTarget.getAttribute('href'));
        } }, 'Вернуться назад',),
      ]),
      el('.details__row.second', [
        el('.details__number', `№ ${res.payload.account}`),
        el('.details__balance', [
          el('span.details-balance__title', 'Баланс'),
          `${res.payload.balance.toLocaleString('ru-RU')} ₽`
        ])
      ]),
    ]),
    el('.details__bottom',
      transferForm = el('form.card-gray.details__form', [
        el('h2.card__title.details-form__title', 'Новый перевод'),
        el('.form__row.details-form__row', [
          el('label.form__label.details-form__label', 'Номер счёта получателя', { for: 'number' }),
          el('.form__input-wrapper.details-form__input-wrapper.autocomplete-input-container',
          autocompleteInput = el('input.form__input.details-form__input', { type: 'text', id: 'number', name: 'number', placeholder: '12455242373623463', 'autocomplete': 'off' })
          )
        ]),
        el('.form__row.details-form__row', [
          el('label.form__label.details-form__label', 'Сумма перевода', { for: 'amount' }),
          el('.form__input-wrapper.details-form__input-wrapper',
            el('input.form__input.details-form__input', { type: 'text', id: 'amount', name: 'amount', placeholder: '1500' })
          )
        ]),
        el('button.btn.btn-primary.btn-with-icon.details-form__btn', { type: 'submit', innerHTML: mailIcon }, 'Отправить')
      ]),
      el('a.card-white.details__dynamics', { href: `/bill-story/${res.payload.account}`, onclick(e) {
        e.preventDefault();
        router.navigate(e.currentTarget.getAttribute('href'));
      }}, [
        el('h2.card__title.details-dynamics__title', 'Динамика баланса'),
        dynamicsCanvas = el('canvas.details-dynamics__canvas')
      ]
      ),
      el('a.card-gray.details__transfers', { href: `/bill-story/${res.payload.account}`, onclick(e) {
        e.preventDefault();
        router.navigate(e.currentTarget.getAttribute('href'));
      }}, [
        el('h2.card__title.details-transfers__title', 'История переводов'),
        el('.details-transfers__table-wrapper',
          el('table.details-transfers__table', [
            el('thead',
              el('tr', [
                el('th', 'Счёт отправителя', { 'data-column': 'from' }),
                el('th', 'Счёт получателя', { 'data-column': 'to' }),
                el('th', 'Сумма', { 'data-column': 'amount' }),
                el('th', 'Дата', { 'data-column': 'date' }),
              ])
            ),
            el('tbody',
            // берём последние 10 записей или меньше
              transactionsArr.slice(Math.max(-transactionsArr.length, -10))
                .sort((a, b) => {
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                })
                .map(transaction => {
                  const isOutgoing = transaction.from === res.payload.account;

                  return el('tr', [
                    el('td', transaction.from),
                    el('td', transaction.to),
                    el(`td.${isOutgoing ? 'minus' : 'plus'}`, `${isOutgoing ? '-' : '+'} ${transaction.amount.toLocaleString('ru-RU')} ₽`),
                    el('td', new Date(transaction.date).toLocaleDateString('ru-RU')),
                  ])
                })
            )
          ])
        )
      ])
    )
  );

  initInputAutocomplete(autocompleteInput, 'bills');

  const transferFormValidation = new JustValidate(transferForm, {
    errorLabelStyle: '',
  });

  transferFormValidation
    .addField('#number', [
      {
        rule: 'required',
        errorMessage: `${errorIcon}Заполните это поле`
      },
      {
        rule: 'number',
        errorMessage: `${errorIcon}Введите число`
      },
    ])
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
      const to = transferForm.querySelector('.form__input[name="number"]').value,
            amount = transferForm.querySelector('.form__input[name="amount"]').value;

      if (amount <= 0) {
        createAlert('Введите положительную сумму');
      }

      const transferRes = await transferFunds(res.payload.account, to, amount);
      console.log(transferRes);
      if (transferRes.payload) {
        let billsnumbersArr = JSON.parse(localStorage.getItem('bills'));
        if (billsnumbersArr === null) {
          billsnumbersArr = [];
        }
        if (billsnumbersArr.indexOf(to) === -1) {
          billsnumbersArr.push(to);
        }
        localStorage.setItem('bills', JSON.stringify(billsnumbersArr));
        console.log(billsnumbersArr);
        createAlert('Перевод успешно выполнен', 'success');
        router.navigate(`/bill/${res.payload.account}`);
      } else if (transferRes.error === 'Invalid account from') {
        createAlert('Счёт списания вам не принадлежит');
      } else if (transferRes.error === 'Invalid account to') {
        createAlert('Такого счёта не существует');
      } else if (transferRes.error === 'Invalid amount') {
        createAlert('Введите положительную сумму');
      } else if (transferRes.error === 'Overdraft prevented') {
        createAlert('Недостаточно средств на балансе');
      }
    })

  const {lastMonths, lastMonthsBalance} = getBalanceStats(res, 6);

  const maxValue = Math.max.apply(null, lastMonthsBalance);

  console.log(lastMonths);
  console.log(lastMonthsBalance);

  Chart.register(...registerables);
  Chart.defaults.font.family = "WorkSans";
  Chart.defaults.font.size = 20;
  Chart.defaults.font.weight = 500;
  Chart.defaults.color = "#000";

  const dynamicsChart = new Chart(dynamicsCanvas, {
    type: 'bar',
    data: {
      labels: lastMonths,
      datasets: [{
        yAxisID: 'yAxis',
        xAxisID: 'xAxis',
        label: 'Баланс',
        data: lastMonthsBalance,
        backgroundColor: '#116ACC',
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        chartAreaBorder: {
          borderColor: '#000000',
          borderWidth: 1,
        },
        legend: {
          display: false,
        },
        tooltip: {}
      },
      scales: {
        yAxis: {
          position: 'right',
          max: maxValue,
          grid: {
            display: false,
          },
          ticks: {
            stepSize: maxValue,
            beginAtZero: true
          }
        },
        xAxis: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              weight: 700,
            },
            beginAtZero: true
          }
        }
      }
    },
    plugins: [chartAreaBorder]
  });

  return billDetails;
}

export function createBillDetailsSkeleton() {
  let chartContainer,
      tbody;

  const skeleton = el('.container.details__container.skeleton',
    el('.details__top', [
      el('.details__row.first', [
        el('.details__title.skeleton-bg-color'),
        el('.btn-with-icon.details__btn_return.skeleton-bg-color.primary'),
      ]),
      el('.details__row.second', [
        el('.details__number.skeleton-bg-color'),
        el('.details__balance', [
          el('.details-balance__title.skeleton-bg-color'),
          el('.details-balance__value.skeleton-bg-color'),
        ])
      ]),
    ]),
    el('.details__bottom',
      el('.card-white.details__form', [
        el('.card__title.details-form__title.skeleton-bg-color'),
        el('.form__row.details-form__row', [
          el('.form__label.details-form__label.skeleton-bg-color'),
          el('.form__input-wrapper.details-form__input-wrapper',
            el('.form__input.details-form__input.skeleton-bg-color')
          )
        ]),
        el('.form__row.details-form__row', [
          el('.form__label.details-form__label.skeleton-bg-color'),
          el('.form__input-wrapper.details-form__input-wrapper',
            el('.form__input.details-form__input.skeleton-bg-color')
          )
        ]),
        el('.btn-with-icon.details-form__btn.skeleton-bg-color.primary')
      ]),
      el('.card-white.details__dynamics', [
        el('.card__title.details-dynamics__title.skeleton-bg-color'),
        chartContainer = el('.chart-container.details-dynamics__chart-container.skeleton-bg-color', [
          el('.chart__values-container', [
            el('.chart__value.skeleton-bg-color'),
            el('.chart__value.skeleton-bg-color'),
          ]),
        ])
      ]
      ),
      el('.card-white.details__transfers', [
        el('.card__title.details-transfers__title.skeleton-bg-color'),
        el('.details-transfers__table-wrapper',
          el('table.details-transfers__table', [
            el('thead',
              el('tr', [
                el('th', { 'data-column': 'from' },
                  el('.skeleton-bg-color')
                ),
                el('th', { 'data-column': 'to' },
                  el('.skeleton-bg-color')
                ),
                el('th', { 'data-column': 'amount' },
                  el('.skeleton-bg-color')
                ),
                el('th', { 'data-column': 'date' },
                  el('.skeleton-bg-color')
                ),
              ])
            ),
            tbody = el('tbody')
          ])
        )
      ])
    )
  );

  let wasFullHeight = false;

  for (let i = 0; i < 6; i++) {
    let randomHeight = Math.ceil(Math.random() * 100);
    if (i === 5 && randomHeight !== 100 && !wasFullHeight) {
      randomHeight = 100;
    }
    if (randomHeight === 100) {
      wasFullHeight = !wasFullHeight;
    }
    const square = el('.chart__square', {style: `height: ${randomHeight}%` },
      el('.chart__label.skeleton-bg-color')
    );

    mount(chartContainer, square);
  }

  console.log(Math.random() * 100);

  for (let i = 0; i < 10; i++) {
    const trow = el('tr', [
      el('td', { 'data-column': 'from' },
        el('.skeleton-bg-color')
      ),
      el('td', { 'data-column': 'to' },
        el('.skeleton-bg-color')
      ),
      el('td.plus', { 'data-column': 'amount' },
        el('.skeleton-bg-color')
      ),
      el('td', { 'data-column': 'date' },
        el('.skeleton-bg-color')
      ),
    ])

    mount(tbody, trow);
  }

  return skeleton;
}
