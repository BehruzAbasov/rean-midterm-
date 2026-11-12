// Optional Supabase cloud sync; the quiz works locally without configuration.
const status = document.getElementById('cloudStatus');
const email = document.getElementById('cloudEmail');
const login = document.getElementById('cloudLogin');
const signup = document.getElementById('cloudSignup');
const password = document.getElementById('cloudPassword');
const logout = document.getElementById('cloudLogout');
const bridge = window.examBridge;
const examId = 'reanimatologiya-ait-midterm-493-v1';
let client=null,user=null,loading=true,pending=false,timer;
const message=t=>{status.textContent=t;};
function updateButtons(){login.classList.toggle('hide',!!user);signup.classList.toggle('hide',!!user);email.classList.toggle('hide',!!user);password.classList.toggle('hide',!!user);logout.classList.toggle('hide',!user);}
async function flush(){
 if(!client||!user||loading){pending=true;return;}
 pending=false;
 const {error}=await client.from('exam_progress').upsert({user_id:user.id,exam_id:examId,payload:bridge.getState(),updated_at:new Date().toISOString()},{onConflict:'user_id,exam_id'});
 if(error){pending=true;message('Buluda yazılmadı: '+error.message+' • Lokal saxlanır');}
 else message('Buludda saxlanıldı • '+new Date().toLocaleTimeString('az-AZ'));
}
window.addEventListener('exam-state-change',()=>{
 if(!user||loading){pending=true;return;}
 clearTimeout(timer);timer=setTimeout(flush,800);message('Sinxronizasiya...');
});
async function loadProgress(){
 loading=true;
 if(!user){loading=false;updateButtons();message('Lokal yaddaş aktivdir • E-poçt və şifrə ilə daxil olun');return;}
 message('Buluddan nəticələr oxunur...');
 const {data,error}=await client.from('exam_progress').select('payload').eq('user_id',user.id).eq('exam_id',examId).maybeSingle();
 if(error){loading=false;message('Oxuma xətası: '+error.message);return;}
 const local=bridge.getState();const remote=data?.payload;
 if(remote && Number(remote.updatedAt||0)>=Number(local.updatedAt||0)){bridge.setState(remote);pending=false;}
 else pending=true;
 loading=false;updateButtons();if(pending)await flush();else message('Buluddan bərpa olundu');
}
async function init(){
 if(!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY){login.disabled=true;message('Lokal yaddaş aktivdir • Bulud üçün config.js doldurulmalıdır');return;}
 try{
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
  client=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data}=await client.auth.getUser();user=data?.user||null;
  updateButtons();await loadProgress();
  client.auth.onAuthStateChange((event,session)=>{
   const id=session?.user?.id||null;
   if(id===user?.id)return;
   user=session?.user||null;
   setTimeout(()=>loadProgress(),0);
  });
 }catch(error){message('Bulud kitabxanası yüklənmədi • Lokal yaddaş aktivdir');console.error(error);}
}
function credentials(){
 const addr=email.value.trim();
 const pass=password.value;
 if(!/^\\S+@\\S+\\.\\S+$/.test(addr)){message('E-poçt ünvanını düzgün yazın');return null;}
 if(pass.length<6){message('Şifrə ən az 6 simvol olmalıdır');return null;}
 return {email:addr,password:pass};
}
async function passwordAction(isSignup){
 if(!client)return;
 const c=credentials();if(!c)return;
 login.disabled=true;signup.disabled=true;
 message(isSignup?'Qeydiyyat edilir...':'Daxil olunur...');
 try{
  const {data,error}=isSignup?await client.auth.signUp(c):await client.auth.signInWithPassword(c);
  if(error){message('Xəta: '+error.message);return;}
  if(data?.session){user=data.user;updateButtons();await loadProgress();message('Giriş uğurludur • Bulud yaddaşı aktivdir');}
  else if(isSignup)message('Hesab yaradıldı, lakin e-poçt təsdiqi aktivdir. Supabase → Authentication → Providers → Email bölməsində Confirm email ayarını söndürün.');
  else message('Giriş üçün hesabın təsdiqlənməsi tələb olunur.');
 }catch(e){message('Bağlantı xətası: '+e.message);}
 finally{login.disabled=false;signup.disabled=false;}
}
login.addEventListener('click',()=>passwordAction(false));
signup.addEventListener('click',()=>passwordAction(true));
password.addEventListener('keydown',e=>{if(e.key==='Enter')passwordAction(false);});
logout.addEventListener('click',async()=>{
 if(!client)return;
 clearTimeout(timer);if(pending)await flush();
 const {error}=await client.auth.signOut();
 if(error)message('Çıxış xətası: '+error.message);
 else{user=null;updateButtons();message('Çıxış edildi • Lokal yaddaş qalır');}
});
init();
