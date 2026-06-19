import os

class Config:
    DEFAULT_ENCODING = 'utf-8'
    MAX_LINE_WRAP_WIDTH = 70
    ALLOWED_INPUT_FORMATS = ['txt', 'md', 'json']
    LOG_PATH = os.path.join(os.path.dirname(__file__), 'logs')
    OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')

config = Config()
