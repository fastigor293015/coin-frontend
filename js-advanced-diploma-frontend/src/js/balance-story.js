import { mount, unmount, el, setChildren } from 'redom';
import JustValidate from 'just-validate';
import { Chart, registerables } from 'chart.js';

import { router } from './router';
import createAlert from './show-alert';
import { getBillDetails } from './api';
import { chartAreaBorder, getBalanceStats } from './chartjs-plugins';

import arrowIcon from '../assets/images/arrow.svg';
import paginationArrowIcon from '../assets/images/pagination-arrow.svg';
import errorIcon from '../assets/images/error.svg';

export async function createBalanceStory(id) {
  const res = await getBillDetails(id);
  console.log(res);

  if (res.error === 'No such account') {
    setTimeout(() => {
      createAlert('Такого счёта не существует');
    }, 50);
    return;
  }

  const transactionsArr = res.payload.transactions;

  let dynamicsCanvas,
      ratioCanvas,
      transfersBlock,
      tablePagination,
      tablePaginationList,
      paginationMobile,
      paginationMobileInput,
      tbody,
      curIndex = 1;

  const balanceStory = el('.container.details__container.story__container',
    el('.details__top.story__top', [
      el('.details__row.story__row.first', [
        el('h1.title.details__title.story__title', 'История баланса'),
        el('a.btn.btn-primary.btn-with-icon.details__btn_return.story__btn_return', { href: `/bill/${res.payload.account}`, innerHTML: arrowIcon, onclick(e) {
          e.preventDefault();
          router.navigate(e.currentTarget.getAttribute('href'));
        } }, 'Вернуться назад'),
      ]),
      el('.details__row.story__row.second', [
        el('.details__number.story__number', `№ ${res.payload.account}`),
        el('.details__balance.story__balance', [
          el('span.details-balance__title.story-balance__title', 'Баланс'),
          `${res.payload.balance.toLocaleString('ru-RU')} ₽`
        ])
      ]),
    ]),
    el('.details__bottom.story__bottom',
      el('.card-white.details__dynamics.story__dynamics', [
        el('h2.card__title.details-dynamics__title.story-dynamics__title', 'Динамика баланса'),
        dynamicsCanvas = el('canvas.story-dynamics__canvas')
      ]),
      el('.card-white.story__ratio', [
        el('h2.card__title.story-ratio__title', 'Соотношение входящих и исходящих транзакций'),
        ratioCanvas = el('canvas.story-ratio__canvas')
      ]),
      transfersBlock = el('.card-gray.details__transfers.story__transfers', [
        el('h2.card__title.details-transfers__title.story-transfers__title', 'История переводов'),
        tablePagination = el('.story-transfers__pagination', { onkeydown(e) {
          if (e.key === 'ArrowLeft') {
            curIndex--;
            updateTablePagination();
          } else if (e.key === 'ArrowRight') {
            curIndex++;
            updateTablePagination();
          }
        } }, [
          el('button.btn.story-transfers-pagination__btn.story-transfers-pagination__btn_prev', { innerHTML: paginationArrowIcon, onclick() {
            curIndex--;
            updateTablePagination();
          } }),
          tablePaginationList = el('ul.story-transfers-pagination__list'),
          paginationMobile = el('form.story-transfers-pagination__mobile',
            paginationMobileInput = el('input.story-transfers-pagination-mobile__input', { type: 'text', id: 'page' })
          ),
          el('button.btn.story-transfers-pagination__btn.story-transfers-pagination__btn_next', { innerHTML: paginationArrowIcon, onclick() {
            curIndex++;
            updateTablePagination();
          } })
        ]),
        el('.details-transfers__table-wrapper',
          el('table.details-transfers__table.story-transfers__table', [
            el('thead',
              el('tr', [
                el('th', 'Счёт отправителя', { 'data-column': 'from' }),
                el('th', 'Счёт получателя', { 'data-column': 'to' }),
                el('th', 'Сумма', { 'data-column': 'amount' }),
                el('th', 'Дата', { 'data-column': 'date' }),
              ])
            ),
            tbody = el('tbody',
            // берём последние 25 записей или меньше
              transactionsArr.slice(Math.max(-transactionsArr.length, -25))
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


  const paginationItemsRequired = Math.ceil(transactionsArr.length / 25);

  paginationMobile.dataset.count = paginationItemsRequired;

  if (paginationItemsRequired <= 1) {
    unmount(transfersBlock, tablePagination);
  } else {
    initTablePagination();

    const paginationForm = new JustValidate(paginationMobile, {
      errorLabelStyle: '',
    });

    paginationForm
      .addField('#page', [
        {
          rule: 'number',
          errorMessage: `${errorIcon}Введите число`
        },
        {
          rule: 'minNumber',
          value: 1,
          errorMessage: `${errorIcon}Введите число >= 1`
        },
        {
          rule: 'maxNumber',
          value: paginationItemsRequired,
          errorMessage: `${errorIcon}Введите число <= ${paginationItemsRequired}`
        },
      ])
      .onSuccess(e => {
        curIndex = parseInt(paginationMobileInput.value);
        initTablePagination();
      })
  }

  const { lastMonths, lastMonthsBalance, positiveTransactions, negativeTransactions, maxTransactionValue } = getBalanceStats(res, 12);

  const maxValue = Math.max.apply(null, lastMonthsBalance);

  console.log(lastMonths);
  console.log(lastMonthsBalance);
  console.log(positiveTransactions);
  console.log(negativeTransactions);
  console.log(maxTransactionValue);

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
          suggestedMax: 2000,
          grid: {
            display: false,
          },
          ticks: {
            stepSize: maxValue,
            beginAtZero: true,
            callback: function(value, index, ticks) {
              return `${value.toLocaleString('ru-RU')} ₽`;
            },
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

  const ratioChart = new Chart(ratioCanvas, {
    type: 'bar',
    data: {
      labels: lastMonths,
      datasets: [
        {
          yAxisID: 'yAxis',
          xAxisID: 'xAxis',
          label: 'Расходные транзакции',
          data: negativeTransactions?.map((trans, index) => {
            return trans / (trans + positiveTransactions[index]) * lastMonthsBalance[index];
          }),
          backgroundColor: '#FD4E5D',
        },
        {
          yAxisID: 'yAxis',
          xAxisID: 'xAxis',
          label: 'Доходные транзакции',
          data: positiveTransactions?.map((trans, index) => {
            return trans / (trans + negativeTransactions[index]) * lastMonthsBalance[index];
          }),
          backgroundColor: '#76CA66',
        },
      ]
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
        tooltip: {
          mode: 'index',
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';

              if (label) {
                  label += ': ';
              }
              if (context.parsed.y !== null) {
                  label += `${Math.round(context.parsed.y / lastMonthsBalance[context.dataIndex] * 10000) / 100}%`
              }
              return label;
            }
          },
          itemSort: function (a, b) {
            return b.datasetIndex - a.datasetIndex;
          }
        }
      },
      scales: {
        yAxis: {
          stacked: true,
          position: 'right',
          max: maxValue,
          labels: [
            3000000, 4, 5, 10
          ],
          grid: {
            display: false,
          },
          ticks: {
            stepSize: maxValue / 2,
            beginAtZero: true,
            callback: function(value, index, ticks) {
              if (index === 1 && maxTransactionValue) {
                return `${maxTransactionValue.toLocaleString('ru-RU')} ₽`;
              }
              return `${value.toLocaleString('ru-RU')} ₽`;
            },
          }
        },
        xAxis: {
          stacked: true,
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

  // setTimeout(() => {
    // ratioChart.scales.yAxis.ticks.push(3000000);
    // ratioChart.update();
  // }, 2000)

  return balanceStory;

  function initTablePagination() {
    const firstPaginationItem = el(`li.story-transfers-pagination__item${1 === curIndex ? '.active' : ''}`, { 'data-index': 1 },
      el('button.btn.story-transfers-pagination__btn', '1', { onclick() {
        curIndex = 1;
        updateTablePagination();
      } })
    )

    const startActiveItem = curIndex;

    const activePaginationItem = el(`li.story-transfers-pagination__item${startActiveItem === curIndex ? '.active' : ''}`, { 'data-index': startActiveItem },
      el('button.btn.story-transfers-pagination__btn', `${startActiveItem}`, { onclick() {
        curIndex = startActiveItem;
        updateTablePagination();
      } })
    )

    const lastPaginationItem = el(`li.story-transfers-pagination__item${paginationItemsRequired === curIndex ? '.active' : ''}`, { 'data-index': paginationItemsRequired },
      el('button.btn.story-transfers-pagination__btn', `${paginationItemsRequired}`, { onclick() {
        curIndex = paginationItemsRequired;
        updateTablePagination();
      } })
    )

    if (curIndex === 1 || curIndex === paginationItemsRequired) {
      setChildren(tablePaginationList, [firstPaginationItem, lastPaginationItem]);
    } else {
      setChildren(tablePaginationList, [firstPaginationItem, activePaginationItem, lastPaginationItem]);
    }

    updateTablePagination();
  }

  function updateTablePagination() {
    if (curIndex < 1) {
      curIndex = 1;
      return;
    } else if (curIndex > paginationItemsRequired) {
      curIndex = paginationItemsRequired;
      return;
    }

    paginationMobileInput.value = curIndex;

    const firstItem = tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="1"]`),
          lastItem = tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${paginationItemsRequired}"]`);

    let firstHiddenItems = 0,
        lastHiddenItems = 0;

    for (let i = 2; i < paginationItemsRequired; i++) {
      const item = tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${i}"]`);

      if (i + 3 <= curIndex) {
        firstHiddenItems++;
        if (item) {
          item.classList.add('hidden');
          setTimeout(() => {
            item.remove();
          }, 200);
        }
      } else if (i - 3 >= curIndex) {
        lastHiddenItems++;
        if (item) {
          item.classList.add('hidden');
          setTimeout(() => {
            item.remove();
          }, 200);
        }
      } else if (i + 3 > curIndex && i - 3 < curIndex && !item) {
        const newPaginationItem = el(`li.story-transfers-pagination__item${i === curIndex ? '.active' : ''}.hidden`, { 'data-index': i },
          el('button.btn.story-transfers-pagination__btn', `${i}`, { onclick() {
            curIndex = i;
            updateTablePagination();
          } })
        )
        if (i < curIndex) {
          const leftNearItem = tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${curIndex - 1}"]`);
          if (i + 2 === curIndex) {
            if (leftNearItem) {
              mount(tablePaginationList, newPaginationItem, leftNearItem);
            } else {
              mount(tablePaginationList, newPaginationItem, tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${curIndex}"]`));
            }
          } else if (i + 1 === curIndex) {
            mount(tablePaginationList, newPaginationItem, tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${curIndex}"]`));
          }
        } else if (i > curIndex) {
          if (i - 1 === curIndex && tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${curIndex + 2}"]`)) {
            mount(tablePaginationList, newPaginationItem, tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${curIndex + 2}"]`));
          } else {
            mount(tablePaginationList, newPaginationItem, tablePaginationList.lastChild);
          }
        }
        setTimeout(() => {
          newPaginationItem.classList.remove('hidden');
        }, 50);

      }
    }

    if (firstHiddenItems > 0) {
      firstItem.classList.add('first-gap');
    } else {
      firstItem.classList.remove('first-gap');
    }

    if (lastHiddenItems > 0) {
      lastItem.classList.add('last-gap');
    } else {
      lastItem.classList.remove('last-gap');
    }

    const prevActiveItem = tablePaginationList.querySelector('.story-transfers-pagination__item.active'),
          nextActiveItem = tablePaginationList.querySelector(`.story-transfers-pagination__item[data-index="${curIndex}"]`);

    prevActiveItem?.classList.remove('active');
    nextActiveItem.classList.add('active');

    if (document.activeElement.closest('.story-transfers-pagination__item[data-index]')) {
      nextActiveItem.childNodes[0].focus();
    }

    setChildren(tbody,
      transactionsArr.slice(Math.max(-transactionsArr.length, -25 * curIndex))
        .slice(0, 25)
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
  }
}

export function createBalanceStorySkeleton() {
  let dynamicsChartContainer,
      ratioChartContainer,
      tbody;

  const skeleton = el('.container.details__container.story__container.skeleton',
    el('.details__top.story__top', [
      el('.details__row.story__row.first', [
        el('.details__title.story__title.skeleton-bg-color'),
        el('.btn-with-icon.details__btn_return.story__btn_return.skeleton-bg-color.primary'),
      ]),
      el('.details__row.story__row.second', [
        el('.details__number.story__number.skeleton-bg-color'),
        el('.details__balance.story__balance', [
          el('.details-balance__title.story-balance__title.skeleton-bg-color'),
          el('.details-balance__value.story-balance__value.skeleton-bg-color'),
        ])
      ]),
    ]),
    el('.details__bottom.story__bottom',
      el('.card-white.details__dynamics.story__dynamics', [
        el('.card__title.details-dynamics__title.story-dynamics__title.skeleton-bg-color'),
        dynamicsChartContainer = el('.chart-container.story-dynamics__chart-container.skeleton-bg-color', [
          el('.chart__values-container', [
            el('.chart__value.skeleton-bg-color'),
            el('.chart__value.skeleton-bg-color'),
          ]),
        ])
      ]),
      el('.card-white.story__ratio', [
        el('.card__title.story-ratio__title.skeleton-bg-color'),
        ratioChartContainer = el('.chart-container.story-ratio__chart-container.skeleton-bg-color', [
          el('.chart__values-container', [
            el('.chart__value.skeleton-bg-color'),
            el('.chart__value.skeleton-bg-color'),
          ]),
        ])
      ]),
      el('.card-white.details__transfers.story__transfers', [
        el('.card__title.details-transfers__title.story-transfers__title.skeleton-bg-color'),
        el('.details-transfers__table-wrapper',
          el('table.details-transfers__table.story-transfers__table', [
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

  for (let i = 0; i < 12; i++) {
    let squareHeight = Math.ceil(Math.random() * 100);
    if (i === 11 && squareHeight !== 100 && !wasFullHeight) {
      squareHeight = 100;
    }
    if (squareHeight === 100) {
      wasFullHeight = !wasFullHeight;
    }
    const dynamicsSquare = el('.chart__square', {style: `height: ${squareHeight}%` },
      el('.chart__label.skeleton-bg-color')
    );

    let negativeHeight = Math.ceil(Math.random() * squareHeight),
        positiveHeight = 100 - negativeHeight;

    const ratioSquare = el('.chart__square', {style: `height: ${squareHeight}%` }, [
      el('.chart__label.skeleton-bg-color'),
      el('.positive', {style: `height: ${positiveHeight}%` }),
      el('.negative', {style: `height: ${negativeHeight}%` })
    ]);
    mount(dynamicsChartContainer, dynamicsSquare);
    mount(ratioChartContainer, ratioSquare);
  }

  for (let i = 0; i < 25; i++) {
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
