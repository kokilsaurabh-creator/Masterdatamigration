# core/rules_engine.py
import pandas as pd
import streamlit as st
from core.db import supabase

def apply_fixed_rules(target_df: pd.DataFrame, project_name: str) -> pd.DataFrame:
    """
    Applies 'Fixed' field rules from the database to the target data payload.
    """
    if not supabase or target_df.empty:
        return target_df

    try:
        # Fetch only the "Fixed" mappings for this project
        response = supabase.table("field_mappings").select("*").eq(
            "project_name", project_name
        ).eq("mapping_type", "Fixed").execute()
        
        fixed_mappings = response.data
    except Exception as e:
        st.error(f"Error fetching fixed rules: {e}")
        return target_df

    # Inject the hardcoded values across all rows in the DataFrame
    for mapping in fixed_mappings:
        target_col = mapping['field_name']
        fixed_val = mapping['fixed_value']
        
        # This applies the exact fixed value to every single row in the column
        target_df[target_col] = fixed_val
        
    return target_df