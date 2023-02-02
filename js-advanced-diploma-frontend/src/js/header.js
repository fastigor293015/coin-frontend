import { el } from 'redom';
import { router } from './router';

import logo from '../assets/images/logo.svg';

export function createHeader() {
  let menu,
      menuTimer;

  const header = el('header.header',
    el('.container.header__container', [
      el('a.header__logo', { href: '/bills', innerHTML: logo, onclick(e) {
        e.preventDefault();
        router.navigate(e.currentTarget.getAttribute('href'));
      } }),
      menu = el('nav.header__nav',
        el('ul.header-nav__list', [
          el('li.header-nav__item',
            el('a.btn.btn-outline.header-nav__link', 'Банкоматы', { href: '/atms', onclick(e) {
              e.preventDefault();
              router.navigate(e.currentTarget.getAttribute('href'));
            } })
          ),
          el('li.header-nav__item',
            el('a.btn.btn-outline.header-nav__link', 'Счета', { href: '/bills', onclick(e) {
              e.preventDefault();
              router.navigate(e.currentTarget.getAttribute('href'));
            } })
          ),
          el('li.header-nav__item',
            el('a.btn.btn-outline.header-nav__link', 'Валюта', { href: '/currency', onclick(e) {
              e.preventDefault();
              router.navigate(e.currentTarget.getAttribute('href'));
            } })
          ),
          el('li.header-nav__item',
            el('a.btn.btn-outline.header-nav__link', 'Выйти', { href: '/login', onclick(e) {
              e.preventDefault();
              localStorage.removeItem('token');
              sessionStorage.clear();
              router.navigate(e.currentTarget.getAttribute('href'));
            } })
          ),
        ])
      ),
      el('button.btn.burger', { onclick(e) {
        if (!menu.classList.contains('visible')) {
          e.currentTarget.classList.add('active');
          menu.classList.add('visible');

          menu.querySelectorAll('.header-nav__item').forEach((navItem, index) => {
            if (!menu.classList.contains('visible')) {
              return;
            }
            menuTimer = setTimeout(() => {
              navItem.classList.add('visible');
            }, 50 * (index + 1))
          })
        } else {
          e.currentTarget.classList.remove('active');
          menu.querySelectorAll('.header-nav__item').forEach((navItem, index, arr) => {
            // if (menu.classList.contains('visible')) {
            //   return;
            // }
            menuTimer = setTimeout(() => {
              navItem.classList.remove('visible');
            }, 50 * (arr.length - (index + 1)))
          })
          const navListLength = menu.childNodes[0].childNodes.length;
          console.log(navListLength);
          menuTimer = setTimeout(() => {
            menu.classList.remove('visible');
          }, 100 * navListLength);
        }
      }},
        el('span.burger__line')
      )
    ]
  ))

  return header;
}

export function createHeaderSkeleton() {
  const skeleton = el('.header.skeleton',
    el('.container.header__container', [
      el('.header__logo.skeleton-bg-color'),
      el('.header__nav',
        el('.header-nav__list', [
          el('.header-nav__item.skeleton-bg-color'),
          el('.header-nav__item.skeleton-bg-color'),
          el('.header-nav__item.skeleton-bg-color'),
          el('.header-nav__item.skeleton-bg-color'),
        ])
      ),
      el('button.btn.burger',
        el('span.burger__line')
      )
    ]
  ))

  return skeleton;
}
