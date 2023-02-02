import 'babel-polyfill';

import { setChildren } from 'redom';
import { router } from './router';

import { createHeader, createHeaderSkeleton } from './header';
import createAuthorizationForm from './authorization-form';
import { createBillsList, createBillsListSkeleton } from './bills-list';
import { createBillDetails, createBillDetailsSkeleton } from './bill-details';
import { createBalanceStory, createBalanceStorySkeleton } from './balance-story';
import { createAtmsMap } from './atms-map';
import { createCurrenciesPage, createCurrenciesPageSkeleton } from './currencies';

import 'choices.js/public/assets/styles/choices.min.css';
import '../css/main.css';

let socket;

router.on('/', () => {
  if (localStorage.getItem('token')) {
    router.navigate('/bills');
  } else {
    router.navigate('/login');
  }
})

router.on('/login', () => {
  if (socket instanceof WebSocket) {
    socket.close();
  }

  const header = createHeader(),
        authorizationForm = createAuthorizationForm();

  header.querySelector('nav.header__nav').remove();
  header.querySelector('.burger').remove();
  setChildren(window.document.body, [header, authorizationForm]);
})

router.on('/atms', async () => {
  if (!localStorage.getItem('token')) {
    router.navigate('/login');
    return;
  }

  if (socket instanceof WebSocket) {
    socket.close();
  }

  const header = createHeader();
  const atmsMap = await createAtmsMap();
  header.querySelector('.header-nav__link[href="/atms"]').classList.add('disabled');
  setChildren(window.document.body, [header, atmsMap]);
})

router.on('/bills', async () => {
  if (!localStorage.getItem('token')) {
    router.navigate('/login');
    return;
  }

  if (socket instanceof WebSocket) {
    socket.close();
  }

  const headerSkeleton = createHeaderSkeleton(),
        billsListSkeleton = createBillsListSkeleton();
  setChildren(window.document.body, [headerSkeleton, billsListSkeleton]);

  const header = createHeader(),
        billsList = await createBillsList();
  header.querySelector('.header-nav__link[href="/bills"]').classList.add('disabled');
  setChildren(window.document.body, [header, billsList]);
})

router.on('/bill/:id', async ({ data: { id } }) => {
  if (!localStorage.getItem('token')) {
    router.navigate('/login');
    return;
  }

  if (socket instanceof WebSocket) {
    socket.close();
  }

  const headerSkeleton = createHeaderSkeleton(),
        billDetailsSkeleton = createBillDetailsSkeleton();
  setChildren(window.document.body, [headerSkeleton, billDetailsSkeleton]);

  const header = createHeader(),
        billDetails = await createBillDetails(id);
  setChildren(window.document.body, [header, billDetails]);
})

router.on('/bill-story/:id', async ({ data: { id } }) => {
  if (!localStorage.getItem('token')) {
    router.navigate('/login');
    return;
  }

  if (socket instanceof WebSocket) {
    socket.close();
  }

  const headerSkeleton = createHeaderSkeleton(),
        balanceStorySkeleton = createBalanceStorySkeleton();
  setChildren(window.document.body, [headerSkeleton, balanceStorySkeleton]);

  const header = createHeader(),
        balanceStory = await createBalanceStory(id);
  setChildren(window.document.body, [header, balanceStory]);
})

router.on('/currency', async () => {
  if (!localStorage.getItem('token')) {
    router.navigate('/login');
    return;
  }

  const headerSkeleton = createHeaderSkeleton(),
        currenciesPageSkeleton = createCurrenciesPageSkeleton();
  setChildren(window.document.body, [headerSkeleton, currenciesPageSkeleton]);

  const header = createHeader();
  const { currenciesPage, currenciesSocket } = await createCurrenciesPage();
  socket = currenciesSocket;
  header.querySelector('.header-nav__link[href="/currency"]').classList.add('disabled');
  setChildren(window.document.body, [header, currenciesPage]);
})

router.notFound(() => {
  router.navigate('/bills');
})

router.resolve();
