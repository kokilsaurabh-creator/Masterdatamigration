import base64
import streamlit as st

# --- EXPOUND LOGO (Capital E with Solid Blue Fill) ---
_SVG_LOGO = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#0056b3" />
  <path d="M 28 22 H 72 V 34 H 42 V 43 H 68 V 55 H 42 V 64 H 72 V 76 H 28 Z" fill="#ffffff" />
</svg>"""

EXPOUND_LOGO = "data:image/svg+xml;base64," + base64.b64encode(_SVG_LOGO.encode('utf-8')).decode('utf-8')

EXPOUND_LOGO_LARGE_HTML = '<div style="display: flex; justify-content: center; margin-bottom: 1.5rem;"><div style="width: 72px; height: 72px; border-radius: 18px; background-color: #0056b3; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 86, 179, 0.2); border: 2px solid rgba(255, 255, 255, 0.2);"><span style="color: #ffffff; font-weight: 900; font-size: 40px; font-family: \'Inter\', system-ui, -apple-system, sans-serif; letter-spacing: -0.04em; line-height: 1;">E</span></div></div>'

EXPOUND_LOGO_HEADER_HTML = '<div style="width: 44px; height: 44px; min-width: 44px; border-radius: 12px; background-color: #0056b3; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0, 86, 179, 0.2);"><span style="color: #ffffff; font-weight: 900; font-size: 24px; font-family: \'Inter\', system-ui, -apple-system, sans-serif; line-height: 1;">E</span></div>'

# --- COMMON CSS FOR BUTTONS & THEME OVERRIDES ---
_GLOBAL_BUTTON_THEME_CSS = """
    /* GLOBAL STREAMLIT COLOR OVERRIDES */
    /* This robustly kills the default orange/red by overriding CSS variables globally */
    :root {
        --primary-color: #0056b3 !important;
        --background-color: #ffffff !important;
        --secondary-background-color: #f8fafc !important;
        --text-color: #0f172a !important;
        --font: "Fira Sans", "Inter", "Segoe UI", system-ui, sans-serif !important;
    }

    /* Force Checkboxes and Radios to use Enterprise Blue instead of Streamlit Red */
    div[data-testid="stCheckbox"] input:checked + div,
    div[data-baseweb="checkbox"] > div {
        background-color: #0056b3 !important;
        border-color: #0056b3 !important;
    }
    
    /* Universal Focus Rings */
    *:focus, input:focus, div[data-baseweb="input"]:focus-within {
        outline: none !important;
        border-color: #0056b3 !important;
        box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.3) !important;
    }

    /* Universal Button Rule */
    button, div.stButton > button, .stButton button {
        white-space: nowrap !important;
    }

    /* Primary Button Styling - Flat Enterprise Blue */
    button[kind="primary"], 
    div.stButton > button[data-testid="stBaseButton-primary"],
    button[data-testid="stBaseButton-primary"],
    .stButton button[kind="primary"] {
        background-color: #0056b3 !important;
        background: #0056b3 !important;
        border: 1px solid #004999 !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        border-radius: 6px !important;
        transition: all 0.2s ease !important;
        white-space: nowrap !important;
    }

    button[kind="primary"]:hover, 
    div.stButton > button[data-testid="stBaseButton-primary"]:hover,
    button[data-testid="stBaseButton-primary"]:hover {
        background-color: #00418d !important;
        background: #00418d !important;
        border-color: #003370 !important;
        color: #ffffff !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        white-space: nowrap !important;
    }

    /* Secondary & Download Buttons */
    button[kind="secondary"],
    div.stDownloadButton > button,
    button[data-testid="stBaseButton-secondary"] {
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
        font-weight: 600 !important;
        background-color: #ffffff !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
        white-space: nowrap !important;
    }

    button[kind="secondary"]:hover,
    div.stDownloadButton > button:hover,
    button[data-testid="stBaseButton-secondary"]:hover {
        border-color: #0056b3 !important;
        color: #0056b3 !important;
        background-color: #f8fafc !important;
        white-space: nowrap !important;
    }

    /* Enterprise Structural Classes & Form Containers */
    .erp-card, div[data-testid="stForm"], div[data-testid="stVerticalBlockBorderWrapper"] {
        background: #ffffff !important;
        border-radius: 8px !important;
        padding: 1.5rem !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) !important;
        border: 1px solid #e2e8f0 !important;
        margin-bottom: 1.25rem !important;
        transition: box-shadow 200ms ease, transform 200ms ease !important;
    }
    
    .erp-card:hover, div[data-testid="stForm"]:hover, div[data-testid="stVerticalBlockBorderWrapper"]:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
    }

    /* Enterprise Data Grids */
    [data-testid="stDataFrame"] {
        border-radius: 8px !important;
        overflow: hidden !important;
        border: 1px solid #e2e8f0 !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
        font-family: 'Fira Code', 'Courier New', Courier, monospace !important;
    }
    
    /* Smooth Row Hover States for Data Accessibility */
    [data-testid="stDataFrame"] table tbody tr {
        transition: background-color 200ms ease;
    }
    [data-testid="stDataFrame"] table tbody tr:hover td, 
    [data-testid="stDataFrame"] table tbody tr:hover th {
        background-color: #f1f5f9 !important;
    }

    [data-testid="stDataFrame"] table th {
        background-color: #f8fafc !important;
        color: #475569 !important;
        font-weight: 700 !important;
        font-size: 0.85rem !important;
        border-bottom: 2px solid #e2e8f0 !important;
        font-family: 'Fira Sans', 'Inter', sans-serif !important;
    }
    
    /* Global Typography Reset for Enterprise Density */
    html, body, [class*="css"] {
        font-family: 'Fira Sans', 'Inter', 'Segoe UI', system-ui, sans-serif !important;
    }

    /* Header Typography and Component Classes */
    .brand-title {
        font-size: 1.15rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
        line-height: 1.2;
    }
    .brand-subtitle {
        font-size: 0.72rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .meta-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .meta-value {
        font-size: 0.95rem;
        font-weight: 700;
        color: #0f172a;
    }
    .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: #f0fdf4;
        color: #15803d;
        border: 1px solid #bbf7d0;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #22c55e;
    }
    .project-title {
        font-size: 1rem;
        font-weight: 700;
        color: #0056b3;
    }
"""

# --- CSS For Screen 1 (Project Setup) ---
LOGIN_THEME_CSS = f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
    
    .block-container {{
        padding-top: 3rem;
        max-width: 700px;
    }}
    .input-label {{
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 4px;
    }}
    #MainMenu {{visibility: hidden;}}
    header {{visibility: hidden;}}
    footer {{visibility: hidden;}}
    {_GLOBAL_BUTTON_THEME_CSS}
</style>
"""

# --- CSS For Screens 2 & 3 (Dashboard and Execution) ---
LIGHT_THEME_CSS = f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

    .block-container {{
        padding-top: 2rem;
        max-width: 95%;
    }}
    #MainMenu {{visibility: hidden;}}
    header {{visibility: hidden;}}
    footer {{visibility: hidden;}}
    {_GLOBAL_BUTTON_THEME_CSS}
</style>
"""