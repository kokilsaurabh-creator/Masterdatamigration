# core/config_loader.py
import json
import os
import streamlit as st

@st.cache_data(show_spinner=False)
def load_master_schema(master_type: str) -> dict:
    """
    Loads the correct JSON schema from the templates folder 
    based on the selected master data type.
    """
    # Map the dropdown selection from project_setup.py to the correct JSON file
    file_map = {
        "Material Master": "material_fields.json",
        "Vendor Master": "vendor_fields.json",
        "Customer Master": "customer_fields.json"
    }
    
    filename = file_map.get(master_type)
    if not filename:
        st.error(f"Schema configuration for {master_type} not found.")
        return {}
        
    filepath = os.path.join("templates", filename)
    
    try:
        if not os.path.exists(filepath):
            st.error(f"⚠️ JSON file not found: {filepath}. Please ensure it exists in the templates directory.")
            return {}
        if os.path.getsize(filepath) == 0:
            st.error(f"⚠️ JSON file is empty (0 bytes): {filepath}. Please paste your JSON structure into the file.")
            return {}
        with open(filepath, 'r', encoding='utf-8') as file:
            schema = json.load(file)
        return schema
    except FileNotFoundError:
        st.error(f"⚠️ JSON file not found: {filepath}. Please ensure it exists in the templates directory.")
        return {}
    except json.JSONDecodeError as err:
        st.error(f"⚠️ Formatting error in {filepath} (Line {err.lineno}, Col {err.colno}): {err.msg}")
        return {}