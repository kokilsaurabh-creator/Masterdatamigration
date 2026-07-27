import streamlit as st
import hashlib
from core.db import supabase
import ui.styles

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def render_login():
    st.markdown(ui.styles.LOGIN_THEME_CSS, unsafe_allow_html=True)
    st.markdown(ui.styles.EXPOUND_LOGO_LARGE_HTML, unsafe_allow_html=True)
    
    st.markdown(
        '<h1 style="text-align: center; color: #0f172a; font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em;">Expound Master Data Hub</h1>'
        '<p style="text-align: center; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2rem;">Enterprise Secure Login</p>',
        unsafe_allow_html=True
    )

    if not supabase:
        st.error("Database connection failed. Please check secrets.toml.")
        return

    # Use Streamlit form to cleanly group inputs without HTML container distortion
    with st.form("login_form", clear_on_submit=False):
        st.markdown("<label class='input-label'>Username</label>", unsafe_allow_html=True)
        username = st.text_input("Username", placeholder="Enter your username", label_visibility="collapsed")
        
        st.markdown("<label class='input-label' style='margin-top: 16px;'>Password</label>", unsafe_allow_html=True)
        password = st.text_input("Password", type="password", placeholder="Enter your password", label_visibility="collapsed")
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        submit_btn = st.form_submit_button("Secure Login ➔", type="primary", use_container_width=True)
        if submit_btn:
            if not username or not password:
                st.error("Please enter both username and password.")
            else:
                try:
                    res = supabase.table("app_users").select("*").eq("username", username).execute()
                    if res.data and len(res.data) > 0:
                        user_record = res.data[0]
                        if user_record.get('is_locked', False):
                            st.error("Access Denied: Your account has been locked. Please contact an Administrator.")
                        else:
                            pwd_hash = hash_password(password)
                            if pwd_hash == user_record['password_hash']:
                                st.session_state['user'] = user_record
                                st.session_state['step'] = 1
                                st.rerun()
                            else:
                                st.error("Invalid credentials.")
                    else:
                        st.error("Invalid credentials.")
                except Exception as e:
                    st.error(f"Authentication Error: {str(e)}")
