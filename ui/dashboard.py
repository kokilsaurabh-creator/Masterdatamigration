# ui/dashboard.py
import streamlit as st
import pandas as pd
import io
import os
import xml.sax.saxutils as saxutils
import re
from streamlit_option_menu import option_menu
from core.db import supabase
from core.config_loader import load_master_schema
from ui.styles import LIGHT_THEME_CSS, EXPOUND_LOGO

# --- LEGACY BRIDGE: Maps clean JSON names to historical Database structures ---
LEGACY_VIEW_MAP = {
    # Material Master Views
    "Basic Data": ("1. Basic Data", "S_MARA"),
    "Additional Descriptions": ("2. Additional Descriptions", "S_MAKT"),
    "Alternative Units of Measure": ("3. Alternative Units of Measure", "S_MARM"),
    "Additional GTINs": ("4. Additional GTINs", "S_MEAN"),
    "Warehouse Product": ("5. Warehouse Product", "S_MATLWH"),
    "Warehouse Product Storage Type": ("6. Warehouse Product Storage Type", "S_MATLWHST"),
    "Distribution Chains": ("7. Distribution Chains", "S_MVKE"),
    "Tax Classification": ("8. Tax Classification", "S_MLAN"),
    "Plant Data": ("9. Plant Data", "S_MARC"),
    "Forecasting Data": ("13. Forecasting Data", "S_MPOP"),
    "Storage Locations": ("10. Storage Locations", "S_MARD"),
    "Production Resources Tools": ("14. Production Resources Tools", "S_PRT"),
    "Inspection Setup Data": ("15. Inspection Setup Data", "S_QMAT"),
    "MRP Area": ("11. MRP Area", "S_MRP_AREA"),
    "Valuation Data": ("12. Valuation Data", "S_MBEW"),
    "Valuation Current Period": ("16. Valuation Current Period", "S_MBEW_CURR"),
    "Valuation Future Price": ("17. Valuation Future Price", "S_MBEW_FUT"),
    
    # Customer Master Views
    "General Data": ("1. General Data", "S_CUST_GEN"),
    "Additional Addresses": ("1.1 Additional Addresses", "S_CUST_ADDR"),
    "Company Data": ("2. Company Data", "S_CUST_COMPANY"),
    "Sales Data": ("3. Sales Data", "S_CUST_SALES_DATA"),
    "Sales Partner": ("4. Sales Partner", "S_CUST_SALES_PARTNER"),
    "Output Tax": ("5. Output Tax", "S_CUST_TAX"),

    # Vendor Master Views
    "Purchasing Data": ("3. Purchasing Data", "S_VEND_PURCHASING"),
    "Partner Functions": ("4. Partner Functions", "S_VEND_PARTNER"),
    "Withholding Tax": ("5. Withholding Tax", "S_VEND_WTAX")
}

def get_legacy_view_info(json_view_name):
    """Returns the (Historical DB View Name, SAP Structure)"""
    if json_view_name in LEGACY_VIEW_MAP:
        return LEGACY_VIEW_MAP[json_view_name]
    clean_struct = re.sub(r'[^A-Za-z0-9_]', '', json_view_name.replace(' ', '_')).upper()
    return (json_view_name, f"S_{clean_struct}")

# --- CACHED DB HELPERS ---
@st.cache_data(show_spinner=False)
def get_all_saved_mappings(project_name: str):
    try:
        res_all = supabase.table("field_mappings").select(
            "view_name, field_name, is_mandatory, mapping_type, fixed_value"
        ).eq("project_name", project_name).execute()
        return res_all.data
    except Exception:
        return []

@st.cache_data(show_spinner=False)
def get_view_saved_mappings(project_name: str, view_name: str):
    try:
        response = supabase.table("field_mappings").select("*").eq(
            "project_name", project_name
        ).eq("view_name", view_name).execute()
        return {row['field_name']: row for row in response.data}
    except Exception:
        return {}

def fetch_all_project_rules(project_name: str, master_type: str):
    """Paginates through Supabase to fetch unlimited rule records, strictly for the selected Master Type."""
    all_rules = []
    page_size = 1000
    start = 0
    while True:
        res = supabase.table("project_fixed_rules").select("rule_data").eq(
            "project_name", project_name
        ).eq("master_type", master_type).range(start, start + page_size - 1).execute()
        
        if not res.data:
            break
        
        all_rules.extend([row['rule_data'] for row in res.data])
        if len(res.data) < page_size:
            break
        start += page_size
    return all_rules

def render_dashboard():
    import importlib
    import ui.styles
    st.markdown(ui.styles.LIGHT_THEME_CSS, unsafe_allow_html=True)
    
    if 'selected_nav' not in st.session_state:
        st.session_state['selected_nav'] = "Field Mapping"
        
    project_name = st.session_state.get('current_project', 'Active Project')
    master_type = st.session_state.get('selected_master', 'Material Master')
    
    user_info = st.session_state.get('user', {})
    if user_info.get('role') != 'Admin':
        res = supabase.table("user_permissions").select("*").eq("user_id", user_info.get('id')).eq("project_name", project_name).eq("master_type", master_type).execute()
        if not res.data:
            st.error(f"🚨 Unauthorized Access: You do not have permissions for {project_name} - {master_type}. Please contact an Administrator.")
            st.stop()

    # --- METADATA HEADER ROW ---
    username = user_info.get('username', 'User')
    role = user_info.get('role', 'User')

    h_col1, h_col2, h_col3, h_col4 = st.columns([3.0, 2.2, 2.6, 4.2])
    
    with h_col1:
        st.markdown(
            f'<div style="display: flex; align-items: center; gap: 12px;">'
            f'{ui.styles.EXPOUND_LOGO_HEADER_HTML}'
            f'<div><div class="brand-title">Expound Master Data Hub</div>'
            f'<div class="brand-subtitle">S/4HANA Migration Engine</div></div></div>',
            unsafe_allow_html=True
        )
        
    with h_col2:
        st.markdown(
            f'<div style="border-left: 1px solid #e2e8f0; padding-left: 1rem; height: 100%; display: flex; flex-direction: column; justify-content: center;">'
            f'<div class="meta-label">Active User</div>'
            f'<div style="margin-top: 2px;"><span style="background-color: #eff6ff; color: #0056b3; font-weight: 600; padding: 4px 12px; border-radius: 12px; border: 1px solid #bfdbfe; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;">👤 {username} <span style="background-color: #0056b3; color: white; border-radius: 8px; padding: 1px 6px; font-size: 0.68rem; text-transform: uppercase;">{role}</span></span></div></div>',
            unsafe_allow_html=True
        )
        
    with h_col3:
        st.markdown(
            f'<div style="text-align: right; height: 100%; display: flex; flex-direction: column; justify-content: center;">'
            f'<div class="meta-label">Active Project Workspace</div>'
            f'<div class="project-title" style="margin-top: 2px;">📁 {project_name}</div></div>',
            unsafe_allow_html=True
        )
        
    with h_col4:
        ac1, ac2, ac3 = st.columns([1.6, 1.2, 1.2])
        with ac1:
            if st.button("Change Project", help="Switch Active Project", use_container_width=True):
                st.session_state['step'] = 1
                st.session_state['current_project'] = None
                if 'generated_xml' in st.session_state:
                    del st.session_state['generated_xml']
                st.rerun()
        with ac2:
            if role == 'Admin':
                if st.button("⚙️ Admin", help="User Management", use_container_width=True):
                    st.session_state['step'] = 4
                    st.rerun()
        with ac3:
            if st.button("🚪 Logout", help="Sign Out", use_container_width=True):
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                st.rerun()
            
    st.markdown("<hr style='margin-top: 1.2rem; margin-bottom: 1.5rem; border: none; border-top: 1px solid #e2e8f0;'>", unsafe_allow_html=True)

    # --- MAIN TABS (Master Data Object) ---
    selected_master = option_menu(
        menu_title=None,
        options=["Material Master", "Vendor Master", "Customer Master"],
        icons=["box-seam", "truck", "people"], 
        default_index=["Material Master", "Vendor Master", "Customer Master"].index(master_type),
        orientation="horizontal",
        styles={
            "container": {"padding": "0!important", "background-color": "transparent", "border-bottom": "1px solid #e2e8f0", "border-radius": "0px", "margin-bottom": "1.5rem"},
            "icon": {"color": "#64748b", "font-size": "16px"},
            "nav-link": {
                "font-size": "15px", "text-align": "center", "margin": "0px", "color": "#475569", 
                "border-radius": "0px", "padding": "12px 20px"
            },
            "nav-link-selected": {
                "background-color": "transparent", "color": "#0056b3", 
                "border-bottom": "3px solid #0056b3", "font-weight": "700"
            },
        }
    )
    
    if selected_master != st.session_state['selected_master']:
        st.session_state['selected_master'] = selected_master
        st.rerun()

    if st.session_state['selected_master'] not in ["Material Master", "Customer Master", "Vendor Master"]:
        st.markdown(f"""
            <div style="text-align: center; padding: 6rem 2rem; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <h1 style="font-size: 3.5rem; margin-bottom: 0.5rem; color: #94a3b8;">🚧</h1>
                <h3 style="color: #334155; margin-bottom: 0.5rem;">Module Under Development</h3>
                <p style="color: #64748b; font-size: 1.1rem;">The migration logic and templates for <b>{st.session_state['selected_master']}</b> are currently being configured.</p>
            </div>
        """, unsafe_allow_html=True)
        return

    # --- DYNAMIC CONFIGURATION BASED ON MASTER DATA TYPE ---
    if st.session_state['selected_master'] == "Material Master":
        base_columns = ["Product Number", "Product Description", "Product Type", "Product Group", "Plant", "Sales Organization", "Distribution Channel"]
        rule_keys = ["Product Type", "Product Group", "Plant", "Sales Organization", "Distribution Channel"]
        primary_key = "Product Number"
        xml_template_file = "Source data for Product.xml"
    elif st.session_state['selected_master'] == "Customer Master":
        base_columns = [
            "Customer Number", "Customer Name", "BP Grouping", 
            "Customer Account Group", "Company Code", "Sales Organization", 
            "Distribution Channel", "Division"
        ]
        rule_keys = [
            "BP Grouping", "Customer Account Group", "Company Code", 
            "Sales Organization", "Distribution Channel", "Division"
        ]
        primary_key = "Customer Number"
        xml_template_file = "Source data for Customer.xml"
    elif st.session_state['selected_master'] == "Vendor Master":
        base_columns = [
            "Vendor Code", "BP Grouping", "Account Group", 
            "BP Type", "Purchasing Organization", "Company Code"
        ]
        rule_keys = [
            "BP Grouping", "Account Group", "BP Type", 
            "Purchasing Organization", "Company Code"
        ]
        primary_key = "Vendor Code"
        supplier_xml = os.path.join("templates", "Source data for Supplier.xml")
        xml_template_file = "Source data for Supplier.xml" if os.path.exists(supplier_xml) else "Source data for Vendor.xml"

    # --- SUB TABS (Workspace Actions) ---
    selected_nav = option_menu(
        menu_title=None,
        options=["Field Mapping", "Rules Definition", "XML Generation"],
        icons=["diagram-3", "file-earmark-ruled", "code-slash"],
        default_index=["Field Mapping", "Rules Definition", "XML Generation"].index(st.session_state['selected_nav']),
        orientation="horizontal",
        styles={
            "container": {"padding": "0!important", "background-color": "transparent", "width": "55%", "margin": "0 auto 2.5rem auto"},
            "icon": {"font-size": "14px"},
            "nav-link": {
                "font-size": "13px", "text-align": "center", "margin": "0px 6px", 
                "color": "#64748b", "background-color": "#f1f5f9", "border-radius": "20px", "padding": "8px 16px"
            },
            "nav-link-selected": {
                "background-color": "#eff6ff", "color": "#0056b3", "font-weight": "600", "border": "1px solid #bfdbfe"
            },
        }
    )

    if selected_nav != st.session_state['selected_nav']:
        st.session_state['selected_nav'] = selected_nav
        st.rerun()

    # --- LOAD JSON SCHEMA ---
    schema = load_master_schema(st.session_state['selected_master'])
    
    if not schema:
        st.error(f"JSON schema for {st.session_state['selected_master']} failed to load. Please check your templates folder.")
        st.stop()
        
    if isinstance(schema, list):
        if len(schema) > 0 and isinstance(schema[0], dict):
            schema = schema[0] 
        else:
            st.error("🚨 Streamlit Cache Conflict: The app is remembering an old, broken structure of your JSON file.")
            st.warning("👉 **Please press the 'C' key on your keyboard, then click 'Clear cache' to fix this instantly.**")
            st.stop()
            
    if not isinstance(schema, dict):
        st.error("Critical formatting error in JSON file. It must be a dictionary.")
        st.stop()

    # Get valid database view names for the CURRENT active Master schema
    valid_master_db_views = [get_legacy_view_info(view)[0] for view in schema.keys()]

    # =========================================================================
    # TAB 1: FIELD MAPPING
    # =========================================================================
    if st.session_state['selected_nav'] == "Field Mapping":
        
        with st.expander("📊 View Saved Mappings Context"):
            try:
                project_mappings = get_all_saved_mappings(project_name)
                # Filter to only show mappings for the current master type
                filtered_mappings = [m for m in project_mappings if m.get('view_name') in valid_master_db_views]
                if filtered_mappings:
                    df_mappings = pd.DataFrame(filtered_mappings)
                    df_mappings.columns = ["SAP View", "Field Name", "Is Mandatory?", "Mapping Rule", "Fixed Value"]
                    st.dataframe(df_mappings, use_container_width=True, hide_index=True)
                else:
                    st.info(f"No fields have been mapped for {st.session_state['selected_master']} in this project yet.")
            except Exception as e:
                st.error(f"Could not load mappings: {e}")

        mapping_options = ["Blank (Default)", "Keep Blank", "Fixed Values", "Based on Fixed Rules", "Based on User Input"]
        st.markdown("---")
        
        selected_view_header = st.selectbox("Select SAP Structure to Configure", options=list(schema.keys()), index=0)
        fields_to_render_json = schema[selected_view_header]
        
        if not isinstance(fields_to_render_json, list):
            st.error(f"🚨 JSON Structure Error in '{selected_view_header}'")
            st.stop()
            
        db_view_name, sap_struct = get_legacy_view_info(selected_view_header)
        existing_mappings = get_view_saved_mappings(project_name, db_view_name)
        
        st.markdown("<br>", unsafe_allow_html=True)
        search_col, scope_col = st.columns([3, 2])

        with search_col:
            search_term = st.text_input("Search field", placeholder="🔍 Find a SAP field by name...", label_visibility="collapsed")
        with scope_col:
            field_scope = st.radio("Show fields", options=["All", "Mandatory only", "Optional only"], horizontal=True, label_visibility="collapsed")

        field_rows = []
        seen_descriptions = set() 
        
        for field_data in fields_to_render_json:
            sap_code = field_data.get("field_name", "")
            desc = field_data.get("description", sap_code)
            is_mand = field_data.get("is_mandatory", False)
            
            if desc in seen_descriptions:
                continue
            seen_descriptions.add(desc)
            
            display_label = f"{sap_code} - {desc}" if sap_code != desc else desc

            if search_term and search_term.lower() not in display_label.lower(): continue
            if field_scope == "Mandatory only" and not is_mand: continue
            if field_scope == "Optional only" and is_mand: continue

            saved_data = existing_mappings.get(desc, {})
            saved_mapping = saved_data.get('mapping_type', 'Blank (Default)')
            saved_value = saved_data.get('fixed_value', "") or ""

            field_rows.append({
                "display_name": display_label,
                "db_field_name": desc, 
                "required_flag": "🔴 Mandatory" if is_mand else "⚪ Optional",
                "mapping_type": saved_mapping,
                "fixed_value": saved_value,
            })

        if not field_rows:
            st.info("No fields match the current filter for this SAP view.")
        else:
            field_df = pd.DataFrame(field_rows)
            edited_df = st.data_editor(
                field_df,
                use_container_width=True,
                hide_index=True,
                height=520,
                disabled=["display_name", "required_flag", "db_field_name"],
                key=f"mapping_editor_{sap_struct}",
                column_config={
                    "display_name": st.column_config.TextColumn("SAP Field (Code - Description)", disabled=True, width="large"),
                    "db_field_name": None, 
                    "required_flag": st.column_config.TextColumn("Req", disabled=True, width="small"),
                    "mapping_type": st.column_config.SelectboxColumn("Mapping Logic", options=mapping_options, width="medium"),
                    "fixed_value": st.column_config.TextColumn("Value / Rule Definition", width="medium"),
                },
            )

            configurations_to_save = []
            validation_error = False

            for row in edited_df.to_dict(orient="records"):
                selection = row.get("mapping_type", "Blank (Default)")
                fixed_val = row.get("fixed_value", "")
                db_field_name = row.get("db_field_name") 
                is_mand = "🔴" in row.get("required_flag", "")

                if is_mand and selection == "Blank (Default)": validation_error = True
                if selection == "Fixed Values" and not str(fixed_val or "").strip(): validation_error = True

                configurations_to_save.append({
                    "project_name": project_name,
                    "sap_structure": sap_struct,
                    "view_name": db_view_name, 
                    "field_name": db_field_name,
                    "is_mandatory": is_mand,
                    "mapping_type": selection,
                    "fixed_value": fixed_val if selection == "Fixed Values" else None,
                })

        st.markdown("---")
        
        c1, c2, c3 = st.columns([7,2,2])
        with c3:
            if st.button(f"Save Mapping", type="primary", use_container_width=True):
                if validation_error:
                    st.error("Cannot save. Please map all mandatory fields and provide values for 'Fixed Values'.")
                else:
                    try:
                        supabase.table("field_mappings").upsert(
                            configurations_to_save, 
                            on_conflict="project_name,sap_structure,field_name"
                        ).execute()
                        get_all_saved_mappings.clear()
                        get_view_saved_mappings.clear()
                        st.success(f"Mapping logic saved for {selected_view_header}")
                    except Exception as e:
                        st.error(f"Database error during save: {e}")

    # =========================================================================
    # TAB 2: RULES DEFINITION
    # =========================================================================
    elif st.session_state['selected_nav'] == "Rules Definition":
        st.subheader("Rules Definition")
        st.markdown("Download the dynamic template, fill in your mapping logic, and upload the completed dataset.")
        
        with st.expander("📊 View Saved Rule Datasets"):
            try:
                saved_rules_data = fetch_all_project_rules(project_name, st.session_state['selected_master'])
                if saved_rules_data:
                    saved_rules_df = pd.DataFrame(saved_rules_data)
                    st.write(f"Total {st.session_state['selected_master']} Rules Loaded: **{len(saved_rules_df)}**")
                    st.dataframe(saved_rules_df, use_container_width=True, hide_index=True)
                else:
                    st.info(f"No rules dataset saved for {st.session_state['selected_master']} in this project.")
            except Exception as e:
                st.error(f"Error loading rules: {e}")

        try:
            response = supabase.table("field_mappings").select("field_name, view_name").eq(
                "project_name", project_name
            ).eq("mapping_type", "Based on Fixed Rules").execute()
            
            rule_fields = []
            for row in response.data:
                if row.get('view_name') in valid_master_db_views:
                    fname = row['field_name']
                    # EXCLUDE all base_columns to ensure identifiers like Customer Number & Name 
                    # never accidentally populate as dynamic rule fields.
                    if fname not in base_columns and fname not in rule_fields:
                        rule_fields.append(fname)
                    
        except Exception as e:
            st.error(f"Error fetching fields: {e}")
            rule_fields = []
            
        if not rule_fields:
            st.warning(f"⚠️ No {st.session_state['selected_master']} fields mapped to 'Based on Fixed Rules' yet. Map fields in the Field Mapping tab first.")
        else:
            # The Rules template strictly starts with the rule_keys
            template_columns = rule_keys + rule_fields
            st.success(f"Found {len(rule_fields)} {st.session_state['selected_master']} fields requiring fixed rules logic.")
            
            df_template = pd.DataFrame(columns=template_columns)
            buffer = io.BytesIO()
            
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df_template.to_excel(writer, index=False, sheet_name='Fixed Rules')
                worksheet = writer.sheets['Fixed Rules']
                for i, col in enumerate(template_columns):
                    worksheet.column_dimensions[worksheet.cell(row=1, column=i+1).column_letter].width = max(len(col) + 2, 15)
            
            st.download_button(
                label="📥 Download Excel Template",
                data=buffer.getvalue(),
                file_name=f"{project_name}_{st.session_state['selected_master'].replace(' ', '_')}_Rules_Template.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            
            st.markdown("---")
            uploaded_file = st.file_uploader("Upload completed Rules Dataset (Excel)", type=["xlsx", "xls"])
            
            if uploaded_file is not None:
                df_uploaded = pd.read_excel(uploaded_file)
                df_uploaded = df_uploaded.fillna("")
                
                st.write(f"##### Pre-Save Verification ({len(df_uploaded)} records)")
                st.dataframe(df_uploaded, use_container_width=True)
                
                c1, c2, c3 = st.columns([7,2,2])
                with c3:
                    if st.button("💾 Save Rules Dataset", type="primary", use_container_width=True):
                        try:
                            supabase.table("project_fixed_rules").delete().eq(
                                "project_name", project_name
                            ).eq("master_type", st.session_state['selected_master']).execute()
                            
                            records = df_uploaded.to_dict(orient='records')
                            insert_payload = [
                                {
                                    "project_name": project_name, 
                                    "master_type": st.session_state['selected_master'], 
                                    "rule_data": record
                                } for record in records
                            ]
                            
                            batch_size = 500
                            progress_bar = st.progress(0)
                            
                            for i in range(0, len(insert_payload), batch_size):
                                chunk = insert_payload[i:i + batch_size]
                                supabase.table("project_fixed_rules").insert(chunk).execute()
                                progress_bar.progress(min((i + batch_size) / len(insert_payload), 1.0))
                                
                            st.success(f"Successfully saved all {len(insert_payload)} rule records!")
                        except Exception as e:
                            st.error(f"Error saving rules: {e}")

    # =========================================================================
    # TAB 3: XML GENERATION
    # =========================================================================
    elif st.session_state['selected_nav'] == "XML Generation":
        st.subheader("Payload Generation (XML)")
        st.markdown(f"Inject raw data into the {st.session_state['selected_master']} XML Migration template.")
        
        try:
            res_mappings = supabase.table("field_mappings").select("*").eq("project_name", project_name).execute()
            all_mappings = [row for row in res_mappings.data if row.get('view_name') in valid_master_db_views]
            
            user_mapped_fields = []
            for row in all_mappings:
                fname = row['field_name']
                if row['mapping_type'] == "Based on User Input" and fname not in base_columns:
                    if fname not in user_mapped_fields:
                        user_mapped_fields.append(fname)
            
            saved_rules = fetch_all_project_rules(project_name, st.session_state['selected_master'])
            
            sloc_mappings = []
            if st.session_state['selected_master'] == "Material Master":
                try:
                    sloc_res = supabase.table("PlantStorageLocationMapping").select("plant_code, storage_location_code").eq("project_name", project_name).execute()
                    sloc_mappings = sloc_res.data if sloc_res.data else []
                except Exception:
                    pass
            
        except Exception as e:
            st.error(f"Configuration load error: {e}")
            all_mappings, user_mapped_fields, saved_rules = [], [], []
            
        template_columns = base_columns + user_mapped_fields
        
        st.markdown("##### 1. Source Data Template")
        df_user_template = pd.DataFrame(columns=template_columns)
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df_user_template.to_excel(writer, index=False, sheet_name='User Data')
            worksheet = writer.sheets['User Data']
            for i, col in enumerate(template_columns):
                worksheet.column_dimensions[worksheet.cell(row=1, column=i+1).column_letter].width = max(len(col) + 2, 15)
        
        st.download_button(
            label="📥 Download Upload Template",
            data=buffer.getvalue(),
            file_name=f"{project_name}_{st.session_state['selected_master'].replace(' ', '_')}_Upload_Template.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        
        st.markdown("---")
        st.markdown("##### 2. Execute Transformation")
        uploaded_file = st.file_uploader("Upload raw data (Excel)", type=["xlsx", "xls"], key="user_data_upload")
        
        if uploaded_file is not None:
            df_uploaded = pd.read_excel(uploaded_file)
            df_uploaded = df_uploaded.fillna("")
            
            st.write(f"Detected **{len(df_uploaded)}** records. Loaded **{len(saved_rules)}** rules for evaluation.")
            st.dataframe(df_uploaded, use_container_width=True)
            
            c1, c2 = st.columns([8, 2])
            with c2:
                if st.button("▶ Execute Migration Logic", type="primary", use_container_width=True):
                    template_path = os.path.join("templates", xml_template_file)
                    
                    if not os.path.exists(template_path):
                        st.error(f"Missing core XML template: {template_path}")
                    else:
                        with st.spinner("Processing data mappings..."):
                            final_sap_data = {}
                            user_materials = df_uploaded.to_dict(orient='records')
                            
                            def normalize_val(v):
                                if pd.isna(v) or v is None: return ""
                                s = str(v).strip()
                                return s[:-2] if s.endswith(".0") else s
                                
                            def get_material_value(mat_dict, fname):
                                if not isinstance(mat_dict, dict): return ""
                                v = mat_dict.get(fname)
                                if v is not None and str(v).strip() != "":
                                    return normalize_val(v)
                                
                                fname_clean = str(fname).replace("*", "").strip().lower()
                                for k, val in mat_dict.items():
                                    k_clean = str(k).replace("*", "").strip().lower()
                                    if k_clean == fname_clean and val is not None and str(val).strip() != "":
                                        return normalize_val(val)
                                        
                                if fname in ["Customer Number", "Customer", "KUNNR", primary_key]:
                                    for alt in ["Customer Number", "Customer Number*", "Customer", "Customer Code", "Customer No", "KUNNR"]:
                                        alt_v = mat_dict.get(alt)
                                        if alt_v is not None and str(alt_v).strip() != "":
                                            return normalize_val(alt_v)
                                            
                                if fname in ["Vendor Code", "Vendor", "Supplier", "LIFNR", primary_key]:
                                    for alt in ["Vendor Code", "Vendor Code*", "Vendor Number", "Supplier Number", "Supplier", "LIFNR"]:
                                        alt_v = mat_dict.get(alt)
                                        if alt_v is not None and str(alt_v).strip() != "":
                                            return normalize_val(alt_v)

                                if fname in ["Product Number", "Material", "MATNR", primary_key]:
                                    for alt in ["Product Number", "Product Number*", "Material Number", "Material", "MATNR"]:
                                        alt_v = mat_dict.get(alt)
                                        if alt_v is not None and str(alt_v).strip() != "":
                                            return normalize_val(alt_v)
                                            
                                return ""
                                
                            # --- WILDCARD EXPANSION LOGIC ---
                            expanded_user_materials = []
                            for material in user_materials:
                                if st.session_state['selected_master'] == "Material Master" and (material.get("Plant") == "*" or material.get("Distribution Channel") == "*"):
                                    sales_org = normalize_val(material.get("Sales Organization", ""))
                                    valid_combos = set()
                                    
                                    m_plant = normalize_val(material.get("Plant", ""))
                                    m_dc = normalize_val(material.get("Distribution Channel", ""))
                                    
                                    for rule in saved_rules:
                                        if normalize_val(rule.get("Sales Organization", "")) == sales_org:
                                            r_plant = normalize_val(rule.get("Plant", ""))
                                            r_dc = normalize_val(rule.get("Distribution Channel", ""))
                                            
                                            if m_plant != "*" and m_plant != r_plant:
                                                continue
                                            if m_dc != "*" and m_dc != r_dc:
                                                continue
                                                
                                            valid_combos.add((r_plant, r_dc))
                                            
                                    if not valid_combos:
                                        st.warning(f"No mapped Plant/Distribution Channel found for Sales Organization '{sales_org}' (Record: {material.get(primary_key, 'Unknown')}). Skipping XML generation for this record.")
                                        continue
                                        
                                    for p, dc in valid_combos:
                                        new_mat = material.copy()
                                        new_mat["Plant"] = p
                                        new_mat["Distribution Channel"] = dc
                                        new_mat["Valuation Area"] = p
                                        expanded_user_materials.append(new_mat)
                                        
                                elif st.session_state['selected_master'] == "Customer Master" and (material.get("Distribution Channel") == "*" or material.get("Division") == "*"):
                                    sales_org = normalize_val(material.get("Sales Organization", ""))
                                    valid_combos = set()
                                    
                                    m_dc = normalize_val(material.get("Distribution Channel", ""))
                                    m_div = normalize_val(material.get("Division", ""))
                                    
                                    for rule in saved_rules:
                                        if normalize_val(rule.get("Sales Organization", "")) == sales_org:
                                            r_dc = normalize_val(rule.get("Distribution Channel", ""))
                                            r_div = normalize_val(rule.get("Division", ""))
                                            
                                            if m_dc != "*" and m_dc != r_dc:
                                                continue
                                            if m_div != "*" and m_div != r_div:
                                                continue
                                                
                                            valid_combos.add((r_dc, r_div))
                                            
                                    if not valid_combos:
                                        st.warning(f"No mapped Distribution Channel/Division found for Sales Organization '{sales_org}' (Record: {material.get(primary_key, 'Unknown')}). Skipping XML generation for this record.")
                                        continue
                                        
                                    for dc, div in valid_combos:
                                        new_mat = material.copy()
                                        new_mat["Distribution Channel"] = dc
                                        new_mat["Division"] = div
                                        expanded_user_materials.append(new_mat)
                                        
                                else:
                                    if st.session_state['selected_master'] == "Material Master":
                                        plant_val = normalize_val(material.get("Plant", ""))
                                        if plant_val and plant_val != "*":
                                            material["Valuation Area"] = plant_val
                                    expanded_user_materials.append(material)
                                    
                            user_materials = expanded_user_materials
                            
                            # --- STORAGE LOCATION WILDCARD EXPANSION (Material Master) ---
                            final_user_materials = []
                            for material in user_materials:
                                if st.session_state['selected_master'] == "Material Master" and material.get("Storage Location") == "*":
                                    plant_code = normalize_val(material.get("Plant", ""))
                                    
                                    valid_slocs = set()
                                    for mapping in sloc_mappings:
                                        if normalize_val(mapping.get("plant_code", "")) == plant_code:
                                            valid_slocs.add(normalize_val(mapping.get("storage_location_code", "")))
                                            
                                    if not valid_slocs:
                                        st.warning(f"No mapped Storage Location found for Plant '{plant_code}' (Record: {material.get(primary_key, 'Unknown')}). Skipping XML generation for this record.")
                                        continue
                                        
                                    for sloc in valid_slocs:
                                        new_mat = material.copy()
                                        new_mat["Storage Location"] = sloc
                                        final_user_materials.append(new_mat)
                                else:
                                    final_user_materials.append(material)
                                    
                            user_materials = final_user_materials
                            # --------------------------------
                            
                            for mat_index, material in enumerate(user_materials):
                                matched_rule = {}
                                
                                for rule in saved_rules:
                                    is_match = True
                                    # Logic engine strictly uses rule_keys to match Uploaded Data to Rules Data
                                    for key in rule_keys:
                                        r_val = normalize_val(rule.get(key, ""))
                                        m_val = normalize_val(material.get(key, ""))
                                        if r_val and r_val != m_val:
                                            is_match = False
                                            break
                                    
                                    if is_match:
                                        matched_rule = rule
                                        break
                                
                                for map_config in all_mappings:
                                    raw_view = map_config['view_name']
                                    sheet_name = raw_view.split(". ", 1)[-1] if ". " in raw_view else raw_view
                                    
                                    if sheet_name not in schema:
                                        continue
                                        
                                    field_name = map_config['field_name']
                                    mapping_type = map_config['mapping_type']
                                    
                                    if sheet_name not in final_sap_data:
                                        final_sap_data[sheet_name] = []
                                        
                                    while len(final_sap_data[sheet_name]) <= mat_index:
                                        final_sap_data[sheet_name].append({})
                                    
                                    resolved_value = ""
                                    if mapping_type in ["Blank (Default)", "Keep Blank"]: resolved_value = ""
                                    elif mapping_type == "Fixed Values": resolved_value = map_config.get('fixed_value', "")
                                    elif mapping_type == "Based on Fixed Rules": 
                                        if st.session_state['selected_master'] == "Customer Master" and field_name in ["Reconciliation Account", "AKONT"]:
                                            comp_code = normalize_val(material.get("Company Code", ""))
                                            recon_val = ""
                                            for rule in saved_rules:
                                                if normalize_val(rule.get("Company Code", "")) == comp_code:
                                                    v = normalize_val(rule.get(field_name, rule.get("Reconciliation Account", rule.get("AKONT", ""))))
                                                    if v:
                                                        recon_val = v
                                                        break
                                            resolved_value = recon_val
                                        else:
                                            resolved_value = normalize_val(matched_rule.get(field_name, ""))
                                    elif mapping_type == "Based on User Input" or field_name in base_columns:
                                        resolved_value = get_material_value(material, field_name)
                                        
                                    if pd.isna(resolved_value) or resolved_value is None:
                                        resolved_value = ""
                                        
                                    if st.session_state['selected_master'] == "Material Master" and field_name == "Valuation Area" and not resolved_value:
                                        resolved_value = normalize_val(material.get("Valuation Area", material.get("Plant", "")))
                                        
                                    if st.session_state['selected_master'] == "Customer Master" and field_name in ["Reconciliation Account", "AKONT"] and not resolved_value:
                                        comp_code = normalize_val(material.get("Company Code", ""))
                                        for rule in saved_rules:
                                            if normalize_val(rule.get("Company Code", "")) == comp_code:
                                                v = normalize_val(rule.get(field_name, rule.get("Reconciliation Account", rule.get("AKONT", ""))))
                                                if v:
                                                    resolved_value = v
                                                    break
                                        
                                    if resolved_value != "":
                                        final_sap_data[sheet_name][mat_index][field_name] = resolved_value
                                    elif field_name not in final_sap_data[sheet_name][mat_index]:
                                        final_sap_data[sheet_name][mat_index][field_name] = ""

                            # Ensure primary_key (e.g. Customer Number) is auto-populated for every sheet record if missing
                            for s_name in final_sap_data:
                                for m_idx, mat_rec in enumerate(user_materials):
                                    if len(final_sap_data[s_name]) > m_idx:
                                        pk_v = get_material_value(mat_rec, primary_key)
                                        if pk_v:
                                            for pk_alias in [primary_key, "Customer Number", "Product Number", "Vendor Code", "KUNNR", "MATNR", "LIFNR"]:
                                                if pk_alias in final_sap_data[s_name][m_idx] and not final_sap_data[s_name][m_idx][pk_alias]:
                                                    final_sap_data[s_name][m_idx][pk_alias] = pk_v
                                            if primary_key not in final_sap_data[s_name][m_idx] or not final_sap_data[s_name][m_idx][primary_key]:
                                                final_sap_data[s_name][m_idx][primary_key] = pk_v
                             
                            with open(template_path, "r", encoding="utf-8") as f:
                                xml_content = f.read()
                                
                            for sheet_name, rows_list in final_sap_data.items():
                                sheet_start_tag = f'<Worksheet ss:Name="{sheet_name}"'
                                
                                if sheet_start_tag in xml_content:
                                    def has_primary_key_val(row_dict):
                                        val = row_dict.get(primary_key, "")
                                        if str(val).strip():
                                            return True
                                        for alt in ["Vendor Code", "Vendor code", "Supplier Number", "Vendor Number", "Supplier", "Product Number", "Customer Number", "Product", "Customer", "Vendor"]:
                                            if str(row_dict.get(alt, "")).strip():
                                                return True
                                        return False

                                    valid_rows = [r for r in rows_list if has_primary_key_val(r)]
                                    
                                    if not valid_rows: continue
                                    
                                    # --- OUTPUT TAX SLASH EXPANSION (Customer Master) ---
                                    if st.session_state['selected_master'] == "Customer Master" and sheet_name == "Output Tax":
                                        expanded_output_tax_rows = []
                                        for r in valid_rows:
                                            cat_val = str(r.get("Tax Category", r.get("TATYP", ""))).strip()
                                            class_val = str(r.get("Tax Classification", r.get("TAXKD", ""))).strip()
                                            
                                            cat_list = [x.strip() for x in cat_val.split("/") if x.strip()] if "/" in cat_val else ([cat_val] if cat_val else [])
                                            class_list = [x.strip() for x in class_val.split("/") if x.strip()] if "/" in class_val else ([class_val] if class_val else [])
                                            
                                            num_splits = max(len(cat_list), len(class_list))
                                            if num_splits > 1:
                                                for i in range(num_splits):
                                                    new_r = r.copy()
                                                    if cat_list:
                                                        c_item = cat_list[i] if i < len(cat_list) else cat_list[-1]
                                                        new_r["Tax Category"] = c_item
                                                        new_r["TATYP"] = c_item
                                                    if class_list:
                                                        cl_item = class_list[i] if i < len(class_list) else class_list[-1]
                                                        new_r["Tax Classification"] = cl_item
                                                        new_r["TAXKD"] = cl_item
                                                    expanded_output_tax_rows.append(new_r)
                                            else:
                                                expanded_output_tax_rows.append(r)
                                        valid_rows = expanded_output_tax_rows
                                    
                                    exact_column_order = [f.get("description", f.get("field_name")) for f in schema[sheet_name]]
                                    
                                    # --- DEDUPLICATION LOGIC PER WORKSHEET ---
                                    # 1. Header/Root sheets ("Basic Data", "General Data") must contain only unique primary key records.
                                    # 2. All worksheets deduplicate exact row value tuples across exact_column_order.
                                    deduped_rows = []
                                    seen_keys = set()
                                    seen_tuples = set()
                                    is_header_sheet = sheet_name in ["Basic Data", "General Data"]

                                    for r in valid_rows:
                                        pk_val = str(r.get(primary_key, "")).strip()
                                        if not pk_val:
                                            for alt in ["Vendor Code", "Vendor code", "Supplier Number", "Vendor Number", "Supplier", "Product Number", "Customer Number", "Product", "Customer", "Vendor"]:
                                                pk_val = str(r.get(alt, "")).strip()
                                                if pk_val:
                                                    break
                                                    
                                        if is_header_sheet and pk_val:
                                            if pk_val in seen_keys:
                                                continue
                                            seen_keys.add(pk_val)
                                            
                                        row_tuple = tuple(str(r.get(field, "")).strip() for field in exact_column_order)
                                        if row_tuple in seen_tuples:
                                            continue
                                        seen_tuples.add(row_tuple)

                                        deduped_rows.append(r)

                                    valid_rows = deduped_rows
                                    num_new_rows = len(valid_rows)
                                    
                                    if num_new_rows == 0: continue
                                    
                                    sheet_xml_rows = ""
                                    for row_dict in valid_rows:
                                        sheet_xml_rows += "    <Row>\n"
                                        for field in exact_column_order:
                                            val = row_dict.get(field, "")
                                            safe_val = saxutils.escape(str(val))
                                            sheet_xml_rows += f'        <Cell><Data ss:Type="String">{safe_val}</Data></Cell>\n'
                                        sheet_xml_rows += "    </Row>\n"
                                    
                                    parts = xml_content.split(sheet_start_tag, 1)
                                    before_sheet = parts[0]
                                    sheet_and_after = parts[1]
                                    
                                    table_parts = sheet_and_after.split("</Table>", 1)
                                    inside_table = table_parts[0]
                                    after_table = table_parts[1]
                                    
                                    def update_row_count(match):
                                        old_count = int(match.group(1))
                                        new_count = old_count + num_new_rows
                                        return f'ss:ExpandedRowCount="{new_count}"'
                                    
                                    inside_table = re.sub(r'ss:ExpandedRowCount="(\d+)"', update_row_count, inside_table, count=1)
                                    xml_content = before_sheet + sheet_start_tag + inside_table + sheet_xml_rows + "</Table>" + after_table
                                    
                            st.session_state['generated_xml'] = xml_content
                            st.success("Payload structured successfully.")

            if 'generated_xml' in st.session_state:
                st.download_button(
                    label="📥 Download SAP XML Payload",
                    data=st.session_state['generated_xml'],
                    file_name=f"{project_name}_{st.session_state['selected_master'].replace(' ', '_')}_Migration_Payload.xml",
                    mime="application/xml"
                )