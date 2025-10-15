
# Rebels Club — CMS v2 (Netlify + Decap CMS)

Kompletna strona + panel `/admin` (Decap CMS). Zawiera:
- Cennik, Regulamin, Aktualności, Grafik, Trenerzy, Zawodnicy, Ustawienia strony.
- Formularz kontaktowy (Netlify Forms) z polem **Temat** i checkboxem **RODO**.
- Mapa Google osadzona dla adresu: **Twardogóra, ul. Plac Piastów 24**.
- Favicon (rękawica bokserska) — link w `<head>`.

## Deploy za darmo
1. Wrzuć cały folder do repo GitHub (branch `main`).
2. W Netlify: **Add new site → Import from Git** → wskaż repo → Deploy.
3. W Netlify: **Identity → Enable**, potem **Git Gateway → Enable**.
4. Wejdź na `https://twoja-domena.netlify.app/admin/` i zaloguj się (zaproszenie z zakładki Identity).

## Edycja treści (kafelki)
- `/admin/` → kolekcje: Ustawienia, Trenerzy, Zawodnicy, Grafik, Aktualności, **Cennik**, **Regulamin**.
- Zmiany zapisują się jako commity do `/data/*.json`. Front pobiera dane automatycznie.

## Formularz (Netlify Forms)
Formularz jest w sekcji **Kontakt** (`index.html`). Netlify wykryje go po `data-netlify="true"` i `name="kontakt"`.

### Powiadomienia mailowe
1. Netlify → zakładka **Forms** → wybierz formularz **kontakt**.
2. Kliknij **Add notification** → **Email** → wpisz swój e-mail.
3. Zapisz. Od teraz dostajesz mail za każdym razem, gdy ktoś wyśle formularz.

## Zmiana favicon
Podmień plik `/images/uploads/favicon.ico` (obecnie rękawica bokserska) i zdeployuj.

## Mapka Google
W `index.html` w sekcji Kontakt znajdziesz iframe z zapytaniem do Google Maps na **Twardogóra, Plac Piastów 24**. Możesz podmienić adres w URL.

Powodzenia! 🥊
