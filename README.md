# STT Demo

Tämä projekti on puheentunnistuksen demo, joka käyttää OpenAI Whisper API:a äänitiedostojen transkriptioon. Käyttäjä voi nauhoittaa ääntä selaimessa, lähettää sen palvelimelle ja saada transkription takaisin.

## Vaatimukset

- Python 3.6 tai uudempi
- Node.js 14 tai uudempi
- Conda (suositeltu Python-ympäristön hallintaan)
- OpenAI API -avain

## Asennus

### Python-riippuvuudet

Aktivoi conda-ympäristö ja asenna Python-riippuvuudet:

```bash
conda activate stt-demo
pip install -r requirements.txt
```

### Node.js-riippuvuudet

Asenna Node.js-riippuvuudet:

```bash
npm install
```

### .env-tiedosto

Luo `.env`-tiedosto projektin juureen ja lisää OpenAI API -avain:

```
OPENAI_API_KEY=your_api_key_here
```

## Käyttöönotto

Käynnistä palvelut seuraavassa järjestyksessä:

1. Python-palvelin (Flask):
   ```bash
   python server.py
   ```

2. Next.js-sovellus:
   ```bash
   npm run dev
   ```

3. Watchdog-agentti:
   ```bash
   python watchdog-agent.py
   ```

## Käyttö

1. Avaa selain osoitteeseen [http://localhost:4000/](http://localhost:4000/).
2. Käytä "Record"-nappia äänityksen aloittamiseen ja "Stop"-nappia lopettamiseen.
3. Äänitiedosto lähetetään automaattisesti palvelimelle, ja transkription tulos näytetään, kun se valmistuu.

## Vianetsintä

- Tarkista, että kaikki palvelut ovat käynnissä ja portit (4000, 4041) ovat vapaana.
- Tarkista, että `.env`-tiedosto on olemassa ja sisältää oikean OpenAI API -avaimen.
- Tarkista lokitiedostot (`stt_agent.log`, `upload_monitor.log`) mahdollisten virheiden selvittämiseksi.

## Lisätiedot

- Äänitiedostot tallennetaan `uploads`-kansioon.
- Transkriptiot tallennetaan samaan kansioon `.txt`-päätteellä.
- Ohjelma käyttää SSE-yhteyttä transkription tulosten välittämiseen frontendille.