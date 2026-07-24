# core/mapper.py
import pandas as pd
import streamlit as st
from core.db import supabase

def apply_direct_mapping(raw_df: pd.DataFrame, project_name: str) -> pd.DataFrame:
    """
    Applies 'Direct' field mappings from the database to the raw uploaded data.
    """
    if not supabase:
        st.error("Database connection missing.")
        return pd.DataFrame()

    try:
        # Fetch only the "Direct" mappings for this specific project
        response = supabase.table("field_mappings").select("*").eq(
            "project_name", project_name
        ).eq("mapping_type", "Direct").execute()
        
        direct_mappings = response.data
    except Exception as e:
        st.error(f"Error fetching direct mappings: {e}")
        return pd.DataFrame()

    if not direct_mappings:
        st.warning("No direct mappings found. Please configure the dashboard first.")
        return pd.DataFrame()

    # Initialize a fresh target DataFrame
    target_df = pd.DataFrame()

    # Loop through the mappings and extract the data
    for mapping in direct_mappings:
        target_col = mapping['field_name']
        source_col = mapping['source_field']

        if source_col in raw_df.columns:
            target_df[target_col] = raw_df[source_col]
        else:
            st.warning(f"Source column '{source_col}' missing from uploaded file. Field '{target_col}' will be left blank.")
            target_df[target_col] = "" 
            
    return target_df