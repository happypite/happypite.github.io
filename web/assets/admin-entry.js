import {AUTH_SERVER_URL} from './auth-config.js';
if(AUTH_SERVER_URL){const target=new URL('/auth/login',AUTH_SERVER_URL);if(target.protocol==='https:')location.replace(target.href);}else{document.querySelector('#login-status').textContent='관리자 로그인 연결을 확인해 주세요.';}
