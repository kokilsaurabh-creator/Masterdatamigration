# app.py
import streamlit as st

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Expound Master Data Hub", 
    page_icon="🏢", 
    layout="wide", 
    initial_sidebar_state="collapsed"
)

# --- SESSION STATE INITIALIZATION ---
if 'step' not in st.session_state:
    st.session_state['step'] = 1 
if 'current_project' not in st.session_state:
    st.session_state['current_project'] = None
if 'selected_master' not in st.session_state:
    st.session_state['selected_master'] = "Material Master"

# --- ROUTING LOGIC ---
import importlib

if st.session_state['step'] == 1:
    import ui.project_setup
    importlib.reload(ui.project_setup)
    ui.project_setup.render_project_setup()
    
elif st.session_state['step'] == 2:
    import ui.dashboard
    importlib.reload(ui.dashboard)
    ui.dashboard.render_dashboard()
    
elif st.session_state['step'] == 3:
    import ui.execution
    importlib.reload(ui.execution)
    ui.execution.render_execution()