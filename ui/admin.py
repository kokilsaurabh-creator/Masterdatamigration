import streamlit as st
import pandas as pd
from core.db import supabase
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

import ui.styles

def render_admin():
    st.markdown(ui.styles.LIGHT_THEME_CSS, unsafe_allow_html=True)
    
    user_info = st.session_state.get('user', {})
    username = user_info.get('username', 'User')
    role = user_info.get('role', 'Admin')

    h1, h2 = st.columns([6, 4])
    with h1:
        st.markdown('<div class="brand-title">Admin User Management</div>', unsafe_allow_html=True)
        st.markdown(
            f'<div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">'
            f'<div class="brand-subtitle">Manage accounts, roles, and project permissions</div>'
            f'<span style="background-color: #eff6ff; color: #0056b3; font-weight: 600; padding: 2px 10px; border-radius: 12px; border: 1px solid #bfdbfe; font-size: 0.78rem;">👤 {username} <span style="background-color: #0056b3; color: white; border-radius: 8px; padding: 1px 5px; font-size: 0.65rem; text-transform: uppercase;">{role}</span></span>'
            f'</div>',
            unsafe_allow_html=True
        )
    with h2:
        ac1, ac2 = st.columns([1.2, 1])
        with ac1:
            if st.button("📁 Projects Home", key="admin_home_btn", use_container_width=True):
                st.session_state['step'] = 1
                st.rerun()
        with ac2:
            if st.button("🚪 Logout", key="admin_logout_btn", use_container_width=True):
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                st.rerun()
                
    st.markdown("<hr style='margin: 1rem 0 1.5rem 0; border: none; border-top: 1px solid #e2e8f0;'>", unsafe_allow_html=True)

    if not supabase:
        st.error("Database connection failed.")
        return

    tab1, tab2, tab3 = st.tabs(["Create User", "Manage Accounts", "Permission Mapping"])

    # --- TAB 1: CREATE USER ---
    with tab1:
        with st.container(border=True):
            st.subheader("Create New User")
            with st.form("create_user_form"):
                new_username = st.text_input("Username")
                new_password = st.text_input("Password", type="password")
                new_role = st.selectbox("Role", ["User", "Admin"])
                
                if st.form_submit_button("Create User", type="primary"):
                    if not new_username or not new_password:
                        st.error("Username and password are required.")
                    else:
                        try:
                            pwd_hash = hash_password(new_password)
                            supabase.table("app_users").insert({
                                "username": new_username,
                                "password_hash": pwd_hash,
                                "role": new_role
                            }).execute()
                            st.success(f"User '{new_username}' created successfully!")
                        except Exception as e:
                            st.error(f"Error creating user: {str(e)}")

    # --- TAB 2: MANAGE ACCOUNTS ---
    with tab2:
        with st.container(border=True):
            st.subheader("All Users")
            try:
                res = supabase.table("app_users").select("id, username, role, is_locked, created_at").execute()
                users_df = pd.DataFrame(res.data)
                if not users_df.empty:
                    st.dataframe(users_df, hide_index=True, use_container_width=True)
                    
                    st.markdown("### Account Controls")
                    col1, col2 = st.columns(2)
                    with col1:
                        target_user = st.selectbox("Select User", users_df['username'].tolist(), key="ctrl_user")
                        lock_status = st.radio("Account Status", ["Active", "Locked"], horizontal=True)
                        if st.button("Update Status"):
                            is_locked = True if lock_status == "Locked" else False
                            supabase.table("app_users").update({"is_locked": is_locked}).eq("username", target_user).execute()
                            st.success(f"Updated status for {target_user} to {lock_status}.")
                            st.rerun()
                    with col2:
                        st.markdown("#### Reset Password")
                        reset_pwd = st.text_input("New Password", type="password", key="reset_pwd")
                        if st.button("Reset Password"):
                            if reset_pwd:
                                supabase.table("app_users").update({"password_hash": hash_password(reset_pwd)}).eq("username", target_user).execute()
                                st.success(f"Password reset for {target_user}.")
                            else:
                                st.error("Please enter a new password.")
                else:
                    st.info("No users found.")
            except Exception as e:
                st.error(f"Error fetching users: {str(e)}")

    # --- TAB 3: PERMISSION MAPPING ---
    with tab3:
        with st.container(border=True):
            st.subheader("Assign Project & Module Access")
            try:
                users_res = supabase.table("app_users").select("id, username").eq("role", "User").execute()
                users_list = [u['username'] for u in users_res.data] if users_res.data else []
                
                projects_res = supabase.table("migration_projects").select("project_name").execute()
                projects_list = [p['project_name'] for p in projects_res.data] if projects_res.data else []
                
                if not users_list:
                    st.info("No Standard Users found to assign permissions.")
                elif not projects_list:
                    st.info("No Projects found.")
                else:
                    with st.form("assign_perm_form"):
                        sel_user = st.selectbox("Select User", users_list)
                        sel_projects = st.multiselect("Select Project Spaces (Multiple allowed)", options=projects_list)
                        sel_modules = st.multiselect(
                            "Master Data Modules (Multiple allowed)", 
                            options=["Material Master", "Vendor Master", "Customer Master"],
                            default=["Material Master", "Vendor Master", "Customer Master"]
                        )
                        
                        if st.form_submit_button("Grant Access", type="primary"):
                            if not sel_projects:
                                st.error("Please select at least one Project Space.")
                            elif not sel_modules:
                                st.error("Please select at least one Master Data Module.")
                            else:
                                user_id = next(u['id'] for u in users_res.data if u['username'] == sel_user)
                                payloads = []
                                for p in sel_projects:
                                    for m in sel_modules:
                                        payloads.append({
                                            "user_id": user_id,
                                            "project_name": p,
                                            "master_type": m
                                        })
                                
                                count_success = 0
                                for item in payloads:
                                    try:
                                        supabase.table("user_permissions").upsert(
                                            item, 
                                            on_conflict="user_id,project_name,master_type"
                                        ).execute()
                                        count_success += 1
                                    except Exception:
                                        pass
                                
                                st.success(f"Successfully assigned {count_success} permission(s) to '{sel_user}'.")
                                st.rerun()
                                
                    st.markdown("---")
                    st.markdown("### Current Permission Mappings")
                    perms_res = supabase.table("user_permissions").select("id, user_id, project_name, master_type").execute()
                    if perms_res.data:
                        user_dict = {u['id']: u['username'] for u in users_res.data}
                        enriched = []
                        for p in perms_res.data:
                            if p['user_id'] in user_dict:
                                enriched.append({
                                    "Permission ID": p['id'],
                                    "Username": user_dict[p['user_id']],
                                    "Project Space": p['project_name'],
                                    "Master Data Module": p['master_type']
                                })
                        
                        if enriched:
                            df_perms = pd.DataFrame(enriched)
                            st.dataframe(df_perms, hide_index=True, use_container_width=True)
                            
                            st.markdown("#### Revoke Permission")
                            perm_options = [
                                f"{row['Permission ID']} - {row['Username']} ({row['Project Space']} | {row['Master Data Module']})"
                                for row in enriched
                            ]
                            target_perm = st.selectbox("Select Permission Entry to Revoke", options=perm_options)
                            if st.button("Revoke Selected Permission", type="secondary"):
                                selected_id = target_perm.split(" - ")[0]
                                try:
                                    supabase.table("user_permissions").delete().eq("id", selected_id).execute()
                                    st.success("Permission revoked successfully!")
                                    st.rerun()
                                except Exception as e:
                                    st.error(f"Error revoking permission: {str(e)}")
                    else:
                        st.info("No permissions currently mapped.")
            except Exception as e:
                st.error(f"Error loading permissions: {str(e)}")
