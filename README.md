# Dynamic Weather Card for Home Assistant 🌤️🌧️⚡

Nowoczesna, animowana karta pogodowa dla interfejsu Home Assistant Lovelace z proceduralnie generowanym, dynamicznym tłem nieba (Canvas 2D/FBM), zintegrowanym cyfrowym zegarem oraz natywną prognozą pogody.

Tło karty reaguje na rzeczywistą pozycję słońca (elewacja i azymut z encji `sun.sun`), fazy księżyca, zachmurzenie, deszcz ze spływającymi kroplami po szybie, śnieg, burze i wiatr.

---

## ✨ Główne cechy

- **Fizyczne renderowanie nieba**: Gradienty zależne od kąta padania promieni słonecznych (wschód, zachód, zmierzch, noc).
- **Proceduralne chmury (FBM)**: Generowanie trójwymiarowych pasm chmur reagujących na kierunek i prędkość wiatru.
- **Efekty cząsteczkowe**: Realistyczny deszcz, śnieg oraz krople wody skraplające się i spływające po szkle.
- **Cyfrowy zegar i data**: Duży, elegancki zegar (font Open Sans) z polskim formatowaniem daty.
- **Pełna kompatybilność**: Działa z dowolną encją pogody wspieraną przez Home Assistant (`weather.*`).

---

## 📥 Instalacja

### Metoda 1: HACS (Jako repozytorium niestandardowe - zalecane)

1. Upewnij się, że masz zainstalowany **HACS**.
2. W Home Assistant przejdź do **HACS** -> **Frontend**.
3. Kliknij ikonę trzech kropek w prawym górnym rogu i wybierz **Niestandardowe repozytoria** (_Custom repositories_).
4. Wklej adres URL tego repozytorium:
   `https://github.com/lukaszbacik/weather-card-dynamic-bg`
5. Jako typ wybierz: **Lovelace**.
6. Kliknij **Dodaj**, znajdź kartę na liście i kliknij **Pobierz** (_Download_).
7. Odśwież stronę w przeglądarce (Ctrl + F5).

### Metoda 2: Instalacja ręczna

1. Pobierz plik `weather-card-dynamic-bg.js` z najnowszego wydania (Releases).
2. Skopiuj plik na swój serwer Home Assistant do folderu `/config/www/weather-card-dynamic-bg.js`.
3. Przejdź w Home Assistant do **Ustawienia** -> **Pulpity nawigacyjne** -> **Zasoby** (zakładka w prawym górnym rogu).
4. Kliknij **Dodaj zasób**:
   - **Adres URL**: `/local/weather-card-dynamic-bg.js`
   - **Typ zasobu**: `Moduł JavaScript`
5. Odśwież widok pulpitu w przeglądarce.

---

## ⚙️ Konfiguracja (Lovelace YAML)

Dodaj kartę do swojego pulpitu w widoku edycji lub bezpośrednio w kodzie YAML:

### Podstawowa konfiguracja:

```yaml
type: custom:weather-card-dynamic-bg
entity: weather.forecast_home
```

### Pełna konfiguracja ze wszystkimi opcjami:

```yaml
type: custom:weather-card-dynamic-bg
entity: weather.forecast_home
sun_entity: sun.sun
name: Dom
show_clock: true
show_date: true
card_min_height: 280
show_forecast: true
forecast_type: hourly # 'hourly' lub 'daily'
forecast_slots: 6
animations: true
intensity: 100
sun_azimuth: true
show_moon: true
show_stars: true
show_shooting_stars: true
```

---

## 🛠️ Dostępne parametry konfiguracyjne

| Parametr              | Typ     | Domyślnie    | Opis                                                        |
| :-------------------- | :------ | :----------- | :---------------------------------------------------------- |
| `entity`              | String  | **Wymagane** | Identyfikator encji pogodowej (np. `weather.home`)          |
| `sun_entity`          | String  | `sun.sun`    | Identyfikator encji słońca do obliczania elewacji i azymutu |
| `name`                | String  | `""`         | Opcjonalna własna nazwa lokalizacji                         |
| `show_clock`          | Boolean | `true`       | Wyświetlanie dużego cyfrowego zegara                        |
| `show_date`           | Boolean | `true`       | Wyświetlanie sformatowanej daty pod zegarem                 |
| `card_min_height`     | Number  | `280`        | Minimalna wysokość karty w pikselach                        |
| `show_forecast`       | Boolean | `true`       | Wyświetlanie kafelków z prognozą na kolejne godziny/dni     |
| `forecast_type`       | String  | `hourly`     | Typ prognozy: `hourly` (godzinowa) lub `daily` (dzienna)    |
| `forecast_slots`      | Number  | `6`          | Liczba slotów prognozy do wyświetlenia                      |
| `animations`          | Boolean | `true`       | Włączenie/wyłączenie animacji w tle (Canvas)                |
| `intensity`           | Number  | `100`        | Intensywność efektów opadów deszczu/śniegu (w %)            |
| `sun_azimuth`         | Boolean | `true`       | Płynne przesuwanie tarczy słońca wzdłuż horyzontu (oś X)    |
| `show_moon`           | Boolean | `true`       | Renderowanie księżyca w nocy z aktualną fazą                |
| `show_stars`          | Boolean | `true`       | Renderowanie gwiazd nocą                                    |
| `show_shooting_stars` | Boolean | `true`       | Losowe spadające gwiazdy przy bezchmurnym niebie            |

---

## 📄 Licencja

Projekt udostępniany na licencji MIT.
