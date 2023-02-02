import createAlert from "./show-alert";

export async function authorization(login, password) {
  let res;
  try {
    res = await fetch('http://localhost:3001/login', {
      method: 'POST',
      body: JSON.stringify({
        login,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  return await res.json();
}

export async function getBillsList() {
  let res;
  try {
    res = await fetch('http://localhost:3001/accounts', {
      headers: {
        'Authorization': `Basic ${localStorage.getItem('token')}`,
      }
    });
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  return await res.json();
}

export async function getBillDetails(id) {
  let res;
  try {
    res = await fetch(`http://localhost:3001/account/${id}`, {
      headers: {
        'Authorization': `Basic ${localStorage.getItem('token')}`,
      }
    })
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  return await res.json();
}

export async function createBill() {
  let res;
  try {
    res = await fetch('http://localhost:3001/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${localStorage.getItem('token')}`,
      }
    })
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  return await res.json();
}

export async function transferFunds(from, to, amount) {
  let res;
  try {
    res = await fetch('http://localhost:3001/transfer-funds', {
      method: 'POST',
      body: JSON.stringify({
        from,
        to,
        amount
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${localStorage.getItem('token')}`,
      }
    })
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  return await res.json();
}

export async function getAtmsList() {
  let res;
  try {
    if (!sessionStorage.getItem('/banks')) {
      res = await fetch('http://localhost:3001/banks', {
        headers: {
          'Authorization': `Basic ${localStorage.getItem('token')}`,
        }
      })
      res = await res.json();
      sessionStorage.setItem('/banks', JSON.stringify(res))
    } else {
      res = JSON.parse(sessionStorage.getItem('/banks'));
    }

    console.log(sessionStorage);
  } catch (err) {
    setTimeout(() => {
      createAlert('Соединение с сервером разорвано');
    }, 1000)
  }

  return res;
}

export function getCurrenciesChanges() {
  const socket = new WebSocket('ws://localhost:3001/currency-feed');

  socket.onopen = (e) => {
    console.log('Вебсокет открыт!');
  }

  socket.onerror = (e) => {
    createAlert('Соединение с сервером разорвано');
  }

  socket.onclose = (e) => {
    console.log('Вебсокет закрыт!');
  }

  return socket;
}

export async function getUserCurrencies() {
  let res;
  try {
    res = await fetch('http://localhost:3001/currencies', {
      headers: {
        'Authorization': `Basic ${localStorage.getItem('token')}`,
      }
    })
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  return await res.json();
}

export async function getAllCurrencies() {
  let res;
  try {
    if (!sessionStorage.getItem('/all-currencies')) {
      res = await fetch('http://localhost:3001/all-currencies', {
        headers: {
          'Authorization': `Basic ${localStorage.getItem('token')}`,
        }
      })
      res = await res.json();
      sessionStorage.setItem('/all-currencies', JSON.stringify(res))
    } else {
      res = JSON.parse(sessionStorage.getItem('/all-currencies'));
    }
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  console.log(sessionStorage);

  return res;
}

export async function buyCurrency(from, to, amount) {
  let res;
  try {
    res = await fetch('http://localhost:3001/currency-buy', {
      method: 'POST',
      body: JSON.stringify({
        from,
        to,
        amount
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${localStorage.getItem('token')}`,
      }
    })
  } catch (err) {
    createAlert('Соединение с сервером разорвано');
  }

  return await res.json();
}
