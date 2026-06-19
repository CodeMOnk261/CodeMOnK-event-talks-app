import pyttsx3
import os

def get_engine():
    """Initializes and returns a pyttsx3 engine instance."""
    # Initialize pyttsx3 engine on-demand
    return pyttsx3.init()

def speak_text(text, rate=150, volume=1.0):
    """Speaks the input text aloud using local text-to-speech engine."""
    try:
        engine = get_engine()
        engine.setProperty('rate', rate)
        engine.setProperty('volume', volume)
        engine.say(text)
        engine.runAndWait()
        return True
    except Exception as e:
        print(f"Error executing speech: {e}")
        return False

def save_text_to_audio(text, output_filepath, rate=150, volume=1.0):
    """Converts the input text into a spoken audio file (e.g. mp3 or wav)."""
    try:
        # Create output directory if it does not exist
        parent_dir = os.path.dirname(output_filepath)
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)
            
        engine = get_engine()
        engine.setProperty('rate', rate)
        engine.setProperty('volume', volume)
        engine.save_to_file(text, output_filepath)
        engine.runAndWait()
        print(f"Audio file successfully created at: {output_filepath}")
        return True
    except Exception as e:
        print(f"Error saving audio: {e}")
        return False
