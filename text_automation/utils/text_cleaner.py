import re

# Define a set of stopwords for text cleaning
STOPWORDS = {'the', 'a', 'an', 'and', 'or', 'in', 'on', 'to', 'for'}

def remove_extra_whitespace(text):
    """Removes leading, trailing, and duplicate inner whitespaces."""
    return re.sub(r'\s+', ' ', text).strip()

def to_lowercase(text):
    """Converts the text to lowercase."""
    return text.lower()

def strip_html_tags(text):
    """Removes HTML tags from the text using a basic regular expression."""
    return re.sub(r'<[^>]+>', '', text)

def remove_punctuation(text):
    """Removes punctuation by keeping only alphanumeric characters and spaces."""
    return re.sub(r'[^a-zA-Z0-9\s]', '', text)

def remove_stopwords(text, stopwords=STOPWORDS):
    """Removes common English stopwords from the text."""
    words = text.split()
    cleaned_words = [word for word in words if word.lower() not in stopwords]
    return ' '.join(cleaned_words)

def clean_text_pipeline(text):
    """Executes a complete text cleaning pipeline on the input string."""
    text = strip_html_tags(text)
    text = to_lowercase(text)
    text = remove_punctuation(text)
    text = remove_stopwords(text)
    text = remove_extra_whitespace(text)
    return text
