import { el, mount, setChildren } from 'redom';
import Choices from 'choices.js';
import mixitup from 'mixitup';

import { router } from './router';
import { getBillsList, createBill } from './api';
import { monthsNames } from './vars';

import plusIcon from '../assets/images/plus.svg';

export async function createBillsList() {
  let res = JSON.parse(sessionStorage.getItem('/accounts'));

  if (!res) {
    res = await getBillsList();
    sessionStorage.setItem('/accounts', JSON.stringify(res));
  } else {
    getBillsList().then(backRes => {
      if (JSON.stringify(backRes) === JSON.stringify(res)) {
        return;
      }
      sessionStorage.setItem('/accounts', JSON.stringify(backRes));
      console.log(backRes);
      billsMixer.remove('.bills__item')
        .then(() => {
          backRes.payload.map((bill, index) => {
            setTimeout(() => {
              const newBillItem = createBillItem(bill);
              billsMixer.append(newBillItem);
            }, 300 * index)
          })
        })
    })
  }

  console.log(res);

  let mixitupContainer,
      sortSelect;

  const billsList = el('.container.bills__container', [
    el('.bills__top', [
      el('.bills__left', [
        el('h1.title.bills__title', 'Ваши счета'),
        sortSelect = el('select.bills__select', { 'aria-label': 'Сортировка' }),
      ]),
      el('button.btn.btn-primary.btn-with-icon.bills__btn_add',
        { innerHTML: plusIcon, async onclick() {
          const newBillRes = await createBill(),
                newBillPayload = newBillRes.payload;

          const cache = JSON.parse(sessionStorage.getItem('/accounts'));
          cache.payload.push(newBillPayload);
          sessionStorage.setItem('/accounts', JSON.stringify(cache));

          console.log(newBillRes);
          const newBillItem = createBillItem(newBillPayload);
          billsMixer.append(newBillItem);
        } }, 'Создать новый счёт'
      ),
    ]),
    mixitupContainer = el('ul.bills__list',
      res.payload.map(bill => {
        return createBillItem(bill);
      })
    ),
  ])

  const billsMixer = mixitup(mixitupContainer, {
    animation: {
        duration: 250
    }
  });

  const sortChoices = new Choices(sortSelect, {
    choices: [
      { label: 'Сортировка', placeholder: true },
      { label: 'По номеру', value: 'account' },
      { label: 'По балансу', value: 'balance' },
      { label: 'По последней транзакции', value: 'transaction' },
    ],
    allowHTML: true,
    searchEnabled: false,
    itemSelectText: '',
    shouldSort: false,
  });
  let ariaLabel = sortSelect.getAttribute('aria-label');
  sortSelect.closest('.choices').setAttribute('aria-label', ariaLabel);

  sortChoices.passedElement.element.addEventListener(
    'choice',
    (e) => {
      console.log(e);
      billsMixer.sort(`${e.detail.choice.value}:asc`);
    },
    false,
  );

  return billsList;

  function createBillItem(bill) {
    const transactionDate = new Date(bill?.transactions[0]?.date);

    return el('li.mix.card-white.bills__item', { 'data-account': bill.account, 'data-balance': bill.balance, 'data-transaction': bill.transactions[0] ? transactionDate.getTime() : '0',},
      el('.bills-item__content', [
        el('h2.bills-item__number', bill.account),
        el('span.bills-item__balance', `${bill.balance.toLocaleString('ru-RU')} ₽`),
        el('.bills-item__transaction', [
          el('span.bills-item-transaction__title', 'Последняя транзакция:'),
            bill.transactions[0] ? `${transactionDate.getDate()} ${monthsNames[transactionDate.getMonth()]} ${transactionDate.getFullYear()}` : 'нет',
          ]),
          el('a.btn.btn-primary.bills-item__btn', 'Открыть', { href: `/bill/${bill.account}`, onclick(e) {
            e.preventDefault();
            router.navigate(e.currentTarget.getAttribute('href'));
          }}
        )
      ])
    )
  }
}

export function createBillsListSkeleton() {
  let skeletonList;

  const skeleton = el('.container.bills__container.skeleton', [
    el('.bills__top', [
      el('.bills__left', [
        el('.bills__title.skeleton-bg-color'),
        el('.bills__select.skeleton-bg-color'),
      ]),
      el('.btn-with-icon.bills__btn_add.skeleton-bg-color.primary'),
    ]),
    skeletonList = el('.bills__list'),
  ])

  for (let i = 0; i < 12; i++) {
    const skeletonListItem = el('.card-white.bills__item',
      el('.bills-item__content', [
        el('.bills-item__number.skeleton-bg-color'),
        el('.bills-item__balance.skeleton-bg-color'),
        el('.bills-item__transaction.skeleton-bg-color'),
        el('.bills-item__btn.skeleton-bg-color.primary')
      ])
    )

    mount(skeletonList, skeletonListItem);
  }

  return skeleton;
}
