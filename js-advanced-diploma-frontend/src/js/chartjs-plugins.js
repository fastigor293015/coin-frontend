import { el, setChildren, setStyle } from 'redom';
import { monthsNames } from './vars';

export const chartAreaBorder = {
  id: 'chartAreaBorder',
  beforeDraw(chart, args, options) {
    const {ctx, chartArea: {left, top, width, height}} = chart;
    ctx.save();
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.setLineDash(options.borderDash || []);
    ctx.lineDashOffset = options.borderDashOffset;
    ctx.strokeRect(left, top, width, height);
    ctx.restore();
  }
};

/* <div class="chart__canvas">
  <div class="chart__values-container">
    <div class="chart__value"></div>
    <div class="chart__value"></div>
  </div>
  <div class="chart__square" style="height: 70%;">
    <div class="chart__label"></div>
  </div>
  <div class="chart__square" style="height: 72%;">
    <div class="chart__label"></div>
  </div>
  <div class="chart__square" style="height: 71%;">
    <div class="chart__label"></div>
  </div>
  <div class="chart__square" style="height: 42%;">
    <div class="chart__label"> </div>
  </div>
  <div class="chart__square" style="height: 19%;">
    <div class="chart__label"></div>
  </div>
  <div class="chart__square" style="height: 100%;">
    <div class="chart__label"></div>
  </div>
</div> */

export function createBarChart(chartContainer, labelsArr, valuesArr) {
  const maxValue = Math.max.apply(null, valuesArr);

  const chart = [
    el('.chart__values-container', [
      el('.chart__value', maxValue.toLocaleString('ru-RU')),
      el('.chart__value', 0),
    ]),
    valuesArr.map((value, index) => {
      const itemHeight = value / maxValue * 100,
            squareItem = el('.chart__square', {style: 'height: 0%' },
              el('.chart__label', labelsArr[index])
            );

      setTimeout(() => {
        setStyle(squareItem, { height: `${itemHeight}%` })
      }, 200)
      return squareItem;
    })
  ]

  setChildren(chartContainer, chart);
}

export function createStackedBarChart(chartContainer, labelsArr, valuesArr, positiveArr, negativeArr, maxTransactionValue) {
  const maxValue = Math.max.apply(null, valuesArr);

  const chart = [
    el('.chart__values-container', [
      el('.chart__value', maxValue.toLocaleString('ru-RU')),
      el('.chart__value', maxTransactionValue.toLocaleString('ru-RU')),
      el('.chart__value', 0),
    ]),
    valuesArr.map((value, index) => {
      const itemHeight = value / maxValue * 100,
            positiveHeight = Math.ceil(positiveArr[index] / (positiveArr[index] + negativeArr[index]) * 10000) / 100,
            squareItem = el('.chart__square', { style: 'height: 0%' }, [
              el('.positive', { style: `height: ${positiveHeight}%` }),
              el('.negative', { style: `height: ${100 - positiveHeight}%` }),
              el('.chart__label', labelsArr[index])
            ]);

      setTimeout(() => {
        setStyle(squareItem, { height: `${itemHeight}%` })
      }, 200)
      return squareItem;
    })
  ]

  setChildren(chartContainer, chart);
}

export function getBalanceStats(res, maxMonthsCount) {
  const transactionsArr = res.payload?.transactions;

  if (transactionsArr.length === 0) {
    return { lastMonths: [monthsNames[new Date().getMonth()].slice(0, 3)], lastMonthsBalance: [res.payload.balance], positiveTransactions: null, negativeTransactions: null, maxTransactionValue: null }
  }

  let curMonth = new Date().getMonth(),
      curBalance = res.payload.balance,
      monthsCount = 1,
      positiveTransactionsCount = 0,
      negativeTransactionsCount = 0,
      positiveTransactionsSum = 0,
      negativeTransactionsSum = 0,
      maxTransactionValue = 0;

  const lastMonths = [monthsNames[curMonth].slice(0, 3)],
        lastMonthsBalance = [curBalance],
        positiveTransactions = [],
        negativeTransactions = [];

  for (let i = transactionsArr.length - 1; i >= 0; i--) {
    const transactionMonth = new Date(transactionsArr[i].date).getMonth();

    while (i === transactionsArr.length - 1 && transactionMonth !== curMonth) {
      curMonth--;
      monthsCount++;
      lastMonths.unshift(monthsNames[curMonth].slice(0, 3));
      lastMonthsBalance.unshift(Math.floor(curBalance * 100) / 100);
      positiveTransactions.unshift(positiveTransactionsCount);
      negativeTransactions.unshift(negativeTransactionsCount);
    }

    if (transactionMonth === curMonth) {
      if (transactionsArr[i].from === res.payload.account) {
        curBalance += transactionsArr[i].amount;
        negativeTransactionsCount++;
        negativeTransactionsSum += transactionsArr[i].amount;
      } else {
        curBalance -= transactionsArr[i].amount;
        positiveTransactionsCount++;
        positiveTransactionsSum += transactionsArr[i].amount;
      }
    } else {
      while (curMonth - 1 !== transactionMonth) {
        if (monthsCount === maxMonthsCount) {
          positiveTransactions.unshift(positiveTransactionsCount);
          negativeTransactions.unshift(negativeTransactionsCount);
          positiveTransactionsCount = 0;
          negativeTransactionsCount = 0;
          if (positiveTransactionsSum > negativeTransactionsSum && positiveTransactionsSum > maxTransactionValue) {
            maxTransactionValue = positiveTransactionsSum;
          } else if (negativeTransactionsSum > positiveTransactionsSum && negativeTransactionsSum > maxTransactionValue) {
            maxTransactionValue = negativeTransactionsSum;
          }
          positiveTransactionsSum = 0;
          negativeTransactionsSum = 0;
          break;
        }
        if (curMonth - 1 < 0) {
          curMonth = 11;
        } else {
          curMonth--;
        }
        monthsCount++;
        lastMonths.unshift(monthsNames[curMonth].slice(0, 3));
        lastMonthsBalance.unshift(Math.floor(curBalance * 100) / 100);
        positiveTransactions.unshift(positiveTransactionsCount);
        negativeTransactions.unshift(negativeTransactionsCount);
        positiveTransactionsCount = 0;
        negativeTransactionsCount = 0;
        if (positiveTransactionsSum > negativeTransactionsSum && positiveTransactionsSum > maxTransactionValue) {
          maxTransactionValue = positiveTransactionsSum;
        } else if (negativeTransactionsSum > positiveTransactionsSum && negativeTransactionsSum > maxTransactionValue) {
          maxTransactionValue = negativeTransactionsSum;
        }
        positiveTransactionsSum = 0;
        negativeTransactionsSum = 0;
      }
      if (monthsCount === maxMonthsCount) {
        positiveTransactions.unshift(positiveTransactionsCount);
        negativeTransactions.unshift(negativeTransactionsCount);
        break;
      }
      curMonth = transactionMonth;
      monthsCount++;
      lastMonths.unshift(monthsNames[curMonth].slice(0, 3));
      lastMonthsBalance.unshift(Math.floor(curBalance * 100) / 100);
      positiveTransactions.unshift(positiveTransactionsCount);
      negativeTransactions.unshift(negativeTransactionsCount);
      positiveTransactionsCount = 0;
      negativeTransactionsCount = 0;
      if (positiveTransactionsSum > negativeTransactionsSum && positiveTransactionsSum > maxTransactionValue) {
        maxTransactionValue = positiveTransactionsSum;
      } else if (negativeTransactionsSum > positiveTransactionsSum && negativeTransactionsSum > maxTransactionValue) {
        maxTransactionValue = negativeTransactionsSum;
      }
      positiveTransactionsSum = 0;
      negativeTransactionsSum = 0;

      if (transactionsArr[i].from === res.payload.account) {
        curBalance += transactionsArr[i].amount;
        negativeTransactionsCount++;
        negativeTransactionsSum += transactionsArr[i].amount;
      } else {
        curBalance -= transactionsArr[i].amount;
        positiveTransactionsCount++;
        positiveTransactionsSum += transactionsArr[i].amount;
      }
    }
    if (i === 0) {
      positiveTransactions.unshift(positiveTransactionsCount);
      negativeTransactions.unshift(negativeTransactionsCount);
      if (positiveTransactionsSum > negativeTransactionsSum && positiveTransactionsSum > maxTransactionValue) {
        maxTransactionValue = positiveTransactionsSum;
      } else if (negativeTransactionsSum > positiveTransactionsSum && negativeTransactionsSum > maxTransactionValue) {
        maxTransactionValue = negativeTransactionsSum;
      }
    }
  }

  const mayIndex = lastMonths.findIndex(item => item.toLowerCase() === 'мая');
  if (mayIndex >= 0) {
    lastMonths[mayIndex] = lastMonths[mayIndex].slice(0, -1) + 'й';
  }

  return { lastMonths, lastMonthsBalance, positiveTransactions, negativeTransactions, maxTransactionValue };
}
