import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://biblespeak.org"
LETTERS = "abcdefghijklmnopqrstuvwxyz"
OUTPUT_FILE = "names_pronunciations.json"

def get_names_by_letter(letter):
    url = f"{BASE_URL}/{letter}-words/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract names from <a> elements
    a_names = [a['aria-label'] for a in soup.select('a[aria-label]')]
    
    # Extract names from <h2> elements
    h2_names = [h2.text for h2 in soup.select('h2.title')]
    
    # Combine both lists of names and de-duplicate
    names = list(set(a_names + h2_names))
    
    return names

def get_pronunciation(name):
    url = f"{BASE_URL}/{name}-pronunciation/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract pronunciation from the specified div
    pronunciation_div = soup.select_one('.col.span_6.audioright')
    pronunciation = pronunciation_div.text.strip().split('\n')[1].strip() if pronunciation_div else None
    
    return pronunciation

def update_json():
    data = {}
    total_letters = len(LETTERS)
    start_time = time.time()
    
    for i, letter in enumerate(LETTERS):
        names = get_names_by_letter(letter)
        print(f"Processing letter: {letter.upper()} ({i+1}/{total_letters}), found {len(names)} names")
        for name in names:
            pronunciation = get_pronunciation(name)
            if (pronunciation):
                data[name] = {
                    "pronunciation": pronunciation,
                    "link": f"{BASE_URL}/{name}-pronunciation/"
                }
        # Calculate and print the percentage of completion
        percent_complete = ((i + 1) / total_letters) * 100
        elapsed_time = time.time() - start_time
        print(f"Progress: {percent_complete:.2f}% complete. Elapsed time: {elapsed_time:.2f} seconds.")
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    print("Update complete. Data saved to", OUTPUT_FILE)

if __name__ == "__main__":
    update_json()