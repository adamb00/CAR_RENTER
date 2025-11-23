import json
from pathlib import Path
import time
import requests  # type: ignore

# --- BEÁLLÍTÁSOK ---

# Projekt gyökere (i18n mappa fölött)
ROOT_DIR = Path(__file__).resolve().parents[2]

# Forrásnyelv JSON (amit most is használsz)
SOURCE_FILE = ROOT_DIR / "messages" / "hu.json"

# Ide írjuk ki az összes fordítást
OUTPUT_DIR = ROOT_DIR / "messages"

# A te LOCALES listád
TARGET_LOCALES = [
    "en",
    "de",
    "ro",
    "sk",
    "cz",
    "fr",
    "se",
    "no",
    "dk",
    "it",
    "pl",
]

# LibreTranslate nyelvkód mapping
# (a te kódod -> LibreTranslate kód)
ENGINE_LANG_MAP = {
    "en": "en",
    "de": "de",
    "ro": "ro",
    "sk": "sk",
    "cz": "cs",  # Czech
    "fr": "fr",
    "se": "sv",  # Swedish
    "no": "no",  # ha nem támogatott, hibát fog dobni, azt látni fogjuk
    "dk": "da",  # Danish
    "it": "it",
    "pl": "pl",
}

# NEM a lokális Docker, hanem egy publikus instance:
LIBRETRANSLATE_URL = "https://libretranslate.com/translate"


# --- SEGÉDFÜGGVÉNYEK ---

def translate_text(text: str, target_locale: str) -> str:
    """Egyetlen sztring fordítása LibreTranslate-tel."""
    target_code = ENGINE_LANG_MAP[target_locale]
    source_code = ENGINE_LANG_MAP["en"]

    if not text.strip():
        return text

    resp = requests.post(
        LIBRETRANSLATE_URL,
        json={
            "q": text,
            "source": source_code,
            "target": target_code,
            "format": "text",
        },
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    # LibreTranslate: {"translatedText": "..."}
    return data["translatedText"]


def translate_value(value, target_locale: str):
    """Rekurzívan végigmegy a JSON-on, csak stringeket fordít."""
    if isinstance(value, str):
        # minimál placeholder-védelem: {valami} maradjon meg
        import re

        pattern = re.compile(r"\{[^}]+\}")
        placeholders = pattern.findall(value)

        translated = translate_text(value, target_locale)

        # ha eltűnne egy placeholder, visszapótoljuk
        for ph in placeholders:
            if ph not in translated:
                translated = (
                    translated.replace(ph, ph)
                    if ph in value
                    else translated + f" {ph}"
                )

        return translated

    if isinstance(value, list):
        return [translate_value(v, target_locale) for v in value]

    if isinstance(value, dict):
        return {k: translate_value(v, target_locale) for k, v in value.items()}

    # szám, bool, null: marad
    return value


def main():
    # Forrás JSON beolvasása
    with SOURCE_FILE.open("r", encoding="utf-8") as f:
        source_obj = json.load(f)

    for locale in TARGET_LOCALES:
        print(f"Fordítás: es → {locale}")

        try:
            translated_obj = translate_value(source_obj, locale)
        except Exception as e:
            print(f"  HIBA {locale} fordításánál: {e}")
            continue

        out_path = OUTPUT_DIR / f"{locale}.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(translated_obj, f, ensure_ascii=False, indent=2)

        print(f"  Mentve: {out_path}")

        # kis szünet, hogy ne DDoS-oljuk a publikus szervert :)
        time.sleep(1.0)

    print("Kész: minden célnyelv generálva (amelyik sikerült).")


if __name__ == "__main__":
    main()