"""Fetch the reviewed Commons photographs without replacing other tour assets."""
import concurrent.futures
import hashlib
import io
import json
import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module
assets = import_module('prepare-local-assets')
ROOT = assets.ROOT

def main():
    pages = json.loads((ROOT / 'vittoriano-photo-selection.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'sources.json').read_text(encoding='utf-8'))
    previous = {entry['file']: entry for entry in manifest}
    def download(item):
        name = item
        page = pages[name]
        info = page['imageinfo'][0]
        meta = info['extmetadata']
        license_name = meta['LicenseShortName']['value']
        license_url = meta.get('LicenseUrl', {}).get('value', '').replace('http:', 'https:')
        if license_name == 'Public domain' and not license_url:
            license_url = 'https://creativecommons.org/publicdomain/mark/1.0/'
        assert license_name.startswith(('CC BY ', 'CC BY-SA ', 'CC0')) or license_name == 'Public domain'
        assert license_url.startswith('https://creativecommons.org/')
        path = ROOT / 'images' / ('vittoriano-' + name + '.jpg')
        download_url = info.get('thumburl', info['url'])
        old = previous.get('images/' + path.name, {})
        content = path.read_bytes() if path.exists() and old.get('title') == page['title'][5:] and old.get('downloadUrl') == download_url else None
        if content and hashlib.sha256(content).hexdigest() != old.get('sha256'):
            content = None
        for attempt in range(3):
            if content:
                break
            try:
                content = assets.fetch(download_url)
            except (TimeoutError, OSError):
                if attempt == 2:
                    raise
        assert content[:2] == b'\xff\xd8' and len(content) < 4_000_000
        with Image.open(io.BytesIO(content)) as image:
            width, height = image.size
            image.verify()
        path.write_bytes(content)
        print(name + ': ' + str(width) + 'x' + str(height), flush=True)
        return assets.add_thumbnail({'file': 'images/' + path.name, 'title': page['title'][5:],
            'sourceUrl': info['descriptionurl'], 'downloadUrl': download_url,
            'author': assets.plain(meta['Artist']['value']), 'artistHtml': meta['Artist']['value'],
            'license': license_name, 'licenseUrl': license_url, 'width': width, 'height': height,
            'captureDate': assets.plain(meta.get('DateTimeOriginal', {}).get('value', '')),
            'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()})
    entries = list(concurrent.futures.ThreadPoolExecutor(2).map(download, pages))
    files = {e['file'] for e in entries}
    manifest = [e for e in manifest if e['file'] not in files] + entries
    (ROOT / 'sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    selection = json.loads((ROOT / 'tour-assets.json').read_text(encoding='utf-8'))
    selection.update({Path(e['file']).name: e['title'] for e in entries})
    (ROOT / 'tour-assets.json').write_text(json.dumps(selection, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    main()
