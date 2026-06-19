import os
import json

def read_file(file_path, encoding='utf-8'):
    """Reads from a file in the specified encoding."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} not found.")
    try:
        with open(file_path, 'r', encoding=encoding) as file:
            return file.read()
    except Exception as e:
        print(f"An error occurred while reading {file_path}: {e}")
        raise e

def write_file(file_path, content, mode='w', encoding='utf-8'):
    """Writes to a file in the specified mode and encoding."""
    try:
        # Create parent directory if it does not exist
        parent_dir = os.path.dirname(file_path)
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)
            
        with open(file_path, mode, encoding=encoding) as file:
            if isinstance(content, str):
                file.write(content)
            elif isinstance(content, (dict, list)):
                json.dump(content, file, indent=4)
            else:
                raise TypeError("Content must be a string, list, or dictionary.")
    except Exception as e:
        print(f"An error occurred while writing to {file_path}: {e}")
        raise e
