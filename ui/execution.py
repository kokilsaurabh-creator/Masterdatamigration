# ui/execution.py
import streamlit as st
import pandas as pd
import io
from ui.styles import LIGHT_THEME_CSS, EXPOUND_LOGO
from core.mapper import apply_direct_mapping
from core.rules_engine import apply_fixed_rules
from core.input_handler import get_required_inputs, apply_user_inputs

def render_execution():
    st.markdown(LIGHT_THEME_CSS, unsafe_allow_html=True)
    
    project_name = st.session_state.get('current_project')
    master_type = st.session_state.get('selected_master')
    
    # --- Top Navigation ---
    col1, col2, col3 = st.columns([1, 6, 1])
    with col1:
        if st.button("← Back to Config"):
            st.session_state['step'] = 2
            st.rerun()
    with col2:
        st.markdown(f"<h2 style='text-align: center; margin: 0;'>{project_name} - Execution</h2>", unsafe_allow_html=True)
        st.markdown(f"<p style='text-align: center; color: #64748b; font-weight: bold;'>Data Pipeline: {master_type}</p>", unsafe_allow_html=True)
    with col3:
        from ui.styles import EXPOUND_LOGO_HEADER_HTML
        st.markdown(f"<div style='display: flex; justify-content: flex-end;'>{EXPOUND_LOGO_HEADER_HTML}</div>", unsafe_allow_html=True)
        
    st.divider()

    # --- 1. File Upload ---
    st.subheader("1. Upload Legacy Data")
    uploaded_file = st.file_uploader("Upload Legacy Excel or CSV", type=["xlsx", "xls", "csv"])

    # --- 2. Dynamic User Inputs ---
    st.subheader("2. Run-Time Variables")
    required_inputs = get_required_inputs(project_name)
    user_input_data = {}
    
    if not required_inputs:
        st.info("No manual inputs configured for this project.")
    else:
        # Dynamically generate Streamlit inputs based on the database configuration
        for req in required_inputs:
            field_name = req['field_name']
            is_mand = req['is_mandatory']
            
            label = f"Assign {field_name}" + (" *" if is_mand else "")
            user_val = st.text_input(label, key=f"run_input_{field_name}")
            
            if user_val:
                user_input_data[field_name] = user_val

    # --- 3. Execute Pipeline ---
    st.subheader("3. Execute Migration")
    if st.button("🚀 Process Data", type="primary", use_container_width=True):
        if not uploaded_file:
            st.error("Please upload a legacy data file first.")
            return

        with st.spinner("Executing S/4HANA Pipeline..."):
            # Load raw data
            if uploaded_file.name.endswith('.csv'):
                raw_df = pd.read_csv(uploaded_file)
            else:
                raw_df = pd.read_excel(uploaded_file)

            # Step 1: Direct Mapping
            target_df = apply_direct_mapping(raw_df, project_name)
            
            if target_df.empty:
                st.error("Transformation failed. Please check your mapping configurations.")
                return

            # Step 2: Fixed Rules
            target_df = apply_fixed_rules(target_df, project_name)
            
            # Step 3: User Inputs
            target_df = apply_user_inputs(target_df, user_input_data)

            st.success("✅ Transformation Complete!")
            st.dataframe(target_df.head(50), use_container_width=True)

            # --- Download Final File ---
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
                target_df.to_excel(writer, index=False, sheet_name='S4_Load_Ready')
            
            st.download_button(
                label="📥 Download S/4HANA Ready Excel",
                data=buffer.getvalue(),
                file_name=f"{project_name}_S4_Load.xlsx",
                mime="application/vnd.ms-excel",
                type="secondary",
                use_container_width=True
            )