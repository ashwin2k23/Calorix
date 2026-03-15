// ════════════════════════════════════════
// STATE
// ════════════════════════════════════════
var S = {
  consumed: 1480, burned: 320, goal: 2100,
  water: 5, wTotal: 8,
  wkCpm: 8, wkName: 'Running',
  unit: 'metric', planGoal: 'maintain',
  obStep: 1, actLevel: 1.55, obGoal: 'maintain',
  theme: 'dark',
  weekWorkouts: 4,
  weightHistory: [78.5,78.0,77.6,77.2,76.8,76.2],
  weeklyData: [1820,2100,1650,1950,1480,0,0],
  totalProt: 108, totalCarb: 162, totalFat: 31
};
var charts = {};

var FOODS = [
  {n:'Banana',c:89,p:1,cb:23,f:0,e:'🍌'},
  {n:'Apple',c:72,p:0,cb:19,f:0,e:'🍎'},
  {n:'Egg',c:78,p:6,cb:0,f:5,e:'🥚'},
  {n:'Chicken Breast',c:165,p:31,cb:0,f:4,e:'🍗'},
  {n:'Brown Rice',c:216,p:5,cb:44,f:2,e:'🍚'},
  {n:'Oatmeal',c:158,p:6,cb:27,f:3,e:'🥣'},
  {n:'Almonds',c:164,p:6,cb:6,f:14,e:'🥜'},
  {n:'Avocado',c:234,p:3,cb:12,f:21,e:'🥑'},
  {n:'Salmon',c:208,p:28,cb:0,f:10,e:'🐟'},
  {n:'Greek Yogurt',c:100,p:17,cb:6,f:0,e:'🥛'},
  {n:'Broccoli',c:55,p:4,cb:11,f:1,e:'🥦'},
  {n:'Sweet Potato',c:130,p:2,cb:30,f:0,e:'🍠'},
  {n:'Protein Shake',c:120,p:25,cb:5,f:2,e:'🥤'},
  {n:'Orange',c:62,p:1,cb:15,f:0,e:'🍊'},
  {n:'Pizza Slice',c:285,p:12,cb:36,f:10,e:'🍕'},
  {n:'Caesar Salad',c:220,p:8,cb:14,f:16,e:'🥗'},
  {n:'Burger',c:540,p:28,cb:45,f:26,e:'🍔'},
  {n:'Pasta',c:320,p:12,cb:60,f:4,e:'🍝'},
  {n:'Steak',c:271,p:26,cb:0,f:18,e:'🥩'},
  {n:'White Rice',c:242,p:4,cb:53,f:0,e:'🍚'},
  {n:'Lentils',c:116,p:9,cb:20,f:0,e:'🫘'},
  {n:'Cottage Cheese',c:98,p:11,cb:3,f:4,e:'🧀'},
  {n:'Blueberries',c:57,p:1,cb:14,f:0,e:'🫐'},
  {n:'Whole Milk',c:149,p:8,cb:12,f:8,e:'🥛'}
];

var TIPS_DATA = [
  {e:'💧',cat:'Hydration',title:'Drink water before meals',body:'Drinking 500ml of water 30 minutes before eating can reduce calorie intake by up to 13% and boost metabolism by 24–30% for 60–90 minutes.'},
  {e:'🥦',cat:'Nutrition',title:'The half-plate rule',body:'Fill half your plate with non-starchy vegetables. They are low in calories, high in fiber, and rich in vitamins and minerals that regulate hunger hormones.'},
  {e:'😴',cat:'Recovery',title:'Sleep and weight management',body:'Poor sleep (under 7 hours) increases ghrelin (hunger hormone) by 24% and decreases leptin (fullness hormone), making you eat 300–500 more calories the next day.'},
  {e:'🏃',cat:'Movement',title:'Post-meal walks reduce blood sugar',body:'A 10-minute walk after eating can lower blood glucose spikes by up to 22%. This reduces fat storage and improves insulin sensitivity over time.'},
  {e:'💪',cat:'Protein',title:'Protein preserves muscle during weight loss',body:'Eating 1.6–2.2g of protein per kg of bodyweight maintains muscle while in a calorie deficit. Prioritize chicken, fish, eggs, legumes, and dairy.'},
  {e:'⏰',cat:'Timing',title:'Eat within a 8–10 hour window',body:'Time-restricted eating (e.g., 10am–8pm) aligns food intake with your circadian rhythm, which can improve fat burning, insulin sensitivity, and sleep quality.'},
  {e:'🧠',cat:'Mindfulness',title:'Eat slowly — your gut needs 20 minutes',body:'It takes 20 minutes for stretch receptors in your stomach to signal fullness to your brain. Eating slowly naturally reduces portion sizes by 10–15%.'},
  {e:'🥜',cat:'Healthy Fats',title:'Fat does not make you fat',body:'Healthy fats from avocados, nuts, and olive oil increase satiety, support hormone production, and improve nutrient absorption. Aim for 20–35% of daily calories from fats.'},
  {e:'🌿',cat:'Fiber',title:'Fiber is the forgotten nutrient',body:'Most people consume only 15g of fiber daily vs. the recommended 25–38g. Fiber feeds gut bacteria, slows digestion, and reduces LDL cholesterol significantly.'},
  {e:'☀️',cat:'Vitamin D',title:'Vitamin D supports metabolism',body:'Low Vitamin D is linked to higher body fat and reduced weight loss. Get 15–20 minutes of midday sun or supplement with 1,000–2,000 IU daily.'}
];

// ════════════════════════════════════════
// THEME
// ════════════════════════════════════════
function toggleTheme() {
  S.theme = S.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', S.theme);
  var isDark = S.theme === 'dark';
  document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('theme-icon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('theme-label').textContent = isDark ? 'Dark Mode' : 'Light Mode';
  var tgl = document.getElementById('theme-tgl');
  if (tgl) tgl.classList.toggle('on', isDark);
  showToast(isDark ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️');
  // Rebuild charts with new colors
  if (charts.trend) { charts.trend.destroy(); charts.trend = null; }
  if (charts.wt) { charts.wt.destroy(); charts.wt = null; }
  setTimeout(function() {
    buildCharts();
    if (document.getElementById('pg-progress').classList.contains('on')) buildWtChart();
  }, 50);
}

// ════════════════════════════════════════
// FIREBASE AUTH
// ════════════════════════════════════════
var firebaseApp = null;
var firebaseAuth = null;
var firebaseInitialized = false;

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAGHTURQtEQRyDVDpq2IWfTd1gGAAutAXo",
  authDomain: "calorie-c115c.firebaseapp.com",
  projectId: "calorie-c115c",
  storageBucket: "calorie-c115c.firebasestorage.app",
  messagingSenderId: "190445844960",
  appId: "1:190445844960:web:ee8e202e608c94537ad385",
  measurementId: "G-1EB46FSR44"
};

function tryInitFirebase(jsonStr) {
  try {
    var cfg = typeof jsonStr === 'object' ? jsonStr : JSON.parse(jsonStr);
    if (!cfg.apiKey || !cfg.authDomain) { return false; }
    if (firebaseInitialized) {
      localStorage.setItem('ctp-firebase-cfg', JSON.stringify(cfg));
      return true;
    }
    firebaseApp = firebase.initializeApp(cfg);
    firebaseAuth = firebase.auth();
    firebaseInitialized = true;
    FIREBASE_CONFIG = cfg;
    localStorage.setItem('ctp-firebase-cfg', JSON.stringify(cfg));
    setupAuthStateListener();
    showToast('Firebase connected ✓');
    return true;
  } catch(e) {
    return false;
  }
}

function setupAuthStateListener() {
  if (!firebaseAuth) return;
  firebaseAuth.onAuthStateChanged(function(user) {
    if (user) {
      var u = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        photo: user.photoURL || null,
        provider: user.providerData[0] ? user.providerData[0].providerId : 'email'
      };
      localStorage.setItem('ctp-user', JSON.stringify(u));
      applyUserToUI(u);
      var alreadyIn = document.getElementById('main').classList.contains('on');
      if (!alreadyIn) {
        var checked = localStorage.getItem('ctp-onboarded-' + u.uid);
        if (checked) { goScr('main'); } else { goScr('onboard'); }
      }
    }
  });
}

function applyUserToUI(u) {
  if (!u) return;
  var initials = (u.name || 'U').split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
  var avEl = document.getElementById('user-av');
  if (avEl) {
    if (u.photo) {
      avEl.innerHTML = '<img src="'+u.photo+'" style="width:30px;height:30px;border-radius:50%;object-fit:cover" onerror="this.parentElement.textContent=\''+initials+'\'"/>';
    } else {
      avEl.textContent = initials;
    }
  }
  var nameEls = document.querySelectorAll('.sav');
  nameEls.forEach(function(el){ el.textContent = initials; });
  var nameDisplay = document.querySelector('[style*="font-size:15px;font-weight:800"]');
  if (nameDisplay) nameDisplay.textContent = u.name || 'User';
  var emailDisplay = document.querySelector('[style*="font-size:11px;color:var(--text2)"]');
  if (emailDisplay && u.email) emailDisplay.textContent = u.email;
}

// ── VALIDATION HELPERS ────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── EMAIL SIGN IN ──────────────────────────────────────────
function doEmailSignIn() {
  var email = document.getElementById('login-email').value.trim();
  var pass  = document.getElementById('login-pass').value;

  if (!email || !pass) {
    showAuthMsg('signin-error','Please enter your email and password');
    return;
  }
  if (!isValidEmail(email)) {
    showAuthMsg('signin-error','Please enter a valid email address');
    return;
  }
  if (pass.length < 6) {
    showAuthMsg('signin-error','Password must be at least 6 characters');
    return;
  }

  if (!firebaseInitialized) {
    showAuthMsg('signin-error','Authentication is not configured yet. Please add your Firebase config to enable sign in.');
    return;
  }

  setAuthLoading('signin-btn','signin-btn-text','Signing in…',true);
  hideAuthMsg('signin-error');
  firebaseAuth.signInWithEmailAndPassword(email, pass)
    .then(function(result) {
      setAuthLoading('signin-btn','signin-btn-text','Sign In',false);
      hideAuthMsg('signin-error');
    })
    .catch(function(err) {
      setAuthLoading('signin-btn','signin-btn-text','Sign In',false);
      showAuthMsg('signin-error', friendlyError(err.code));
    });
}

// ── EMAIL SIGN UP ──────────────────────────────────────────
function doEmailSignUp() {
  var name  = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var pass  = document.getElementById('reg-pass').value;
  var pass2 = document.getElementById('reg-pass2').value;
  if (!name) { showAuthMsg('signup-error','Please enter your full name'); return; }
  if (!email) { showAuthMsg('signup-error','Please enter your email'); return; }
  if (pass.length < 6) { showAuthMsg('signup-error','Password must be at least 6 characters'); return; }
  if (pass !== pass2) { showAuthMsg('signup-error','Passwords do not match'); return; }
  if (!firebaseInitialized) {
    showAuthMsg('signup-error','Authentication is not configured yet. Please add your Firebase config to enable sign up.');
    return;
  }
  setAuthLoading('signup-btn','signup-btn-text','Creating account…',true);
  firebaseAuth.createUserWithEmailAndPassword(email, pass)
    .then(function(result) {
      return result.user.updateProfile({ displayName: name });
    })
    .then(function() {
      setAuthLoading('signup-btn','signup-btn-text','Create Account →',false);
      hideAuthMsg('signup-error');
      showToast('Account created! Welcome ' + name + ' 🎉');
    })
    .catch(function(err) {
      setAuthLoading('signup-btn','signup-btn-text','Create Account →',false);
      showAuthMsg('signup-error', friendlyError(err.code));
    });
}

// ── PASSWORD RESET ─────────────────────────────────────────
function doPasswordReset() {
  var email = document.getElementById('reset-email').value.trim();
  if (!email) { showAuthMsg('reset-msg','Please enter your email address'); return; }
  if (!firebaseInitialized) {
    showAuthMsg('reset-msg','Authentication is not configured yet. Please add your Firebase config first.');
    return;
  }
  setAuthLoading('reset-btn','reset-btn-text','Sending…',true);
  firebaseAuth.sendPasswordResetEmail(email)
    .then(function() {
      setAuthLoading('reset-btn','reset-btn-text','Send Reset Link',false);
      showAuthMsg('reset-msg','✓ Reset link sent to ' + email + '. Check your inbox.', 'success');
    })
    .catch(function(err) {
      setAuthLoading('reset-btn','reset-btn-text','Send Reset Link',false);
      showAuthMsg('reset-msg', friendlyError(err.code));
    });
}

// ── SIGN OUT ───────────────────────────────────────────────
function doSignOut() {
  var lbl = document.getElementById('signout-label');
  var btn = document.getElementById('signout-btn');
  if (lbl) lbl.textContent = 'Signing out…';
  if (btn) btn.style.opacity = '0.6';

  function clearAndLeave() {
    try {
      localStorage.removeItem('ctp-user');
    } catch(e) {}
    if (lbl) lbl.textContent = 'Sign Out';
    if (btn) btn.style.opacity = '1';
    showToast('Signed out successfully 👋');
    setTimeout(function() { goScr('land'); }, 600);
  }

  if (firebaseAuth) {
    firebaseAuth.signOut()
      .then(clearAndLeave)
      .catch(clearAndLeave);
  } else {
    setTimeout(clearAndLeave, 400);
  }
}

// ── HELPERS ────────────────────────────────────────────────
function friendlyError(code) {
  var map = {
    'auth/user-not-found':      'No account found with this email.',
    'auth/wrong-password':      'Incorrect password. Try again.',
    'auth/invalid-credential':  'Invalid email or password.',
    'auth/email-already-in-use':'An account with this email already exists.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/too-many-requests':   'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-blocked':       'Popup was blocked. Please allow popups and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase console.'
  };
  return map[code] || 'Something went wrong. Please try again.';
}

function showAuthMsg(id, msg, type) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  if (type === 'success') {
    el.style.color = '#00e87a';
    el.style.background = 'rgba(0,232,122,0.08)';
    el.style.border = '1px solid rgba(0,232,122,0.2)';
  } else if (type === 'info') {
    el.style.color = '#00c2ff';
    el.style.background = 'rgba(0,194,255,0.08)';
    el.style.border = '1px solid rgba(0,194,255,0.2)';
  } else {
    el.style.color = '#ff5f6d';
    el.style.background = 'rgba(255,95,109,0.1)';
    el.style.border = 'none';
  }
}
function hideAuthMsg(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function setAuthLoading(btnId, textId, label, loading) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  if (textId) {
    var txtEl = document.getElementById(textId);
    if (txtEl) txtEl.innerHTML = loading ? '<span class="auth-spinner"></span>' + label : label;
  }
  btn.disabled = loading;
}

function togglePwd(inputId, eyeEl) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; eyeEl.textContent = '🙈'; }
  else { inp.type = 'password'; eyeEl.textContent = '👁'; }
}

function goScr(id) {
  document.querySelectorAll('.scr').forEach(function(s) { s.classList.remove('on'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
  if (id === 'main') initMain();
}

function authTab(t) {
  var forms = ['in','up','reset'];
  forms.forEach(function(f) {
    var el = document.getElementById('form-' + f);
    if (el) el.style.display = (f === t) ? 'block' : 'none';
  });
  var tabIn = document.getElementById('atab-in');
  var tabUp = document.getElementById('atab-up');
  if (tabIn) tabIn.classList.toggle('on', t === 'in');
  if (tabUp) tabUp.classList.toggle('on', t === 'up');
  ['signin-error','signup-error','reset-msg'].forEach(hideAuthMsg);
}

// ════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════
var obsIds = ['obs1','obs2','obs3','obs4'];
function obNext() {
  if (S.obStep < 4) {
    document.getElementById(obsIds[S.obStep - 1]).style.display = 'none';
    S.obStep++;
    document.getElementById(obsIds[S.obStep - 1]).style.display = 'block';
    document.getElementById('ob-bar').style.width = (S.obStep / 4 * 100) + '%';
    document.getElementById('ob-snum').textContent = S.obStep + ' / 4';
    document.getElementById('ob-back').style.display = S.obStep > 1 ? 'block' : 'none';
    if (S.obStep === 4) {
      document.getElementById('ob-next').textContent = 'Start Tracking 🚀';
      calcObSum();
    }
  } else {
    goScr('main');
  }
}
function obBack() {
  if (S.obStep > 1) {
    document.getElementById(obsIds[S.obStep - 1]).style.display = 'none';
    S.obStep--;
    document.getElementById(obsIds[S.obStep - 1]).style.display = 'block';
    document.getElementById('ob-bar').style.width = (S.obStep / 4 * 100) + '%';
    document.getElementById('ob-snum').textContent = S.obStep + ' / 4';
    document.getElementById('ob-back').style.display = S.obStep > 1 ? 'block' : 'none';
    if (S.obStep < 4) document.getElementById('ob-next').textContent = 'Continue →';
  }
}
function pickGoal(el, g) {
  document.querySelectorAll('#obs2 .chip').forEach(function(c) { c.classList.remove('on'); });
  el.classList.add('on'); S.obGoal = g;
}
function pickAct(el, v) {
  document.querySelectorAll('#obs3 .chip').forEach(function(c) { c.classList.remove('on'); });
  el.classList.add('on'); S.actLevel = v;
}
function calcObSum() {
  var h = parseFloat(document.getElementById('ob-h2').value) || 175;
  var w = parseFloat(document.getElementById('ob-w2').value) || 78;
  var a = parseFloat(document.getElementById('ob-age').value) || 28;
  var g = document.getElementById('ob-gen').value;
  var bmi = w / ((h / 100) * (h / 100));
  var bmr = g === 'm' ? (10*w)+(6.25*h)-(5*a)+5 : (10*w)+(6.25*h)-(5*a)-161;
  var tdee = Math.round(bmr * S.actLevel);
  var adj = S.obGoal === 'lose' ? -500 : S.obGoal === 'gain' ? 300 : 0;
  document.getElementById('ob-bmi').textContent = bmi.toFixed(1);
  document.getElementById('ob-bmr').textContent = Math.round(bmr).toLocaleString() + ' kcal';
  document.getElementById('ob-tdee').textContent = tdee.toLocaleString() + ' kcal';
  document.getElementById('ob-target').textContent = (tdee + adj).toLocaleString() + ' kcal';
  S.goal = Math.max(1200, tdee + adj);
}

// ════════════════════════════════════════
// MAIN APP INIT
// ════════════════════════════════════════
function initMain() {
  var now = new Date();
  document.getElementById('topdate').textContent = now.toLocaleDateString('en-US', {weekday:'short',month:'short',day:'numeric'});
  document.getElementById('meals-date').textContent = now.toLocaleDateString('en-US', {weekday:'short',month:'short',day:'numeric'});
  buildWater();
  buildWeekBars();
  renderRing();
  renderChips();
  buildTips();
  var tip = TIPS_DATA[now.getDate() % TIPS_DATA.length];
  document.getElementById('tip-em').textContent = tip.e;
  document.getElementById('tip-bdg').textContent = tip.cat;
  document.getElementById('tip-txt').textContent = tip.body;
  document.getElementById('week-goal-disp').textContent = S.goal.toLocaleString();
  calcBMI();
  calcPlan();
  setTimeout(buildCharts, 500);
}

// ════════════════════════════════════════
// RING + STATS
// ════════════════════════════════════════
function renderRing() {
  var remain = Math.max(0, S.goal - S.consumed + S.burned);
  document.getElementById('r-eaten').textContent = S.consumed.toLocaleString();
  document.getElementById('r-goal').textContent = S.goal.toLocaleString();
  document.getElementById('s-eaten').textContent = S.consumed.toLocaleString();
  document.getElementById('s-burned').textContent = S.burned.toLocaleString();
  document.getElementById('s-remain').textContent = remain.toLocaleString();
  document.getElementById('m-total-cal').textContent = S.consumed.toLocaleString();
  var pct = Math.min(S.consumed / S.goal, 1);
  var circ = 2 * Math.PI * 46;
  var ring = document.getElementById('mainring');
  if (ring) {
    ring.setAttribute('stroke-dasharray', circ.toFixed(1));
    ring.setAttribute('stroke-dashoffset', (circ * (1 - pct)).toFixed(1));
  }
  document.getElementById('mf-p').style.width = Math.min(100, Math.round(S.totalProt/150*100)) + '%';
  document.getElementById('mf-c').style.width = Math.min(100, Math.round(S.totalCarb/280*100)) + '%';
  document.getElementById('mf-f').style.width = Math.min(100, Math.round(S.totalFat/70*100)) + '%';
  document.getElementById('mv-p').textContent = S.totalProt + ' / 150g';
  document.getElementById('mv-c').textContent = S.totalCarb + ' / 280g';
  document.getElementById('mv-f').textContent = S.totalFat + ' / 70g';
  document.getElementById('m-total-prot').textContent = S.totalProt + 'g';
  document.getElementById('m-total-carb').textContent = S.totalCarb + 'g';
  document.getElementById('m-total-fat').textContent = S.totalFat + 'g';
}

// ════════════════════════════════════════
// WATER
// ════════════════════════════════════════
function buildWater() {
  var g = document.getElementById('wdrops');
  g.innerHTML = '';
  for (var i = 0; i < S.wTotal; i++) {
    var f = i < S.water;
    var d = document.createElement('div');
    d.className = 'wd';
    d.dataset.i = i;
    d.innerHTML = '<svg viewBox="0 0 28 34" fill="none"><path d="M14 2C14 2 3 12 3 20a11 11 0 0022 0C25 12 14 2 14 2z" fill="' + (f ? '#00c2ff' : 'rgba(0,194,255,0.1)') + '" stroke="' + (f ? 'rgba(0,194,255,0.7)' : 'rgba(0,194,255,0.2)') + '" stroke-width="1.5"/>' + (f ? '<path d="M9 19Q11 15 9 21" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round"/>' : '') + '</svg>';
    d.onclick = (function(idx) {
      return function() {
        S.water = idx + 1;
        document.getElementById('water-lbl').textContent = S.water + ' / ' + S.wTotal + ' glasses';
        buildWater();
        showToast('Water logged! 💧 ' + S.water + '/' + S.wTotal);
        if (S.water >= S.wTotal) { confetti(); showToast('Daily water goal reached! 🎉'); }
      };
    })(i);
    g.appendChild(d);
  }
}

// ════════════════════════════════════════
// WEEK BARS
// ════════════════════════════════════════
function buildWeekBars() {
  S.weeklyData[4] = S.consumed;
  var days = ['M','T','W','T','F','S','S'];
  var max = 2500;
  var bw = document.getElementById('wkbars');
  var lw = document.getElementById('wklbls');
  bw.innerHTML = ''; lw.innerHTML = '';
  days.forEach(function(d, i) {
    var h = S.weeklyData[i] ? Math.round((S.weeklyData[i] / max) * 55) : 3;
    var col = i === 4 ? 'var(--g1)' : i < 5 ? 'rgba(0,232,122,0.3)' : 'rgba(128,128,128,0.1)';
    bw.innerHTML += '<div class="wkd"><div class="wkb" style="height:' + h + 'px;background:' + col + '"></div></div>';
    lw.innerHTML += '<span>' + d + '</span>';
  });
}

// ════════════════════════════════════════
// CHARTS
// ════════════════════════════════════════
function getChartColors() {
  return S.theme === 'dark' ? { grid: 'rgba(255,255,255,0.04)', tick: '#3d5070' } : { grid: 'rgba(0,0,0,0.06)', tick: '#8899bb' };
}
function buildCharts() {
  if (!window.Chart) return;
  var cc = getChartColors();
  if (!charts.trend) {
    var ctx = document.getElementById('trendC');
    if (!ctx) return;
    charts.trend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri'],
        datasets: [{
          label: 'Calories',
          data: S.weeklyData.slice(0,5),
          borderColor: '#00e87a', backgroundColor: 'rgba(0,232,122,0.07)',
          borderWidth: 2, fill: true, tension: 0.4,
          pointBackgroundColor: '#00e87a', pointRadius: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c) { return c.parsed.y.toLocaleString() + ' kcal'; } } } },
        scales: {
          x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { size: 10 } } },
          y: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { size: 10 } }, min: 1000, max: 2500 }
        }
      }
    });
  }
}
function buildWtChart() {
  if (!window.Chart || charts.wt) return;
  var cc = getChartColors();
  var ctx = document.getElementById('wtC');
  if (!ctx) return;
  charts.wt = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      datasets: [{
        label: 'Weight (kg)',
        data: S.weightHistory.slice(),
        borderColor: '#9b6dff', backgroundColor: 'rgba(155,109,255,0.07)',
        borderWidth: 2, fill: true, tension: 0.4,
        pointBackgroundColor: '#9b6dff', pointRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { size: 10 } } },
        y: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { size: 10 }, callback: function(v) { return v + 'kg'; } }, min: 70, max: 82 }
      }
    }
  });
}

// ════════════════════════════════════════
// PAGE NAVIGATION
// ════════════════════════════════════════
function showPg(name, el) {
  document.querySelectorAll('.pg').forEach(function(p) { p.classList.remove('on'); });
  var pg = document.getElementById('pg-' + name);
  if (pg) pg.classList.add('on');
  document.querySelectorAll('.ni').forEach(function(n) { n.classList.remove('on'); });
  if (el) el.classList.add('on');
  document.getElementById('maincontent').scrollTop = 0;
  if (name === 'progress') setTimeout(buildWtChart, 200);
  if (name === 'home') setTimeout(buildCharts, 200);
}

// ════════════════════════════════════════
// WORKOUT
// ════════════════════════════════════════
function selWk(el, name, cpm) {
  document.querySelectorAll('.wkcard').forEach(function(c) { c.classList.remove('sel'); });
  el.classList.add('sel');
  S.wkCpm = cpm; S.wkName = name;
  updBurn();
}
function updBurn() {
  var d = parseInt(document.getElementById('dur-sl').value);
  document.getElementById('dur-v').textContent = d + ' min';
  document.getElementById('burn-n').textContent = Math.round(d * S.wkCpm * 0.9);
}
function logWk() {
  var d = parseInt(document.getElementById('dur-sl').value);
  var b = Math.round(d * S.wkCpm * 0.9);
  S.burned += b;
  S.weekWorkouts++;
  renderRing();
  buildWeekBars();
  var wDone = Math.min(S.weekWorkouts, 5);
  var wPct = Math.round(wDone / 5 * 100);
  document.getElementById('wk-done').textContent = wDone;
  document.getElementById('wk-pct').textContent = wPct + '%';
  document.getElementById('wk-bar').style.width = wPct + '%';
  var rw = document.getElementById('recent-workouts');
  var row = document.createElement('div');
  row.className = 'mitem';
  row.innerHTML = '<div><div class="min">' + S.wkName + ' · ' + d + ' min</div><div class="mim">Just now</div></div><div class="mic" style="color:#f97316">' + b + ' kcal</div>';
  rw.insertBefore(row, rw.firstChild);
  confetti();
  showToast('Workout logged! Burned ' + b + ' kcal 💪');
}

// ════════════════════════════════════════
// WEIGHT LOGGING
// ════════════════════════════════════════
function logWeight() {
  var w = parseFloat(document.getElementById('weight-input').value);
  if (!w || w < 20 || w > 300) { showToast('Please enter a valid weight'); return; }
  S.weightHistory.push(w);
  document.getElementById('prog-wt').textContent = w.toFixed(1) + ' kg';
  if (charts.wt) { charts.wt.destroy(); charts.wt = null; }
  buildWtChart();
  showToast('Weight logged: ' + w.toFixed(1) + ' kg ✓');
}

// ════════════════════════════════════════
// BMI CALCULATION
// ════════════════════════════════════════
function setUnit(u) {
  S.unit = u;
  document.getElementById('u-metric').classList.toggle('on', u === 'metric');
  document.getElementById('u-imperial').classList.toggle('on', u === 'imperial');
  if (u === 'imperial') {
    document.getElementById('lbl-h').textContent = 'Height (in)';
    document.getElementById('lbl-w').textContent = 'Weight (lb)';
    document.getElementById('bmi-h').value = 69;
    document.getElementById('bmi-w').value = 172;
  } else {
    document.getElementById('lbl-h').textContent = 'Height (cm)';
    document.getElementById('lbl-w').textContent = 'Weight (kg)';
    document.getElementById('bmi-h').value = 175;
    document.getElementById('bmi-w').value = 78;
  }
  calcBMI();
}
function calcBMI() {
  var hR = parseFloat(document.getElementById('bmi-h').value) || 175;
  var wR = parseFloat(document.getElementById('bmi-w').value) || 78;
  var h, w;
  if (S.unit === 'imperial') { h = hR * 0.0254; w = wR * 0.453592; }
  else { h = hR / 100; w = wR; }
  var bmi = w / (h * h);
  var br = Math.round(bmi * 10) / 10;
  document.getElementById('bmi-score').textContent = br.toFixed(1);
  var cat, col, det;
  if (bmi < 18.5) { cat = 'Underweight'; col = '#22d3ee'; det = 'BMI below healthy range. Increase calorie intake and add strength training to build lean mass.'; }
  else if (bmi < 25) { cat = 'Normal Weight'; col = '#4ade80'; det = 'Your BMI is in the healthy range. Maintain with balanced nutrition and regular exercise.'; }
  else if (bmi < 30) { cat = 'Overweight'; col = '#facc15'; det = 'Slightly above healthy range. A moderate calorie deficit + regular cardio is recommended.'; }
  else { cat = 'Obese'; col = '#ef4444'; det = 'Higher health risk indicated. Consult a healthcare professional for a structured plan.'; }
  var catEl = document.getElementById('bmi-cat-text');
  catEl.textContent = cat; catEl.style.color = col;
  document.getElementById('bmi-detail').textContent = det;
  var pct = Math.max(0, Math.min(100, ((bmi - 16) / (40 - 16)) * 100));
  document.getElementById('bmi-ptr').style.left = pct.toFixed(1) + '%';
  if (S.unit === 'imperial') {
    document.getElementById('bmi-formula').textContent = 'BMI = (weight(lb) ÷ height(in)²) × 703';
    document.getElementById('bmi-calc').textContent = '= (' + wR + ' ÷ ' + hR + '²) × 703 = ' + br.toFixed(1);
  } else {
    document.getElementById('bmi-formula').textContent = 'BMI = weight(kg) ÷ height(m)²';
    document.getElementById('bmi-calc').textContent = '= ' + wR + ' ÷ (' + (hR/100).toFixed(2) + 'm)² = ' + br.toFixed(1);
  }
  document.getElementById('prof-bmi').textContent = br.toFixed(1) + ' — ' + cat;
  document.getElementById('prof-bmi').style.color = col;
  calcPlan();
}

// ════════════════════════════════════════
// CALORIE PLAN
// ════════════════════════════════════════
var planGoal = 'maintain';
function setPG(g) {
  planGoal = g;
  ['lose','maintain','gain'].forEach(function(x) {
    document.getElementById('ptab-' + x).classList.toggle('on', x === g);
  });
  calcPlan();
}
function calcPlan() {
  var act = parseFloat(document.getElementById('p-act').value) || 1.55;
  var gen = document.getElementById('p-gen').value;
  var age = parseFloat(document.getElementById('p-age').value) || 28;
  var hR = parseFloat(document.getElementById('bmi-h').value) || 175;
  var wR = parseFloat(document.getElementById('bmi-w').value) || 78;
  var h, w;
  if (S.unit === 'imperial') { h = hR * 2.54; w = wR * 0.453592; }
  else { h = hR; w = wR; }
  var bmr = gen === 'm' ? (10*w)+(6.25*h)-(5*age)+5 : (10*w)+(6.25*h)-(5*age)-161;
  var tdee = Math.round(bmr * act);
  var rec, agg, rl, al, rd, ad, adjl;
  if (planGoal === 'lose') {
    rec = tdee - 500; agg = tdee - 1000;
    rl = 'Moderate deficit'; al = 'Aggressive deficit';
    rd = '~0.5 kg/week loss. Sustainable long-term.'; ad = '~1 kg/week loss. Monitor energy closely.';
    adjl = '−500 kcal/day';
  } else if (planGoal === 'gain') {
    rec = tdee + 300; agg = tdee + 500;
    rl = 'Lean bulk'; al = 'Dirty bulk';
    rd = 'Minimal fat gain while building muscle.'; ad = 'Faster mass gain, higher fat accumulation.';
    adjl = '+300 kcal/day';
  } else {
    rec = tdee; agg = tdee + 100;
    rl = 'Maintenance'; al = 'Slight surplus';
    rd = 'Eat at TDEE to maintain current body composition.'; ad = 'Small surplus supports body recomposition.';
    adjl = 'No adjustment';
  }
  rec = Math.max(1200, rec); agg = Math.max(1200, agg);
  document.getElementById('pc-rec').textContent = rec.toLocaleString();
  document.getElementById('pc-agg').textContent = agg.toLocaleString();
  document.getElementById('pc-lbl').textContent = rl;
  document.getElementById('pa-lbl').textContent = al;
  document.getElementById('pc-det').textContent = rd;
  document.getElementById('pa-det').textContent = ad;
  document.getElementById('bd-bmr').textContent = Math.round(bmr).toLocaleString() + ' kcal';
  document.getElementById('bd-tdee').textContent = tdee.toLocaleString() + ' kcal';
  document.getElementById('bd-adj').textContent = adjl;
  document.getElementById('bd-target').textContent = rec.toLocaleString() + ' kcal';
  var gf = gen === 'm' ? 'Men: (10×kg) + (6.25×cm) − (5×age) + 5' : 'Women: (10×kg) + (6.25×cm) − (5×age) − 161';
  document.getElementById('msj-f').textContent = gf;
  document.getElementById('msj-c').textContent = '= (10×' + Math.round(w) + ') + (6.25×' + Math.round(h) + ') − (5×' + age + ') ' + (gen === 'm' ? '+ 5' : '− 161') + ' = ' + Math.round(bmr).toLocaleString();
  document.getElementById('prof-target').textContent = rec.toLocaleString() + ' kcal';
}

// ════════════════════════════════════════
// FOOD MODAL (MANUAL)
// ════════════════════════════════════════
function openModal(t) {
  document.getElementById('food-modal').classList.add('on');
  document.getElementById('modal-type').textContent = t;
  document.querySelectorAll('#modal-meal-tabs .mt').forEach(function(m) {
    m.classList.toggle('on', m.textContent === t);
  });
  renderChips();
  document.getElementById('fsrch').value = '';
  document.getElementById('fn').value = '';
  document.getElementById('fc').value = '';
  document.getElementById('fp').value = '';
  document.getElementById('fcarb').value = '';
}
function closeModal() {
  document.getElementById('food-modal').classList.remove('on');
}
function setMT(el) {
  document.querySelectorAll('#modal-meal-tabs .mt').forEach(function(m) { m.classList.remove('on'); });
  el.classList.add('on');
  document.getElementById('modal-type').textContent = el.textContent;
}
function renderChips(list) {
  var items = list || FOODS.slice(0, 10);
  document.getElementById('fchips').innerHTML = items.map(function(f) {
    return '<span class="fchip" onclick="fillF(\'' + f.n.replace(/'/g,"&apos;") + '\',' + f.c + ',' + f.p + ',' + f.cb + ')">' + f.e + ' ' + f.n + ' (' + f.c + ')</span>';
  }).join('');
}
function fillF(n, c, p, cb) {
  document.getElementById('fn').value = n;
  document.getElementById('fc').value = c;
  document.getElementById('fp').value = p;
  document.getElementById('fcarb').value = cb;
}
function doSearch(v) {
  if (!v.trim()) { renderChips(); return; }
  var r = FOODS.filter(function(f) { return f.n.toLowerCase().includes(v.toLowerCase()); });
  renderChips(r.length ? r : []);
}
function submitFood() {
  var n = document.getElementById('fn').value.trim();
  var c = parseInt(document.getElementById('fc').value) || 0;
  var p = parseInt(document.getElementById('fp').value) || 0;
  var cb = parseInt(document.getElementById('fcarb').value) || 0;
  if (!n || !c) { showToast('Please enter food name and calories'); return; }
  var mealType = document.getElementById('modal-type').textContent;
  addFoodToMealSection(mealType, n, c, p, cb, 0);
  S.consumed += c;
  S.totalProt += p;
  S.totalCarb += cb;
  renderRing();
  buildWeekBars();
  closeModal();
  showToast(n + ' added! +' + c + ' kcal');
  if (S.consumed >= S.goal) { confetti(); showToast('Daily calorie goal reached! 🎉'); }
}
function addFoodToMealSection(mealType, name, cal, prot, carb, fat) {
  var map = { 'Breakfast': 'bf-items', 'Lunch': 'lunch-items', 'Dinner': 'dinner-items', 'Snack': 'snack-items' };
  var containerId = map[mealType] || 'snack-items';
  var container = document.getElementById(containerId);
  if (!container) return;
  var row = document.createElement('div');
  row.className = 'mitem';
  row.innerHTML = '<div><div class="min">' + name + '</div><div class="mim">P: ' + prot + 'g · C: ' + carb + 'g · F: ' + fat + 'g</div></div><div style="display:flex;align-items:center;gap:6px"><div class="mic">' + cal + '</div><span onclick="removeMealItem(this,' + cal + ')" style="cursor:pointer;color:var(--text3);font-size:16px;line-height:1">×</span></div>';
  container.appendChild(row);
}
function removeMealItem(el, cal) {
  S.consumed = Math.max(0, S.consumed - cal);
  renderRing();
  buildWeekBars();
  el.closest('.mitem').remove();
  showToast('Item removed (−' + cal + ' kcal)');
}

// ════════════════════════════════════════
// PROFILE EDIT
// ════════════════════════════════════════
function showEditProfile() {
  document.getElementById('profile-modal').classList.add('on');
}
function saveProfile() {
  var h = parseFloat(document.getElementById('edit-height').value) || 175;
  var w = parseFloat(document.getElementById('edit-weight').value) || 76.2;
  var a = parseFloat(document.getElementById('edit-age').value) || 28;
  var cal = parseInt(document.getElementById('edit-calories').value) || 2100;
  document.getElementById('prof-height').textContent = h + ' cm';
  document.getElementById('prof-weight').textContent = w.toFixed(1) + ' kg';
  document.getElementById('prof-target').textContent = cal.toLocaleString() + ' kcal';
  document.getElementById('bmi-h').value = h;
  document.getElementById('bmi-w').value = w;
  document.getElementById('p-age').value = a;
  S.goal = cal;
  calcBMI();
  renderRing();
  document.getElementById('profile-modal').classList.remove('on');
  showToast('Profile updated ✓');
}

// ════════════════════════════════════════
// HEALTH TIPS PAGE
// ════════════════════════════════════════
function buildTips() {
  var container = document.getElementById('tips-container');
  if (!container || container.children.length > 0) return;
  TIPS_DATA.forEach(function(tip) {
    var div = document.createElement('div');
    div.className = 'tip-full';
    div.innerHTML = '<div class="tip-full-hd"><div class="tip-em-big">' + tip.e + '</div><div><div class="tip-cat">' + tip.cat + '</div></div></div><div class="tip-title">' + tip.title + '</div><div class="tip-body">' + tip.body + '</div>';
    container.appendChild(div);
  });
}

// ════════════════════════════════════════
// EXPORT DATA
// ════════════════════════════════════════
function exportData() {
  var now = new Date();
  var dateStr = now.toISOString().split('T')[0];

  var mealRows = [['Date','Meal Type','Food Name','Calories','Protein(g)','Carbs(g)','Fat(g)']];
  var mealSections = [
    {id:'bf-items',    label:'Breakfast'},
    {id:'lunch-items', label:'Lunch'},
    {id:'dinner-items',label:'Dinner'},
    {id:'snack-items', label:'Snack'}
  ];
  mealSections.forEach(function(sec) {
    var container = document.getElementById(sec.id);
    if (!container) return;
    Array.from(container.querySelectorAll('.mitem')).forEach(function(item) {
      var name = (item.querySelector('.min') || {}).textContent || '';
      var macro = (item.querySelector('.mim') || {}).textContent || '';
      var calEl = item.querySelector('.mic');
      var cal = calEl ? calEl.textContent.trim() : '0';
      var prot = 0, carb = 0, fat = 0;
      var pm = macro.match(/P:\s*(\d+)/);  if (pm) prot = pm[1];
      var cm = macro.match(/C:\s*(\d+)/);  if (cm) carb = cm[1];
      var fm = macro.match(/F:\s*(\d+)/);  if (fm) fat  = fm[1];
      mealRows.push([dateStr, sec.label, name, cal, prot, carb, fat]);
    });
  });

  var workoutRows = [['Date','Workout','Duration (min)','Calories Burned']];
  Array.from(document.querySelectorAll('#recent-workouts .mitem')).forEach(function(item) {
    var name = (item.querySelector('.min') || {}).textContent || '';
    var calEl = item.querySelector('.mic');
    var cal = calEl ? calEl.textContent.trim() : '0';
    var durMatch = name.match(/(\d+)\s*min/);
    var dur = durMatch ? durMatch[1] : '';
    var wkName = name.replace(/·.*/, '').trim();
    workoutRows.push([dateStr, wkName, dur, cal]);
  });

  var weightRows = [['Month','Weight (kg)']];
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  S.weightHistory.forEach(function(w, i) {
    weightRows.push([months[i % 12], w]);
  });

  var csvParts = [];
  csvParts.push('=== CALORIX EXPORT ===');
  csvParts.push('Exported: ' + now.toLocaleString());
  csvParts.push('Daily Calories Consumed: ' + S.consumed);
  csvParts.push('Daily Calories Burned: ' + S.burned);
  csvParts.push('Daily Goal: ' + S.goal);
  csvParts.push('');
  csvParts.push('--- MEAL LOG ---');
  mealRows.forEach(function(r) { csvParts.push(r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(',')); });
  csvParts.push('');
  csvParts.push('--- WORKOUT LOG ---');
  workoutRows.forEach(function(r) { csvParts.push(r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(',')); });
  csvParts.push('');
  csvParts.push('--- WEIGHT HISTORY ---');
  weightRows.forEach(function(r) { csvParts.push(r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(',')); });

  var csv = csvParts.join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Calorix_' + dateStr + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  showToast('Data exported! Check your downloads 📥');
}

// ════════════════════════════════════════
// TOAST NOTIFICATION
// ════════════════════════════════════════
var toastTimer = null;
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ════════════════════════════════════════
// CONFETTI
// ════════════════════════════════════════
function confetti() {
  var app = document.getElementById('APP');
  var colors = ['#00e87a','#00c2ff','#9b6dff','#f97316','#ff5f6d'];
  for (var i = 0; i < 22; i++) {
    var p = document.createElement('div');
    p.className = 'cp';
    p.style.cssText = 'left:' + Math.random()*100 + '%;top:' + (Math.random()*25+5) + '%;background:' + colors[Math.floor(Math.random()*5)] + ';animation-delay:' + Math.random()*0.5 + 's;animation-duration:' + (1.2+Math.random()) + 's';
    app.appendChild(p);
    setTimeout((function(el) { return function() { el.remove(); }; })(p), 2400);
  }
}

// ════════════════════════════════════════
// MODAL EVENT LISTENERS (deferred)
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('food-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
  document.getElementById('profile-modal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('on');
  });
});

// ════════════════════════════════════════
// BOOT
// ════════════════════════════════════════
window.addEventListener('DOMContentLoaded', function() {
  // Restore theme
  var savedTheme = localStorage.getItem('ctp-theme') || 'dark';
  if (savedTheme !== 'dark') { S.theme = savedTheme; toggleTheme(); }

  // Try init Firebase from stored config
  var storedCfg = localStorage.getItem('ctp-firebase-cfg');
  if (storedCfg && typeof firebase !== 'undefined') {
    try { tryInitFirebase(JSON.parse(storedCfg)); } catch(e) {}
  } else if (FIREBASE_CONFIG && typeof firebase !== 'undefined') {
    tryInitFirebase(FIREBASE_CONFIG);
  }

  // Check for persisted demo session (no Firebase)
  if (!firebaseInitialized) {
    var loggedIn = localStorage.getItem('ctp-user');
    if (loggedIn) {
      try {
        var u = JSON.parse(loggedIn);
        if (u && u.uid) { applyUserToUI(u); goScr('main'); return; }
      } catch(e) {}
    }
    goScr('land');
  }
  // If Firebase initialized, onAuthStateChanged handles navigation
});

// Patch toggleTheme to persist preference
var _origToggle = toggleTheme;
toggleTheme = function() {
  _origToggle();
  localStorage.setItem('ctp-theme', S.theme);
};

// Mark onboarding complete when user enters main
var _origInitMain = initMain;
initMain = function() {
  _origInitMain();
  var u = JSON.parse(localStorage.getItem('ctp-user') || '{}');
  if (u.uid) localStorage.setItem('ctp-onboarded-' + u.uid, '1');
};
