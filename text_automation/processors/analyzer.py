import re
from collections import Counter

def character_count(text, include_whitespace=True):
    """Calculates the total number of characters in the text."""
    if include_whitespace:
        return len(text)
    return len(text.replace(" ", "").replace("\n", "").replace("\r", ""))

def word_count(text):
    """Calculates the total number of words in the text."""
    words = text.split()
    return len(words)

def sentence_count(text):
    """Calculates the total number of sentences based on terminal punctuation (. ! ?)."""
    # Regex splitting by punctuation followed by space or end of string
    sentences = re.split(r'[.!?]+(?=\s|$)', text)
    # Remove empty splits
    sentences = [s.strip() for s in sentences if s.strip()]
    return len(sentences)

def average_word_length(text):
    """Calculates the average length of words in the text."""
    words = text.split()
    if not words:
        return 0.0
    total_len = sum(len(re.sub(r'[^a-zA-Z0-9]', '', w)) for w in words)
    return round(total_len / len(words), 2)

def word_frequency(text, limit=10):
    """Calculates the frequency distribution of words in the text."""
    # Clean non-alphanumeric characters for word frequency counts
    words = [re.sub(r'[^a-zA-Z0-9]', '', w).lower() for w in text.split()]
    words = [w for w in words if w]
    counter = Counter(words)
    return dict(counter.most_common(limit))

def analyze_text_statistics(text):
    """Compiles a complete analysis report of the input text."""
    return {
        'char_count_total': character_count(text, include_whitespace=True),
        'char_count_no_whitespace': character_count(text, include_whitespace=False),
        'word_count': word_count(text),
        'sentence_count': sentence_count(text),
        'average_word_length': average_word_length(text),
        'top_word_frequencies': word_frequency(text, limit=10)
    }
