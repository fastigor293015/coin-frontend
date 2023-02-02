/// <reference types="cypress" />

const checkBill = '61253747452820828268825011';

beforeEach(() => {
  cy.visit('/');
  cy.get('.authorization-form__input#login').type('developer');
  cy.get('.authorization-form__input#password').type('skillbox');
  cy.get('.authorization-form__btn[type="submit"]').click();
})

describe('Coin', () => {
  it('Успешная авторизация при вводе правильных логина и пароля', () => {
    cy.url().should('include', '/bills');
  });
  it('Возможность просмотреть список счетов', () => {
    cy.get('ul.bills__list').children('.bills__item').should('have.lengthOf.at.least', 1);
  });
  it('Возможность перевести сумму со счёта на счёт', () => {
    cy.get('.bills__list').children('.bills__item').first().find('.bills-item__btn').click();

    cy.get('.details-form__input#number').type(checkBill);
    cy.get('.details-form__input#amount').type('1500');
    cy.get('.details-form__btn[type="submit"]').click();
    cy.get('.alert').should('have.class', 'success-alert');
  });
  it('Возможность создать новый счёт и перевести с него сумму', () => {
    cy.get('.bills__list').children('.bills__item').its('length').then(startLength => {
      cy.get('.bills__btn_add').click();
      cy.wait(2000);
      cy.get('.bills__list').children('.bills__item').should('have.length', startLength + 1);

      cy.get('.bills__list').children('.bills__item').last().find('.bills-item__number').then(lastItem => {
        const lastItemNumber = lastItem.text();

        cy.get('.bills__list').children('.bills__item').first().find('.bills-item__btn').click();

        cy.get('.details-form__input#number').type(lastItemNumber);
        cy.get('.details-form__input#amount').type('1500');
        cy.get('.details-form__btn[type="submit"]').click();
        cy.get('.alert').should('have.class', 'success-alert');

        cy.wait(2000);

        cy.get('.details__btn_return').click();

        cy.get('.bills__list').children('.bills__item').first().find('.bills-item__number').then(firstItem => {
          const firstItemNumber = firstItem.text();

          cy.get('.bills__list').children('.bills__item').last().find('.bills-item__btn').click();

          cy.get('.details-form__input#number').type(firstItemNumber);
          cy.get('.details-form__input#amount').type('1500');
          cy.get('.details-form__btn[type="submit"]').click();
          cy.get('.alert').should('have.class', 'success-alert');
        })
      })
    });
  });
})
