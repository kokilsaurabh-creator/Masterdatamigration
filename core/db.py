# core/db.py
import streamlit as st
from supabase import create_client, Client

@st.cache_resource
def init_connection() -> Client:
    """Initializes and caches the Supabase connection."""
    url = st.secrets["SUPABASE_URL"]
    key = st.secrets["SUPABASE_KEY"]
    return create_client(url, key)

try:
    supabase = init_connection()
except Exception:
    supabase = None
    st.error("⚠️ Database not connected. Please check your .streamlit/secrets.toml file.")


def get_view_saved_mappings(project_name: str, view_name: str) -> dict:
    """
    Fetches saved mappings for a specific project and SAP view.
    Returns a dictionary keyed by the target field name for instant UI lookups.
    """
    if not supabase: 
        return {}
        
    try:
        response = supabase.table("field_mappings").select("*").eq(
            "project_name", project_name
        ).eq("view_name", view_name).execute()
        
        return {row['field_name']: row for row in response.data}
    except Exception as e:
        st.error(f"Error fetching existing mappings: {e}")
        return {}


def save_mapping_to_db(project_name: str, view_name: str, field_name: str, 
                       mapping_type: str, source_field: str, fixed_value: str, is_mandatory: bool) -> bool:
    """
    Upserts (inserts or updates) a single field mapping into Supabase.
    """
    if not supabase: 
        return False
        
    payload = {
        "project_name": project_name,
        "view_name": view_name,
        "field_name": field_name,
        "mapping_type": mapping_type,
        "source_field": source_field,
        "fixed_value": fixed_value,
        "is_mandatory": is_mandatory
    }
    
    try:
        # Note: Ensure your Supabase table has a unique composite key or constraint 
        # on (project_name, view_name, field_name) for upsert to work perfectly.
        supabase.table("field_mappings").upsert(payload).execute()
        return True
    except Exception as e:
        st.error(f"Failed to save mapping for {field_name}: {e}")
        return False