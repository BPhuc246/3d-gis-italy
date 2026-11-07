"""Download the curated, openly licensed tour photos; keep attribution and hashes."""
import concurrent.futures
import hashlib
import html
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / '_local'
HEADERS = {'User-Agent': 'RomaGIS-study/1.0 (academic photo tours)'}

def fetch(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=45) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 502, 503, 504) or attempt == 3:
                raise
            time.sleep(min(20, 5 * (attempt + 1)))

def plain(value):
    return html.unescape(re.sub('<[^>]*>', '', value)).strip()

def add_thumbnail(entry):
    target = ROOT / 'images' / 'thumbs' / Path(entry['file']).name
    target.parent.mkdir(exist_ok=True)
    with Image.open(ROOT / entry['file']) as image:
        image = image.convert('RGB')
        image.thumbnail((360, 240))
        image.save(target, quality=82, optimize=True)
    return dict(entry, thumbnail='images/thumbs/' + target.name,
        changes='Wikimedia image resized up to 1920px, plus uncropped 360x240 thumbnail; attribution/license retained.')

def main():
    if '--thumbnails-only' in sys.argv:
        manifest = json.loads((ROOT / 'sources.json').read_text(encoding='utf-8'))
        manifest = [add_thumbnail(entry) for entry in manifest]
        (ROOT / 'sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('Prepared ' + str(len(manifest)) + ' local thumbnails.')
        return
    selection = json.loads((ROOT / 'tour-assets.json').read_text(encoding='utf-8'))
    query = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'imageinfo',
        'iiprop': 'url|extmetadata|size', 'iiurlwidth': 1920,
        'titles': '|'.join('File:' + title for title in selection.values())})
    result = json.loads(fetch('https://commons.wikimedia.org/w/api.php?' + query))
    (ROOT / 'research' / 'selected-image-metadata.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    pages = {p['title'].replace('_', ' '): p for p in result['query']['pages'].values()}
    tasks = []
    for filename, title in selection.items():
        page = pages.get('File:' + title.replace('_', ' '), {})
        if not page.get('imageinfo'):
            print('MISSING: ' + title, flush=True)
            continue
        info = page['imageinfo'][0]
        meta = info['extmetadata']
        license_name = meta.get('LicenseShortName', {}).get('value', '')
        license_url = meta.get('LicenseUrl', {}).get('value', '')
        license_url = license_url.replace('http://creativecommons.org/', 'https://creativecommons.org/')
        if not (license_name.startswith(('CC BY ', 'CC BY-SA ', 'CC0')) or license_name == 'Public domain'):
            raise ValueError('License requires separate review: ' + title + ' / ' + license_name)
        if not license_url and license_name == 'Public domain':
            license_url = 'https://creativecommons.org/publicdomain/mark/1.0/'
        if not license_url.startswith('https://creativecommons.org/'):
            raise ValueError('Missing license URL: ' + title)
        tasks.append((filename, title, info, meta, license_name, license_url))
    folder = ROOT / 'images'
    folder.mkdir(exist_ok=True)
    old_manifest = json.loads((ROOT / 'sources.json').read_text(encoding='utf-8')) if (ROOT / 'sources.json').exists() else []
    previous = {entry['file']: entry for entry in old_manifest}

    def download(task):
        filename, title, info, meta, license_name, license_url = task
        old = previous.get('images/' + filename)
        path = folder / filename
        if old and old['title'] == title and old.get('width', 0) >= min(1920, info['width']) and path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == old.get('sha256'):
            print(filename + ': verified local cache', flush=True)
            return add_thumbnail(dict(old, captureDate=plain(meta.get('DateTimeOriginal', {}).get('value', ''))))
        url = info.get('thumburl', info['url'])
        content = fetch(url)
        if not content.startswith(b'\xff\xd8') or len(content) > 4_000_000:
            raise ValueError('Unexpected or oversized JPEG: ' + title)
        with Image.open(io.BytesIO(content)) as image:
            width, height = image.size
            image.verify()
        path = folder / filename
        path.with_suffix('.part').write_bytes(content)
        path.with_suffix('.part').replace(path)
        print(filename + ': ' + str(width) + 'x' + str(height) + ', ' + str(len(content)) + ' bytes', flush=True)
        time.sleep(.4)
        return add_thumbnail({'file': 'images/' + filename, 'title': title, 'sourceUrl': info['descriptionurl'],
            'downloadUrl': url, 'author': plain(meta['Artist']['value']), 'artistHtml': meta['Artist']['value'],
            'license': license_name, 'licenseUrl': license_url, 'width': width, 'height': height,
            'description': plain(meta.get('ImageDescription', {}).get('value', '')),
            'captureDate': plain(meta.get('DateTimeOriginal', {}).get('value', '')),
            'changes': 'Wikimedia thumbnail up to 1920px; no additional edits.',
            'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()})
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        manifest = list(pool.map(download, tasks))
    (ROOT / 'sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if len(tasks) != len(selection):
        raise ValueError('Some requested filenames are missing; replace them before completing the tours.')
    print('Downloaded ' + str(len(manifest)) + ' licensed photos.', flush=True)

if __name__ == '__main__':
    main()
