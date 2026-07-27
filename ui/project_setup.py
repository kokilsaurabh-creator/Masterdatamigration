# ui/project_setup.py
import streamlit as st
from streamlit_option_menu import option_menu
from ui.styles import LOGIN_THEME_CSS, EXPOUND_LOGO
from core.db import supabase

def render_project_setup():
    import importlib
    import ui.styles
    importlib.reload(ui.styles)
    st.markdown(ui.styles.LOGIN_THEME_CSS, unsafe_allow_html=True)
    
    user_info = st.session_state.get('user', {})
    user_role = user_info.get('role', 'User')
    user_id = user_info.get('id')
    username = user_info.get('username', 'User')

    # Top Integrated Header Action Row
    top_col1, top_col2 = st.columns([5, 5])
    with top_col1:
        st.markdown(
            f'<div style="padding: 4px 0;">'
            f'<span style="background-color: #eff6ff; color: #0056b3; font-weight: 600; padding: 6px 14px; border-radius: 14px; border: 1px solid #bfdbfe; font-size: 0.85rem;">'
            f'👤 Logged in as: <strong style="color: #0f172a;">{username}</strong> '
            f'<span style="background-color: #0056b3; color: white; border-radius: 8px; padding: 2px 7px; font-size: 0.7rem; text-transform: uppercase;">{user_role}</span></span></div>',
            unsafe_allow_html=True
        )
    with top_col2:
        btn_c1, btn_c2 = st.columns([1.6, 1.1])
        with btn_c1:
            if user_role == 'Admin':
                if st.button("⚙️ Admin Panel", key="ps_admin_btn", use_container_width=True):
                    st.session_state['step'] = 4
                    st.rerun()
        with btn_c2:
            if st.button("🚪 Logout", key="ps_logout_btn", use_container_width=True):
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                st.rerun()

    st.markdown(ui.styles.EXPOUND_LOGO_LARGE_HTML, unsafe_allow_html=True)
    
    st.markdown(
        '<h1 style="text-align: center; color: #0f172a; font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em;">Expound Master Data Hub</h1>'
        '<p style="text-align: center; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2rem;">S/4HANA Migration Engine <span style="color: #cbd5e1; padding: 0 4px;">|</span> Enterprise-Grade Precision</p>',
        unsafe_allow_html=True
    )

    existing_projects = []
    allowed_masters = {} # map project -> list of masters
    
    if supabase:
        try:
            if user_role == 'Admin':
                response = supabase.table("migration_projects").select("project_name, master_type").execute()
                for row in response.data:
                    p = row['project_name']
                    m = row['master_type']
                    if p not in existing_projects: existing_projects.append(p)
                    if p not in allowed_masters: allowed_masters[p] = []
                    allowed_masters[p].append(m)
            else:
                # Standard User: fetch from permissions
                response = supabase.table("user_permissions").select("project_name, master_type").eq("user_id", user_id).execute()
                for row in response.data:
                    p = row['project_name']
                    m = row['master_type']
                    if p not in existing_projects: existing_projects.append(p)
                    if p not in allowed_masters: allowed_masters[p] = []
                    allowed_masters[p].append(m)
        except Exception:
            pass

    # Admin gets both tabs, User gets only 'Open Existing Project'
    options = ["Open Existing Project", "Create New Migration"] if user_role == 'Admin' else ["Open Existing Project"]
    icons = ["folder2-open", "plus-circle"] if user_role == 'Admin' else ["folder2-open"]

    mode = option_menu(
        menu_title=None,
        options=options,
        icons=icons,
        orientation="horizontal",
        default_index=0,
        styles={
            "container": {
                "max-width": "100%", "margin": "0 auto 2rem auto",
                "background-color": "#f1f5f9", "padding": "4px",
                "border-radius": "8px", "border": "1px solid #e2e8f0"
            },
            "icon": {"font-size": "13px", "color": "inherit"},
            "nav-link": {
                "font-size": "13px", "text-align": "center", "margin": "0",
                "padding": "10px", "border-radius": "6px", "color": "#64748b",
                "transition": "all 0.2s ease"
            },
            "nav-link-selected": {
                "background-color": "#ffffff", "color": "#0a6ed1",
                "font-weight": "600", "box-shadow": "0 1px 3px rgba(0,0,0,0.1)"
            }
        }
    )

    if mode == "Open Existing Project":
        if not existing_projects:
            st.info("No projects assigned to you. Please contact an Administrator.")
        else:
            st.markdown("<label class='input-label'>Select Project Space</label>", unsafe_allow_html=True)
            selected_project = st.selectbox("Select Project Space", options=existing_projects, label_visibility="collapsed")
            
            # Show allowed modules for this project for Standard Users
            available_modules = allowed_masters.get(selected_project, [])
            selected_module = None
            
            if user_role == 'Admin':
                try:
                    project_row = supabase.table("migration_projects").select("master_type").eq("project_name", selected_project).single().execute()
                    if project_row.data and project_row.data.get('master_type'):
                        selected_module = project_row.data['master_type']
                except:
                    selected_module = "Material Master"
            else:
                st.markdown("<label class='input-label' style='margin-top: 16px;'>Select Module Access</label>", unsafe_allow_html=True)
                selected_module = st.selectbox("Module", options=available_modules, label_visibility="collapsed")

            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("Launch Workspace ➔", type="primary", use_container_width=True):
                st.session_state['current_project'] = selected_project
                st.session_state['selected_master'] = selected_module or "Material Master"
                st.session_state['step'] = 2 
                st.rerun()

    elif mode == "Create New Migration" and user_role == 'Admin':
        st.markdown("<label class='input-label'>New Project Name</label>", unsafe_allow_html=True)
        new_project_name = st.text_input("New Project Name", placeholder="e.g. Global_Rollout_2024", label_visibility="collapsed")
        
        st.markdown("<label class='input-label' style='margin-top: 16px;'>Primary Master Data Type</label>", unsafe_allow_html=True)
        new_master_type = st.selectbox("Primary Master Data Type", ["Material Master", "Vendor Master", "Customer Master"], label_visibility="collapsed")
        
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Initialize Environment ➔", type="primary", use_container_width=True):
            if new_project_name in existing_projects:
                st.error("Project name exists. Choose a unique identifier.")
            elif new_project_name:
                try:
                    supabase.table("migration_projects").insert({
                        "project_name": new_project_name, 
                        "master_type": new_master_type
                    }).execute()
                    
                    st.session_state['current_project'] = new_project_name
                    st.session_state['selected_master'] = new_master_type
                    st.session_state['step'] = 2
                    st.rerun()
                except Exception as e:
                    st.error(f"Database Error: {e}")