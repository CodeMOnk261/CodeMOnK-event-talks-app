import argparse
import sys
import os

from text_automation.config import config
from text_automation.utils.file_io import read_file, write_file
from text_automation.utils.text_cleaner import clean_text_pipeline
from text_automation.processors.analyzer import analyze_text_statistics
from text_automation.processors.formatter import wrap_text, align_text

def run_pipeline(args):
    # 1. Read input file
    try:
        content = read_file(args.input, encoding=config.DEFAULT_ENCODING)
    except Exception as e:
        print(f"Error: Failed to read file '{args.input}': {e}", file=sys.stderr)
        sys.exit(1)

    output_data = {}
    processed_text = content

    # 2. Text Cleaning
    if args.clean:
        print("Cleaning text...")
        processed_text = clean_text_pipeline(processed_text)

    # 3. Text Formatting (Wrapping & Alignment)
    if args.wrap:
        width = args.wrap_width or config.MAX_LINE_WRAP_WIDTH
        print(f"Wrapping text to width {width}...")
        processed_text = wrap_text(processed_text, width=width)

    if args.align:
        width = args.wrap_width or config.MAX_LINE_WRAP_WIDTH
        print(f"Aligning text to '{args.align}'...")
        processed_text = align_text(processed_text, alignment=args.align, width=width)

    # 4. Analysis
    if args.analyze:
        print("Analyzing text statistics...")
        stats = analyze_text_statistics(processed_text)
        output_data['statistics'] = stats
        
        # Format statistics output for terminal display
        print("\n=== Text Statistics Analysis ===")
        print(f"Word Count:             {stats['word_count']}")
        print(f"Sentence Count:         {stats['sentence_count']}")
        print(f"Avg Word Length:        {stats['average_word_length']}")
        print(f"Char Count (Total):     {stats['char_count_total']}")
        print(f"Char Count (no spaces): {stats['char_count_no_whitespace']}")
        print("\nTop 10 Word Frequencies:")
        for word, count in stats['top_word_frequencies'].items():
            print(f"  - '{word}': {count}")
        print("================================\n")

    # 5. Save or Print Output
    if args.output:
        # Determine format (JSON if statistics were requested without printing text, otherwise text)
        if args.analyze and not args.clean and not args.wrap and not args.align:
            # Only statistics requested, output JSON
            write_file(args.output, output_data, encoding=config.DEFAULT_ENCODING)
            print(f"Analysis saved to JSON file: {args.output}")
        else:
            # Text changes requested
            write_file(args.output, processed_text, encoding=config.DEFAULT_ENCODING)
            print(f"Processed text successfully saved to: {args.output}")
    else:
        # No output file specified, print to stdout
        if not args.analyze:
            print("\n--- Processed Text ---")
            print(processed_text)
            print("----------------------\n")

def main():
    parser = argparse.ArgumentParser(description="Python Text Automation Command-Line Tool")
    parser.add_argument("input", help="Path to the input text file")
    parser.add_argument("-o", "--output", help="Path to the output file (txt or json)")
    parser.add_argument("-c", "--clean", action="store_true", help="Perform text cleaning pipeline (lowercase, remove punctuation, strip HTML, remove common stopwords)")
    parser.add_argument("-a", "--analyze", action="store_true", help="Analyze text metrics (word count, frequencies, sentence stats)")
    parser.add_argument("-w", "--wrap", action="store_true", help="Wrap text lines to column width")
    parser.add_argument("--wrap-width", type=int, help="Override default line wrapping width (default: 70)")
    parser.add_argument("--align", choices=['left', 'center', 'right'], help="Align text lines")

    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' does not exist.", file=sys.stderr)
        sys.exit(1)

    run_pipeline(args)

if __name__ == "__main__":
    main()
