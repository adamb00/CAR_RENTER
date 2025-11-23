from typing import List


class Package:
    from_code: str
    to_code: str

    def download(self) -> str: ...


def get_available_packages() -> List[Package]: ...


def install_from_path(path: str, /) -> None: ...


def update_package_index() -> None: ...
