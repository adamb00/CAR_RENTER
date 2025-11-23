from typing import List


class Translation:
    def translate(self, text: str, /) -> str: ...


class Language:
    code: str

    def get_translation(self, to_lang: "Language", /) -> Translation: ...


def get_installed_languages() -> List[Language]: ...
