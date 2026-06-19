import textwrap

def wrap_text(text, width=70):
    """Wraps text so that every line is at most 'width' characters long."""
    # Split paragraphs by newline to preserve original paragraph spacing
    paragraphs = text.split('\n')
    wrapped_paragraphs = []
    
    for paragraph in paragraphs:
        if not paragraph.strip():
            wrapped_paragraphs.append("")
        else:
            wrapped_paragraphs.append(textwrap.fill(paragraph, width=width))
            
    return '\n'.join(wrapped_paragraphs)

def format_template(template_str, placeholders):
    """Replaces placeholders format like {variable_name} with actual dictionary values."""
    try:
        return template_str.format(**placeholders)
    except KeyError as ke:
        print(f"Warning: Template placeholder key missing: {ke}")
        return template_str
    except Exception as e:
        print(f"Error formatting template: {e}")
        return template_str

def align_text(text, alignment='left', width=70):
    """Aligns text lines based on alignment mode ('left', 'center', 'right')."""
    lines = text.split('\n')
    aligned_lines = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            aligned_lines.append("")
            continue
            
        if alignment == 'center':
            aligned_lines.append(stripped.center(width))
        elif alignment == 'right':
            aligned_lines.append(stripped.rjust(width))
        else:
            aligned_lines.append(stripped.ljust(width))
            
    return '\n'.join(aligned_lines)
