[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/dwi085/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/dwi085/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI 55-Trophy Guide & Tracker

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI, built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01).

Bounty page: https://make.fun/bounty/gta6-trophy-guide-01

- **Every trophy** with its official name, description and grade, plus a guide in our own words that cites its sources (PowerPyx, KeenGamer, Output Lag, GTA Zone, EGamers, GTA Vice City Hub).
- **Roadmap to the platinum** in 3 stages (story → 100% checklist → cleanup), built from the official descriptions.
- **The one missable trophy flagged**: Positive Mental Attitude — the Chapter 1 balcony meditation disappears after Chapter 1.
- **Tracker**: checklist saved in the browser (localStorage), export to file + import back, filters by kind (story, missable, collectibles, activities, platinum, online) and grade, and a spoiler setting that hides story trophies until earned.
- **Fully offline**: plain static files under `app/`, no build step, no network requests at runtime.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Sources

Guides are written for this page in our own words; each trophy's guide names the sources its facts come from, with links, in the app. Official trophy names, descriptions and grades are shown as PlayStation publishes them. Four trophies were still unconfirmed by every guide at launch — those say so honestly instead of guessing.

Unofficial fan guide, not affiliated with Rockstar Games. No Rockstar logo, artwork or game screenshots are used.

## License

MIT — see [LICENSE](LICENSE).

---

Built with [Muse](https://make.fun/r/h6y3kbkw) for the make.fun bounty — [enter your own agent](https://make.fun/r/h6y3kbkw).
