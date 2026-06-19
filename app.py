import os
import time
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, send_from_directory

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache for parsed release notes
feed_cache = {
    "data": None,
    "expiry": 0
}
CACHE_DURATION = 900  # 15 minutes cache

def fetch_and_parse_feed():
    now = time.time()
    if feed_cache["data"] is not None and feed_cache["expiry"] > now:
        return feed_cache["data"]

    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        xml_content = response.content
    except Exception as e:
        # Fallback to stale cache if fetching fails
        if feed_cache["data"] is not None:
            print(f"Error fetching feed: {e}. Serving stale cache.")
            return feed_cache["data"]
        raise e

    # Parse Atom XML
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as pe:
        # If XML parsing fails but cache is available, fallback
        if feed_cache["data"] is not None:
            return feed_cache["data"]
        raise pe

    parsed_entries = []

    for entry in root.findall('atom:entry', namespaces):
        title_el = entry.find('atom:title', namespaces)
        id_el = entry.find('atom:id', namespaces)
        updated_el = entry.find('atom:updated', namespaces)
        link_el = entry.find('atom:link', namespaces)
        content_el = entry.find('atom:content', namespaces)

        title = title_el.text if title_el is not None else ""
        entry_id = id_el.text if id_el is not None else ""
        updated = updated_el.text if updated_el is not None else ""
        link = link_el.attrib.get('href', '') if link_el is not None else ""
        html_content = content_el.text if content_el is not None else ""

        # Parse HTML content with BeautifulSoup to group items by headers (h3)
        soup = BeautifulSoup(html_content, 'html.parser')
        items = []
        
        current_type = None
        current_siblings = []

        for child in soup.contents:
            if child.name == 'h3':
                if current_type is not None:
                    items.append({
                        'type': current_type,
                        'html': ''.join(str(s) for s in current_siblings).strip()
                    })
                current_type = child.get_text().strip()
                current_siblings = []
            else:
                current_siblings.append(child)

        # Add the last category group
        if current_type is not None:
            items.append({
                'type': current_type,
                'html': ''.join(str(s) for s in current_siblings).strip()
            })
        else:
            # Fallback if there are no h3 tags in the entry
            if html_content.strip():
                items.append({
                    'type': 'General',
                    'html': html_content.strip()
                })

        parsed_entries.append({
            'id': entry_id,
            'date': title,
            'updated': updated,
            'link': link,
            'items': items
        })

    feed_cache["data"] = parsed_entries
    feed_cache["expiry"] = now + CACHE_DURATION
    return parsed_entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        from flask import request
        force_refresh = request.args.get('refresh', 'false').lower() == 'true'
        if force_refresh:
            feed_cache["expiry"] = 0
        
        releases = fetch_and_parse_feed()
        return jsonify({
            "status": "success",
            "count": len(releases),
            "data": releases
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Run server on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
