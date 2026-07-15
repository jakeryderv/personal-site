---
title: NBA Database
description: PostgreSQL database and FastAPI service for NBA stats, backed by an ETL pipeline against the NBA API.
tech: [Python, PostgreSQL, FastAPI, Docker]
repo: https://github.com/jakeryderv/nba-db
featured: true
order: 2
---

ETL pipeline extracts box scores, game data, and shot charts from the NBA API and loads
them into Postgres with CHECK constraints, triggers, and views. A FastAPI layer exposes
18 endpoints (players, teams, games, shot charts, leaders, standings) backing a small
web dashboard, with Docker Compose for local Postgres and a data-quality test suite.
