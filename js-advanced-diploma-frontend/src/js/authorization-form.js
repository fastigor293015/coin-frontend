import { el} from 'redom';
import JustValidate from 'just-validate';
import { router } from './router';

import createAlert from './show-alert';
import { authorization } from './api';

import errorIcon from '../assets/images/error.svg';

export default function createAuthorizationForm() {
  let authorizationForm;

  const authorizationPage = el('.container.authorization__container',
    authorizationForm = el('form.card-gray.authorization__form', [
      el('h1.title.authorization-form__title', 'Вход в аккаунт'),
      el('.form__row.authorization-form__row', [
        el('label.form__label.authorization-form__label', 'Логин', { for: 'login' }),
        el('.form__input-wrapper.authorization-form__input-wrapper',
          el('input.form__input.authorization-form__input', { type: 'text', id: 'login', name: 'login', placeholder: 'BlackViking' })
        )
      ]),
      el('.form__row.authorization-form__row', [
        el('label.form__label.authorization-form__label', 'Пароль', { for: 'password' }),
        el('.form__input-wrapper.authorization-form__input-wrapper',
          el('input.form__input.authorization-form__input', { type: 'password', id: 'password', name: 'password', placeholder: '******' })
        )
      ]),
      el('button.btn.btn-primary.btn-small.authorization-form__btn', 'Войти', { type: 'submit' })
    ])
  )

  const authorizationFormValidation = new JustValidate(authorizationForm, {
    errorLabelStyle: '',
  })

  authorizationFormValidation
    .addField('#login', [
      {
        rule: 'customRegexp',
        value: /^\S*$/,
        errorMessage: `${errorIcon}Пробел недопустим`
      },
      {
        rule: 'required',
        errorMessage: `${errorIcon}Заполните это поле`
      },
      {
        rule: 'minLength',
        value: 6,
        errorMessage: `${errorIcon}Введите не менее 6 символов`
      },
    ])
    .addField('#password', [
      {
        rule: 'customRegexp',
        value: /^\S*$/,
        errorMessage: `${errorIcon}Пробел недопустим`
      },
      {
        rule: 'required',
        errorMessage: `${errorIcon}Заполните это поле`
      },
      {
        rule: 'minLength',
        value: 6,
        errorMessage: `${errorIcon}Введите не менее 6 символов`
      },
    ])
    .onSuccess(async () => {
      const loginInput = authorizationForm.querySelector('.form__input[name="login"]'),
            passwordInput = authorizationForm.querySelector('.form__input[name="password"]');

      const res = await authorization(loginInput.value, passwordInput.value);

      console.log(res);

      if (res.payload?.token) {
        localStorage.setItem('token', res.payload.token);
        console.log(localStorage);
        router.navigate('/bills');
      } else if (res.error === 'No such user') {
        createAlert('Пользователя с таким логином не существует');
      } else if (res.error === 'Invalid password') {
        createAlert('Неверный пароль');
      }
    })

  return authorizationPage;
}
