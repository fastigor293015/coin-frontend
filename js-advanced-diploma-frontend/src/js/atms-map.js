import { el } from 'redom';

import { getAtmsList } from './api';

export async function createAtmsMap() {
  const res = await getAtmsList();
  console.log(res);

  let atmsMap;

  const atms = [
    el('.container.atms__container', [
      el('h1.title.atms__title', 'Карта банкоматов'),
      atmsMap = el('.atms__map.skeleton-bg-color#map')
    ]),
    el('script', { src: 'https://api-maps.yandex.ru/2.1/?apikey=ваш API-ключ&lang=ru_RU', type: 'text/javascript' })
  ]

  setTimeout(() => {
    ymaps.ready(init);
    function init(){
      const myMap = new ymaps.Map(atmsMap, {
        center: [55.76, 37.64],
        zoom: 10
      });

      res.payload.map(atm => {
        const myPlacemark = new ymaps.Placemark([atm.lat, atm.lon], {
          balloonContentHeader: 'Coin',
        }, {});

        myMap.geoObjects.add(myPlacemark);
      })
    }
  }, 1000);

  return atms;
}
