# core/input_handler.py
import pandas as pd
import streamlit as st
from core.db import supabase

def get_required_inputs(project_name: str) -> list:
    """
    Fetches all fields configured as 'Input' for the current project.
    Returns a list of dictionaries containing the field details.
    """
    if not supabase:
        return []
        
    try:
        response = supabase.table("field_mappings").select("*").eq(
            "project_name", project_name
        ).eq("mapping_type", "Input").execute()
        
        return response.data
    except Exception as e:
        st.error(f"Error fetching required inputs: {e}")
        return []


def apply_user_inputs(target_df: pd.DataFrame, user_input_data: dict) -> pd.DataFrame:
    """
    Takes the dictionary of values the user typed into the Streamlit UI
    and applies them across all rows in the target DataFrame.
    """
    if target_df.empty or not user_input_data:
        return target_df

    for target_col, user_val in user_input_data.items():
        # Inject the user's typed value into every row for that column
        target_df[target_col] = user_val
        
    return target_df