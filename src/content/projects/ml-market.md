---
title: ml-market
description: Quantile regression forests to predict return and volatility distributions for QQQ and its top holdings.
tech: [Python, pandas, yfinance, Jupyter]
repo: https://github.com/jakeryderv/ml-market
featured: true
order: 3
---

Walk-forward cross-validated models (ridge, logistic regression, random forest, quantile
random forest, GARCH baseline) trained on OHLCV data and ~109 technical/macro features
for 11 tickers, 2016-2025. Volatility turned out to be forecastable (0.403 CV / 0.446
out-of-sample correlation for the quantile forest), while returns stayed near-zero
correlation, consistent with the efficient market hypothesis.
