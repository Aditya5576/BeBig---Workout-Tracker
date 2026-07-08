/**
 * BeBig - Premium Workout Tracker JS Engine
 * Core architectural logic, state manager, logging engine, and UI renderer.
 */

const APP_CURRENT_VERSION = "V2.0";

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- GLOBAL ERROR BOUNDARY (Self-Healing Safeguard) ---
window.addEventListener("error", (event) => {
  console.error("Unhandled global error:", event.error);
  // Auto-dismiss overlays to prevent screen freeze
  const splash = document.getElementById("app-splash-screen");
  if (splash) {
    splash.classList.add("fade-out");
    splash.classList.add("hidden");
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Auto-dismiss overlays
  const splash = document.getElementById("app-splash-screen");
  if (splash) {
    splash.classList.add("fade-out");
    splash.classList.add("hidden");
  }
});

// ==========================================================================
// 1. INITIAL SEED DATA
// ==========================================================================

const DEFAULT_EXERCISES = [
  // Chest
  { id: "bench-press-bb", name: "Bench Press (Barbell)", muscle: "Chest", category: "Barbell", instructions: "Lie flat on a bench. Grip the barbell slightly wider than shoulder-width. Lower the bar to your mid-chest, then press it back up while locking your elbows." },
  { id: "incline-bench-press-bb", name: "Incline Bench Press (Barbell)", muscle: "Chest", category: "Barbell", instructions: "Lie on an incline bench set to 30-45 degrees. Grip the barbell, lower to your upper chest, and press upward." },
  { id: "dumbbell-bench-press", name: "Bench Press (Dumbbell)", muscle: "Chest", category: "Dumbbell", instructions: "Lie flat on a bench with a dumbbell in each hand. Start with arms extended, lower dumbbells to chest level, and press them back up." },
  { id: "incline-dumbbell-bench-press", name: "Incline Bench Press (Dumbbell)", muscle: "Chest", category: "Dumbbell", instructions: "Lie on an incline bench. Lower dumbbells to the sides of your upper chest, then press upward." },
  { id: "chest-fly-db", name: "Chest Fly (Dumbbell)", muscle: "Chest", category: "Dumbbell", instructions: "Lie flat on a bench holding dumbbells. With a slight bend in your elbows, flare your arms wide until you feel a chest stretch, then bring them back together." },
  { id: "cable-crossover", name: "Cable Crossover", muscle: "Chest", category: "Machine", instructions: "Stand between two pulleys. Pull the cables down and together in front of your body, squeezing your chest." },
  { id: "push-up", name: "Push-Up", muscle: "Chest", category: "Bodyweight", instructions: "Start in a plank position. Lower your chest to the floor, keeping your core tight, then push back up." },
  { id: "chest-dip", name: "Chest Dip", muscle: "Chest", category: "Bodyweight", instructions: "Grip dip bars, lean forward slightly, bend your arms to lower your body, then push back up to lock out." },

  // Back
  { id: "deadlift-bb", name: "Deadlift (Barbell)", muscle: "Back", category: "Barbell", instructions: "Stand with feet mid-foot under the bar. Bend, grip the bar, flatten your back, and lift the bar by driving through your legs and locking out your hips." },
  { id: "pull-up", name: "Pull-Up", muscle: "Back", category: "Bodyweight", instructions: "Grip a pull-up bar overhead. Pull your body up until your chin clears the bar, then lower under control." },
  { id: "lat-pulldown", name: "Lat Pulldown (Cable)", muscle: "Back", category: "Machine", instructions: "Sit at a pulldown station. Pull the bar down to your upper chest, drawing your shoulder blades together." },
  { id: "bent-over-row-bb", name: "Bent Over Row (Barbell)", muscle: "Back", category: "Barbell", instructions: "Hinge at the hips with a flat back. Grip the bar and pull it to your lower ribs, keeping your elbows close to your body." },
  { id: "dumbbell-row", name: "One-Arm Row (Dumbbell)", muscle: "Back", category: "Dumbbell", instructions: "Place one knee and hand on a bench. Row the dumbbell up to your hip pocket with the other hand." },
  { id: "seated-cable-row", name: "Seated Cable Row", muscle: "Back", category: "Machine", instructions: "Sit at a row machine. Pull the handles toward your lower stomach, keeping your back upright." },
  { id: "face-pull", name: "Face Pull (Cable)", muscle: "Back", category: "Machine", instructions: "Pull the rope attachment towards your face, pulling your hands apart at the ears to recruit the rear delts." },
  { id: "t-bar-row", name: "T-Bar Row", muscle: "Back", category: "Machine", instructions: "Stand over the T-bar. Pull the weights to your chest, squeezing your upper back muscles." },

  // Legs
  { id: "squat-bb", name: "Squat (Barbell)", muscle: "Legs", category: "Barbell", instructions: "Rest the bar on your upper back. Squat down by bending at the hips and knees until thighs are parallel to floor, then stand up." },
  { id: "leg-press", name: "Leg Press (Machine)", muscle: "Legs", category: "Machine", instructions: "Sit in the machine and place feet on the sled. Lower the weight under control toward your chest, then press it back up." },
  { id: "lying-leg-curl", name: "Lying Leg Curl (Machine)", muscle: "Legs", category: "Machine", instructions: "Lie face down on the leg curl machine. Curl the pad up toward your glutes, then return slowly." },
  { id: "leg-extension", name: "Leg Extension (Machine)", muscle: "Legs", category: "Machine", instructions: "Sit on the machine. Extend your legs fully, pausing at the top, then lower the weight under control." },
  { id: "romanian-deadlift-bb", name: "Romanian Deadlift (Barbell)", muscle: "Legs", category: "Barbell", instructions: "Hold a bar at hip level. Hinge forward at your hips, keeping legs semi-straight and bar close to legs, until you feel a hamstring stretch, then return." },
  { id: "standing-calf-raise", name: "Standing Calf Raise", muscle: "Legs", category: "Machine", instructions: "Position shoulders under pads. Push upward on your toes, flexing your calves, then lower heels down." },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", muscle: "Legs", category: "Dumbbell", instructions: "Stand in front of a bench. Place one foot backward onto the bench. Lower your hips until rear knee is close to floor, then press up." },
  { id: "goblet-squat-db", name: "Goblet Squat (Dumbbell)", muscle: "Legs", category: "Dumbbell", instructions: "Hold a single dumbbell vertically in front of your chest. Squat down and stand back up." },
  { id: "hip-thrust-bb", name: "Hip Thrust (Barbell)", muscle: "Legs", category: "Barbell", instructions: "Sit with upper back against a bench and bar across hips. Drive hips up, squeezing glutes, until torso is parallel to floor." },

  // Shoulders
  { id: "overhead-press-bb", name: "Overhead Press (Barbell)", muscle: "Shoulders", category: "Barbell", instructions: "Press the bar overhead from your upper chest until your arms are fully locked out, then return to shoulders." },
  { id: "dumbbell-shoulder-press", name: "Shoulder Press (Dumbbell)", muscle: "Shoulders", category: "Dumbbell", instructions: "Sit on a bench, dumbbells at shoulder height. Press dumbbells upward until arms are straight." },
  { id: "lateral-raise-db", name: "Lateral Raise (Dumbbell)", muscle: "Shoulders", category: "Dumbbell", instructions: "Stand holding dumbbells. Lift arms out to the sides until parallel to the floor, maintaining a slight elbow bend." },
  { id: "front-raise-db", name: "Front Raise (Dumbbell)", muscle: "Shoulders", category: "Dumbbell", instructions: "Raise dumbbells forward in front of your body until arms are parallel to the floor." },
  { id: "rear-delt-fly-db", name: "Rear Delt Fly (Dumbbell)", muscle: "Shoulders", category: "Dumbbell", instructions: "Bent forward at hips. Raise dumbbells out to the sides to engage your rear shoulders." },
  { id: "upright-row-bb", name: "Upright Row (Barbell)", muscle: "Shoulders", category: "Barbell", instructions: "Pull the barbell straight up in front of your body to chest height, flaring your elbows." },
  { id: "cable-lateral-raise", name: "Lateral Raise (Cable)", muscle: "Shoulders", category: "Machine", instructions: "Stand side-on to cable pulley. Pull cable across your body out to the side to work shoulder caps." },

  // Arms
  { id: "bicep-curl-bb", name: "Bicep Curl (Barbell)", muscle: "Arms", category: "Barbell", instructions: "Stand holding a barbell at your thighs. Flex your elbows to curl the bar to shoulder height, keeping elbows locked to sides." },
  { id: "dumbbell-hammer-curl", name: "Hammer Curl (Dumbbell)", muscle: "Arms", category: "Dumbbell", instructions: "Curl dumbbells with palms facing each other (neutral grip) to build forearm and bicep thickness." },
  { id: "cable-tricep-pushdown", name: "Tricep Pushdown (Cable)", muscle: "Arms", category: "Machine", instructions: "Stand at cable station. Push the bar/rope attachment downward until arms are locked out by contracting triceps." },
  { id: "overhead-tricep-extension-db", name: "Overhead Tricep Extension (Dumbbell)", muscle: "Arms", category: "Dumbbell", instructions: "Hold a dumbbell overhead in both hands. Lower behind head, then press up to full arm lockout." },
  { id: "incline-dumbbell-curl", name: "Incline Curl (Dumbbell)", muscle: "Arms", category: "Dumbbell", instructions: "Sit on an incline bench. Curl dumbbells, letting your arms hang behind your torso for maximum stretch." },
  { id: "skull-crusher-bb", name: "Skull Crusher (Barbell)", muscle: "Arms", category: "Barbell", instructions: "Lie flat holding barbell/EZ-bar straight up. Lower bar toward forehead by bending elbows, then push back up." },
  { id: "preacher-curl", name: "Preacher Curl (Dumbbell/Barbell)", muscle: "Arms", category: "Machine", instructions: "Sit at preacher bench with back of arms flat on pad. Curl weight upward toward face." },
  { id: "concentration-curl-db", name: "Concentration Curl (Dumbbell)", muscle: "Arms", category: "Dumbbell", instructions: "Sit, rest elbow against inner thigh. Curl the dumbbell upwards towards chest." },

  // Core
  { id: "crunch", name: "Abdominal Crunch", muscle: "Core", category: "Bodyweight", instructions: "Lie on back with knees bent. Contract abdominals, raising shoulders off the floor." },
  { id: "plank", name: "Plank", muscle: "Core", category: "Bodyweight", instructions: "Hold a pushup position resting on forearms. Keep body in a straight line, pulling belly button in." },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", muscle: "Core", category: "Bodyweight", instructions: "Hang from pullup bar. Raise legs straight out in front to 90 degrees, then lower slowly." },
  { id: "russian-twist", name: "Russian Twist", muscle: "Core", category: "Bodyweight", instructions: "Sit with legs slightly bent, torso leaning back. Rotate shoulders side to side, tapping floor." },
  { id: "cable-crunch", name: "Kneeling Cable Crunch", muscle: "Core", category: "Machine", instructions: "Kneel below pulley, hold rope at ears. Pull elbows down to thighs by crunching upper spine." }
];

const DEFAULT_TEMPLATES = [
  {
    id: "template-push",
    name: "Push Day (Chest/Shoulders/Triceps)",
    notes: "Focus on progressive overload on compound lifts. Rest 90s between sets.",
    exercises: [
      { exerciseId: "bench-press-bb", sets: [{ type: "N", weight: 135, reps: 8 }, { type: "N", weight: 135, reps: 8 }, { type: "N", weight: 135, reps: 8 }] },
      { exerciseId: "dumbbell-shoulder-press", sets: [{ type: "N", weight: 40, reps: 10 }, { type: "N", weight: 40, reps: 10 }, { type: "N", weight: 40, reps: 10 }] },
      { exerciseId: "lateral-raise-db", sets: [{ type: "N", weight: 15, reps: 12 }, { type: "N", weight: 15, reps: 12 }, { type: "D", weight: 10, reps: 15 }] },
      { exerciseId: "cable-tricep-pushdown", sets: [{ type: "N", weight: 50, reps: 10 }, { type: "N", weight: 50, reps: 10 }, { type: "F", weight: 50, reps: 12 }] }
    ]
  },
  {
    id: "template-pull",
    name: "Pull Day (Back/Biceps)",
    notes: "Squeeze back at peak contraction. Keep deadlift form tight.",
    exercises: [
      { exerciseId: "deadlift-bb", sets: [{ type: "N", weight: 225, reps: 5 }, { type: "N", weight: 225, reps: 5 }, { type: "N", weight: 225, reps: 5 }] },
      { exerciseId: "lat-pulldown", sets: [{ type: "N", weight: 110, reps: 10 }, { type: "N", weight: 110, reps: 10 }, { type: "N", weight: 110, reps: 10 }] },
      { exerciseId: "dumbbell-row", sets: [{ type: "N", weight: 50, reps: 8 }, { type: "N", weight: 50, reps: 8 }] },
      { exerciseId: "dumbbell-hammer-curl", sets: [{ type: "N", weight: 25, reps: 12 }, { type: "N", weight: 25, reps: 12 }, { type: "F", weight: 25, reps: 10 }] }
    ]
  },
  {
    id: "template-legs",
    name: "Leg Day (Quads/Hamstrings/Calves)",
    notes: "Hit depth on barbell squats.",
    exercises: [
      { exerciseId: "squat-bb", sets: [{ type: "N", weight: 185, reps: 8 }, { type: "N", weight: 185, reps: 8 }, { type: "N", weight: 185, reps: 8 }] },
      { exerciseId: "romanian-deadlift-bb", sets: [{ type: "N", weight: 135, reps: 10 }, { type: "N", weight: 135, reps: 10 }] },
      { exerciseId: "lying-leg-curl", sets: [{ type: "N", weight: 70, reps: 12 }, { type: "N", weight: 70, reps: 12 }] },
      { exerciseId: "plank", sets: [{ type: "N", weight: 0, reps: 60 }, { type: "N", weight: 0, reps: 60 }] }
    ]
  }
];

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

// ==========================================================================
// 2. STATE MANAGER (LOCAL STORAGE PERSISTENCE)
// ==========================================================================

const store = {
  get(key, defaultValue) {
    try {
      const val = localStorage.getItem(`be_big_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`be_big_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  }
};

let state = {
  exercises: [],
  templates: [],
  history: [],
  activeWorkout: null, // Workout currently logging
  settings: {
    unit: "lbs",
    defaultRest: 90
  }
};

let pendingTemplateId = null;
let currentGeneratedWorkout = null;
let isWorkoutPanelOpening = false;
let isTemplateEditorOpening = false;


function initStore() {
  const storedExercises = store.get("exercises", []);
  const customExercises = Array.isArray(storedExercises)
    ? storedExercises.filter(ex => ex.id && String(ex.id).startsWith('custom-'))
    : [];
  state.exercises = [...DEFAULT_EXERCISES, ...customExercises];

  state.templates = store.get("templates", DEFAULT_TEMPLATES);
  state.history = store.get("history", []);
  state.activeWorkout = store.get("activeWorkout", null);
  state.settings = store.get("settings", { unit: "lbs", defaultRest: 90, notificationsEnabled: false, broadcastFilterDuration: "12" });
  if (!state.settings.broadcastFilterDuration) state.settings.broadcastFilterDuration = "12";

  state.auth = store.get("auth", { email: null, token: null, lastSyncTime: 0, isAdmin: false });
  state.schedule = store.get("bebig_schedule", {
    "Mon": null,
    "Tue": null,
    "Wed": null,
    "Thu": null,
    "Fri": null,
    "Sat": null,
    "Sun": null
  });

  // Ensure all entities have sync properties and dirty flags
  state.exercises.forEach(ex => {
    if (ex.updated_at === undefined) ex.updated_at = 0;
    if (ex.deleted === undefined) ex.deleted = 0;
    if (ex.dirty === undefined) ex.dirty = 0;
  });
  state.templates.forEach(t => {
    if (t.updated_at === undefined) t.updated_at = 0;
    if (t.deleted === undefined) t.deleted = 0;
    if (t.dirty === undefined) t.dirty = 0;
  });

  // Repair any corrupted history logs due to server/client casing differences
  let needsFullSync = false;
  state.history.forEach(h => {
    if (h.startTime === undefined && h.start_time !== undefined) {
      h.startTime = h.start_time;
    }
    if (h.endTime === undefined && h.end_time !== undefined) {
      h.endTime = h.end_time;
    }
    if (h.startTime === undefined || h.endTime === undefined) {
      needsFullSync = true;
    }

    if (h.updated_at === undefined) h.updated_at = 0;
    if (h.deleted === undefined) h.deleted = 0;
    if (h.dirty === undefined) h.dirty = 0;
  });

  // If logs were corrupted, trigger a fresh pull of all user history from the database
  if (needsFullSync && state.auth && state.auth.token) {
    state.auth.lastSyncTime = 0;
    state.history = state.history.filter(h => h.startTime !== undefined && h.endTime !== undefined);
  }

  if (state.settings.notificationsEnabled === undefined) {
    state.settings.notificationsEnabled = false;
  }
  if (state.settings.updated_at === undefined) {
    state.settings.updated_at = 0;
  }
  if (state.settings.dirty === undefined) {
    state.settings.dirty = 0;
  }
}

function saveAllState() {
  // Only persist custom exercises to local storage to keep JSON sizes tiny and saves instant
  const customExercises = state.exercises.filter(ex => ex.id && String(ex.id).startsWith('custom-'));
  store.set("exercises", customExercises);

  store.set("templates", state.templates);
  store.set("history", state.history);
  store.set("activeWorkout", state.activeWorkout);
  store.set("settings", state.settings);
  store.set("auth", state.auth);
  store.set("bebig_schedule", state.schedule);
  // Schedule a cloud push 500ms after any local state write (debounced)
  if (typeof scheduleSyncAfterWrite === 'function' && !isSyncing) {
    scheduleSyncAfterWrite();
  }
}

function applyTheme() {
  const currentTheme = (state.settings && state.settings.theme) || "dark";
  if (currentTheme === "light") {
    document.body.classList.add("theme-light");
    
    // Toggle active classes on the toggle buttons
    const btnDark = document.getElementById("btn-theme-dark");
    const btnLight = document.getElementById("btn-theme-light");
    if (btnDark) btnDark.classList.remove("active");
    if (btnLight) btnLight.classList.add("active");
  } else {
    document.body.classList.remove("theme-light");
    
    const btnDark = document.getElementById("btn-theme-dark");
    const btnLight = document.getElementById("btn-theme-light");
    if (btnDark) btnDark.classList.add("active");
    if (btnLight) btnLight.classList.remove("active");
  }
  
  // Re-render charts so their text/grid lines align perfectly with the background theme!
  if (typeof currentChartInstance !== "undefined" && currentChartInstance) {
    Analytics.renderExerciseHistoryChart(document.getElementById("select-chart-exercise")?.value || "");
  }
  if (typeof currentMuscleChartInstance !== "undefined" && currentMuscleChartInstance) {
    Analytics.renderMuscleSplitChart();
  }
}

// --- SCHEDULED WORKOUT NOTIFICATION REMINDERS ---
function checkScheduledWorkoutReminders() {
  if (!state.settings || !state.settings.notificationsEnabled || Notification.permission !== "granted") {
    return;
  }

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon is 0
  const todayName = daysOfWeek[todayIndex];

  const templateId = state.schedule ? state.schedule[todayName] : null;
  if (!templateId) return;

  const template = state.templates.find(t => t.id === templateId && !t.deleted);
  if (!template) return;

  const todayKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (state.settings.lastScheduledNotificationDate !== todayKey) {
    try {
      new Notification("Time to Train! 🏋️‍♂️", {
        body: `Your scheduled workout for today: ${template.name}. Let's get big!`,
        tag: "scheduled-workout-reminder",
        renotify: true
      });
      state.settings.lastScheduledNotificationDate = todayKey;
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      saveAllState();
    } catch (e) {
      console.warn("Could not fire scheduled workout reminder notification", e);
    }
  }
}

function triggerImmediateScheduledNotification(tmplName, day) {
  if (state.settings && state.settings.notificationsEnabled && Notification.permission === "granted") {
    try {
      new Notification("Workout Scheduled! 📅", {
        body: `${tmplName} has been scheduled for ${day}. We will remind you to train!`,
        tag: "schedule-change"
      });
    } catch (e) {
      console.warn("Could not fire schedule change notification", e);
    }
  }
}

// ==========================================================================
// 3. SOUND SYNTHESIS ENGINE (WEB AUDIO API)
// ==========================================================================
const SoundSynth = {
  audioCtx: null,

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  beep(freq, duration, type = "sine") {
    try {
      this.init();
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (err) {
      console.warn("Audio Context beep failed", err);
    }
  },

  playRestCompleteSequence() {
    // Elegant triple beep chime
    setTimeout(() => this.beep(880, 0.15, "triangle"), 0);
    setTimeout(() => this.beep(880, 0.15, "triangle"), 200);
    setTimeout(() => this.beep(1200, 0.35, "sine"), 400);
  }
};

// ==========================================================================
// 4. WORKOUT TIMER & LIVE TIMERS
// ==========================================================================
let workoutTimerId = null;

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [
    h > 0 ? String(h).padStart(2, '0') : null,
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].filter(Boolean).join(':');
}

function startWorkoutTimer() {
  if (workoutTimerId) clearInterval(workoutTimerId);
  lastHeartbeatTime = 0; // reset heartbeat timer to trigger immediately
  
  const timerWidget = document.getElementById("active-timer-widget");
  const widgetText = document.getElementById("widget-timer-text");
  const panelTimer = document.getElementById("workout-panel-timer");
  const miniTimer = document.getElementById("mini-workout-timer");

  if (timerWidget) timerWidget.classList.remove("hidden");

  workoutTimerId = setInterval(() => {
    if (!state.activeWorkout) {
      clearInterval(workoutTimerId);
      return;
    }

    // Trigger active heartbeat ping every 10 seconds
    const now = Date.now();
    if (now - lastHeartbeatTime >= 10000) {
      lastHeartbeatTime = now;
      sendActiveHeartbeat();
    }

    const elapsed = Math.floor((Date.now() - state.activeWorkout.startTime) / 1000);
    const timeStr = formatDuration(elapsed);

    if (panelTimer) panelTimer.textContent = timeStr;
    if (widgetText) widgetText.textContent = formatDuration(elapsed).substring(0, 5); // display MM:SS on mini
    if (miniTimer) miniTimer.textContent = timeStr;
  }, 1000);
}

function stopWorkoutTimer() {
  if (workoutTimerId) {
    clearInterval(workoutTimerId);
    workoutTimerId = null;
  }
  const timerWidget = document.getElementById("active-timer-widget");
  if (timerWidget) timerWidget.classList.add("hidden");
}

// ==========================================================================
// 5. REST TIMER ENGINE
// ==========================================================================
let restTimerId = null;
let restTotalDuration = 90;
let restEndTime = 0; // absolute target timestamp when timer ends

const RestTimer = {
  start(seconds) {
    this.stop();
    SoundSynth.init(); // Warm up audio context on user interaction
    restTotalDuration = seconds;
    restEndTime = Date.now() + (seconds * 1000);

    const overlay = document.getElementById("rest-timer-overlay");
    if (overlay) overlay.classList.remove("hidden");

    this.tick();
    restTimerId = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const textEl = document.getElementById("rest-countdown-text");
    const ring = document.getElementById("timer-progress-ring");

    // Calculate time remaining using absolute clock
    const restTimeRemaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));

    if (restTimeRemaining <= 0) {
      this.stop();
      SoundSynth.playRestCompleteSequence();
      if (state.settings.notificationsEnabled && Notification.permission === "granted") {
        try {
          new Notification("Rest Time Completed!", {
            body: "Get ready for your next set!",
            tag: "rest-timer",
            renotify: true
          });
        } catch (e) {
          console.warn("Could not fire Notification", e);
        }
      }
      this.hide();
      return;
    }

    // Update text
    const m = Math.floor(restTimeRemaining / 60);
    const s = restTimeRemaining % 60;
    if (textEl) {
      textEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // Update SVG progress ring (circumference is 283)
    if (ring) {
      const percentage = restTimeRemaining / restTotalDuration;
      const offset = 283 - (percentage * 283);
      ring.style.strokeDashoffset = offset;
    }
  },

  stop() {
    if (restTimerId) {
      clearInterval(restTimerId);
      restTimerId = null;
    }
  },

  hide() {
    this.stop();
    const overlay = document.getElementById("rest-timer-overlay");
    if (overlay) overlay.classList.add("hidden");
  },

  addTime(sec) {
    restEndTime += (sec * 1000);
    restTotalDuration = Math.max(1, restTotalDuration + sec);
    this.tick();
  }
};

// ==========================================================================
// 6. PLATE CALCULATOR
// ==========================================================================
const PlateCalc = {
  // Plates per side (Lbs/Kg)
  LBS_PLATES: [45, 35, 25, 10, 5, 2.5],
  KG_PLATES: [25, 20, 15, 10, 5, 2.5, 1.25],

  calculate(targetWeight, barWeight, isLbs) {
    const platesAvailable = isLbs ? this.LBS_PLATES : this.KG_PLATES;
    const netWeight = targetWeight - barWeight;
    
    if (netWeight <= 0) {
      return { plates: [], remainder: netWeight };
    }

    const weightPerSide = netWeight / 2;
    let tempWeight = weightPerSide;
    const result = [];

    for (let plate of platesAvailable) {
      const count = Math.floor(tempWeight / plate);
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          result.push(plate);
        }
        tempWeight -= count * plate;
      }
    }

    return { plates: result, remainder: tempWeight * 2 };
  },

  render(targetWeight) {
    const unit = state.settings.unit;
    const isLbs = unit === "lbs";
    const barSelect = document.getElementById("select-bar-weight");
    const barWeight = parseFloat(barSelect.value);
    
    const { plates, remainder } = this.calculate(targetWeight, barWeight, isLbs);
    const container = document.getElementById("plates-visual-list");
    const remainderText = document.getElementById("calc-weight-remainder");
    
    if (remainderText) remainderText.textContent = remainder.toFixed(1);
    if (!container) return;

    container.innerHTML = "";

    // Render left-side barbell bar
    const barShaft = document.createElement("div");
    barShaft.className = "barbell-shaft";
    container.appendChild(barShaft);

    const barCollar = document.createElement("div");
    barCollar.className = "barbell-collar";
    container.appendChild(barCollar);

    if (plates.length === 0) {
      const emptyMsg = document.createElement("span");
      emptyMsg.className = "empty-state-text";
      emptyMsg.style.padding = "0 10px";
      emptyMsg.textContent = "Barbell Empty";
      container.appendChild(emptyMsg);
      return;
    }

    // Render plates (ordered biggest to smallest)
    plates.forEach(plate => {
      const pDiv = document.createElement("div");
      const plateClassStr = String(plate).replace(".", "_");
      pDiv.className = `plate-graphic plate-${plateClassStr}${isLbs ? '' : 'kg'}`;
      pDiv.textContent = plate;
      container.appendChild(pDiv);
    });
  }
};

// ==========================================================================
// 7. ANALYTICS ENGINE & CHARTS
// ==========================================================================
let currentChartInstance = null;
let currentMuscleChartInstance = null;

const Analytics = {
  calculate1RM(weight, reps) {
    if (reps <= 0) return 0;
    if (reps === 1) return weight;
    // Epley Formula
    return weight * (1 + reps / 30);
  },

  calculateAllStats() {
    // Total Workouts
    document.getElementById("stat-total-workouts").textContent = state.history.length;

    // Total Weight Volume Lifted
    let totalVol = 0;
    state.history.forEach(workout => {
      workout.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.completed) {
            totalVol += (set.weight || 0) * (set.reps || 0);
          }
        });
      });
    });
    
    const formattedVol = totalVol >= 10000 
      ? (totalVol / 1000).toFixed(1) + "k" 
      : totalVol.toLocaleString();
    document.getElementById("stat-total-volume").textContent = `${formattedVol} ${state.settings.unit}`;

    // Streak Calculations (Workouts completed on different calendar days)
    const sortedDates = state.history
      .map(w => new Date(w.endTime).toDateString())
      .filter((v, i, self) => self.indexOf(v) === i) // unique dates
      .map(dStr => new Date(dStr))
      .sort((a, b) => b - a); // descending (recent first)

    let streak = 0;
    if (sortedDates.length > 0) {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const firstHistoryDate = sortedDates[0];
      firstHistoryDate.setHours(0,0,0,0);

      // Check if last workout was today or yesterday to continue streak
      if (firstHistoryDate.getTime() === today.getTime() || firstHistoryDate.getTime() === yesterday.getTime()) {
        streak = 1;
        let lastTime = firstHistoryDate.getTime();
        
        for (let i = 1; i < sortedDates.length; i++) {
          const nextDate = sortedDates[i];
          nextDate.setHours(0,0,0,0);
          const diffDays = (lastTime - nextDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (diffDays === 1) {
            streak++;
            lastTime = nextDate.getTime();
          } else if (diffDays > 1) {
            break; // Streak broken
          }
        }
      }
    }
    document.getElementById("stat-streak").textContent = `${streak} day${streak === 1 ? '' : 's'}`;

    // Load exercises into select drop for charts
    this.populateChartExerciseSelect();
    this.renderActivityCalendar();
    this.renderMuscleDistributionChart();
    this.renderMuscleHeatmap();
  },

  renderMuscleDistributionChart() {
    const ctx = document.getElementById("muscle-distribution-chart");
    if (!ctx) return;

    if (currentMuscleChartInstance) {
      currentMuscleChartInstance.destroy();
      currentMuscleChartInstance = null;
    }

    const muscleSets = {
      Chest: 0,
      Back: 0,
      Legs: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0
    };

    state.history.filter(w => !w.deleted).forEach(workout => {
      workout.exercises.forEach(ex => {
        const details = state.exercises.find(e => e.id === ex.exerciseId);
        if (details && muscleSets[details.muscle] !== undefined) {
          muscleSets[details.muscle] += ex.sets.length;
        }
      });
    });

    const labels = Object.keys(muscleSets);
    const data = Object.values(muscleSets);
    const totalSets = data.reduce((a, b) => a + b, 0);

    if (totalSets === 0) {
      ctx.style.display = "none";
      const parent = ctx.parentElement;
      let placeholder = parent.querySelector(".muscle-chart-placeholder");
      if (!placeholder) {
        placeholder = document.createElement("div");
        placeholder.className = "muscle-chart-placeholder";
        placeholder.style.fontSize = "0.85rem";
        placeholder.style.color = "var(--text-dark)";
        placeholder.textContent = "Log a workout to view muscle distribution.";
        parent.appendChild(placeholder);
      }
      return;
    } else {
      ctx.style.display = "block";
      const placeholder = ctx.parentElement.querySelector(".muscle-chart-placeholder");
      if (placeholder) placeholder.remove();
    }

    currentMuscleChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            "#3b82f6", // Chest: blue
            "#10b981", // Back: green
            "#7c3aed", // Legs: purple
            "#f59e0b", // Shoulders: yellow
            "#ec4899", // Arms: pink
            "#0d9488"  // Core: teal
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: document.body.classList.contains("theme-light") ? "#475569" : "#94a3b8",
              font: {
                family: "Inter",
                size: 11
              },
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw || 0;
                const percentage = Math.round((val / totalSets) * 100);
                return ` ${context.label}: ${val} sets (${percentage}%)`;
              }
            }
          }
        },
        cutout: "70%"
      }
    });
  },

  renderMuscleHeatmap() {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
    const recentSets = {
      Chest: 0,
      Back: 0,
      Legs: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0
    };

    state.history.filter(w => !w.deleted && w.endTime >= thirtyDaysAgo).forEach(workout => {
      workout.exercises.forEach(ex => {
        const details = state.exercises.find(e => e.id === ex.exerciseId);
        if (details && recentSets[details.muscle] !== undefined) {
          recentSets[details.muscle] += ex.sets.length;
        }
      });
    });

    const getHeatmapColor = (sets) => {
      if (sets === 0) return "#1b2436";
      if (sets <= 3) return "rgba(16, 185, 129, 0.35)";
      if (sets <= 8) return "rgba(16, 185, 129, 0.75)";
      return "#d4fc34"; // Neon glowing cyan
    };

    const setFill = (id, color) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("fill", color);
    };

    // Chest
    setFill("muscle-chest", getHeatmapColor(recentSets.Chest));

    // Core
    setFill("muscle-core", getHeatmapColor(recentSets.Core));

    // Shoulders
    const shoulderColor = getHeatmapColor(recentSets.Shoulders);
    setFill("muscle-shoulders-front-l", shoulderColor);
    setFill("muscle-shoulders-front-r", shoulderColor);
    setFill("muscle-shoulders-back-l", shoulderColor);
    setFill("muscle-shoulders-back-r", shoulderColor);

    // Arms
    const armsColor = getHeatmapColor(recentSets.Arms);
    setFill("muscle-arms-front-l", armsColor);
    setFill("muscle-arms-front-r", armsColor);
    setFill("muscle-arms-back-l", armsColor);
    setFill("muscle-arms-back-r", armsColor);

    // Back
    setFill("muscle-back", getHeatmapColor(recentSets.Back));

    // Legs / Glutes / Hamstrings / Calves
    const legsColor = getHeatmapColor(recentSets.Legs);
    setFill("muscle-legs-front-l", legsColor);
    setFill("muscle-legs-front-r", legsColor);
    setFill("muscle-legs-back-glutes", legsColor);
    setFill("muscle-legs-back-l", legsColor);
    setFill("muscle-legs-back-r", legsColor);
    setFill("muscle-legs-back-calves-l", legsColor);
    setFill("muscle-legs-back-calves-r", legsColor);
  },

  populateChartExerciseSelect() {
    const select = document.getElementById("select-chart-exercise");
    if (!select) return;

    const previousVal = select.value;
    select.innerHTML = '<option value="">Select an Exercise</option>';

    // Find all unique exercises present in history logs
    const loggedExercisesIds = new Set();
    state.history.forEach(w => {
      w.exercises.forEach(ex => loggedExercisesIds.add(ex.exerciseId));
    });

    const activeExercises = state.exercises.filter(ex => loggedExercisesIds.has(ex.id));

    activeExercises.forEach(ex => {
      const opt = document.createElement("option");
      opt.value = ex.id;
      opt.textContent = ex.name;
      select.appendChild(opt);
    });

    if (previousVal && loggedExercisesIds.has(previousVal)) {
      select.value = previousVal;
      this.renderProgressionChart(previousVal);
    } else if (activeExercises.length > 0) {
      // Auto select first
      select.value = activeExercises[0].id;
      this.renderProgressionChart(activeExercises[0].id);
    } else {
      this.renderProgressionChart(""); // empty state
    }
  },

  renderProgressionChart(exerciseId) {
    const ctx = document.getElementById("analytics-chart");
    const placeholder = document.getElementById("chart-placeholder");
    
    if (currentChartInstance) {
      currentChartInstance.destroy();
      currentChartInstance = null;
    }

    if (!ctx) return;

    if (!exerciseId) {
      if (placeholder) placeholder.classList.remove("hidden");
      ctx.style.display = "none";
      return;
    }

    // Gather logs for this exercise across all history (sorted chronological)
    const logs = [];
    state.history.forEach(w => {
      const targetEx = w.exercises.find(e => e.exerciseId === exerciseId);
      if (targetEx) {
        // Find maximum weight, max volume, and max estimated 1RM for this workout
        let maxWeight = 0;
        let totalVol = 0;
        let max1RM = 0;
        let hasCompletedSet = false;

        targetEx.sets.forEach(s => {
          if (s.completed) {
            hasCompletedSet = true;
            const wVal = parseFloat(s.weight) || 0;
            const rVal = parseInt(s.reps) || 0;
            totalVol += wVal * rVal;
            if (wVal > maxWeight) maxWeight = wVal;
            
            const oneRepM = this.calculate1RM(wVal, rVal);
            if (oneRepM > max1RM) max1RM = oneRepM;
          }
        });

        if (hasCompletedSet) {
          logs.push({
            date: new Date(w.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            dateFull: new Date(w.endTime).toLocaleDateString(),
            timestamp: w.endTime,
            maxWeight,
            max1RM: Math.round(max1RM),
            volume: totalVol
          });
        }
      }
    });

    // Sort logs by time
    logs.sort((a, b) => a.timestamp - b.timestamp);

    if (logs.length === 0) {
      if (placeholder) placeholder.classList.remove("hidden");
      ctx.style.display = "none";
      return;
    }

    if (placeholder) placeholder.classList.add("hidden");
    ctx.style.display = "block";

    // Build data points
    const labels = logs.map(l => l.date);
    const volumeData = logs.map(l => l.volume);
    const oneRMData = logs.map(l => l.max1RM);

    currentChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Estimated 1RM (${state.settings.unit})`,
            data: oneRMData,
            borderColor: '#d4fc34',
            backgroundColor: 'rgba(212, 252, 52, 0.08)',
            tension: 0.2,
            borderWidth: 2,
            yAxisID: 'y1',
            fill: true
          },
          {
            label: `Total Volume (${state.settings.unit})`,
            data: volumeData,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.2,
            borderWidth: 2,
            borderDash: [5, 5],
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: document.body.classList.contains("theme-light") ? "#475569" : "#9ca3af", font: { family: 'Inter', size: 10 } },
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: { color: document.body.classList.contains("theme-light") ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.03)" },
            ticks: { color: document.body.classList.contains("theme-light") ? "#475569" : "#9ca3af", font: { family: 'Inter', size: 10 } }
          },
          y1: {
            type: 'linear',
            position: 'left',
            grid: { color: document.body.classList.contains("theme-light") ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.05)" },
            ticks: { color: '#3b82f6', font: { family: 'Outfit', size: 10 } },
            title: { display: true, text: '1RM', color: '#3b82f6', font: { family: 'Inter', size: 9 } }
          },
          y2: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false }, // avoid overlapping grid lines
            ticks: { color: '#10b981', font: { family: 'Outfit', size: 10 } },
            title: { display: true, text: 'Volume', color: '#10b981', font: { family: 'Inter', size: 9 } }
          }
        }
      }
    });
  },


  renderActivityCalendar() {
    const grid = document.getElementById("activity-grid");
    const statsText = document.getElementById("activity-stats-text");
    if (!grid || !statsText) return;

    grid.innerHTML = "";

    // Calculate dates representing 18 weeks (126 days) ending on this week's Saturday
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - today.getDay());
    
    const startDate = new Date(currentSunday);
    startDate.setDate(startDate.getDate() - (17 * 7)); // 17 full weeks before current week's Sunday
    
    const endDate = new Date(currentSunday);
    endDate.setDate(endDate.getDate() + 6); // End on this Saturday

    // Dynamically calculate and render month labels above the grid
    const wrapper = grid.parentNode;
    let monthsHeader = wrapper.querySelector(".activity-grid-months");
    if (!monthsHeader) {
      monthsHeader = document.createElement("div");
      monthsHeader.className = "activity-grid-months";
      wrapper.insertBefore(monthsHeader, grid);
    }
    monthsHeader.innerHTML = "";
    
    let lastMonthName = "";
    for (let w = 0; w < 18; w++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + w * 7);
      const monthName = weekDate.toLocaleDateString(undefined, { month: 'short' });
      
      if (monthName !== lastMonthName) {
        const mLabel = document.createElement("div");
        mLabel.className = "month-label";
        mLabel.style.gridColumnStart = w + 1;
        mLabel.textContent = monthName;
        monthsHeader.appendChild(mLabel);
        lastMonthName = monthName;
      }
    }

    // Compile workouts count by day
    const workoutCounts = {};
    state.history.forEach(w => {
      const dateStr = new Date(w.endTime).toDateString();
      workoutCounts[dateStr] = (workoutCounts[dateStr] || 0) + 1;
    });

    let totalWorkoutsInWindow = 0;
    const datesArray = [];
    let d = new Date(startDate);
    
    while (d <= endDate) {
      datesArray.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    datesArray.forEach(date => {
      const cell = document.createElement("div");
      cell.className = "activity-cell";
      
      const dateStr = date.toDateString();
      const isFuture = date > today;
      
      if (isFuture) {
        cell.classList.add("level-0");
        cell.style.opacity = "0.08";
        cell.style.cursor = "default";
      } else {
        const count = workoutCounts[dateStr] || 0;
        totalWorkoutsInWindow += count;

        let level = 0;
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count >= 3) level = 3;

        cell.classList.add(`level-${level}`);
        
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = date.toLocaleDateString(undefined, dateOptions);
        const workoutText = count === 1 ? "1 workout" : `${count} workouts`;
        
        cell.title = count > 0 
          ? `${workoutText} on ${formattedDate}` 
          : `No workouts on ${formattedDate}`;
      }
      grid.appendChild(cell);
    });

    // Update status text
    statsText.textContent = `You logged ${totalWorkoutsInWindow} workout${totalWorkoutsInWindow === 1 ? '' : 's'} in the last 18 weeks.`;
  }
};

function updateMiniBarState(visible) {
  const miniBar = document.getElementById("mini-workout-bar");
  const shell = document.querySelector(".phone-shell");
  if (miniBar) {
    if (visible) {
      miniBar.classList.remove("hidden");
    } else {
      miniBar.classList.add("hidden");
    }
  }
  if (shell) {
    if (visible) {
      shell.classList.add("mini-workout-active");
    } else {
      shell.classList.remove("mini-workout-active");
    }
  }
}

function startWorkoutSession(templateId = null) {
  // If a workout is already active, prompt to finish it
  if (state.activeWorkout) {
    const restoreBtn = document.getElementById("btn-restore-workout");
    if (restoreBtn) restoreBtn.click();
    return;
  }

  // Intercept to display recovery assessment modal
  pendingTemplateId = templateId;
  
  // Reset active classes in recovery cards (set 'none' as default)
  const recoveryCards = document.querySelectorAll(".recovery-option-card");
  recoveryCards.forEach(c => {
    c.classList.remove("active");
    if (c.dataset.fatigue === "none") {
      c.classList.add("active");
    }
  });

  const recoveryModal = document.getElementById("modal-recovery-check");
  if (recoveryModal) {
    recoveryModal.classList.remove("hidden");
  } else {
    // Fallback if modal isn't present
    initializeWorkoutSession(templateId, "none");
  }
}

function initializeWorkoutSession(templateId, fatigue) {
  const recoveryModal = document.getElementById("modal-recovery-check");
  if (recoveryModal) {
    recoveryModal.classList.add("hidden");
  }

  let workoutName = "Evening Workout";
  let workoutNotes = "";
  let exercisesToLoad = [];

  if (templateId) {
    const tmpl = state.templates.find(t => t.id === templateId);
    if (tmpl) {
      workoutName = tmpl.name.replace(" (Chest/Shoulders/Triceps)", "").replace(" (Back/Biceps)", "").replace(" (Quads/Hamstrings/Calves)", "");
      workoutNotes = tmpl.notes || "";
      
      // Load exercises and sets from template
      exercisesToLoad = tmpl.exercises.map(ex => {
        const previousString = getPreviousSetStatsString(ex.exerciseId);
        
        let loadedSets = ex.sets.map((s, idx) => ({
          id: `set-${Date.now()}-${idx}-${Math.random()}`,
          type: s.type || "N",
          weight: s.weight,
          reps: s.reps,
          completed: false,
          previous: previousString
        }));

        // Soreness deload adjustment: cut last set and decrease weights by 10%
        if (fatigue === "sore") {
          if (loadedSets.length > 1) {
            loadedSets.pop();
          }
          loadedSets = loadedSets.map(s => {
            let adjustedWeight = s.weight;
            if (typeof adjustedWeight === "number") {
              adjustedWeight = parseFloat((adjustedWeight * 0.9).toFixed(1));
            } else if (typeof adjustedWeight === "string" && !isNaN(parseFloat(adjustedWeight))) {
              adjustedWeight = parseFloat((parseFloat(adjustedWeight) * 0.9).toFixed(1));
            }
            return {
              ...s,
              weight: adjustedWeight
            };
          });
        }

        return {
          exerciseId: ex.exerciseId,
          importedName: ex.importedName || "",
          sets: loadedSets
        };
      });

      if (fatigue === "sore") {
        workoutNotes = (workoutNotes ? workoutNotes + "\n" : "") + "Coach Note: Deload applied due to soreness (-1 set, -10% weight).";
      }
    }
  }

  // Create active workout state
  state.activeWorkout = {
    name: workoutName,
    notes: workoutNotes,
    startTime: Date.now(),
    exercises: exercisesToLoad,
    fatigue: fatigue // save recovery assessment state
  };

  saveAllState();
  isWorkoutPanelOpening = true;
  renderActiveWorkoutUI();
  
  // Set UI input values
  document.getElementById("input-workout-name").value = workoutName;
  document.getElementById("input-workout-notes").value = workoutNotes;
  
  // Toggle screens
  const wPanel = document.getElementById("workout-panel");
  if (wPanel) {
    wPanel.style.transform = ""; // clear any inline GSAP styles
    wPanel.classList.remove("minimized");
    wPanel.classList.add("open");
  }

  updateMiniBarState(false);

  startWorkoutTimer();
}


function getPreviousSetStatsString(exerciseId) {
  // Find the most recent workout in history containing this exercise
  let previousString = "—";
  for (let i = state.history.length - 1; i >= 0; i--) {
    const historicalWorkout = state.history[i];
    const targetEx = historicalWorkout.exercises.find(e => e.exerciseId === exerciseId);
    if (targetEx && targetEx.sets && targetEx.sets.length > 0) {
      // Get the best set or the first completed set
      const completedSets = targetEx.sets.filter(s => s.completed);
      if (completedSets.length > 0) {
        // Find max weight set
        let bestSet = completedSets[0];
        completedSets.forEach(s => {
          if (s.weight > bestSet.weight) bestSet = s;
        });
        previousString = `${bestSet.weight} × ${bestSet.reps}`;
        break;
      }
    }
  }
  return previousString;
}

function renderActiveWorkoutUI() {
  const container = document.getElementById("active-exercises-list");
  if (!container) return;

  if (!state.activeWorkout || state.activeWorkout.exercises.length === 0) {
    container.innerHTML = `
      <div class="empty-state-text">
        <i data-lucide="dumbbell" style="width: 32px; height: 32px; stroke-width: 1.5; color: var(--text-dark); margin-bottom: 10px;"></i>
        <p>No exercises added yet.</p>
        <p style="font-size: 0.75rem; color: var(--text-dark); margin-top: 4px;">Click "Add Exercise" to begin logging</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = "";

  state.activeWorkout.exercises.forEach((activeEx, exIdx) => {
    const exDetails = state.exercises.find(e => e.id === activeEx.exerciseId);
    const exName = exDetails ? exDetails.name : "Unknown Exercise";
    
    const card = document.createElement("div");
    card.className = "active-exercise-card";
    card.dataset.index = exIdx;

    let rowsHTML = "";
    activeEx.sets.forEach((set, setIdx) => {
      const isCompleted = set.completed;
      const typeDisplay = set.type === "N" ? (setIdx + 1) : set.type;
      
      // Find set-specific previous value from history
      let previousDisplay = "—";
      for (let i = state.history.length - 1; i >= 0; i--) {
        const historicalWorkout = state.history[i];
        const targetEx = historicalWorkout.exercises.find(e => e.exerciseId === activeEx.exerciseId);
        if (targetEx && targetEx.sets && targetEx.sets.length > 0) {
          const histSet = targetEx.sets[setIdx];
          if (histSet && histSet.weight !== undefined && histSet.reps !== undefined && histSet.weight !== null && histSet.reps !== null && histSet.weight !== "" && histSet.reps !== "") {
            previousDisplay = `${histSet.weight} × ${histSet.reps}`;
          }
          break;
        }
      }
      
      // Check for progressive overload suggestion
      let showOverloadBadge = false;
      const unit = state.settings.unit || "lbs";
      const overloadAmount = unit === "kg" ? 2.5 : 5;
      
      const fatigue = state.activeWorkout ? state.activeWorkout.fatigue : "none";
      
      if (fatigue === "none" && !set.overloadApplied && !isCompleted) {
        const targetReps = parseInt(set.reps);
        if (!isNaN(targetReps) && targetReps > 0) {
          for (let i = state.history.length - 1; i >= 0; i--) {
            const histWorkout = state.history[i];
            const targetEx = histWorkout.exercises.find(e => e.exerciseId === activeEx.exerciseId);
            if (targetEx && targetEx.sets && targetEx.sets.length > 0) {
              const histSet = targetEx.sets[setIdx];
              if (histSet && histSet.completed && histSet.reps >= targetReps) {
                showOverloadBadge = true;
              }
              break;
            }
          }
        }
      }

      const badgeHTML = showOverloadBadge 
        ? `<div class="overload-badge-container" style="margin-top: 3px;">
             <button class="overload-badge" data-action="apply-overload" title="Hit target reps in last session! Click to overload +${overloadAmount} ${unit}">
               ⚡ +${overloadAmount} ${unit}
             </button>
           </div>`
        : "";

      rowsHTML += `
        <div class="set-table-row ${isCompleted ? 'completed' : ''}" data-set-index="${setIdx}">
          <div>
            <button class="set-type-tag ${set.type}" title="Set Type: Warmup, Drop, Failure, Normal" data-action="toggle-set-type">
              ${typeDisplay}
            </button>
          </div>
          <div class="set-previous">${previousDisplay}</div>
          <div class="set-input-cell">
            <input type="number" class="input-set-weight" placeholder="0" min="0" step="any" value="${set.weight !== undefined && set.weight !== null && set.weight !== '' ? set.weight : ''}" data-field="weight">
            ${badgeHTML}
          </div>
          <div class="set-input-cell">
            <input type="number" class="input-set-reps" placeholder="0" min="0" value="${set.reps !== undefined && set.reps !== null && set.reps !== '' ? set.reps : ''}" data-field="reps">
          </div>
          <div>
            <div class="set-checkmark" data-action="toggle-complete">
              <i data-lucide="check"></i>
            </div>
          </div>
          <div>
            <button class="btn-delete-set" data-action="delete-set" title="Delete set">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    });

    const importedNameHTML = activeEx.importedName 
      ? `<span style="font-size: 0.72rem; color: var(--text-muted); display: block; font-style: italic; margin-top: 2px;">Imported as: ${escapeHTML(activeEx.importedName)}</span>` 
      : "";

    card.innerHTML = `
      <div class="active-exercise-header">
        <div class="active-exercise-title-container" style="flex: 1; min-width: 0;">
          <h4 class="active-exercise-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${exName}</h4>
          ${importedNameHTML}
          <span class="badge" style="font-size:0.65rem; margin-top: 4px;">${exDetails ? exDetails.muscle : 'Muscle'}</span>
        </div>
        <div class="active-exercise-actions" style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: 8px;">
          <button class="btn-icon-only-flat" data-action="move-workout-exercise-up" title="Move Up" ${exIdx === 0 ? 'disabled style="opacity: 0.2; cursor: not-allowed;"' : ''}>
            <i data-lucide="chevron-up" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="btn-icon-only-flat" data-action="move-workout-exercise-down" title="Move Down" ${exIdx === state.activeWorkout.exercises.length - 1 ? 'disabled style="opacity: 0.2; cursor: not-allowed;"' : ''}>
            <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="btn-icon-only-flat" data-action="open-plate-calc" title="Plate Calculator">
            <i data-lucide="calculator" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="btn-icon-only-flat" data-action="remove-exercise" title="Remove exercise from workout">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
      
      <div class="set-table">
        <div class="set-table-header">
          <div>Set</div>
          <div>Prev</div>
          <div>Weight</div>
          <div>Reps</div>
          <div style="display: flex; justify-content: center;"><i data-lucide="check" style="width:12px;height:12px;stroke-width:3;"></i></div>
          <div></div>
        </div>
        <div class="sets-tbody">
          ${rowsHTML}
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 12px; align-items: center;">
        <button class="btn-add-set" data-action="add-set" style="margin: 0; flex: 1;">
          <i data-lucide="plus"></i> Add Set
        </button>
        <button class="btn-secondary" data-action="toggle-exercise-note" style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 14px; font-size: 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); color: var(--text-main); font-weight: 600; cursor: pointer; height: 38px;">
          <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Note
        </button>
      </div>
      
      <div class="exercise-note-container ${activeEx.note ? '' : 'hidden'}" style="margin-top: 10px;">
        <textarea class="input-exercise-note" placeholder="Add exercise note..." style="width: 100%; min-height: 48px; max-height: 120px; font-size: 0.78rem; padding: 8px 10px; border-radius: 6px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); color: var(--text-main); resize: vertical; outline: none; line-height: 1.4; font-family: var(--font-body);">${activeEx.note || ''}</textarea>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();

  // Run entrance animation for cards if panel is opening
  if (isWorkoutPanelOpening) {
    isWorkoutPanelOpening = false;
    if (window.gsap) {
      const cards = container.querySelectorAll(".active-exercise-card");
      if (cards.length > 0) {
        gsap.killTweensOf(cards);
        gsap.fromTo(cards, 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power3.out", clearProps: "transform" }
        );
      }
    }
  }

}

function handleActiveWorkoutClickEvents(e) {
  // Handle set table row clicks (using event delegation)
  const target = e.target;
  
  // Find action and parent elements
  const actionButton = target.closest("[data-action]");
  const card = target.closest(".active-exercise-card");
  
  if (!card) return;
  const exIdx = parseInt(card.dataset.index);
  const activeEx = state.activeWorkout.exercises[exIdx];

  if (actionButton) {
    const action = actionButton.dataset.action;
    const row = target.closest(".set-table-row");
    const setIdx = row ? parseInt(row.dataset.setIndex) : null;

    if (action === "apply-overload") {
      const set = activeEx.sets[setIdx];
      const unit = state.settings.unit || "lbs";
      const overloadAmount = unit === "kg" ? 2.5 : 5;
      
      let currWeight = parseFloat(set.weight);
      if (isNaN(currWeight)) {
        currWeight = 0;
      }
      set.weight = currWeight + overloadAmount;
      set.overloadApplied = true;
      
      saveAllState();
      renderActiveWorkoutUI();
    }
    else if (action === "toggle-complete") {
      // Weight & Rep validation
      const weightInput = row.querySelector(".input-set-weight");
      const repsInput = row.querySelector(".input-set-reps");
      const weight = weightInput.value.trim() === "" ? "" : (parseFloat(weightInput.value) || 0);
      const reps = repsInput.value.trim() === "" ? "" : (parseInt(repsInput.value) || 0);

      // Update state
      const set = activeEx.sets[setIdx];
      set.weight = weight;
      set.reps = reps;
      set.completed = !set.completed;

      saveAllState();

      // Rest timer auto trigger
      if (set.completed) {
        RestTimer.start(state.settings.defaultRest);
      } else {
        RestTimer.stop();
      }

      renderActiveWorkoutUI();
    } 
    else if (action === "toggle-set-type") {
      const set = activeEx.sets[setIdx];
      const types = ["N", "W", "D", "F"];
      const currTypeIdx = types.indexOf(set.type);
      set.type = types[(currTypeIdx + 1) % types.length];
      saveAllState();
      renderActiveWorkoutUI();
    } 
    else if (action === "delete-set") {
      activeEx.sets.splice(setIdx, 1);
      saveAllState();
      renderActiveWorkoutUI();
    } 
    else if (action === "add-set") {
      // Add a set with values copied from last set in the list
      const setLength = activeEx.sets.length;
      let newWeight = "";
      let newReps = "";
      let newType = "N";

      if (setLength > 0) {
        const lastSet = activeEx.sets[setLength - 1];
        let lastWeight = parseFloat(lastSet.weight);
        if (!isNaN(lastWeight) && lastWeight > 0) {
          const unit = state.settings.unit || "lbs";
          const increment = unit === "kg" ? 2.5 : 5;
          newWeight = lastWeight + increment;
        } else {
          newWeight = (lastSet.weight !== undefined && lastSet.weight !== null && lastSet.weight !== "") ? lastSet.weight : "";
        }
        newReps = (lastSet.reps !== undefined && lastSet.reps !== null && lastSet.reps !== "") ? lastSet.reps : "";
        newType = lastSet.type || "N";
      }

      activeEx.sets.push({
        id: `set-${Date.now()}-${setLength}-${Math.random()}`,
        type: newType,
        weight: newWeight,
        reps: newReps,
        completed: false,
        previous: getPreviousSetStatsString(activeEx.exerciseId)
      });

      saveAllState();
      renderActiveWorkoutUI();
    } 
    else if (action === "move-workout-exercise-up") {
      if (exIdx > 0) {
        const exercises = state.activeWorkout.exercises;
        const temp = exercises[exIdx];
        exercises[exIdx] = exercises[exIdx - 1];
        exercises[exIdx - 1] = temp;
        saveAllState();
        renderActiveWorkoutUI();
      }
    }
    else if (action === "move-workout-exercise-down") {
      const exercises = state.activeWorkout.exercises;
      if (exIdx < exercises.length - 1) {
        const temp = exercises[exIdx];
        exercises[exIdx] = exercises[exIdx + 1];
        exercises[exIdx + 1] = temp;
        saveAllState();
        renderActiveWorkoutUI();
      }
    }
    else if (action === "toggle-exercise-note") {
      const noteContainer = card.querySelector(".exercise-note-container");
      if (noteContainer) {
        noteContainer.classList.toggle("hidden");
        const textarea = noteContainer.querySelector(".input-exercise-note");
        if (textarea && !noteContainer.classList.contains("hidden")) {
          textarea.focus();
        }
      }
    }
    else if (action === "remove-exercise") {
      state.activeWorkout.exercises.splice(exIdx, 1);
      saveAllState();
      renderActiveWorkoutUI();
    }
    else if (action === "open-plate-calc") {
      // Find current weight from input
      const rows = card.querySelectorAll(".set-table-row");
      let currentWeight = 135; // default
      if (rows.length > 0) {
        const lastWeightInput = rows[rows.length - 1].querySelector(".input-set-weight");
        if (lastWeightInput && lastWeightInput.value) {
          currentWeight = parseFloat(lastWeightInput.value) || 135;
        }
      }
      
      const plateModal = document.getElementById("modal-plate-calculator");
      if (plateModal) {
        plateModal.classList.remove("hidden");
        document.getElementById("input-target-weight").value = currentWeight;
        PlateCalc.render(currentWeight);
      }
    }
  }
}

// Bind input changes to state
function handleActiveWorkoutInputChanges(e) {
  const input = e.target;

  if (input.classList.contains("input-exercise-note")) {
    const card = input.closest(".active-exercise-card");
    if (!card) return;
    const exIdx = parseInt(card.dataset.index);
    if (state.activeWorkout && state.activeWorkout.exercises[exIdx]) {
      state.activeWorkout.exercises[exIdx].note = input.value;
      saveAllState();
    }
    return;
  }

  if (!input.classList.contains("input-set-weight") && !input.classList.contains("input-set-reps")) return;

  const card = input.closest(".active-exercise-card");
  const row = input.closest(".set-table-row");
  if (!card || !row) return;

  const exIdx = parseInt(card.dataset.index);
  const setIdx = parseInt(row.dataset.setIndex);
  const field = input.dataset.field;
  
  if (state.activeWorkout && state.activeWorkout.exercises[exIdx]) {
    const activeEx = state.activeWorkout.exercises[exIdx];
    const set = activeEx.sets[setIdx];
    if (field === "weight") {
      set.weight = input.value === "" ? "" : parseFloat(input.value);
      
      // Auto-propagate increments to subsequent sets if they are empty
      let currentWeight = parseFloat(input.value);
      if (!isNaN(currentWeight) && currentWeight > 0) {
        const unit = state.settings.unit || "lbs";
        const increment = unit === "kg" ? 2.5 : 5;
        
        for (let i = setIdx + 1; i < activeEx.sets.length; i++) {
          let nextSet = activeEx.sets[i];
          let nextWeight = parseFloat(nextSet.weight);
          if (isNaN(nextWeight) || nextSet.weight === "" || nextSet.weight === 0) {
            let overloadWeight = currentWeight + (i - setIdx) * increment;
            nextSet.weight = overloadWeight;
            
            // Update the DOM element directly so the user doesn't lose focus
            const nextRow = card.querySelector(`.set-table-row[data-set-index="${i}"]`);
            if (nextRow) {
              const nextInput = nextRow.querySelector(".input-set-weight");
              if (nextInput) nextInput.value = overloadWeight;
            }
          }
        }
      }
    } else if (field === "reps") {
      set.reps = input.value === "" ? "" : parseInt(input.value);
    }
    saveAllState();
  }
}

function addExercisesToWorkout(selectedIds) {
  if (!state.activeWorkout) return;

  selectedIds.forEach(id => {
    // Check if exercise already added. If so, just add another set.
    const existing = state.activeWorkout.exercises.find(e => e.exerciseId === id);
    const prevStr = getPreviousSetStatsString(id);

    if (existing) {
      const lastSet = existing.sets[existing.sets.length - 1];
      existing.sets.push({
        id: `set-${Date.now()}-${existing.sets.length}-${Math.random()}`,
        type: "N",
        weight: (lastSet && lastSet.weight !== undefined && lastSet.weight !== null) ? lastSet.weight : "",
        reps: (lastSet && lastSet.reps !== undefined && lastSet.reps !== null) ? lastSet.reps : "",
        completed: false,
        previous: prevStr
      });
    } else {
      state.activeWorkout.exercises.push({
        exerciseId: id,
        sets: [
          { id: `set-${Date.now()}-0-${Math.random()}`, type: "N", weight: "", reps: "", completed: false, previous: prevStr },
          { id: `set-${Date.now()}-1-${Math.random()}`, type: "N", weight: "", reps: "", completed: false, previous: prevStr },
          { id: `set-${Date.now()}-2-${Math.random()}`, type: "N", weight: "", reps: "", completed: false, previous: prevStr }
        ]
      });
    }
  });

  saveAllState();
  renderActiveWorkoutUI();
}

function finishActiveWorkout() {
  if (!state.activeWorkout) return;

  // Validate that there is at least one completed set
  let completedSetCount = 0;
  state.activeWorkout.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      if (s.completed) completedSetCount++;
    });
  });

  if (completedSetCount === 0) {
    alert("Please complete at least one set before finishing the workout!");
    return;
  }

  // Compile final workout object
  const completedWorkout = {
    id: `workout-${Date.now()}`,
    name: document.getElementById("input-workout-name").value.trim() || state.activeWorkout.name || "Evening Workout",
    notes: document.getElementById("input-workout-notes").value.trim(),
    startTime: state.activeWorkout.startTime,
    endTime: Date.now(),
    exercises: state.activeWorkout.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      note: ex.note || "",
      importedName: ex.importedName || "",
      sets: ex.sets.filter(s => s.completed) // only save completed sets in history
    })).filter(ex => ex.sets.length > 0), // only save exercises with completed sets
    updated_at: Date.now(),
    deleted: 0,
    dirty: 1
  };

  // Detect if any exercise set in this workout sets a new Personal Record
  completedWorkout.exercises.forEach(ex => {
    let prevMax = 0;
    state.history.forEach(h => {
      if (!h.deleted) {
        const histEx = h.exercises.find(e => e.exerciseId === ex.exerciseId);
        if (histEx) {
          histEx.sets.forEach(s => {
            const wt = parseFloat(s.weight) || 0;
            if (wt > prevMax) prevMax = wt;
          });
        }
      }
    });

    let currMax = 0;
    ex.sets.forEach(s => {
      const wt = parseFloat(s.weight) || 0;
      if (wt > currMax) currMax = wt;
    });

    // If there was a previous lift and they lifted more, it is a PR!
    if (prevMax > 0 && currMax > prevMax) {
      ex.isPR = true;
      // Synthesize a brief extra high pitch chime
      setTimeout(() => SoundSynth.beep(880, 0.1), 120);
    }
  });

  // Push to history
  state.history.push(completedWorkout);

  
  // Clear active workout
  state.activeWorkout = null;
  saveAllState();

  // Instant cloud sync
  if (state.auth && state.auth.token) {
    syncData(true);
  }
  
  stopWorkoutTimer();

  // Reset overlays
  document.getElementById("workout-panel").classList.remove("open");
  document.getElementById("workout-panel").classList.remove("minimized");
  updateMiniBarState(false);

  // Visual success celebration chime
  SoundSynth.beep(523.25, 0.15); // C5
  setTimeout(() => SoundSynth.beep(659.25, 0.15), 120); // E5
  setTimeout(() => SoundSynth.beep(783.99, 0.15), 240); // G5
  setTimeout(() => SoundSynth.beep(1046.50, 0.35), 360); // C6

  // Switch to history view
  switchView("history");
  renderHistoryView();
  
  // Recalculate stats & charts
  Analytics.calculateAllStats();
}

function showCustomConfirm(options = {}) {
  const {
    title = "Confirm Action",
    message = "Are you sure?",
    confirmText = "Proceed",
    cancelText = "Cancel",
    isDanger = true,
    onConfirm = () => {},
    onCancel = () => {}
  } = options;

  const modal = document.getElementById("modal-custom-confirm");
  const titleEl = document.getElementById("confirm-dialog-title");
  const msgEl = document.getElementById("confirm-dialog-message");
  const iconEl = document.getElementById("confirm-dialog-icon");
  const btnCancel = document.getElementById("btn-confirm-dialog-cancel");
  const btnOk = document.getElementById("btn-confirm-dialog-ok");

  if (!modal) return;

  titleEl.textContent = title;
  msgEl.textContent = message;
  btnCancel.textContent = cancelText;
  btnOk.textContent = confirmText;

  if (isDanger) {
    iconEl.textContent = "⚠️";
    iconEl.style.background = "rgba(244, 63, 94, 0.12)";
    iconEl.style.color = "var(--color-danger)";
    btnOk.className = "btn-danger";
  } else {
    iconEl.textContent = "❓";
    iconEl.style.background = "rgba(16, 185, 129, 0.12)";
    iconEl.style.color = "var(--color-primary)";
    btnOk.className = "btn-success";
  }

  modal.classList.remove("hidden");
  if (window.gsap) {
    gsap.killTweensOf(modal);
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.18 });
    const content = modal.querySelector(".modal-content");
    if (content) {
      gsap.killTweensOf(content);
      gsap.fromTo(content, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.4)" });
    }
  }

  // Remove previous event listeners by cloning
  const newBtnCancel = btnCancel.cloneNode(true);
  const newBtnOk = btnOk.cloneNode(true);
  btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
  btnOk.parentNode.replaceChild(newBtnOk, btnOk);

  const closeModal = () => {
    if (window.gsap) {
      const content = modal.querySelector(".modal-content");
      gsap.to(content, { scale: 0.92, opacity: 0, duration: 0.15, onComplete: () => {
        gsap.to(modal, { opacity: 0, duration: 0.1, onComplete: () => {
          modal.classList.add("hidden");
        }});
      }});
    } else {
      modal.classList.add("hidden");
    }
  };

  newBtnCancel.addEventListener("click", () => {
    closeModal();
    onCancel();
  });

  newBtnOk.addEventListener("click", () => {
    closeModal();
    onConfirm();
  });
}

function cancelActiveWorkout() {
  showCustomConfirm({
    title: "Discard Workout?",
    message: "Are you sure you want to discard this workout session? All logged sets will be lost permanently.",
    confirmText: "Discard",
    cancelText: "Keep Logging",
    isDanger: true,
    onConfirm: () => {
      state.activeWorkout = null;
      saveAllState();
      stopWorkoutTimer();

      const wPanel = document.getElementById("workout-panel");
      if (wPanel) {
        wPanel.style.transform = "";
        wPanel.classList.remove("open");
        wPanel.classList.remove("minimized");
      }
      updateMiniBarState(false);
      switchView("workouts");
    }
  });
}


// ==========================================================================
// 9. RENDER SUBVIEWS
// ==========================================================================

// --- HOME DASHBOARD VIEW ---
function renderHomeView() {
  // Update banner visibility
  const banner = document.getElementById("home-photo-banner");
  if (banner) {
    const dismissed = localStorage.getItem("bebig_profile_photo_banner_dismissed") === "true";
    const hasPhoto = !!state.settings.profilePhoto;
    if (dismissed || hasPhoto) {
      banner.classList.add("hidden");
    } else {
      banner.classList.remove("hidden");
    }
  }

  // Update profile avatars globally (home, header, settings)
  const hasPhoto = !!state.settings.profilePhoto;
  const displayName = state.auth.name || (state.auth.email ? state.auth.email.split('@')[0] : "Adi");
  let initials = displayName.substring(0, 2).toUpperCase();
  if (state.auth.name && state.auth.name.includes(" ")) {
    const parts = state.auth.name.split(" ");
    initials = (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1])).toUpperCase();
  }
  
  document.querySelectorAll("#home-profile-avatar, .app-header .profile-avatar, .profile-card-avatar").forEach(el => {
    if (hasPhoto) {
      el.innerHTML = `<img src="${state.settings.profilePhoto}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
      el.innerHTML = `<span id="home-avatar-initials" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: 700;">${initials}</span>`;
    }
  });

  // Update Greeting title & Motivation Quote
  const greetingTitle = document.getElementById("home-greeting-title");
  const quoteEl = document.getElementById("home-greeting-quote");
  const hours = new Date().getHours();
  let timeGreeting = "Good Morning";
  let bracket = "morning";
  
  if (hours >= 12 && hours < 17) {
    timeGreeting = "Good Afternoon";
    bracket = "afternoon";
  } else if (hours >= 17 && hours < 22) {
    timeGreeting = "Good Evening";
    bracket = "evening";
  } else if (hours >= 22 || hours < 5) {
    timeGreeting = "Good Night";
    bracket = "night";
  }
  
  if (greetingTitle) {
    let nameGreet = "Adi";
    if (state.auth.name) {
      nameGreet = state.auth.name.split(" ")[0];
    } else if (state.auth.email) {
      const parts = state.auth.email.split('@')[0].split('.');
      nameGreet = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    greetingTitle.innerHTML = `${timeGreeting},<br><span style="background: linear-gradient(135deg, #d4fc34 0%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${nameGreet}</span>`;
  }

  if (quoteEl) {
    const quotes = {
      morning: [
        "Win the morning, own the day. Let's make today count!",
        "Rise and grind. Consistency beats intensity.",
        "Your only limit is you. Let's crush today's objectives."
      ],
      afternoon: [
        "Keep the momentum going. No half efforts.",
        "Midday energy check. Refocus, reload, rebuild.",
        "Finish the day strong. You've got this."
      ],
      evening: [
        "Discipline over motivation. Finish the day with a win.",
        "Sweat out the stress. The grind never stops.",
        "Push your boundaries tonight. Tomorrow starts now."
      ],
      night: [
        "Late night dedication. Building in silence.",
        "Rest up, recover, prepare. Tomorrow we go again.",
        "Sleep is when you grow. Great effort today."
      ]
    };
    const quoteList = quotes[bracket] || quotes.morning;
    const index = new Date().getDate() % quoteList.length;
    quoteEl.textContent = quoteList[index];
  }

  // Calculate Streak
  let streak = 0;
  const streakCount = document.getElementById("home-streak-count");
  const visibleHistory = state.history.filter(w => !w.deleted);
  
  if (visibleHistory.length > 0) {
    const sortedHistory = [...visibleHistory].sort((a, b) => b.endTime - a.endTime);
    let lastDate = null;
    let currentCheck = new Date();
    currentCheck.setHours(0, 0, 0, 0);

    let isStreakActive = true;
    for (let i = 0; i < sortedHistory.length; i++) {
      const workoutDate = new Date(sortedHistory[i].endTime);
      workoutDate.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        const diffTime = currentCheck.getTime() - workoutDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          streak = 1;
          lastDate = workoutDate;
        } else {
          isStreakActive = false;
          break;
        }
      } else {
        const diffTime = lastDate.getTime() - workoutDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          lastDate = workoutDate;
        } else if (diffDays > 1) {
          break;
        }
      }
    }
  }

  if (streakCount) {
    streakCount.textContent = streak;
  }
  
  // Scale Streak Circular SVG Ring
  const progressRing = document.getElementById("streak-ring-progress");
  if (progressRing) {
    const targetStreak = 7;
    const offset = Math.max(0, 251.2 - (251.2 * Math.min(streak, targetStreak) / targetStreak));
    progressRing.style.strokeDashoffset = offset;
  }

  const streakDayText = document.getElementById("streak-day-text");
  if (streakDayText) {
    streakDayText.textContent = `${streak} Day${streak === 1 ? '' : 's'} Streak`;
  }

  // Calculate sessions completed this week (past 7 days)
  const weekSessions = document.getElementById("home-week-sessions");
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const count = visibleHistory.filter(w => w.endTime >= sevenDaysAgo).length;
  if (weekSessions) {
    weekSessions.textContent = count;
  }

  // Populate Weekly Dot Calendar (Fixed Monday-Sunday layout)
  const dotsContainer = document.getElementById("home-weekly-dots");
  if (dotsContainer) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const mondayOfWeek = new Date(today);
    mondayOfWeek.setDate(today.getDate() + distanceToMonday);

    const dots = dotsContainer.querySelectorAll(".week-dot");
    const daysAbbrev = ["M", "T", "W", "T", "F", "S", "S"];

    dots.forEach((dot, idx) => {
      const targetDate = new Date(mondayOfWeek);
      targetDate.setDate(mondayOfWeek.getDate() + idx);

      const label = dot.querySelector("span");
      if (label) {
        label.textContent = daysAbbrev[idx];
      }

      const hasWorkout = visibleHistory.some(w => {
        const wDate = new Date(w.endTime);
        wDate.setHours(0, 0, 0, 0);
        return wDate.getTime() === targetDate.getTime();
      });

      if (hasWorkout) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }

      if (targetDate.getTime() === today.getTime()) {
        dot.classList.add("today");
      } else {
        dot.classList.remove("today");
      }
    });
  }


  // Update Weight subtext
  const weightSubtext = document.getElementById("home-weight-subtext");
  if (weightSubtext) {
    if (state.settings.currentWeight) {
      weightSubtext.textContent = `Last: ${state.settings.currentWeight} ${state.settings.unit || 'lbs'}`;
    } else {
      weightSubtext.textContent = "Track progress";
    }
  }

  // Weekly Focus list
  const focusList = document.getElementById("home-weekly-focus-list");
  if (focusList) {
    const recentWorkouts = visibleHistory.filter(w => w.endTime >= sevenDaysAgo);
    const musclesMap = {};
    
    recentWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        const details = state.exercises.find(e => e.id === ex.exerciseId);
        if (details && details.muscle) {
          const setsCount = ex.sets ? ex.sets.length : 0;
          musclesMap[details.muscle] = (musclesMap[details.muscle] || 0) + setsCount;
        }
      });
    });

    const sortedFocus = Object.entries(musclesMap).sort((a, b) => b[1] - a[1]);

    if (sortedFocus.length === 0) {
      focusList.innerHTML = '<p class="empty-state-text" style="font-size: 0.78rem; text-align: left; padding: 0;">No muscle focus logged this week yet.</p>';
    } else {
      const maxSets = Math.max(...sortedFocus.map(f => f[1]));
      focusList.innerHTML = sortedFocus.map(([muscle, sets]) => {
        const percent = maxSets > 0 ? Math.round((sets / maxSets) * 100) : 0;
        return `
          <div class="focus-progress-row">
            <div class="focus-progress-labels">
              <span class="focus-progress-muscle">
                <i data-lucide="shield" style="width: 14px; height: 14px;"></i>
                ${muscle}
              </span>
              <span class="focus-progress-count">${sets} sets</span>
            </div>
            <div class="focus-progress-bar-bg">
              <div class="focus-progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join("");
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

// --- PROTOCOL SCHEDULE VIEW ---
let scheduleSelectedDay = null;

function renderScheduleView() {
  const container = document.getElementById("schedule-weekly-list");
  if (!container) return;

  container.innerHTML = "";

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon is 0
  const todayName = daysOfWeek[todayIndex];

  daysOfWeek.forEach(day => {
    const card = document.createElement("div");
    card.className = "schedule-day-card";
    card.dataset.day = day;

    const isToday = day === todayName;
    const templateId = state.schedule[day];
    const template = templateId ? state.templates.find(t => t.id === templateId && !t.deleted) : null;

    let contentHTML = "";
    if (template) {
      const totalExercises = template.exercises.length;
      const names = template.exercises.slice(0, 3).map(ex => {
        const det = state.exercises.find(e => e.id === ex.exerciseId);
        return det ? det.name : "";
      }).filter(Boolean).join(" • ");

      const extraCount = totalExercises > 3 ? ` • +${totalExercises - 3} more` : "";

      contentHTML = `
        <div class="schedule-day-label active">
          <span class="schedule-day-name">${day}</span>
          <span class="schedule-day-status-text">LIVE</span>
        </div>
        <div class="schedule-day-content">
          <h3 class="schedule-day-title">${template.name}</h3>
          <span class="schedule-day-subtitle">
            <i data-lucide="activity" style="width: 12px; height: 12px; color: var(--color-primary);"></i >
            ${totalExercises} MODULES
          </span>
          <div class="schedule-day-exercises-list">${names}${extraCount}</div>
        </div>
        <button class="btn-schedule-play" data-action="play-scheduled" data-id="${template.id}" title="Start Scheduled Workout">
          <i data-lucide="play" style="fill: currentColor; width: 12px; height: 12px;"></i>
        </button>
      `;
    } else {
      contentHTML = `
        <div class="schedule-day-label">
          <span class="schedule-day-name">${day}</span>
        </div>
        <div class="schedule-day-content">
          <span class="schedule-recovery-text">SYSTEM RECOVERY</span>
        </div>
        <i data-lucide="plus" style="color: var(--text-dark); width: 16px; height: 16px;"></i>
      `;
    }

    card.innerHTML = contentHTML;

    if (isToday) {
      card.style.borderColor = "rgba(212, 252, 52, 0.4)";
      card.style.boxShadow = "inset 0 0 10px rgba(212, 252, 52, 0.03)";
    }

    const playBtn = card.querySelector('[data-action="play-scheduled"]');
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startWorkoutSession(template.id);
      });
    }

    card.addEventListener("click", () => {
      openSchedulePicker(day);
    });

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

function openSchedulePicker(day) {
  scheduleSelectedDay = day;
  
  const modal = document.getElementById("modal-schedule-picker");
  const title = document.getElementById("schedule-picker-day-desc");
  const listContainer = document.getElementById("schedule-templates-list");
  
  if (!modal || !listContainer) return;

  modal.classList.remove("hidden");
  title.textContent = `Select a template for ${day}:`;

  const visibleTemplates = state.templates.filter(t => !t.deleted);
  if (visibleTemplates.length === 0) {
    listContainer.innerHTML = '<p class="empty-state-text">No workout templates created yet. Go to the Workouts tab to create one.</p>';
    return;
  }

  listContainer.innerHTML = "";

  visibleTemplates.forEach(tmpl => {
    const button = document.createElement("div");
    button.className = "action-card";
    button.style.padding = "12px 16px";
    button.style.width = "100%";
    
    const totalExercises = tmpl.exercises.length;

    button.innerHTML = `
      <div class="action-card-content" style="text-align: left;">
        <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 2px;">${tmpl.name}</h3>
        <p style="font-size: 0.72rem; color: var(--text-muted);">${totalExercises} exercises</p>
      </div>
      <i data-lucide="plus" style="width: 16px; height: 16px; color: var(--color-primary);"></i>
    `;

    button.addEventListener("click", () => {
      state.schedule[scheduleSelectedDay] = tmpl.id;
      saveAllState();
      renderScheduleView();
      modal.classList.add("hidden");
      
      // Send scheduled workout notification if enabled
      triggerImmediateScheduledNotification(tmpl.name, scheduleSelectedDay);
    });

    listContainer.appendChild(button);
  });

  if (window.lucide) window.lucide.createIcons();
}

// --- START WORKOUT VIEW ---
function updateStartViewGreeting() {
  const subtitle = document.getElementById("start-greeting-subtext");
  if (!subtitle) return;

  const visibleHistory = state.history.filter(w => !w.deleted);
  if (visibleHistory.length === 0) {
    subtitle.innerHTML = "Welcome! Let's get after it today!";
    return;
  }

  // Get last workout
  const sorted = [...visibleHistory].sort((a, b) => b.endTime - a.endTime);
  const last = sorted[0];

  // Calculate relative time
  const diffMs = Date.now() - last.endTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let timeStr = "";
  if (diffDays === 0) {
    timeStr = "today";
  } else if (diffDays === 1) {
    timeStr = "yesterday";
  } else {
    timeStr = `${diffDays} days ago`;
  }

  subtitle.innerHTML = `Last workout: <strong style="color: var(--color-primary); font-weight: 700;">${last.name}</strong> (${timeStr})`;
}

function renderStartView() {
  const container = document.getElementById("templates-list");
  if (!container) return;

  // Render greeting subtext
  updateStartViewGreeting();

  const visibleTemplates = state.templates.filter(t => !t.deleted);
  if (visibleTemplates.length === 0) {
    container.innerHTML = '<p class="empty-state-text">No workout templates created yet.</p>';
    return;
  }

  container.innerHTML = "";

  visibleTemplates.forEach(template => {
    const card = document.createElement("div");
    card.className = "template-card";
    
    // Calculate template stats
    const exercisesList = Array.isArray(template.exercises) ? template.exercises : [];
    const totalExercises = exercisesList.length;
    const totalSets = exercisesList.reduce((sum, ex) => sum + (ex && ex.sets ? ex.sets.length : 0), 0);

    // Extract unique muscles
    const musclesMap = {};
    exercisesList.forEach(ex => {
      if (ex && ex.exerciseId) {
        const det = state.exercises.find(e => e.id === ex.exerciseId);
        if (det && det.muscle) {
          musclesMap[det.muscle] = true;
        }
      }
    });
    const targetedMuscles = Object.keys(musclesMap);

    // Build brief list of exercises in template as preview text (takes much less vertical space)
    const exerciseNames = exercisesList.map(ex => {
      if (ex && ex.exerciseId) {
        const det = state.exercises.find(e => e.id === ex.exerciseId);
        return det ? det.name : null;
      }
      return null;
    }).filter(Boolean);
    
    let previewText = "No exercises added yet.";
    if (exerciseNames.length > 0) {
      previewText = exerciseNames.slice(0, 3).join(", ");
      if (exerciseNames.length > 3) {
        previewText += ` +${exerciseNames.length - 3} more`;
      }
    }

    const exercisesHTML = `
      <p class="template-preview-text" style="font-size: 0.8rem; color: var(--text-muted); margin: 8px 0 12px 0; line-height: 1.4; font-family: var(--font-body); font-weight: 500;">
        ${escapeHTML(previewText)}
      </p>
    `;


    // Muscle group badges
    let musclesHTML = "";
    if (targetedMuscles.length > 0) {
      const badges = targetedMuscles.map(muscle => {
        const muscleClean = muscle.toLowerCase().replace(/\s+/g, '-');
        const badgeClass = `primary-muscle-badge ${muscleClean}`;
        return `<span class="${badgeClass}">${escapeHTML(muscle)}</span>`;
      });
      musclesHTML = `<div class="template-card-muscle-badges">${badges.join(" ")}</div>`;
    }

    card.innerHTML = `
      <div class="template-card-header">
        <div>
          <span class="template-card-title">${escapeHTML(template.name)}</span>
          <span class="template-card-subtitle">${totalExercises} exercises • ${totalSets} sets</span>
        </div>
        <div class="template-card-actions">
          <button class="btn-card-action" data-action="edit-template" data-id="${template.id}" title="Edit Template">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-card-action" data-action="delete-template" data-id="${template.id}" title="Delete Template">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      ${exercisesHTML}
      ${template.notes ? `<div class="template-card-notes">${escapeHTML(template.notes)}</div>` : ''}
      ${musclesHTML}
    `;


    // Make the card clickable to start a workout session
    card.addEventListener("click", (e) => {
      if (e.target.closest(".template-card-actions") || e.target.closest("button")) {
        // Ignore clicks on action buttons
        return;
      }
      startWorkoutSession(template.id);
    });

    container.appendChild(card);
  });

  // Attach button event listeners inside template actions
  container.querySelectorAll('[data-action="edit-template"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTemplateEditor(btn.dataset.id);
    });
  });

  container.querySelectorAll('[data-action="delete-template"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteWorkoutTemplate(btn.dataset.id);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

// --- HISTORY VIEW ---
function renderHistoryView(searchQuery = "") {
  const container = document.getElementById("history-list");
  if (!container) return;

  const visibleHistory = state.history.filter(w => !w.deleted);
  if (visibleHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state-text">
        <i data-lucide="calendar" style="width: 32px; height: 32px; stroke-width: 1.5; color: var(--text-dark); margin-bottom: 10px;"></i>
        <p>Your workout logs will appear here.</p>
        <p style="font-size: 0.75rem; color: var(--text-dark); margin-top: 4px;">Go to the "Start" tab to log your first lift!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Search filter
  let list = [...visibleHistory].sort((a, b) => b.endTime - a.endTime); // reverse chrono
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(w => {
      const matchTitle = w.name.toLowerCase().includes(q);
      const matchEx = w.exercises.some(ex => {
        const details = state.exercises.find(e => e.id === ex.exerciseId);
        return details && details.name.toLowerCase().includes(q);
      });
      return matchTitle || matchEx;
    });
  }

  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state-text">No workouts match your search.</p>';
    return;
  }

  container.innerHTML = "";

  let currentGroupLabel = "";

  list.forEach(w => {
    const dateObj = new Date(w.endTime);
    const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const durationMin = Math.round((w.endTime - w.startTime) / 60000);
    
    // Determine month group label (e.g. "JUNE 2026")
    const monthLabel = dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase();
    
    if (monthLabel !== currentGroupLabel) {
      currentGroupLabel = monthLabel;
      const groupHeader = document.createElement("div");
      groupHeader.className = "history-month-header";
      groupHeader.textContent = monthLabel;
      container.appendChild(groupHeader);
    }

    // calculate total volume and count muscle groups trained
    let volume = 0;
    let setsCount = 0;
    const muscleCounts = {};
    
    w.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        volume += (s.weight || 0) * (s.reps || 0);
        setsCount++;
      });
      const details = state.exercises.find(e => e.id === ex.exerciseId);
      if (details && details.muscle) {
        muscleCounts[details.muscle] = (muscleCounts[details.muscle] || 0) + 1;
      }
    });

    // Find primary muscle trained
    let primaryMuscle = "";
    let maxCount = 0;
    Object.entries(muscleCounts).forEach(([muscle, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryMuscle = muscle;
      }
    });

    const muscleBadge = primaryMuscle 
      ? `<span class="badge primary-muscle-badge ${primaryMuscle.toLowerCase()}">${escapeHTML(primaryMuscle)}</span>` 
      : '';

    const card = document.createElement("div");
    card.className = "history-card";
    
    const exerciseNames = w.exercises.map(ex => {
      const det = state.exercises.find(e => e.id === ex.exerciseId);
      return det ? det.name : "Exercise";
    });
    const previewText = exerciseNames.join(", ");

    card.innerHTML = `
      <div class="history-card-header">
        <div class="history-card-title-box">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3>${escapeHTML(w.name)}</h3>
            ${muscleBadge}
          </div>
          <span class="history-card-date">${dateStr}</span>
        </div>
        <button class="btn-card-action" data-action="delete-history" data-id="${w.id}" title="Delete Log" style="position: absolute; right: 12px; top: 12px; z-index: 10;">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>

      <div class="history-card-stats" style="margin-bottom: 8px;">
        <div class="history-stat-item">
          <i data-lucide="clock"></i>
          <span>${durationMin} min</span>
        </div>
        <div class="history-stat-item">
          <i data-lucide="dumbbell"></i>
          <span>${volume.toLocaleString()} ${state.settings.unit}</span>
        </div>
        <div class="history-stat-item">
          <i data-lucide="layers"></i>
          <span>${setsCount} sets</span>
        </div>
      </div>

      <div class="history-card-exercises-preview" style="font-size: 0.76rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-body); font-weight: 500; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 8px; margin-top: 4px;">
        <strong style="color: var(--text-main); font-weight: 600;">Exercises: </strong>${escapeHTML(previewText)}
      </div>
    `;

    // Click handler to open popup (except when clicking delete)
    card.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="delete-history"]')) return;
      openHistoryDetailModal(w.id);
    });

    container.appendChild(card);
  });

  // Attach delete click handlers
  container.querySelectorAll('[data-action="delete-history"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent opening modal
      deleteHistoryItem(btn.dataset.id);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

// Global reference to open modal and save image handlers
function openHistoryDetailModal(workoutId) {
  const w = state.history.find(h => h.id === workoutId);
  if (!w) return;

  const modal = document.getElementById("modal-history-detail");
  if (!modal) return;

  // Set basic info
  document.getElementById("history-detail-card-name").textContent = w.name;
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = new Date(w.startTime).toLocaleDateString(undefined, options);
  document.getElementById("history-detail-card-date").textContent = dateStr;

  // Stats calculation
  let volume = 0;
  let setsCount = 0;
  w.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      volume += (s.weight || 0) * (s.reps || 0);
      setsCount++;
    });
  });
  const durationMin = Math.round((w.endTime - w.startTime) / 60000);

  document.getElementById("history-detail-stat-duration").textContent = `${durationMin}m`;
  document.getElementById("history-detail-stat-volume").textContent = `${volume.toLocaleString()} ${state.settings.unit}`;
  document.getElementById("history-detail-stat-sets").textContent = setsCount;

  // Render general workout notes
  const notesBox = document.getElementById("history-detail-card-notes-box");
  notesBox.innerHTML = w.notes
    ? `<div style="font-size:0.76rem; color:var(--text-muted); background:rgba(255,255,255,0.02); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); line-height:1.4;"><strong style="color:var(--text-main); font-weight:700; display:block; font-size:0.65rem; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">Workout Notes</strong>${escapeHTML(w.notes)}</div>`
    : "";

  // Render detailed list of exercises
  const exercisesContainer = document.getElementById("history-detail-card-exercises");
  exercisesContainer.innerHTML = "";

  w.exercises.forEach(ex => {
    const det = state.exercises.find(e => e.id === ex.exerciseId);
    const name = det ? det.name : "Exercise";
    
    const prBadge = ex.isPR ? `<span class="pr-trophy-badge" title="New Personal Record!"><i data-lucide="trophy" style="width:13px; height:13px; color:#ffd700; fill:#ffd700; display:inline-block; vertical-align:middle;"></i></span>` : '';

    const refText = ex.importedName 
      ? ` <span style="font-size:0.7rem; color:var(--text-muted); font-style:italic;">(Ref: ${escapeHTML(ex.importedName)})</span>` 
      : "";

    const noteHTML = ex.note
      ? `<div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.3; background: rgba(255,255,255,0.02); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);"><i data-lucide="file-text" style="width: 13px; height: 13px; margin-top: 2px; color: var(--color-primary); flex-shrink: 0;"></i> <span>Note: ${escapeHTML(ex.note)}</span></div>`
      : "";

    let setsGridHTML = "";
    ex.sets.forEach((s, sIdx) => {
      let setTypeLabel = "";
      let setTypeClass = "";
      if (s.type === "W") {
        setTypeLabel = "W";
        setTypeClass = "warmup";
      } else if (s.type === "D") {
        setTypeLabel = "D";
        setTypeClass = "drop";
      } else if (s.type === "F") {
        setTypeLabel = "F";
        setTypeClass = "failure";
      }

      const badgeHTML = setTypeLabel 
        ? `<span class="set-type-badge ${setTypeClass}" style="font-size: 0.58rem; font-weight: 800; background: rgba(212,252,52,0.15); color: #d4fc34; padding: 1px 3px; border-radius: 3px; margin-left: 2px;">${setTypeLabel}</span>` 
        : "";

      setsGridHTML += `
        <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.03); padding: 8px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; justify-content: center; min-width: 60px;">
          <div style="font-size: 0.62rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; display: flex; align-items: center; justify-content: center; gap: 2px;">
            <span>Set ${sIdx + 1}</span>${badgeHTML}
          </div>
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">${s.weight}<span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 400; margin-left: 1px;">${state.settings.unit || 'lbs'}</span></div>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 1px;">${s.reps} reps</div>
        </div>
      `;
    });

    const exBox = document.createElement("div");
    exBox.style.cssText = "background: rgba(255, 255, 255, 0.015); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); margin-bottom: 8px;";
    exBox.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          ${prBadge}
          <strong style="font-size: 0.88rem; color: var(--text-main); font-weight: 700;">${escapeHTML(name)}</strong>
          ${refText}
        </div>
        <span style="font-size: 0.68rem; color: var(--color-primary); font-weight: 700; background: rgba(212,252,52,0.06); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(212,252,52,0.12);">${ex.sets.length} sets</span>
      </div>
      ${noteHTML}
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${setsGridHTML}
      </div>
    `;
    exercisesContainer.appendChild(exBox);
  });

  modal.classList.remove("hidden");

  // Animate modal open
  if (window.gsap) {
    gsap.killTweensOf(modal);
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.out" });
    const content = modal.querySelector(".modal-content");
    if (content) {
      gsap.killTweensOf(content);
      gsap.fromTo(content, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out" });
    }
  }

  if (window.lucide) window.lucide.createIcons();

  // Setup Save Image Handler specifically for this workout
  const saveBtn = document.getElementById("btn-history-save-image");
  if (saveBtn) {
    // Remove old listeners to avoid multiple downloads
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener("click", async () => {
      newSaveBtn.disabled = true;
      const originalText = newSaveBtn.innerHTML;
      newSaveBtn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 16px; height: 16px;"></i> Rendering...`;
      if (window.lucide) window.lucide.createIcons();

      try {
        const shareContainer = document.getElementById("history-share-card-container");
        
        // Wait a small moment for Lucide icons to fully render in DOM
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(shareContainer, {
          backgroundColor: "#0a0f0b",
          scale: 2, // Double scale for premium resolution
          logging: false,
          useCORS: true
        });

        const link = document.createElement("a");
        link.download = `${w.name.replace(/\s+/g, "_")}_LogCard.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        alert("Failed to render share image: " + err.message);
      } finally {
        newSaveBtn.disabled = false;
        newSaveBtn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}

function deleteHistoryItem(id) {
  showCustomConfirm({
    title: "Delete Workout Log?",
    message: "Are you sure you want to delete this workout log from your history? This cannot be undone.",
    confirmText: "Delete",
    cancelText: "Keep Log",
    isDanger: true,
    onConfirm: () => {
      const item = state.history.find(w => w.id === id);
      if (item) {
        item.deleted = 1;
        item.updated_at = Date.now();
        item.dirty = 1;
        saveAllState();
        renderHistoryView(document.getElementById("input-history-search").value);
        Analytics.calculateAllStats();

        // Instant cloud sync
        if (state.auth && state.auth.token) {
          syncData(true);
        }
      }
    }
  });
}


// --- EXERCISES VIEW ---
let exercisesSelectedMuscleFilter = "all";

function renderExercisesView(searchQuery = "") {
  const container = document.getElementById("exercises-list");
  if (!container) return;

  let list = state.exercises.filter(ex => !ex.deleted).sort((a, b) => a.name.localeCompare(b.name));

  // Muscle filter
  if (exercisesSelectedMuscleFilter !== "all") {
    list = list.filter(ex => ex.muscle.toLowerCase() === exercisesSelectedMuscleFilter.toLowerCase());
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(ex => ex.name.toLowerCase().includes(q) || ex.muscle.toLowerCase().includes(q));
  }

  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state-text">No exercises found.</p>';
    return;
  }

  container.innerHTML = "";

  const maxDisplay = 60;
  const itemsToRender = list.slice(0, maxDisplay);

  itemsToRender.forEach(ex => {
    const item = document.createElement("div");
    item.className = "exercise-item";
    
    const categoryBadge = `<span class="exercise-cat-tag ${ex.category.toLowerCase()}">${escapeHTML(ex.category)}</span>`;
    
    item.innerHTML = `
      <div class="exercise-item-content">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="exercise-item-name">${escapeHTML(ex.name)}</span>
          ${categoryBadge}
        </div>
        <span class="exercise-item-muscle">${escapeHTML(ex.muscle)}</span>
      </div>
      <i data-lucide="chevron-right" style="color: var(--text-dark); width: 18px; height: 18px;"></i>
    `;


    item.addEventListener("click", () => {
      openExerciseDetails(ex.id);
    });

    container.appendChild(item);
  });

  if (list.length > maxDisplay) {
    const loader = document.createElement("div");
    loader.className = "empty-state-text";
    loader.style.padding = "20px 10px";
    loader.style.borderTop = "1px solid var(--border-light)";
    loader.style.marginTop = "10px";
    loader.style.fontSize = "0.78rem";
    loader.textContent = `Showing 60 of ${list.length} exercises. Use search above to find more.`;
    container.appendChild(loader);
  }

  if (window.lucide) window.lucide.createIcons();
}

function setupMuscleFilters() {
  const container = document.getElementById("muscle-filters-container");
  if (!container) return;

  container.innerHTML = '<button class="filter-chip active" data-muscle="all">All</button>';

  MUSCLE_GROUPS.forEach(muscle => {
    const chip = document.createElement("button");
    chip.className = "filter-chip";
    chip.dataset.muscle = muscle.toLowerCase();
    chip.textContent = muscle;
    container.appendChild(chip);
  });

  // Click handlers
  container.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      container.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      
      exercisesSelectedMuscleFilter = chip.dataset.muscle;
      renderExercisesView(document.getElementById("input-exercise-search").value);
    });
  });
}

// ==========================================================================
// 10. MODALS & DIALOG POPUPS IMPLEMENTATION
// ==========================================================================

// --- EXERCISE SELECTOR MODAL (Add exercises to workout/template) ---
let selectorCurrentSelection = [];
let selectorMuscleFilter = "all";
let selectorTargetCallback = null; // callback when confirm clicked

function openExerciseSelector(callback) {
  selectorTargetCallback = callback;
  selectorCurrentSelection = [];
  selectorMuscleFilter = "all";
  
  const modal = document.getElementById("modal-exercise-selector");
  if (!modal) return;

  modal.classList.remove("hidden");
  document.getElementById("input-modal-search").value = "";
  
  // Render muscle chips in selector
  const filterContainer = document.getElementById("modal-muscle-filters");
  if (filterContainer) {
    filterContainer.innerHTML = '<button class="filter-chip active" data-muscle="all">All</button>';
    MUSCLE_GROUPS.forEach(muscle => {
      const chip = document.createElement("button");
      chip.className = "filter-chip";
      chip.dataset.muscle = muscle.toLowerCase();
      chip.textContent = muscle;
      filterContainer.appendChild(chip);
    });

    filterContainer.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        filterContainer.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectorMuscleFilter = chip.dataset.muscle;
        renderSelectorList(document.getElementById("input-modal-search").value);
      });
    });
  }

  renderSelectorList();
  updateSelectorConfirmButton();
}

function renderSelectorList(searchQuery = "") {
  const container = document.getElementById("modal-exercises-list");
  if (!container) return;

  let list = [...state.exercises].sort((a, b) => a.name.localeCompare(b.name));

  if (selectorMuscleFilter !== "all") {
    list = list.filter(ex => ex.muscle.toLowerCase() === selectorMuscleFilter.toLowerCase());
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(ex => ex.name.toLowerCase().includes(q));
  }

  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state-text">No exercises match search</p>';
    return;
  }

  container.innerHTML = "";

  const maxDisplay = 60;
  const itemsToRender = list.slice(0, maxDisplay);

  itemsToRender.forEach(ex => {
    const isSelected = selectorCurrentSelection.includes(ex.id);
    const item = document.createElement("div");
    item.className = `exercise-item ${isSelected ? 'selected' : ''}`;
    
    item.innerHTML = `
      <div class="exercise-item-content">
        <span class="exercise-item-name">${escapeHTML(ex.name)}</span>
        <span class="exercise-item-muscle">${escapeHTML(ex.muscle)} • ${escapeHTML(ex.category)}</span>
      </div>
      <div class="exercise-item-checkbox">
        <i data-lucide="check"></i>
      </div>
    `;


    item.addEventListener("click", () => {
      if (selectorCurrentSelection.includes(ex.id)) {
        selectorCurrentSelection = selectorCurrentSelection.filter(id => id !== ex.id);
      } else {
        selectorCurrentSelection.push(ex.id);
      }
      item.classList.toggle("selected");
      updateSelectorConfirmButton();
    });

    container.appendChild(item);
  });

  if (list.length > maxDisplay) {
    const loader = document.createElement("div");
    loader.className = "empty-state-text";
    loader.style.padding = "15px 10px";
    loader.style.borderTop = "1px solid var(--border-light)";
    loader.style.marginTop = "10px";
    loader.style.fontSize = "0.78rem";
    loader.textContent = `Showing 60 of ${list.length} exercises. Use search above to find more.`;
    container.appendChild(loader);
  }

  if (window.lucide) window.lucide.createIcons();
}

function updateSelectorConfirmButton() {
  const btn = document.getElementById("btn-confirm-exercises");
  if (btn) {
    btn.textContent = `Add Selected (${selectorCurrentSelection.length})`;
  }
}

// --- EXERCISE DETAILS MODAL ---
function openExerciseDetails(exerciseId) {
  const ex = state.exercises.find(e => e.id === exerciseId);
  if (!ex) return;

  const modal = document.getElementById("modal-exercise-details");
  if (!modal) return;

  modal.classList.remove("hidden");

  // Populate basic info
  document.getElementById("detail-exercise-name").textContent = ex.name;
  document.getElementById("detail-exercise-muscle").textContent = ex.muscle;
  document.getElementById("detail-exercise-category").textContent = ex.category;
  document.getElementById("detail-exercise-instructions").textContent = ex.instructions || "No instructions loaded.";

  // Calculate PR values
  let maxWeight = 0;
  let maxVolume = 0;
  let max1RM = 0;
  const historyList = [];

  state.history.forEach(w => {
    const histEx = w.exercises.find(e => e.exerciseId === exerciseId);
    if (histEx) {
      let workoutMaxW = 0;
      let workoutVol = 0;
      let hasCompleted = false;

      histEx.sets.forEach(s => {
        if (s.completed) {
          hasCompleted = true;
          const wt = parseFloat(s.weight) || 0;
          const rp = parseInt(s.reps) || 0;
          workoutVol += wt * rp;
          if (wt > workoutMaxW) workoutMaxW = wt;
          
          const est1 = Analytics.calculate1RM(wt, rp);
          if (est1 > max1RM) max1RM = est1;
        }
      });

      if (hasCompleted) {
        if (workoutMaxW > maxWeight) maxWeight = workoutMaxW;
        if (workoutVol > maxVolume) maxVolume = workoutVol;
        
        historyList.push({
          date: new Date(w.endTime).toLocaleDateString(),
          timestamp: w.endTime,
          sets: histEx.sets
        });
      }
    }
  });

  // Display PRs
  document.getElementById("detail-pr-1rm").textContent = max1RM > 0 ? `${Math.round(max1RM)} ${state.settings.unit}` : "—";
  document.getElementById("detail-pr-weight").textContent = maxWeight > 0 ? `${maxWeight} ${state.settings.unit}` : "—";
  document.getElementById("detail-pr-volume").textContent = maxVolume > 0 ? `${maxVolume.toLocaleString()} ${state.settings.unit}` : "—";

  // Display History List
  const histContainer = document.getElementById("detail-exercise-history-list");
  if (histContainer) {
    if (historyList.length === 0) {
      histContainer.innerHTML = '<p class="empty-state-text" style="padding:15px 0;">No logs recorded yet.</p>';
      return;
    }

    historyList.sort((a, b) => b.timestamp - a.timestamp); // reverse chrono
    
    histContainer.innerHTML = historyList.map(item => {
      const setsStr = item.sets.map(s => `${s.weight}×${s.reps}`).join(", ");
      return `
        <div class="detail-history-row">
          <span class="detail-history-date">${item.date}</span>
          <span class="detail-history-performance">${item.sets.length} sets: ${setsStr}</span>
        </div>
      `;
    }).join("");
  }
}

// --- CUSTOM EXERCISE CREATOR MODAL ---
function initCustomExerciseModal() {
  const select = document.getElementById("select-custom-exercise-muscle");
  if (!select) return;

  select.innerHTML = "";
  MUSCLE_GROUPS.forEach(muscle => {
    const opt = document.createElement("option");
    opt.value = muscle;
    opt.textContent = muscle;
    select.appendChild(opt);
  });
}

function saveCustomExercise() {
  const nameEl = document.getElementById("input-custom-exercise-name");
  const muscleEl = document.getElementById("select-custom-exercise-muscle");
  const catEl = document.getElementById("select-custom-exercise-category");
  const instEl = document.getElementById("input-custom-exercise-instructions");

  const name = nameEl.value.trim();
  if (!name) {
    alert("Please enter an exercise name.");
    return;
  }

  // Check if exists
  if (state.exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase())) {
    alert("An exercise with this name already exists!");
    return;
  }

  // Create globally unique ID
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const id = `custom-${slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newEx = {
    id: id,
    name: name,
    muscle: muscleEl.value,
    category: catEl.value,
    instructions: instEl.value.trim(),
    updated_at: Date.now(),
    deleted: 0,
    dirty: 1
  };

  state.exercises.push(newEx);
  saveAllState();

  // Reset inputs
  nameEl.value = "";
  instEl.value = "";

  // Hide modal
  document.getElementById("modal-create-exercise").classList.add("hidden");

  // Refresh current view
  renderExercisesView(document.getElementById("input-exercise-search").value);

  // Auto-select and refresh selector list if the selector is active
  const isSelectorOpen = !document.getElementById("modal-exercise-selector").classList.contains("hidden");
  if (isSelectorOpen) {
    selectorCurrentSelection.push(newEx.id);
    updateSelectorConfirmButton();
    renderSelectorList(document.getElementById("input-modal-search").value);
  }

  // Instant cloud sync
  if (state.auth && state.auth.token) {
    syncData(true);
  }
}

// --- TEMPLATE EDITOR MODAL (Create/Edit workout template) ---
let templateEditorId = null; // if null, creating. if string, editing templateId
let templateEditorExercises = []; // exercises loaded in editor

function openTemplateEditor(templateId = null) {
  templateEditorId = templateId;
  templateEditorExercises = [];
  isTemplateEditorOpening = true;

  const modal = document.getElementById("modal-template-editor");
  const title = document.getElementById("template-editor-title");
  const nameInput = document.getElementById("input-template-name");
  const notesInput = document.getElementById("input-template-notes");
  const deleteBtn = document.getElementById("btn-delete-template-editor");
  const saveBtn = document.getElementById("btn-save-template");
  
  if (!modal) return;

  modal.classList.remove("hidden");
  
  if (window.gsap) {
    gsap.killTweensOf(modal);
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" });
    const content = modal.querySelector(".modal-content");
    if (content) {
      gsap.killTweensOf(content);
      gsap.fromTo(content, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, ease: "power3.out" });
    }
  }


  if (templateId) {
    title.textContent = "Edit Template";
    const tmpl = state.templates.find(t => t.id === templateId);
    if (tmpl) {
      nameInput.value = tmpl.name;
      notesInput.value = tmpl.notes || "";
      // Deep copy template exercises
      templateEditorExercises = JSON.parse(JSON.stringify(tmpl.exercises));
    }
    if (deleteBtn) deleteBtn.classList.remove("hidden");
    if (saveBtn) {
      saveBtn.classList.remove("btn-full-width");
      saveBtn.textContent = "Save Changes";
    }
  } else {
    title.textContent = "Create Template";
    nameInput.value = "";
    notesInput.value = "";
    if (deleteBtn) deleteBtn.classList.add("hidden");
    if (saveBtn) {
      saveBtn.classList.add("btn-full-width");
      saveBtn.textContent = "Save Template";
    }
  }

  renderTemplateEditorExercises();
}

function closeTemplateEditorModal() {
  const modal = document.getElementById("modal-template-editor");
  if (!modal) return;

  if (window.gsap) {
    const content = modal.querySelector(".modal-content");
    if (content) {
      gsap.killTweensOf(content);
      gsap.to(content, { 
        y: 45, 
        opacity: 0, 
        duration: 0.25, 
        ease: "power2.in", 
        onComplete: () => {
          gsap.killTweensOf(modal);
          gsap.to(modal, { 
            opacity: 0, 
            duration: 0.15, 
            onComplete: () => {
              modal.classList.add("hidden");
            } 
          });
        } 
      });
    } else {
      modal.classList.add("hidden");
    }
  } else {
    modal.classList.add("hidden");
  }
}


function updateTemplateEditorSummary() {
  const summaryContainer = document.getElementById("template-target-muscles-summary");
  if (!summaryContainer) return;

  if (templateEditorExercises.length === 0) {
    summaryContainer.innerHTML = '<span class="text-muted" style="font-size: 0.75rem; display: inline-flex; align-items: center; gap: 6px;"><i data-lucide="info" style="width: 14px; height: 14px; opacity: 0.6;"></i> No exercises added yet. Targeted muscles will appear here.</span>';
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const musclesMap = {};
  templateEditorExercises.forEach(ex => {
    const exDetails = state.exercises.find(e => e.id === ex.exerciseId);
    if (exDetails && exDetails.muscle) {
      musclesMap[exDetails.muscle] = (musclesMap[exDetails.muscle] || 0) + 1;
    }
  });

  const uniqueMuscles = Object.keys(musclesMap);
  if (uniqueMuscles.length === 0) {
    summaryContainer.innerHTML = '<span class="text-muted" style="font-size: 0.75rem; font-style: italic;">No muscles targeted.</span>';
    return;
  }

  let html = `<span style="font-size:0.72rem; color:var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 6px;">Targeted:</span>`;
  uniqueMuscles.forEach(muscle => {
    const count = musclesMap[muscle];
    const muscleClean = muscle.toLowerCase().replace(/\s+/g, '-');
    const badgeClass = `primary-muscle-badge ${muscleClean}`;
    html += `<span class="${badgeClass}" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.65rem; border-radius: 6px; padding: 2px 8px; margin-right: 4px; margin-bottom: 2px;">${muscle} <span style="opacity: 0.7; font-size: 0.58rem; font-weight: 800;">x${count}</span></span>`;
  });

  summaryContainer.innerHTML = html;
}

function renderTemplateEditorExercises() {
  const container = document.getElementById("template-exercises-list");
  if (!container) return;

  // Render muscle groups summary at the top
  updateTemplateEditorSummary();

  if (templateEditorExercises.length === 0) {
    container.innerHTML = '<p class="empty-state-text padding-2">Add exercises to this template to get started.</p>';
    return;
  }

  container.innerHTML = "";

  templateEditorExercises.forEach((activeEx, exIdx) => {
    const exDetails = state.exercises.find(e => e.id === activeEx.exerciseId);
    const exName = exDetails ? exDetails.name : "Unknown Exercise";

    const card = document.createElement("div");
    card.className = "active-exercise-card";
    card.dataset.index = exIdx;

    let rowsHTML = "";
    activeEx.sets.forEach((set, setIdx) => {
      const typeDisplay = set.type === "N" ? (setIdx + 1) : set.type;
      rowsHTML += `
        <div class="set-table-row template-editor-row" data-set-index="${setIdx}">
          <div>
            <button class="set-type-tag ${set.type}" data-action="toggle-editor-set-type">
              ${typeDisplay}
            </button>
          </div>
          <div class="set-input-cell">
            <input type="number" class="input-set-weight" placeholder="0" min="0" value="${set.weight !== undefined && set.weight !== null && set.weight !== '' ? set.weight : ''}" data-field="weight">
          </div>
          <div class="set-input-cell">
            <input type="number" class="input-set-reps" placeholder="0" min="0" value="${set.reps !== undefined && set.reps !== null && set.reps !== '' ? set.reps : ''}" data-field="reps">
          </div>
          <div>
            <button class="btn-delete-set" data-action="delete-editor-set" title="Delete set">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    });

    const currentUnit = state.settings.unit || "lbs";

    const importedNameHTML = activeEx.importedName 
      ? `<span style="font-size: 0.72rem; color: var(--text-muted); display: block; font-style: italic; margin-top: 2px;">Imported as: ${escapeHTML(activeEx.importedName)}</span>` 
      : "";

    card.innerHTML = `
      <div class="active-exercise-header">
        <div>
          <h4 class="active-exercise-title">${exName}</h4>
          ${importedNameHTML}
          <span class="badge" style="font-size:0.65rem; margin-top: 4px;">${exDetails ? exDetails.muscle : 'Muscle'}</span>
        </div>
        <div class="active-exercise-actions">
          <button class="btn-icon-only-flat" data-action="move-editor-exercise-up" title="Move Up" ${exIdx === 0 ? 'disabled' : ''}>
            <i data-lucide="chevron-up" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="btn-icon-only-flat" data-action="move-editor-exercise-down" title="Move Down" ${exIdx === templateEditorExercises.length - 1 ? 'disabled' : ''}>
            <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="btn-icon-only-flat" data-action="remove-editor-exercise" title="Remove exercise">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
      
      <div class="set-table">
        <div class="set-table-header template-editor-row">
          <div>Set</div>
          <div>Weight (${currentUnit})</div>
          <div>Reps</div>
          <div></div>
        </div>
        <div class="sets-tbody-editor">
          <!-- Dynamically loaded -->
        </div>
      </div>

      <button class="btn-add-set" data-action="add-editor-set">
        <i data-lucide="plus"></i> Add Set
      </button>
    `;

    // Re-adjust layouts since editor has fewer columns (no complete box, no previous box)
    const tbody = card.querySelector(".sets-tbody-editor");
    tbody.innerHTML = rowsHTML;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();

  // Run entrance animation for cards if editor is opening
  if (isTemplateEditorOpening) {
    isTemplateEditorOpening = false;
    if (window.gsap) {
      const cards = container.querySelectorAll(".active-exercise-card");
      if (cards.length > 0) {
        gsap.killTweensOf(cards);
        gsap.fromTo(cards, 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power3.out", clearProps: "transform" }
        );
      }
    }
  }
}


function handleTemplateEditorClicks(e) {
  const target = e.target;
  const actionButton = target.closest("[data-action]");
  const card = target.closest(".active-exercise-card");

  if (!card) return;
  const exIdx = parseInt(card.dataset.index);
  const activeEx = templateEditorExercises[exIdx];

  if (actionButton) {
    const action = actionButton.dataset.action;
    const row = target.closest(".set-table-row");
    const setIdx = row ? parseInt(row.dataset.setIndex) : null;

    if (action === "toggle-editor-set-type") {
      const set = activeEx.sets[setIdx];
      const types = ["N", "W", "D", "F"];
      const curr = types.indexOf(set.type);
      set.type = types[(curr + 1) % types.length];
      renderTemplateEditorExercises();
    } 
    else if (action === "delete-editor-set") {
      activeEx.sets.splice(setIdx, 1);
      renderTemplateEditorExercises();
    } 
    else if (action === "add-editor-set") {
      const setLength = activeEx.sets.length;
      let newWeight = "";
      let newReps = "";
      let newType = "N";

      if (setLength > 0) {
        const lastSet = activeEx.sets[setLength - 1];
        newWeight = (lastSet.weight !== undefined && lastSet.weight !== null && lastSet.weight !== "") ? lastSet.weight : "";
        newReps = (lastSet.reps !== undefined && lastSet.reps !== null && lastSet.reps !== "") ? lastSet.reps : "";
        newType = lastSet.type || "N";
      }

      activeEx.sets.push({ type: newType, weight: newWeight, reps: newReps });
      renderTemplateEditorExercises();
    } 
    else if (action === "remove-editor-exercise") {
      templateEditorExercises.splice(exIdx, 1);
      renderTemplateEditorExercises();
    }
    else if (action === "move-editor-exercise-up") {
      if (exIdx > 0) {
        const temp = templateEditorExercises[exIdx];
        templateEditorExercises[exIdx] = templateEditorExercises[exIdx - 1];
        templateEditorExercises[exIdx - 1] = temp;
        renderTemplateEditorExercises();
      }
    }
    else if (action === "move-editor-exercise-down") {
      if (exIdx < templateEditorExercises.length - 1) {
        const temp = templateEditorExercises[exIdx];
        templateEditorExercises[exIdx] = templateEditorExercises[exIdx + 1];
        templateEditorExercises[exIdx + 1] = temp;
        renderTemplateEditorExercises();
      }
    }
  }
}

function handleTemplateEditorInputChanges(e) {
  const input = e.target;
  if (!input.classList.contains("input-set-weight") && !input.classList.contains("input-set-reps")) return;

  const card = input.closest(".active-exercise-card");
  const row = input.closest(".set-table-row");
  if (!card || !row) return;

  const exIdx = parseInt(card.dataset.index);
  const setIdx = parseInt(row.dataset.setIndex);
  const field = input.dataset.field;

  const activeEx = templateEditorExercises[exIdx];
  if (activeEx && activeEx.sets[setIdx]) {
    if (field === "weight") {
      activeEx.sets[setIdx].weight = input.value === "" ? "" : parseFloat(input.value);
    } else if (field === "reps") {
      activeEx.sets[setIdx].reps = input.value === "" ? "" : parseInt(input.value);
    }
  }
}

function saveWorkoutTemplate() {
  const nameInput = document.getElementById("input-template-name");
  const notesInput = document.getElementById("input-template-notes");
  const name = nameInput.value.trim();

  if (!name) {
    alert("Please enter a template name!");
    return;
  }

  if (templateEditorExercises.length === 0) {
    alert("Please add at least one exercise to the template!");
    return;
  }

  // Sanitize weight/reps values
  const sanitizedExercises = templateEditorExercises.map(ex => ({
    exerciseId: ex.exerciseId,
    importedName: ex.importedName || "",
    sets: ex.sets.map(s => ({
      type: s.type || "N",
      weight: (s.weight !== undefined && s.weight !== null && s.weight !== "") ? parseFloat(s.weight) : "",
      reps: (s.reps !== undefined && s.reps !== null && s.reps !== "") ? parseInt(s.reps) : ""
    }))
  }));

  if (templateEditorId) {
    // Edit existing template
    const tmplIdx = state.templates.findIndex(t => t.id === templateEditorId);
    if (tmplIdx !== -1) {
      state.templates[tmplIdx].name = name;
      state.templates[tmplIdx].notes = notesInput.value.trim();
      state.templates[tmplIdx].exercises = sanitizedExercises;
      state.templates[tmplIdx].updated_at = Date.now();
      state.templates[tmplIdx].deleted = 0;
      state.templates[tmplIdx].dirty = 1;
    }
  } else {
    // Create new template
    const newTmpl = {
      id: `template-${Date.now()}`,
      name: name,
      notes: notesInput.value.trim(),
      exercises: sanitizedExercises,
      updated_at: Date.now(),
      deleted: 0,
      dirty: 1
    };
    state.templates.push(newTmpl);
  }

  saveAllState();
  renderStartView();

  // Close modal
  closeTemplateEditorModal();


  // Instant cloud sync
  if (state.auth && state.auth.token) {
    syncData(true);
  }
}

function deleteWorkoutTemplate(templateId) {
  showCustomConfirm({
    title: "Delete Template?",
    message: "Are you sure you want to delete this workout template? This cannot be undone.",
    confirmText: "Delete",
    cancelText: "Keep Template",
    isDanger: true,
    onConfirm: () => {
      const tmpl = state.templates.find(t => t.id === templateId);
      if (tmpl) {
        tmpl.deleted = 1;
        tmpl.updated_at = Date.now();
        tmpl.dirty = 1;
        saveAllState();
        renderStartView();
        
        // Instant cloud sync
        if (state.auth && state.auth.token) {
          syncData(true);
        }
      }
    }
  });
}


// ==========================================================================
// 11. VIEW CONTROLLER (SPA TAB VIEW ROUTER)
// ==========================================================================

function switchView(viewName) {
  if (viewName !== "admin") {
    stopLiveMonitorPolling();
  }
  // Toggle Nav buttons
  document.querySelectorAll(".app-nav .nav-item").forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Toggle View Panels
  document.querySelectorAll(".views-wrapper .app-view").forEach(panel => {
    if (panel.id === `view-${viewName}`) {
      panel.classList.add("active");
      // GSAP stagger entrance on the view's direct content children
      if (window.gsap) {
        const targets = panel.querySelectorAll(
          '.action-card, .metric-card, .template-card, .history-item-card, .admin-client-card, .analytics-card, .exercise-detail-section'
        );
        if (targets.length > 0) {
          gsap.fromTo(targets,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.32, stagger: 0.04, ease: 'power3.out', clearProps: 'transform' }
          );
        }
      }
    } else {
      panel.classList.remove("active");
    }
  });

  // Trigger view renderers + silent sync on switch
  if (viewName === "home") {
    renderHomeView();
    if (state.auth && state.auth.token) syncData(true);
  }
  else if (viewName === "workouts") {
    renderStartView();
    if (state.auth && state.auth.token) syncData(true);
  }
  else if (viewName === "schedule") renderScheduleView();
  else if (viewName === "history") renderHistoryView();
  else if (viewName === "exercises") renderExercisesView();
  else if (viewName === "analytics") Analytics.calculateAllStats();
  else if (viewName === "settings") loadSettingsView();
  else if (viewName === "admin") renderAdminView();
}

function loadSettingsView() {
  applyTheme();
  // Update unit selectors
  const isLbs = state.settings.unit === "lbs";
  document.getElementById("btn-unit-lbs").classList.toggle("active", isLbs);
  document.getElementById("btn-unit-kg").classList.toggle("active", !isLbs);
  
  // Update default rest timer duration dropdown
  document.getElementById("select-default-rest").value = state.settings.defaultRest;

  // Update broadcast filter duration dropdown
  const selectBroadcast = document.getElementById("select-broadcast-duration");
  if (selectBroadcast) {
    selectBroadcast.value = state.settings.broadcastFilterDuration || "12";
  }


  // Update notifications toggle state
  const notifEnabled = state.settings.notificationsEnabled === true;
  document.getElementById("btn-notif-on").classList.toggle("active", notifEnabled);
  document.getElementById("btn-notif-off").classList.toggle("active", !notifEnabled);

  // Update Profile details dynamically if logged in
  const profileCardName = document.querySelector(".profile-card-name");
  const profileCardTier = document.querySelector(".profile-card-tier");
  const profileCardAvatar = document.querySelector(".profile-card-avatar");

  if (state.auth && state.auth.email) {
    profileCardName.textContent = (state.auth.name || state.auth.email.split("@")[0]).toUpperCase();
    if (state.auth.isAdmin) {
      profileCardTier.textContent = "🛡️ System Administrator";
      profileCardAvatar.textContent = "AD";
      profileCardAvatar.style.background = "linear-gradient(135deg, #d4fc34 0%, #10b981 100%)";
    } else {
      profileCardTier.textContent = "Premium Active Member";
      profileCardAvatar.textContent = state.auth.email.substring(0, 2).toUpperCase();
      profileCardAvatar.style.background = "";
    }
  } else {
    profileCardName.textContent = "Offline Athlete";
    profileCardTier.textContent = "Guest Mode / Local Sync Only";
    profileCardAvatar.textContent = "G";
    profileCardAvatar.style.background = "";
  }

  // Render Admin Portal card if admin
  const adminContainer = document.getElementById("admin-portal-link-container");
  if (adminContainer) {
    if (state.auth && state.auth.isAdmin) {
      adminContainer.innerHTML = `
        <div class="admin-portal-link-card" id="btn-goto-admin">
          <div class="admin-portal-link-info">
            <div class="admin-portal-link-icon">
              <i data-lucide="shield-alert" style="width:20px; height:20px;"></i>
            </div>
            <div class="admin-portal-link-text">
              <h4>Admin Dashboard</h4>
              <p>Manage clients and routines</p>
            </div>
          </div>
          <i data-lucide="chevron-right" style="color:var(--text-dark); width:18px; height:18px;"></i>
        </div>
      `;
      // Re-run lucide icons rendering
      if (window.lucide) window.lucide.createIcons();
      
      // Bind click
      document.getElementById("btn-goto-admin").addEventListener("click", () => {
        switchView("admin");
      });
    } else {
      adminContainer.innerHTML = "";
    }
  }

  // Render Personal Records in Profile
  renderSettingsPersonalRecords();
}

function renderSettingsPersonalRecords() {
  const container = document.getElementById("settings-personal-records-list");
  if (!container) return;

  const prs = [];
  
  state.exercises.forEach(ex => {
    let maxWeight = 0;
    let max1RM = 0;
    let prDate = null;

    state.history.forEach(w => {
      if (!w.deleted) {
        const histEx = w.exercises.find(e => e.exerciseId === ex.id);
        if (histEx) {
          histEx.sets.forEach(s => {
            const wt = parseFloat(s.weight) || 0;
            const rp = parseInt(s.reps) || 0;
            if (wt > maxWeight) {
              maxWeight = wt;
              prDate = new Date(w.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            }
            const est1 = Analytics.calculate1RM(wt, rp);
            if (est1 > max1RM) max1RM = est1;
          });
        }
      }
    });

    if (maxWeight > 0) {
      prs.push({
        name: ex.name,
        maxWeight,
        max1RM: Math.round(max1RM),
        date: prDate
      });
    }
  });

  if (prs.length === 0) {
    container.innerHTML = `<div class="empty-state-text" style="font-size: 0.78rem; text-align: left; padding: 0;">No personal records logged yet. Complete workouts to track PRs!</div>`;
    return;
  }

  prs.sort((a, b) => b.maxWeight - a.maxWeight);

  container.innerHTML = prs.map(pr => `
    <div class="settings-pr-card">
      <div class="settings-pr-card-info">
        <span class="settings-pr-name">${pr.name}</span>
        <span class="settings-pr-date">Achieved on ${pr.date}</span>
      </div>
      <div class="settings-pr-val-box">
        <span class="settings-pr-weight">${pr.maxWeight} ${state.settings.unit}</span>
        <span class="settings-pr-1rm">Est. 1RM: ${pr.max1RM} ${state.settings.unit}</span>
      </div>
    </div>
  `).join("");
}


// ==========================================================================
// 12. BACKUP & RESTORE DATA (JSON)
// ==========================================================================

function exportStateToJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `be_big_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function handleJSONImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsedData = JSON.parse(evt.target.result);
      
      // Simple structures verification
      if (parsedData.exercises && parsedData.templates && parsedData.history) {
        state.exercises = parsedData.exercises;
        state.templates = parsedData.templates;
        state.history = parsedData.history;
        state.settings = parsedData.settings || { unit: "lbs", defaultRest: 90 };
        
        saveAllState();
        alert("Data restored successfully! The page will now reload to apply all changes.");
        window.location.reload();
      } else {
        alert("Invalid backup file structure. Please ensure it is a valid backup JSON.");
      }
    } catch(err) {
      alert("Error parsing backup JSON file. Make sure it is a valid format.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

function resetAllAppData() {
  if (confirm("CRITICAL WARNING: This will delete ALL your workout templates, custom exercises, settings, and completed history. This cannot be undone! Are you absolutely sure?")) {
    localStorage.clear();
    alert("Application data wiped. The page will reload.");
    window.location.reload();
  }
}

// ==========================================================================
// 13. BOOTSTRAPPING & DOM BINDINGS
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Start splash screen first so the loader is visible immediately
  try {
    runSplashLoadingSequence();
  } catch (splashErr) {
    console.error("Error starting splash screen:", splashErr);
    // Dismiss splash overlay immediately as a fallback if it failed to run
    const splash = document.getElementById("app-splash-screen");
    if (splash) {
      splash.classList.add("fade-out");
      splash.classList.add("hidden");
    }
  }

  // Disable pinch-to-zoom gesture scaling on iOS Safari
  document.addEventListener("gesturestart", (e) => {
    e.preventDefault();
  });

  // Run all initialization blocks inside a safe try-catch
  try {
    initStore();
    applyTheme();
  } catch (storeErr) {
    console.error("Error in initStore:", storeErr);
  }

  try {
    setupMuscleFilters();
    initCustomExerciseModal();
  } catch (initErr) {
    console.error("Error in view filters initialization:", initErr);
  }
  
  // Asynchronously load the 1300+ ExerciseDB database
  try {
    loadExercisesDatabase();
  } catch (dbErr) {
    console.error("Error initiating exercise database load:", dbErr);
  }
  
  // Render current view
  try {
    renderHomeView();
  } catch (renderErr) {
    console.error("Error rendering home view on startup:", renderErr);
  }

  // Auto-sync remote updates on startup asynchronously to prevent blocking the main load thread
  if (state.auth && state.auth.token) {
    setTimeout(() => {
      try {
        syncData(true);
      } catch (syncErr) {
        console.error("Startup auto-sync failed:", syncErr);
      }
    }, 100);
  }

  // Check for any scheduled workout reminders on startup
  setTimeout(() => {
    try {
      checkScheduledWorkoutReminders();
    } catch (reminderErr) {
      console.error("Error checking scheduled workout reminders:", reminderErr);
    }
  }, 1000);
  // --- HOME VIEW BINDINGS ---
  const homeBtnStart = document.getElementById("home-btn-start-workout");
  if (homeBtnStart) {
    homeBtnStart.addEventListener("click", () => {
      switchView("workouts");
    });
  }

  const homeBtnWeight = document.getElementById("home-btn-log-weight");
  if (homeBtnWeight) {
    homeBtnWeight.addEventListener("click", () => {
      const modal = document.getElementById("modal-log-weight");
      if (modal) {
        modal.classList.remove("hidden");
        document.getElementById("input-log-weight-value").value = state.settings.currentWeight || "";
      }
    });
  }

  const homeBtnExercises = document.getElementById("home-btn-exercises");
  if (homeBtnExercises) {
    homeBtnExercises.addEventListener("click", () => {
      switchView("exercises");
    });
  }

  const homeBtnHistory = document.getElementById("home-btn-history");
  if (homeBtnHistory) {
    homeBtnHistory.addEventListener("click", () => {
      switchView("history");
    });
  }

  const homeBtnAnalytics = document.getElementById("home-btn-analytics");
  if (homeBtnAnalytics) {
    homeBtnAnalytics.addEventListener("click", () => {
      switchView("analytics");
    });
  }

  // Skip and Add photo banner clicks
  const bannerSkip = document.getElementById("btn-banner-skip");
  if (bannerSkip) {
    bannerSkip.addEventListener("click", () => {
      localStorage.setItem("bebig_profile_photo_banner_dismissed", "true");
      document.getElementById("home-photo-banner").classList.add("hidden");
    });
  }

  // Choose profile photo from gallery via file input
  const fileInputPhoto = document.getElementById("input-profile-photo");
  const handlePhotoChoose = () => {
    if (fileInputPhoto) fileInputPhoto.click();
  };

  const bannerAdd = document.getElementById("btn-banner-add");
  if (bannerAdd) {
    bannerAdd.addEventListener("click", handlePhotoChoose);
  }

  // Bind photo upload clicks to all avatar circles
  document.querySelectorAll("#home-profile-avatar, .app-header .profile-avatar, .profile-card-avatar").forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", handlePhotoChoose);
  });

  if (fileInputPhoto) {
    fileInputPhoto.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        state.settings.profilePhoto = evt.target.result; // Base64 data URL
        saveAllState();
        renderHomeView();
      };
      reader.readAsDataURL(file);
    });
  }

  // Save weight modal binding
  const btnSaveWeight = document.getElementById("btn-save-weight");
  if (btnSaveWeight) {
    btnSaveWeight.addEventListener("click", () => {
      const weightVal = parseFloat(document.getElementById("input-log-weight-value").value);
      if (weightVal && weightVal > 0) {
        state.settings.currentWeight = weightVal;
        state.settings.updated_at = Date.now();
        state.settings.dirty = 1;
        saveAllState();
        renderHomeView();
        document.getElementById("modal-log-weight").classList.add("hidden");
        
        // Instant cloud sync
        if (state.auth && state.auth.token) {
          syncData(true);
        }
      } else {
        alert("Please enter a valid weight!");
      }
    });
  }

  // Set Recovery Day in picker binding
  const btnSetRecovery = document.getElementById("btn-set-recovery-day");
  if (btnSetRecovery) {
    btnSetRecovery.addEventListener("click", () => {
      if (scheduleSelectedDay) {
        state.schedule[scheduleSelectedDay] = null;
        saveAllState();
        renderScheduleView();
        document.getElementById("modal-schedule-picker").classList.add("hidden");
      }
    });
  }

  // If there's an active workout in local storage, resume it
  if (state.activeWorkout) {
    renderActiveWorkoutUI();
    document.getElementById("workout-panel").classList.add("minimized");
    updateMiniBarState(true);
    startWorkoutTimer();
  }

  // --- GENERAL CLICK ROUTER (Event Delegation for SPA buttons) ---
  document.body.addEventListener("click", (e) => {
    const target = e.target;
    
    // Bottom Nav Tabs clicks
    const navItem = target.closest(".app-nav .nav-item");
    if (navItem) {
      switchView(navItem.dataset.view);
      return;
    }

    // Modal Close buttons
    const closeModal = target.closest(".btn-close-modal");
    if (closeModal) {
      const modal = target.closest(".modal-overlay");
      if (modal) {
        if (modal.id === "modal-template-editor") {
          closeTemplateEditorModal();
        } else {
          modal.classList.add("hidden");
        }
      }
      return;
    }


    // + Custom button inside exercise selector modal
    if (target.closest("#btn-selector-create-custom")) {
      const createModal = document.getElementById("modal-create-exercise");
      if (createModal) {
        createModal.classList.remove("hidden");
        const nameEl = document.getElementById("input-custom-exercise-name");
        const instEl = document.getElementById("input-custom-exercise-instructions");
        if (nameEl) nameEl.value = "";
        if (instEl) instEl.value = "";
      }
      return;
    }
  });

  // --- START WORKOUT VIEW BINDINGS ---
  const btnStartEmpty = document.getElementById("btn-start-empty");
  if (btnStartEmpty) {
    btnStartEmpty.addEventListener("click", () => startWorkoutSession());
  }

  const btnNewTemplate = document.getElementById("btn-new-template");
  if (btnNewTemplate) {
    btnNewTemplate.addEventListener("click", () => openTemplateEditor(null));
  }

  // --- HISTORY VIEW BINDINGS ---
  const searchHistoryInput = document.getElementById("input-history-search");
  if (searchHistoryInput) {
    searchHistoryInput.addEventListener("input", debounce((e) => {
      renderHistoryView(e.target.value);
    }, 180));
  }

  const btnCloseHistoryDetailBottom = document.getElementById("btn-close-history-detail-bottom");
  if (btnCloseHistoryDetailBottom) {
    btnCloseHistoryDetailBottom.addEventListener("click", () => {
      const modal = document.getElementById("modal-history-detail");
      if (modal) modal.classList.add("hidden");
    });
  }

  // --- EXERCISES VIEW BINDINGS ---
  const searchExerciseInput = document.getElementById("input-exercise-search");
  if (searchExerciseInput) {
    searchExerciseInput.addEventListener("input", debounce((e) => {
      renderExercisesView(e.target.value);
    }, 180));
  }

  const btnCreateEx = document.getElementById("btn-create-exercise");
  if (btnCreateEx) {
    btnCreateEx.addEventListener("click", () => {
      document.getElementById("modal-create-exercise").classList.remove("hidden");
    });
  }

  const btnSaveCustomEx = document.getElementById("btn-save-custom-exercise");
  if (btnSaveCustomEx) {
    btnSaveCustomEx.addEventListener("click", saveCustomExercise);
  }

  const btnCloseCreateEx = document.getElementById("btn-close-create-exercise");
  if (btnCloseCreateEx) {
    btnCloseCreateEx.addEventListener("click", () => {
      document.getElementById("modal-create-exercise").classList.add("hidden");
    });
  }

  // --- ANALYTICS VIEW BINDINGS ---
  const chartSelect = document.getElementById("select-chart-exercise");
  if (chartSelect) {
    chartSelect.addEventListener("change", (e) => {
      Analytics.renderProgressionChart(e.target.value);
    });
  }

  // --- SETTINGS VIEW BINDINGS ---
  const btnLbs = document.getElementById("btn-unit-lbs");
  const btnKg = document.getElementById("btn-unit-kg");
  
  if (btnLbs) {
    btnLbs.addEventListener("click", () => {
      state.settings.unit = "lbs";
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      btnLbs.classList.add("active");
      if (btnKg) btnKg.classList.remove("active");
      saveAllState();
      
      // Update calculator labels and details
      document.querySelectorAll(".current-unit-text").forEach(el => el.textContent = "lbs");
      document.getElementById("select-bar-weight").innerHTML = `
        <option value="45">Standard Barbell (45 lbs)</option>
        <option value="35">Women's Barbell (35 lbs)</option>
        <option value="15">Technique Bar (15 lbs)</option>
      `;
      Analytics.calculateAllStats();

      // Instant cloud sync
      if (state.auth && state.auth.token) {
        syncData(true);
      }
    });
  }

  if (btnKg) {
    btnKg.addEventListener("click", () => {
      state.settings.unit = "kg";
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      btnKg.classList.add("active");
      if (btnLbs) btnLbs.classList.remove("active");
      saveAllState();

      // Update calculator labels and details
      document.querySelectorAll(".current-unit-text").forEach(el => el.textContent = "kg");
      document.getElementById("select-bar-weight").innerHTML = `
        <option value="20">Standard Barbell (20 kg)</option>
        <option value="15">Women's Barbell (15 kg)</option>
        <option value="10">Technique Bar (10 kg)</option>
      `;
      Analytics.calculateAllStats();

      // Instant cloud sync
      if (state.auth && state.auth.token) {
        syncData(true);
      }
    });
  }

  const btnThemeDark = document.getElementById("btn-theme-dark");
  const btnThemeLight = document.getElementById("btn-theme-light");

  if (btnThemeDark) {
    btnThemeDark.addEventListener("click", () => {
      state.settings.theme = "dark";
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      saveAllState();
      applyTheme();
      if (state.auth && state.auth.token) {
        syncData(true);
      }
    });
  }

  if (btnThemeLight) {
    btnThemeLight.addEventListener("click", () => {
      state.settings.theme = "light";
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      saveAllState();
      applyTheme();
      if (state.auth && state.auth.token) {
        syncData(true);
      }
    });
  }

  const selectRest = document.getElementById("select-default-rest");
  if (selectRest) {
    selectRest.addEventListener("change", (e) => {
      state.settings.defaultRest = parseInt(e.target.value) || 90;
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      saveAllState();

      // Instant cloud sync
      if (state.auth && state.auth.token) {
        syncData(true);
      }
    });
  }

  const selectBroadcast = document.getElementById("select-broadcast-duration");
  if (selectBroadcast) {
    selectBroadcast.addEventListener("change", (e) => {
      state.settings.broadcastFilterDuration = e.target.value || "12";
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      saveAllState();

      // Instant cloud sync
      if (state.auth && state.auth.token) {
        syncData(true);
      }
    });
  }


  const btnExport = document.getElementById("btn-export-data");
  if (btnExport) {
    btnExport.addEventListener("click", exportStateToJSON);
  }

  const btnImportTrigger = document.getElementById("btn-import-trigger");
  const fileInput = document.getElementById("input-import-file");
  if (btnImportTrigger && fileInput) {
    btnImportTrigger.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleJSONImport);
  }

  const btnReset = document.getElementById("btn-reset-data");
  if (btnReset) {
    btnReset.addEventListener("click", resetAllAppData);
  }

  // --- ACTIVE WORKOUT LOGGER DOM BINDINGS ---
  const wPanel = document.getElementById("workout-panel");
  const miniBar = document.getElementById("mini-workout-bar");

  // Header click widget to restore panel
  const timerWidget = document.getElementById("active-timer-widget");
  if (timerWidget) {
    timerWidget.addEventListener("click", () => {
      if (wPanel) {
        wPanel.style.transform = ""; // clear GSAP overrides
        wPanel.classList.remove("minimized");
        wPanel.classList.add("open");
        isWorkoutPanelOpening = true;
        renderActiveWorkoutUI();
      }
      updateMiniBarState(false);
    });
  }

  const btnMinimize = document.getElementById("btn-minimize-workout");
  if (btnMinimize) {
    btnMinimize.addEventListener("click", () => {
      if (wPanel) {
        wPanel.style.transform = ""; // clear GSAP overrides
        wPanel.classList.remove("open");
        wPanel.classList.add("minimized");
      }
      updateMiniBarState(true);
    });
  }

  const btnRestore = document.getElementById("btn-restore-workout");
  if (btnRestore) {
    btnRestore.addEventListener("click", () => {
      if (wPanel) {
        wPanel.style.transform = ""; // clear GSAP overrides
        wPanel.classList.remove("minimized");
        wPanel.classList.add("open");
        isWorkoutPanelOpening = true;
        renderActiveWorkoutUI();
      }
      updateMiniBarState(false);
    });
  }

  const panelDragHeader = document.querySelector(".panel-header-bar");
  if (panelDragHeader) {
    panelDragHeader.addEventListener("click", () => {
      if (wPanel) {
        wPanel.style.transform = ""; // clear GSAP overrides
        if (wPanel.classList.contains("open")) {
          wPanel.classList.remove("open");
          wPanel.classList.add("minimized");
          updateMiniBarState(true);
        } else {
          wPanel.classList.remove("minimized");
          wPanel.classList.add("open");
          isWorkoutPanelOpening = true;
          renderActiveWorkoutUI();
          updateMiniBarState(false);
        }
      }
    });
  }



  const activeExList = document.getElementById("active-exercises-list");
  if (activeExList) {
    activeExList.addEventListener("click", handleActiveWorkoutClickEvents);
    activeExList.addEventListener("input", handleActiveWorkoutInputChanges);
  }

  const btnAddExToWorkout = document.getElementById("btn-add-exercise-to-workout");
  if (btnAddExToWorkout) {
    btnAddExToWorkout.addEventListener("click", () => {
      openExerciseSelector((selectedIds) => {
        addExercisesToWorkout(selectedIds);
      });
    });
  }

  const btnCancelWorkout = document.getElementById("btn-cancel-workout");
  if (btnCancelWorkout) {
    btnCancelWorkout.addEventListener("click", cancelActiveWorkout);
  }

  const btnFinishWorkout = document.getElementById("btn-finish-workout");
  if (btnFinishWorkout) {
    btnFinishWorkout.addEventListener("click", finishActiveWorkout);
  }

  // Exercise selector search & confirm
  const modalSearch = document.getElementById("input-modal-search");
  if (modalSearch) {
    modalSearch.addEventListener("input", debounce((e) => {
      renderSelectorList(e.target.value);
    }, 180));
  }

  const btnConfirmSelected = document.getElementById("btn-confirm-exercises");
  if (btnConfirmSelected) {
    btnConfirmSelected.addEventListener("click", () => {
      if (selectorCurrentSelection.length > 0 && selectorTargetCallback) {
        selectorTargetCallback(selectorCurrentSelection);
      }
      document.getElementById("modal-exercise-selector").classList.add("hidden");
    });
  }

  // NOTE: #btn-selector-create-custom is handled by the delegated body click handler above

  // --- FLOATING REST TIMER CONTROLS ---
  const btnCloseRest = document.getElementById("btn-close-rest-timer");
  if (btnCloseRest) {
    btnCloseRest.addEventListener("click", () => RestTimer.hide());
  }

  const btnRestSkip = document.getElementById("btn-rest-skip");
  if (btnRestSkip) {
    btnRestSkip.addEventListener("click", () => RestTimer.hide());
  }

  const btnRestSub30 = document.getElementById("btn-rest-sub30");
  if (btnRestSub30) {
    btnRestSub30.addEventListener("click", () => RestTimer.addTime(-30));
  }

  const btnRestAdd30 = document.getElementById("btn-rest-add30");
  if (btnRestAdd30) {
    btnRestAdd30.addEventListener("click", () => RestTimer.addTime(30));
  }

  // --- PLATE CALCULATOR CONTROLS ---
  const calcWeightInput = document.getElementById("input-target-weight");
  if (calcWeightInput) {
    calcWeightInput.addEventListener("input", (e) => {
      let val = parseFloat(e.target.value) || 0;
      PlateCalc.render(val);
    });
  }

  const barSelectWeight = document.getElementById("select-bar-weight");
  if (barSelectWeight) {
    barSelectWeight.addEventListener("change", () => {
      let val = parseFloat(calcWeightInput.value) || 0;
      PlateCalc.render(val);
    });
  }

  const btnCalcSub5 = document.getElementById("btn-calc-sub-5");
  if (btnCalcSub5) {
    btnCalcSub5.addEventListener("click", () => {
      let val = Math.max(0, (parseFloat(calcWeightInput.value) || 0) - 5);
      calcWeightInput.value = val;
      PlateCalc.render(val);
    });
  }

  const btnCalcAdd5 = document.getElementById("btn-calc-add-5");
  if (btnCalcAdd5) {
    btnCalcAdd5.addEventListener("click", () => {
      let val = (parseFloat(calcWeightInput.value) || 0) + 5;
      calcWeightInput.value = val;
      PlateCalc.render(val);
    });
  }

  const btnApplyCalc = document.getElementById("btn-apply-calc-weight");
  if (btnApplyCalc) {
    btnApplyCalc.addEventListener("click", () => {
      // Find active set input and update it
      const targetWeight = parseFloat(calcWeightInput.value) || 0;
      
      // Close modal
      document.getElementById("modal-plate-calculator").classList.add("hidden");

      // Set target weight on inputs in the active logging view for the active card
      // (This updates all incomplete sets of the active card or is a convenient helper)
      // For best UX, we update the last touched input or we let user see it.
      // In our design, we can copy target weight to clipboard or prompt, but applying it directly
      // is most premium. Let's find the active card and update the weight input.
      const cards = document.querySelectorAll(".active-exercise-card");
      if (cards.length > 0) {
        // Just alert the user they can enter it or fill the empty weight fields in active workout
        alert(`Target weight calculated: ${targetWeight} ${state.settings.unit}. Please enter it into your set row.`);
      }
    });
  }

  // --- TEMPLATE EDITOR BINDINGS ---
  const btnSaveTemplate = document.getElementById("btn-save-template");
  if (btnSaveTemplate) {
    btnSaveTemplate.addEventListener("click", saveWorkoutTemplate);
  }

  const btnDeleteTemplateEditor = document.getElementById("btn-delete-template-editor");
  if (btnDeleteTemplateEditor) {
    btnDeleteTemplateEditor.addEventListener("click", () => {
      if (templateEditorId) {
        deleteWorkoutTemplate(templateEditorId);
        closeTemplateEditorModal();
      }
    });

  }

  const btnAddExToTemplate = document.getElementById("btn-add-exercise-to-template");
  if (btnAddExToTemplate) {
    btnAddExToTemplate.addEventListener("click", () => {
      openExerciseSelector((selectedIds) => {
        selectedIds.forEach(id => {
          if (!templateEditorExercises.some(e => e.exerciseId === id)) {
            templateEditorExercises.push({
              exerciseId: id,
              sets: [{ type: "N", weight: "", reps: "" }, { type: "N", weight: "", reps: "" }, { type: "N", weight: "", reps: "" }]
            });
          }
        });
        renderTemplateEditorExercises();
      });
    });
  }

  const templateExercisesList = document.getElementById("template-exercises-list");
  if (templateExercisesList) {
    templateExercisesList.addEventListener("click", handleTemplateEditorClicks);
    templateExercisesList.addEventListener("input", handleTemplateEditorInputChanges);
  }

  // Initialize Cloud Sync UI
  updateCloudUI();
  
  // Auto sync if user is logged in (show pill on first sync)
  if (state.auth && state.auth.token) {
    SyncPill.setSyncing();
    syncData(true);
  }

  // Start the live sync engine (8s polling + visibility + online/offline)
  initLiveSyncEngine();

  // --- CLOUD SYNC & AUTH BINDINGS ---
  const btnCloudAccount = document.getElementById("btn-cloud-account");
  if (btnCloudAccount) {
    btnCloudAccount.addEventListener("click", () => {
      if (!state.auth || !state.auth.token) {
        document.getElementById("modal-cloud-auth").classList.remove("hidden");
        document.getElementById("auth-error-msg").classList.add("hidden");
        document.getElementById("input-auth-email").value = "";
        document.getElementById("input-auth-password").value = "";
        const nameInput = document.getElementById("input-auth-name");
        if (nameInput) nameInput.value = "";
        switchAuthTab("login");
      }
    });
  }

  const btnProfileLogout = document.getElementById("btn-profile-logout");
  if (btnProfileLogout) {
    btnProfileLogout.addEventListener("click", () => {
      showCustomConfirm({
        title: "Log Out?",
        message: "Are you sure you want to terminate your sync session? Your local training data will be reset to defaults to protect your privacy.",
        confirmText: "Log Out",
        cancelText: "Stay Logged In",
        isDanger: true,
        onConfirm: () => {
          // Clear credentials
          state.auth = { email: null, token: null, lastSyncTime: 0 };
          localStorage.removeItem("bebig_guest_mode");
          
          // Reset local cache to clean defaults
          state.exercises = [...DEFAULT_EXERCISES];
          state.templates = [...DEFAULT_TEMPLATES];
          state.history = [];
          state.settings = { unit: "lbs", defaultRest: 90, notificationsEnabled: false, updated_at: 0 };
          
          saveAllState();
          updateCloudUI();
          
          // Re-render all views to empty defaults
          renderHomeView();
          renderStartView();
          renderScheduleView();
          renderHistoryView();
          renderExercisesView();
          loadSettingsView();
          Analytics.calculateAllStats();

          // Show login modal by default on logout
          const authModal = document.getElementById("modal-cloud-auth");
          if (authModal) {
            authModal.classList.remove("hidden");
            document.getElementById("auth-error-msg").classList.add("hidden");
            document.getElementById("input-auth-email").value = "";
            document.getElementById("input-auth-password").value = "";
            const nameInput = document.getElementById("input-auth-name");
            if (nameInput) nameInput.value = "";
            switchAuthTab("login");
          }
        }
      });
    });
  }


  const btnCloseCloudAuth = document.getElementById("btn-close-cloud-auth");
  if (btnCloseCloudAuth) {
    btnCloseCloudAuth.addEventListener("click", () => {
      localStorage.setItem("bebig_guest_mode", "true");
      document.getElementById("modal-cloud-auth").classList.add("hidden");
    });
  }

  const btnAuthGuest = document.getElementById("btn-auth-guest");
  if (btnAuthGuest) {
    btnAuthGuest.addEventListener("click", () => {
      localStorage.setItem("bebig_guest_mode", "true");
      document.getElementById("modal-cloud-auth").classList.add("hidden");
    });
  }

  const btnTabLogin = document.getElementById("btn-tab-login");
  const btnTabSignup = document.getElementById("btn-tab-signup");
  if (btnTabLogin) {
    btnTabLogin.addEventListener("click", () => switchAuthTab("login"));
  }
  if (btnTabSignup) {
    btnTabSignup.addEventListener("click", () => switchAuthTab("signup"));
  }

  const btnForgotPassword = document.getElementById("btn-forgot-password");
  if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", () => switchAuthTab("forgot"));
  }

  const btnBackToLogin = document.getElementById("btn-back-to-login");
  if (btnBackToLogin) {
    btnBackToLogin.addEventListener("click", () => switchAuthTab("login"));
  }

  const btnAuthSubmit = document.getElementById("btn-auth-submit");
  if (btnAuthSubmit) {
    btnAuthSubmit.addEventListener("click", handleAuthSubmit);
  }

  const btnSyncNow = document.getElementById("btn-sync-now");
  if (btnSyncNow) {
    btnSyncNow.addEventListener("click", () => syncData());
  }

  const btnSyncNowHeader = document.getElementById("btn-sync-now-header");
  if (btnSyncNowHeader) {
    btnSyncNowHeader.addEventListener("click", () => syncData());
  }

  // --- NOTIFICATION BINDINGS ---
  const btnNotifOn = document.getElementById("btn-notif-on");
  const btnNotifOff = document.getElementById("btn-notif-off");
  if (btnNotifOn && btnNotifOff) {
    btnNotifOn.addEventListener("click", () => {
      if (Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            state.settings.notificationsEnabled = true;
            btnNotifOn.classList.add("active");
            btnNotifOff.classList.remove("active");
            state.settings.updated_at = Date.now();
            state.settings.dirty = 1;
            saveAllState();
          } else {
            alert("Notification permission was denied. Please enable it in browser settings.");
          }
        });
      } else {
        state.settings.notificationsEnabled = true;
        btnNotifOn.classList.add("active");
        btnNotifOff.classList.remove("active");
        state.settings.updated_at = Date.now();
        state.settings.dirty = 1;
        saveAllState();
      }
    });

    btnNotifOff.addEventListener("click", () => {
      state.settings.notificationsEnabled = false;
      btnNotifOff.classList.add("active");
      btnNotifOn.classList.remove("active");
      state.settings.updated_at = Date.now();
      state.settings.dirty = 1;
      saveAllState();
    });
  }

  // --- ADMIN PORTAL BINDINGS ---
  const btnAdminBack = document.getElementById("btn-admin-back");
  if (btnAdminBack) {
    btnAdminBack.addEventListener("click", () => switchView("settings"));
  }

  const btnCloseAdminDetail = document.getElementById("btn-close-admin-detail");
  if (btnCloseAdminDetail) {
    btnCloseAdminDetail.addEventListener("click", () => {
      document.getElementById("modal-admin-client-detail").classList.add("hidden");
    });
  }

  // Admin Tab togglers (Clients Manager vs Live Monitor)
  const btnAdminTabClients = document.getElementById("btn-admin-tab-clients");
  const btnAdminTabLive = document.getElementById("btn-admin-tab-live");
  const adminViewClientsContainer = document.getElementById("admin-view-clients-container");
  const adminViewLiveContainer = document.getElementById("admin-view-live-container");

  if (btnAdminTabClients && btnAdminTabLive) {
    btnAdminTabClients.addEventListener("click", () => {
      btnAdminTabClients.classList.add("active");
      btnAdminTabLive.classList.remove("active");
      if (adminViewClientsContainer) adminViewClientsContainer.classList.remove("hidden");
      if (adminViewLiveContainer) adminViewLiveContainer.classList.add("hidden");
      stopLiveMonitorPolling();
    });

    btnAdminTabLive.addEventListener("click", () => {
      btnAdminTabLive.classList.add("active");
      btnAdminTabClients.classList.remove("active");
      if (adminViewLiveContainer) adminViewLiveContainer.classList.remove("hidden");
      if (adminViewClientsContainer) adminViewClientsContainer.classList.add("hidden");
      startLiveMonitorPolling();
    });
  }

  // Force Reset Password Submit
  const btnAdminResetPasswordSubmit = document.getElementById("btn-admin-reset-password-submit");
  if (btnAdminResetPasswordSubmit) {
    btnAdminResetPasswordSubmit.addEventListener("click", resetClientPassword);
  }

  // Filters and search input listeners
  const inputAdminSearch = document.getElementById("input-admin-client-search");
  if (inputAdminSearch) {
    inputAdminSearch.addEventListener("input", filterAndRenderAdminClients);
  }

  const selectAdminFilter = document.getElementById("select-admin-filter");
  if (selectAdminFilter) {
    selectAdminFilter.addEventListener("change", filterAndRenderAdminClients);
  }

  const selectAdminSort = document.getElementById("select-admin-sort");
  if (selectAdminSort) {
    selectAdminSort.addEventListener("change", filterAndRenderAdminClients);
  }

  const selectAdminBlueprint = document.getElementById("admin-assign-template-select");
  if (selectAdminBlueprint) {
    selectAdminBlueprint.addEventListener("change", handleAdminBlueprintChange);
  }

  const btnAdminAddExercise = document.getElementById("btn-admin-add-exercise");
  if (btnAdminAddExercise) {
    btnAdminAddExercise.addEventListener("click", () => {
      openExerciseSelector((selectedExerciseIds) => {
        selectedExerciseIds.forEach(id => {
          if (!adminBuilderWorkout.exercises.some(ex => ex.exerciseId === id)) {
            adminBuilderWorkout.exercises.push({
              exerciseId: id,
              sets: [{ type: "N", weight: 135, reps: 8 }]
            });
          }
        });
        renderAdminBuilderExercises();
      });
    });
  }

  const btnAdminAssignSubmit = document.getElementById("btn-admin-assign-submit");
  if (btnAdminAssignSubmit) {
    btnAdminAssignSubmit.addEventListener("click", submitAdminAssignTemplate);
  }

  // Admin Client Detail Modal Tabs
  const btnAdminTabAssign = document.getElementById("btn-admin-tab-assign");
  const btnAdminTabLogs = document.getElementById("btn-admin-tab-logs");
  const adminDetailAssignSection = document.getElementById("admin-detail-assign-section");
  const adminDetailLogsSection = document.getElementById("admin-detail-logs-section");
  const adminDetailFooter = document.getElementById("admin-detail-footer");

  if (btnAdminTabAssign && btnAdminTabLogs) {
    btnAdminTabAssign.addEventListener("click", () => {
      btnAdminTabAssign.classList.add("active");
      btnAdminTabLogs.classList.remove("active");
      if (adminDetailAssignSection) adminDetailAssignSection.classList.remove("hidden");
      if (adminDetailLogsSection) adminDetailLogsSection.classList.add("hidden");
      if (adminDetailFooter) adminDetailFooter.classList.remove("hidden");
    });

    btnAdminTabLogs.addEventListener("click", () => {
      btnAdminTabLogs.classList.add("active");
      btnAdminTabAssign.classList.remove("active");
      if (adminDetailAssignSection) adminDetailAssignSection.classList.add("hidden");
      if (adminDetailLogsSection) adminDetailLogsSection.classList.remove("hidden");
      if (adminDetailFooter) adminDetailFooter.classList.add("hidden");
      if (selectedAdminClient) {
        loadAdminClientHistoryLogs(selectedAdminClient.id);
      }
    });
  }

  // Admin Client Danger Zone Actions
  const btnAdminBanClient = document.getElementById("btn-admin-ban-client");
  if (btnAdminBanClient) {
    btnAdminBanClient.addEventListener("click", toggleBanClient);
  }

  const btnAdminDeleteClient = document.getElementById("btn-admin-delete-client");
  if (btnAdminDeleteClient) {
    btnAdminDeleteClient.addEventListener("click", deleteClientAccount);
  }

  // Admin Broadcast Announcement Trigger
  const btnAdminBroadcastSubmit = document.getElementById("btn-admin-broadcast-submit");
  if (btnAdminBroadcastSubmit) {
    btnAdminBroadcastSubmit.addEventListener("click", submitGlobalBroadcast);
  }

  // Client Broadcast Announcement Acknowledgment
  const btnAcknowledgeBroadcast = document.getElementById("btn-acknowledge-broadcast");
  if (btnAcknowledgeBroadcast) {
    btnAcknowledgeBroadcast.addEventListener("click", () => {
      document.getElementById("modal-broadcast-announcement").classList.add("hidden");
    });
  }

  const btnCloseBroadcast = document.getElementById("btn-close-broadcast");
  if (btnCloseBroadcast) {
    btnCloseBroadcast.addEventListener("click", () => {
      document.getElementById("modal-broadcast-announcement").classList.add("hidden");
    });
  }

  // --- PERSONAL RECORDS (PRs) MODAL BINDINGS ---
  const btnViewPrs = document.getElementById("btn-view-prs");
  const modalPrs = document.getElementById("modal-personal-records");
  const btnClosePrsModal = document.getElementById("btn-close-prs-modal");

  if (btnViewPrs && modalPrs) {
    btnViewPrs.addEventListener("click", () => {
      renderSettingsPersonalRecords(); // compile and render PRs inside modal
      modalPrs.classList.remove("hidden");
    });
  }

  if (btnClosePrsModal && modalPrs) {
    btnClosePrsModal.addEventListener("click", () => {
      modalPrs.classList.add("hidden");
    });
  }

  // --- RELEASE NOTES ("WHAT'S NEW") MODAL BINDINGS ---
  const modalReleaseNotes = document.getElementById("modal-release-notes");
  const btnCloseReleaseNotes = document.getElementById("btn-close-release-notes");
  const btnCloseReleaseNotesOk = document.getElementById("btn-close-release-notes-ok");

  const closeReleaseNotes = () => {
    if (modalReleaseNotes) modalReleaseNotes.classList.add("hidden");
  };

  if (btnCloseReleaseNotes) btnCloseReleaseNotes.addEventListener("click", closeReleaseNotes);
  if (btnCloseReleaseNotesOk) btnCloseReleaseNotesOk.addEventListener("click", closeReleaseNotes);

  // --- MANUAL REFRESH BUTTON BINDING ---
  const btnManualRefresh = document.getElementById("btn-manual-refresh");
  if (btnManualRefresh) {
    btnManualRefresh.addEventListener("click", () => {
      const icon = btnManualRefresh.querySelector("svg") || btnManualRefresh.querySelector("i") || btnManualRefresh;
      icon.classList.add("spin-once");
      setTimeout(() => {
        window.location.reload();
      }, 450);
    });
  }

  // Set up AI Coach and Recovery modal listeners
  setupAiCoachAndRecoveryListeners();
  initWorkoutTextParser();

  // Auto-display version in UI
  document.querySelectorAll(".app-version-display").forEach(el => {
    el.textContent = APP_CURRENT_VERSION;
  });

  // Clean initialization of Lucide Icons
  if (window.lucide) window.lucide.createIcons();
});

// Asynchronously load the 1300+ ExerciseDB database
async function loadExercisesDatabase() {
  try {
    const response = await fetch('exercises_db.json');
    if (!response.ok) throw new Error("Could not load exercises_db.json");
    const fetchedExercises = await response.json();
    
    if (Array.isArray(fetchedExercises) && fetchedExercises.length > 0) {
      // Find custom exercises in current state
      const customExercises = state.exercises.filter(ex => ex.id && String(ex.id).startsWith('custom-'));
      
      // Merge: DEFAULT_EXERCISES + fetched standard exercises + user custom exercises
      state.exercises = [...DEFAULT_EXERCISES, ...fetchedExercises, ...customExercises];
      saveAllState();
      
      // Refresh views that display exercises
      const searchExInput = document.getElementById("input-exercise-search");
      const query = searchExInput ? searchExInput.value : "";
      renderExercisesView(query);
      setupMuscleFilters();
      initCustomExerciseModal();
      
      // Refresh all other views that depend on resolved exercise details
      renderStartView();
      renderActiveWorkoutUI();
      renderHistoryView();
      console.log(`Loaded ${fetchedExercises.length} standard exercises and preserved ${customExercises.length} custom exercises.`);
    }
  } catch (err) {
    console.warn("Could not load exercises_db.json, falling back to local preloaded exercises.", err);
  }
}

// ==========================================================================
// 13. CLOUD SYNC & AUTHENTICATION SERVICES
// ==========================================================================
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8787"
  : "https://bebig-backend.adityapatil2348.workers.dev";

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (state.auth && state.auth.token) {
    headers["Authorization"] = `Bearer ${state.auth.token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let isSyncing = false;

let _syncWriteTimer = null; // debounce timer for post-write syncs
let _lastPushedActiveWorkoutStr = null; // tracker for active workout session pushes


// ── Sync Status Pill controller ─────────────────────────────────────────────
const SyncPill = {
  show(state, text) {},
  hide(delay = 2200) {},
  setSyncing() {},
  setSynced()  {},
  setOffline() {},
  setError()   {}
};


// ── Debounced post-write sync ────────────────────────────────────────────────
function scheduleSyncAfterWrite() {
  if (!state.auth || !state.auth.token) return;
  clearTimeout(_syncWriteTimer);
  _syncWriteTimer = setTimeout(() => syncData(true), 500);
}


async function syncData(isSilent = false) {
  if (isSyncing || !state.auth || !state.auth.token) return;
  isSyncing = true;

  if (!isSilent) SyncPill.setSyncing();

  try {
    const lastSync = state.auth.lastSyncTime || 0;
    const activeWorkoutStr = JSON.stringify(state.activeWorkout);
    const activeWorkoutChanged = activeWorkoutStr !== _lastPushedActiveWorkoutStr;
    
    // 1. Filter local modifications since last sync (or marked dirty)
    const exercisesToPush = state.exercises.filter(ex => ex.id && String(ex.id).startsWith("custom-") && (ex.dirty || (ex.updated_at || 0) > lastSync));
    const templatesToPush = state.templates.filter(t => t.dirty || (t.updated_at || 0) > lastSync);
    const historyToPush = state.history.filter(h => h.dirty || (h.updated_at || 0) > lastSync);
    
    let settingsToPush = null;
    if (state.settings.dirty || (state.settings.updated_at || 0) > lastSync) {
      settingsToPush = {
        unit: state.settings.unit,
        default_rest: state.settings.defaultRest,
        updated_at: state.settings.updated_at
      };
    }

    // 2. Push local state updates
    if (exercisesToPush.length > 0 || templatesToPush.length > 0 || historyToPush.length > 0 || settingsToPush || activeWorkoutChanged) {
      const pushRes = await fetch(`${API_BASE_URL}/api/sync/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.auth.token}`
        },
        body: JSON.stringify({
          exercises: exercisesToPush,
          templates: templatesToPush,
          history: historyToPush,
          settings: settingsToPush,
          activeWorkout: state.activeWorkout
        })
      });
      if (pushRes.status === 403) {
        handleBannedUserLogout("🚫 Access Blocked: Your account has been banned/disabled by the administrator.");
        return;
      }
      if (pushRes.status === 401) {
        handleBannedUserLogout("🔒 Session Expired: Your account has been deleted or your session has expired. Please log in again.");
        return;
      }
      if (!pushRes.ok) {
        throw new Error("Push sync failed");
      }
      const pushData = await pushRes.json();
      if (pushData.success && pushData.synced_at) {
        _lastPushedActiveWorkoutStr = activeWorkoutStr;
        exercisesToPush.forEach(ex => { ex.updated_at = pushData.synced_at; delete ex.dirty; });
        templatesToPush.forEach(t => { t.updated_at = pushData.synced_at; delete t.dirty; });
        historyToPush.forEach(h => { h.updated_at = pushData.synced_at; delete h.dirty; });
        if (settingsToPush) {
          state.settings.updated_at = pushData.synced_at;
          delete state.settings.dirty;
        }
        saveAllState();
      }
    }


    // 3. Pull newer remote state updates
    const pullRes = await fetch(`${API_BASE_URL}/api/sync/pull?last_pulled_at=${lastSync}&_nocache=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${state.auth.token}`
      }
    });
    if (pullRes.status === 403) {
      handleBannedUserLogout("🚫 Access Blocked: Your account has been banned/disabled by the administrator.");
      return;
    }
    if (pullRes.status === 401) {
      handleBannedUserLogout("🔒 Session Expired: Your account has been deleted or your session has expired. Please log in again.");
      return;
    }
    if (!pullRes.ok) {
      throw new Error("Pull sync failed");
    }

    const remoteData = await pullRes.json();

    // Check for global broadcast announcement
    if (remoteData.broadcast && remoteData.broadcast.timestamp) {
      const lastBroadcast = state.settings.lastBroadcastTimestamp || 0;
      const durationSetting = state.settings.broadcastFilterDuration || "12";

      if (durationSetting !== "off") {
        let isWithinLimit = true;
        if (durationSetting !== "always") {
          const hours = parseInt(durationSetting, 10) || 12;
          const ageMs = Date.now() - remoteData.broadcast.timestamp;
          isWithinLimit = ageMs < (hours * 60 * 60 * 1000);
        }

        if (remoteData.broadcast.timestamp > lastBroadcast && isWithinLimit) {
          state.settings.lastBroadcastTimestamp = remoteData.broadcast.timestamp;
          saveAllState();

          const broadcastModal = document.getElementById("modal-broadcast-announcement");
          const broadcastMsgText = document.getElementById("broadcast-message-text");
          const broadcastTimeText = document.getElementById("broadcast-timestamp-text");
          
          if (broadcastModal && broadcastMsgText) {
            broadcastMsgText.textContent = remoteData.broadcast.message;
            if (broadcastTimeText) {
              const dateStr = new Date(remoteData.broadcast.timestamp).toLocaleString();
              broadcastTimeText.textContent = `Sent: ${dateStr}`;
            }
            broadcastModal.classList.remove("hidden");
          }
        }
      }
    }



    // 4. Conflict Resolution (Latest timestamp wins)
    // Exercises
    if (Array.isArray(remoteData.exercises)) {
      remoteData.exercises.forEach(remote => {
        const localIdx = state.exercises.findIndex(e => e.id === remote.id);
        if (localIdx !== -1) {
          const local = state.exercises[localIdx];
          if ((remote.updated_at || 0) >= (local.updated_at || 0)) {
            state.exercises[localIdx] = remote;
          }
        } else {
          state.exercises.push(remote);
        }
      });
    }

    // Templates
    if (Array.isArray(remoteData.templates)) {
      remoteData.templates.forEach(remote => {
        const localIdx = state.templates.findIndex(t => t.id === remote.id);
        if (localIdx !== -1) {
          const local = state.templates[localIdx];
          if ((remote.updated_at || 0) >= (local.updated_at || 0)) {
            state.templates[localIdx] = remote;
          }
        } else {
          state.templates.push(remote);
        }
      });
    }

    // History
    if (Array.isArray(remoteData.history)) {
      remoteData.history.forEach(remote => {
        const localIdx = state.history.findIndex(h => h.id === remote.id);
        if (localIdx !== -1) {
          const local = state.history[localIdx];
          if ((remote.updated_at || 0) >= (local.updated_at || 0)) {
            state.history[localIdx] = remote;
          }
        } else {
          state.history.push(remote);
        }
      });
    }

    // Settings
    if (remoteData.settings) {
      if ((remoteData.settings.updated_at || 0) >= (state.settings.updated_at || 0)) {
        state.settings.unit = remoteData.settings.unit;
        state.settings.defaultRest = remoteData.settings.default_rest;
        state.settings.updated_at = remoteData.settings.updated_at;
        
        loadSettingsView();
      }
    }

    // Active Workout Sync (Real-time Session mirroring)
    if (remoteData.activeWorkout !== undefined) {
      const currentActiveStr = JSON.stringify(state.activeWorkout);
      const remoteActiveStr = JSON.stringify(remoteData.activeWorkout);

      if (currentActiveStr !== remoteActiveStr) {
        if (remoteData.activeWorkout) {
          state.activeWorkout = remoteData.activeWorkout;
          _lastPushedActiveWorkoutStr = remoteActiveStr; // Align pushed state tracker to prevent feedback loops
          
          renderActiveWorkoutUI();
          
          // Ensure panel shows up as minimized if it isn't already visible
          const wPanel = document.getElementById("workout-panel");
          if (wPanel && !wPanel.classList.contains("open") && !wPanel.classList.contains("minimized")) {
            wPanel.classList.add("minimized");
            updateMiniBarState(true);
          }
          startWorkoutTimer();
        } else {
          // Workout finished or discarded on other device
          state.activeWorkout = null;
          _lastPushedActiveWorkoutStr = null;
          
          stopWorkoutTimer();
          const wPanel = document.getElementById("workout-panel");
          if (wPanel) {
            wPanel.style.transform = "";
            wPanel.classList.remove("open", "minimized");
          }
          updateMiniBarState(false);
        }
      }
    }

    // Sync finished successfully
    state.auth.lastSyncTime = remoteData.server_time || Date.now();
    saveAllState();
    SyncPill.setSynced();

    // Refresh display lists
    renderHomeView();
    renderStartView();
    renderScheduleView();
    renderHistoryView();
    renderExercisesView();
    Analytics.calculateAllStats();


  } catch (err) {
    console.error("Cloud Sync error:", err);
    if (!isSilent) SyncPill.setError();
    else SyncPill.setError();
  } finally {
    isSyncing = false;
    updateCloudUI();
  }
}

// ── Kick off background sync every 8 seconds + on visibility/online ──────────
function initLiveSyncEngine() {
  // 1. Background polling — every 8 seconds
  setInterval(() => {
    if (state.auth && state.auth.token && document.visibilityState === 'visible' && navigator.onLine) {
      syncData(true);
    }
  }, 8000);

  // 2. Sync immediately when user switches back to this tab / app
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (restTimerId) {
        try { RestTimer.tick(); } catch (e) {}
      }
      if (state.auth && state.auth.token) {
        syncData(true);
      }
    }
  });

  window.addEventListener('focus', () => {
    if (restTimerId) {
      try { RestTimer.tick(); } catch (e) {}
    }
  });

  // 3. Sync immediately when network comes back online
  window.addEventListener('online', () => {
    SyncPill.show('', '📶 Back online!');
    if (state.auth && state.auth.token) {
      setTimeout(() => syncData(true), 400);
    } else {
      SyncPill.hide(2000);
    }
  });

  // 4. Show offline pill when network drops
  window.addEventListener('offline', () => {
    SyncPill.setOffline();
  });
}


function updateCloudUI() {
  const accountLabel = document.getElementById("cloud-account-label");
  const accountSubtext = document.getElementById("cloud-account-subtext");
  const syncRow = document.getElementById("btn-sync-now");
  const syncHeaderBtn = document.getElementById("btn-sync-now-header");
  const lastSyncText = document.getElementById("last-sync-subtext");
  const statusIcon = document.getElementById("cloud-status-icon");
  const logoutRow = document.getElementById("btn-profile-logout");

  if (state.auth && state.auth.token) {
    if (accountLabel) accountLabel.textContent = "Regimen Sync";
    if (accountSubtext) accountSubtext.textContent = state.auth.email;
    if (statusIcon) {
      statusIcon.setAttribute("data-lucide", "cloud");
      statusIcon.style.color = "var(--color-success)";
    }
    if (syncRow) syncRow.classList.remove("hidden");
    if (syncHeaderBtn) syncHeaderBtn.classList.remove("hidden");
    if (logoutRow) logoutRow.classList.remove("hidden");
    if (lastSyncText) {
      const timeStr = state.auth.lastSyncTime > 0 
        ? new Date(state.auth.lastSyncTime).toLocaleTimeString() 
        : "Never";
      lastSyncText.textContent = `Last: ${timeStr}`;
    }
  } else {
    if (accountLabel) accountLabel.textContent = "Regimen Sync";
    if (accountSubtext) accountSubtext.textContent = "Tap to link profile";
    if (statusIcon) {
      statusIcon.setAttribute("data-lucide", "cloud-off");
      statusIcon.style.color = "var(--text-muted)";
    }
    if (syncRow) syncRow.classList.add("hidden");
    if (syncHeaderBtn) syncHeaderBtn.classList.add("hidden");
    if (logoutRow) logoutRow.classList.add("hidden");
  }

  if (window.lucide) window.lucide.createIcons();
}


let activeAuthTab = "login";

function switchAuthTab(tab) {
  activeAuthTab = tab;
  const loginTab = document.getElementById("btn-tab-login");
  const signupTab = document.getElementById("btn-tab-signup");
  const submitBtn = document.getElementById("btn-auth-submit");
  const title = document.getElementById("auth-modal-title");
  
  const nameGroup = document.getElementById("group-auth-name");
  const emailGroup = document.getElementById("input-auth-email")?.closest(".form-group");
  const passGroup = document.getElementById("group-auth-password");
  const codeGroup = document.getElementById("group-auth-code");
  const newPassGroup = document.getElementById("group-auth-new-password");

  const forgotLinkContainer = document.getElementById("auth-forgot-link-container");
  const backToLoginContainer = document.getElementById("auth-back-to-login-container");

  const tabsContainer = loginTab ? loginTab.parentElement : null;

  if (tab === "login") {
    if (tabsContainer) tabsContainer.classList.remove("hidden");
    if (loginTab) loginTab.classList.add("active");
    if (signupTab) signupTab.classList.remove("active");
    if (nameGroup) nameGroup.classList.add("hidden");
    if (emailGroup) emailGroup.classList.remove("hidden");
    if (passGroup) passGroup.classList.remove("hidden");
    if (codeGroup) codeGroup.classList.add("hidden");
    if (newPassGroup) newPassGroup.classList.add("hidden");
    
    if (forgotLinkContainer) forgotLinkContainer.classList.remove("hidden");
    if (backToLoginContainer) backToLoginContainer.classList.add("hidden");
    
    submitBtn.textContent = "Login";
    title.textContent = "Cloud Login";
  } 
  else if (tab === "signup") {
    if (tabsContainer) tabsContainer.classList.remove("hidden");
    if (loginTab) loginTab.classList.remove("active");
    if (signupTab) signupTab.classList.add("active");
    if (nameGroup) nameGroup.classList.remove("hidden");
    if (emailGroup) emailGroup.classList.remove("hidden");
    if (passGroup) passGroup.classList.remove("hidden");
    if (codeGroup) codeGroup.classList.add("hidden");
    if (newPassGroup) newPassGroup.classList.add("hidden");

    if (forgotLinkContainer) forgotLinkContainer.classList.add("hidden");
    if (backToLoginContainer) backToLoginContainer.classList.add("hidden");

    submitBtn.textContent = "Sign Up";
    title.textContent = "Create Cloud Account";
  } 
  else if (tab === "forgot") {
    if (tabsContainer) tabsContainer.classList.add("hidden");
    if (nameGroup) nameGroup.classList.add("hidden");
    if (emailGroup) emailGroup.classList.remove("hidden");
    if (passGroup) passGroup.classList.add("hidden");
    if (codeGroup) codeGroup.classList.add("hidden");
    if (newPassGroup) newPassGroup.classList.add("hidden");

    if (forgotLinkContainer) forgotLinkContainer.classList.add("hidden");
    if (backToLoginContainer) backToLoginContainer.classList.remove("hidden");

    submitBtn.textContent = "Send Recovery Code";
    title.textContent = "Reset Password";
  } 
  else if (tab === "reset") {
    if (tabsContainer) tabsContainer.classList.add("hidden");
    if (nameGroup) nameGroup.classList.add("hidden");
    if (emailGroup) emailGroup.classList.add("hidden");
    if (passGroup) passGroup.classList.add("hidden");
    if (codeGroup) codeGroup.classList.remove("hidden");
    if (newPassGroup) newPassGroup.classList.remove("hidden");

    if (forgotLinkContainer) forgotLinkContainer.classList.add("hidden");
    if (backToLoginContainer) backToLoginContainer.classList.remove("hidden");

    submitBtn.textContent = "Update Password";
    title.textContent = "Change Password";
  }
}

async function handleAuthSubmit() {
  const email = document.getElementById("input-auth-email").value.trim();
  const errorEl = document.getElementById("auth-error-msg");
  const submitBtn = document.getElementById("btn-auth-submit");

  if (activeAuthTab === "forgot") {
    if (!email) {
      if (errorEl) {
        errorEl.textContent = "Email address is required.";
        errorEl.classList.remove("hidden");
      }
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    if (errorEl) errorEl.classList.add("hidden");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");

      alert(`🔐 Recovery code generated: ${data.code}\n(An email simulation was successful. Type this code to continue!)`);
      
      switchAuthTab("reset");
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Recovery Code";
    }
    return;
  }

  if (activeAuthTab === "reset") {
    const code = document.getElementById("input-auth-code").value.trim();
    const newPassword = document.getElementById("input-auth-new-password").value;

    if (!code || !newPassword) {
      if (errorEl) {
        errorEl.textContent = "Recovery code and new password are required.";
        errorEl.classList.remove("hidden");
      }
      return;
    }
    if (newPassword.length < 6) {
      if (errorEl) {
        errorEl.textContent = "Password must be at least 6 characters.";
        errorEl.classList.remove("hidden");
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";
    if (errorEl) errorEl.classList.add("hidden");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reset failed");

      alert("🎉 Password reset successfully! You can now log in with your new password.");
      switchAuthTab("login");
      
      document.getElementById("input-auth-code").value = "";
      document.getElementById("input-auth-new-password").value = "";
      document.getElementById("input-auth-password").value = "";
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Update Password";
    }
    return;
  }

  const password = document.getElementById("input-auth-password").value;
  if (!email || !password) {
    if (errorEl) {
      errorEl.textContent = "Email and password are required.";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = activeAuthTab === "login" ? "Logging in..." : "Signing up...";
  if (errorEl) errorEl.classList.add("hidden");

  try {
    const route = activeAuthTab === "login" ? "/api/auth/login" : "/api/auth/signup";
    const payload = { email, password };
    
    if (activeAuthTab === "signup") {
      const nameInput = document.getElementById("input-auth-name");
      const nameVal = nameInput ? nameInput.value.trim() : "";
      if (!nameVal) {
        throw new Error("Full Name is required.");
      }
      payload.name = nameVal;
    }

    const response = await fetch(`${API_BASE_URL}${route}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    state.auth = {
      email: data.email,
      token: data.token,
      name: data.name || "",
      lastSyncTime: 0,
      isAdmin: !!data.isAdmin
    };
    localStorage.removeItem("bebig_guest_mode");

    // Mark all existing local custom items as dirty so they sync up to the database of this authenticated user
    state.exercises.forEach(ex => {
      if (ex.id && String(ex.id).startsWith("custom-")) {
        ex.dirty = 1;
      }
    });
    state.templates.forEach(t => { t.dirty = 1; });
    state.history.forEach(h => { h.dirty = 1; });

    saveAllState();

    document.getElementById("modal-cloud-auth").classList.add("hidden");
    syncData(true);

  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = activeAuthTab === "login" ? "Login" : "Sign Up";
  }
}

// ==========================================================================
// 14. ADMIN PORTAL INTERFACE & ROUTINES ASSIGNER
// ==========================================================================
let adminClients = [];
let selectedAdminClient = null;
let adminBuilderWorkout = {
  name: "",
  notes: "",
  exercises: []
};

async function renderAdminView() {
  const listContainer = document.getElementById("admin-clients-list");
  if (!listContainer) return;

  listContainer.innerHTML = '<div class="skeleton-loader" style="margin: 20px auto;"></div>';
  document.getElementById("admin-stat-clients").textContent = "-";
  document.getElementById("admin-stat-total-workouts").textContent = "-";

  if (!state.auth || !state.auth.token || !state.auth.isAdmin) {
    alert("Unauthorized: Admin access only");
    switchView("settings");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/clients`, {
      headers: {
        "Authorization": `Bearer ${state.auth.token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load admin client database");
    }

    const data = await response.json();
    adminClients = data.clients || [];

    // Calculate aggregated stats
    document.getElementById("admin-stat-clients").textContent = adminClients.length;
    const totalLogs = adminClients.reduce((sum, c) => sum + (c.workouts_count || 0), 0);
    document.getElementById("admin-stat-total-workouts").textContent = totalLogs;

    renderAdminClientsList(adminClients);

  } catch (err) {
    alert("Admin Error: " + err.message);
    switchView("settings");
  }
}

function renderAdminClientsList(clients) {
  const container = document.getElementById("admin-clients-list");
  if (!container) return;

  if (clients.length === 0) {
    container.innerHTML = '<p class="empty-state-text" style="grid-column: 1/-1; text-align: center; padding: 20px;">No registered clients found.</p>';
    return;
  }

  container.innerHTML = "";

  // Helper: format a timestamp into a friendly relative string
  function formatRelTime(ts) {
    if (!ts) return 'Never';
    const diffMs = Date.now() - ts;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `${diffD}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  }

  function formatJoinDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  clients.forEach(client => {
    const isBanned = client.banned === 1;
    const displayName = client.name || client.email.split('@')[0];
    const initial = displayName.charAt(0).toUpperCase();
    const joinedStr = formatJoinDate(client.created_at);
    const lastSeenStr = client.last_seen ? formatRelTime(client.last_seen) : (client.last_workout_time ? formatRelTime(client.last_workout_time) : 'Never');
    const isRecentlyActive = client.last_seen && (Date.now() - client.last_seen) < 5 * 60 * 1000; // within 5 min
    const statusDotColor = isBanned ? '#ef4444' : (isRecentlyActive ? '#10b981' : '#6b7280');
    const statusLabel = isBanned ? 'BANNED' : (isRecentlyActive ? 'ACTIVE' : 'OFFLINE');
    const statusBg = isBanned ? 'rgba(239,68,68,0.12)' : (isRecentlyActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)');
    const statusColor = isBanned ? '#ef4444' : (isRecentlyActive ? '#10b981' : '#9ca3af');

    // Avatar gradient — cycle through a few palettes based on initial
    const gradients = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#f59e0b,#d97706)',
      'linear-gradient(135deg,#3b82f6,#2563eb)',
      'linear-gradient(135deg,#ec4899,#db2777)',
      'linear-gradient(135deg,#14b8a6,#0d9488)',
    ];
    const grad = gradients[initial.charCodeAt(0) % gradients.length];

    const card = document.createElement('div');
    card.className = 'admin-client-card';
    if (isBanned) card.classList.add('banned');
    card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px; position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s;';

    card.innerHTML = `
      <!-- Top row: avatar + name/email + status capsule -->
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="position: relative; flex-shrink: 0;">
          <div style="width: 46px; height: 46px; border-radius: 50%; background: ${grad}; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 800; color: #fff;">${initial}</div>
          <span style="position: absolute; bottom: 1px; right: 1px; width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--bg-card); background: ${statusDotColor};"></span>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayName}</div>
          <div style="font-size: 0.68rem; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">${client.email}</div>
        </div>
        <span style="flex-shrink: 0; padding: 3px 9px; border-radius: 20px; background: ${statusBg}; color: ${statusColor}; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.06em;">${statusLabel}</span>
      </div>

      <!-- Mini detail cards: Joined + Last Seen -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 10px;">
          <div style="font-size: 0.55rem; font-weight: 700; color: var(--text-dark); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 3px;">Joined</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-main);">${joinedStr}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 10px;">
          <div style="font-size: 0.55rem; font-weight: 700; color: var(--text-dark); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 3px;">Last Active</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: ${isRecentlyActive ? '#10b981' : 'var(--text-main)'}">${lastSeenStr}</div>
        </div>
      </div>

      <!-- 4 action buttons -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
        <button class="ac-btn-details" data-id="${client.id}" title="View Details"
          style="background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; transition: opacity 0.2s;">
          <i data-lucide="eye" style="width:15px; height:15px; color:#818cf8;"></i>
          <span style="font-size:0.55rem; color:#818cf8; font-weight:700;">Details</span>
        </button>
        <button class="ac-btn-reset" data-id="${client.id}" title="Reset Password"
          style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; transition: opacity 0.2s;">
          <i data-lucide="key-round" style="width:15px; height:15px; color:#10b981;"></i>
          <span style="font-size:0.55rem; color:#10b981; font-weight:700;">Reset</span>
        </button>
        <button class="ac-btn-ban" data-id="${client.id}" data-banned="${client.banned}" title="${isBanned ? 'Unban' : 'Ban'} Client"
          style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); border-radius: 10px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; transition: opacity 0.2s;">
          <i data-lucide="${isBanned ? 'unlock' : 'ban'}" style="width:15px; height:15px; color:#f59e0b;"></i>
          <span style="font-size:0.55rem; color:#f59e0b; font-weight:700;">${isBanned ? 'Unban' : 'Ban'}</span>
        </button>
        <button class="ac-btn-delete" data-id="${client.id}" data-email="${client.email}" title="Delete Account"
          style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; transition: opacity 0.2s;">
          <i data-lucide="trash-2" style="width:15px; height:15px; color:#ef4444;"></i>
          <span style="font-size:0.55rem; color:#ef4444; font-weight:700;">Delete</span>
        </button>
      </div>
    `;

    // Wire up Details button
    card.querySelector('.ac-btn-details').addEventListener('click', () => openAdminClientDetailModal(client));

    // Wire up Reset button — opens inspector focused on password field
    card.querySelector('.ac-btn-reset').addEventListener('click', () => {
      openAdminClientDetailModal(client);
      setTimeout(() => {
        const pw = document.getElementById('input-admin-reset-password');
        if (pw) pw.focus();
      }, 200);
    });

    // Wire up Ban button (inline quick-action)
    card.querySelector('.ac-btn-ban').addEventListener('click', async (e) => {
      e.stopPropagation();
      const newBanned = client.banned === 1 ? 0 : 1;
      const action = newBanned === 1 ? 'ban' : 'unban';
      if (!confirm(`Are you sure you want to ${action} ${client.email}?`)) return;
      try {
        const res = await apiFetch(`/api/admin/client/${client.id}/ban`, { method: 'POST', body: JSON.stringify({ banned: newBanned === 1 }) });
        if (res.success) {
          client.banned = newBanned;
          showToast(`Client ${action}ned successfully.`, 'success');
          loadAdminView();
        }
      } catch (err) {
        showToast('Action failed: ' + err.message, 'error');
      }
    });

    // Wire up Delete button (inline quick-action)
    card.querySelector('.ac-btn-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Permanently delete account for ${client.email}? This cannot be undone.`)) return;
      try {
        const res = await apiFetch(`/api/admin/client/${client.id}`, { method: 'DELETE' });
        if (res.success) {
          showToast('Account permanently deleted.', 'success');
          loadAdminView();
        }
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    });

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}


function openAdminClientDetailModal(client) {
  selectedAdminClient = client;
  
  const modal = document.getElementById("modal-admin-client-detail");
  if (!modal) return;

  // --- Populate User Inspector fields ---

  const displayName = client.name || client.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();
  const isBanned = client.banned === 1;

  // Avatar
  const avatarInitialEl = document.getElementById('inspector-avatar-initial');
  if (avatarInitialEl) avatarInitialEl.textContent = initial;

  // Status dot
  const dotEl = document.getElementById('inspector-status-dot');
  const isRecentlyActive = client.last_seen && (Date.now() - client.last_seen) < 5 * 60 * 1000;
  if (dotEl) dotEl.style.background = isBanned ? '#ef4444' : (isRecentlyActive ? '#10b981' : '#6b7280');

  // Name + email
  const nameEl = document.getElementById('inspector-name');
  if (nameEl) nameEl.textContent = displayName;
  const emailEl = document.getElementById('inspector-email');
  if (emailEl) emailEl.textContent = client.email;

  // Copy email button
  const copyBtn = document.getElementById('btn-inspector-copy-email');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(client.email).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      });
    };
  }

  // User ID
  const userIdEl = document.getElementById('inspector-user-id');
  if (userIdEl) userIdEl.textContent = `usr_${client.id}`;

  // Status text
  const statusEl = document.getElementById('inspector-status-text');
  if (statusEl) statusEl.textContent = isBanned ? '🚫 Banned' : '✅ Active';

  // Joined
  const joinedEl = document.getElementById('inspector-joined');
  if (joinedEl && client.created_at) {
    joinedEl.textContent = new Date(client.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Last Seen
  const lastSeenEl = document.getElementById('inspector-last-seen');
  if (lastSeenEl) {
    const lastTs = client.last_seen || client.last_workout_time;
    if (lastTs) {
      lastSeenEl.textContent = new Date(lastTs).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      lastSeenEl.textContent = 'Never';
    }
  }

  // Device
  const deviceEl = document.getElementById('inspector-device');
  if (deviceEl) deviceEl.textContent = client.device || 'Offline';

  // Workouts count
  const workoutsEl = document.getElementById('inspector-workouts');
  if (workoutsEl) workoutsEl.textContent = client.workouts_count || 0;

  // Clear password input
  const passEl = document.getElementById("input-admin-reset-password");
  if (passEl) passEl.value = "";

  // Ban button label
  const banBtn = document.getElementById("btn-admin-ban-client");
  if (banBtn) {
    if (isBanned) {
      banBtn.innerHTML = `<i data-lucide="unlock" style="width:15px; height:15px;"></i> Unban Account`;
      banBtn.style.borderColor = 'rgba(16,185,129,0.35)';
      banBtn.style.background = 'rgba(16,185,129,0.06)';
      banBtn.style.color = '#10b981';
    } else {
      banBtn.innerHTML = `<i data-lucide="ban" style="width:15px; height:15px;"></i> Ban Account`;
      banBtn.style.borderColor = 'rgba(239,68,68,0.35)';
      banBtn.style.background = 'rgba(239,68,68,0.06)';
      banBtn.style.color = '#ef4444';
    }
  }

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function handleAdminBlueprintChange(e) {
  const val = e.target.value;
  
  if (val === "custom_empty") {
    adminBuilderWorkout = {
      name: "",
      notes: "",
      exercises: []
    };
    document.getElementById("input-admin-template-name").value = "";
    document.getElementById("input-admin-template-notes").value = "";
    renderAdminBuilderExercises();
    return;
  }

  let selectedTemplate = null;
  if (val.startsWith("default_")) {
    const idx = parseInt(val.split("_")[1], 10);
    selectedTemplate = DEFAULT_TEMPLATES[idx];
  } else if (val.startsWith("custom_")) {
    const id = val.substring(7);
    selectedTemplate = state.templates.find(t => t.id === id);
  }

  if (selectedTemplate) {
    adminBuilderWorkout = {
      name: `Coach Routine - ${selectedTemplate.name}`,
      notes: selectedTemplate.notes || "",
      exercises: JSON.parse(JSON.stringify(selectedTemplate.exercises)) // Deep copy
    };

    // Populate inputs
    document.getElementById("input-admin-template-name").value = adminBuilderWorkout.name;
    document.getElementById("input-admin-template-notes").value = adminBuilderWorkout.notes;
    renderAdminBuilderExercises();
  }
}

function renderAdminBuilderExercises() {
  const container = document.getElementById("admin-template-exercises-list");
  if (!container) return;

  if (adminBuilderWorkout.exercises.length === 0) {
    container.innerHTML = '<p class="empty-state-text" style="padding: 10px 0 0 0;">Add exercises to build a custom routine template.</p>';
    return;
  }

  container.innerHTML = "";
  adminBuilderWorkout.exercises.forEach((item, exIdx) => {
    const exerciseDetails = state.exercises.find(ex => ex.id === item.exerciseId) || { name: item.exerciseId };
    
    const card = document.createElement("div");
    card.className = "admin-builder-exercise-card";

    let setsHtml = "";
    item.sets.forEach((set, setIdx) => {
      setsHtml += `
        <div class="admin-builder-set-row" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">
          <span class="admin-builder-set-number">${setIdx + 1}</span>
          <input type="number" class="admin-builder-set-input input-weight" placeholder="lbs" value="${set.weight || ''}" step="any">
          <input type="number" class="admin-builder-set-input input-reps" placeholder="reps" value="${set.reps || ''}">
          <button class="btn-admin-remove-set" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">
            <i data-lucide="minus-circle" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="admin-builder-exercise-header">
        <span class="admin-builder-exercise-title">${exerciseDetails.name}</span>
        <button class="btn-admin-remove-exercise" data-ex-idx="${exIdx}">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
      <div class="admin-builder-sets-list">
        <div class="admin-builder-set-row" style="grid-template-columns: 24px 1fr 1fr 24px; text-align: center; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 4px; margin-bottom: 2px;">
          <span></span>
          <span style="font-size: 0.65rem; color: var(--text-dark); text-transform: uppercase;">Weight</span>
          <span style="font-size: 0.65rem; color: var(--text-dark); text-transform: uppercase;">Reps</span>
          <span></span>
        </div>
        ${setsHtml}
      </div>
      <button class="btn-admin-add-set" data-ex-idx="${exIdx}">
        <i data-lucide="plus" style="width: 12px; height: 12px;"></i> Add Set
      </button>
    `;

    // Bind weight & reps change events
    card.querySelectorAll(".input-weight").forEach(input => {
      input.addEventListener("input", (e) => {
        const row = e.target.closest(".admin-builder-set-row");
        const eIdx = parseInt(row.dataset.exIdx, 10);
        const sIdx = parseInt(row.dataset.setIdx, 10);
        adminBuilderWorkout.exercises[eIdx].sets[sIdx].weight = parseFloat(e.target.value) || 0;
      });
    });

    card.querySelectorAll(".input-reps").forEach(input => {
      input.addEventListener("input", (e) => {
        const row = e.target.closest(".admin-builder-set-row");
        const eIdx = parseInt(row.dataset.exIdx, 10);
        const sIdx = parseInt(row.dataset.setIdx, 10);
        adminBuilderWorkout.exercises[eIdx].sets[sIdx].reps = parseInt(e.target.value, 10) || 0;
      });
    });

    // Remove Exercise click
    card.querySelector(".btn-admin-remove-exercise").addEventListener("click", () => {
      adminBuilderWorkout.exercises = adminBuilderWorkout.exercises.filter((_, idx) => idx !== exIdx);
      renderAdminBuilderExercises();
    });

    // Add Set click
    card.querySelector(".btn-admin-add-set").addEventListener("click", () => {
      const lastSet = item.sets[item.sets.length - 1] || { weight: 135, reps: 8 };
      item.sets.push({
        type: "N",
        weight: lastSet.weight,
        reps: lastSet.reps
      });
      renderAdminBuilderExercises();
    });

    // Remove Set clicks
    card.querySelectorAll(".btn-admin-remove-set").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const targetBtn = e.target.closest(".btn-admin-remove-set");
        const eIdx = parseInt(targetBtn.dataset.exIdx, 10);
        const sIdx = parseInt(targetBtn.dataset.setIdx, 10);
        adminBuilderWorkout.exercises[eIdx].sets = adminBuilderWorkout.exercises[eIdx].sets.filter((_, idx) => idx !== sIdx);
        renderAdminBuilderExercises();
      });
    });

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

async function submitAdminAssignTemplate() {
  if (!selectedAdminClient) return;

  const tName = document.getElementById("input-admin-template-name").value.trim();
  const tNotes = document.getElementById("input-admin-template-notes").value.trim();

  if (!tName) {
    alert("Please enter a template name!");
    return;
  }

  if (adminBuilderWorkout.exercises.length === 0) {
    alert("Please add at least one exercise to assign!");
    return;
  }

  // Validate exercises have at least 1 set
  for (const item of adminBuilderWorkout.exercises) {
    if (item.sets.length === 0) {
      const exDetails = state.exercises.find(ex => ex.id === item.exerciseId) || { name: item.exerciseId };
      alert(`Exercise "${exDetails.name}" must have at least one set!`);
      return;
    }
  }

  const payload = {
    userId: selectedAdminClient.id,
    template: {
      name: tName,
      notes: tNotes,
      exercises: adminBuilderWorkout.exercises
    }
  };

  const submitBtn = document.getElementById("btn-admin-assign-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Assigning Template...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/assign-template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.auth.token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to assign routine template");
    }

    alert(`Successfully assigned template "${tName}" to ${selectedAdminClient.email}!`);
    document.getElementById("modal-admin-client-detail").classList.add("hidden");
    
    // Refresh client counts dynamically
    renderAdminView();

  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Assign Workout Template";
  }
}

async function loadAdminClientHistoryLogs(clientId) {
  const container = document.getElementById("admin-client-logs-list");
  if (!container) return;

  container.innerHTML = '<div class="skeleton-loader" style="margin: 20px auto;"></div>';

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/client/${clientId}/history`, {
      headers: {
        "Authorization": `Bearer ${state.auth.token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load logs");
    }

    const history = data.history || [];
    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state-text" style="padding: 20px 0; text-align: center;">No workouts logged by this client yet.</p>';
      return;
    }

    container.innerHTML = history.map(log => {
      const dateStr = new Date(log.start_time).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const exercisesHtml = log.exercises.map(ex => {
        const exName = state.exercises.find(e => e.id === ex.exerciseId)?.name || ex.exerciseId;
        const setsCount = ex.sets ? ex.sets.length : 0;
        return `
          <div class="admin-client-log-ex-row">
            <span class="admin-client-log-ex-name">${exName}</span>
            <span class="admin-client-log-ex-sets">${setsCount} sets</span>
          </div>
        `;
      }).join("");

      return `
        <div class="admin-client-log-card">
          <div class="admin-client-log-header">
            <h4 class="admin-client-log-title">${log.name}</h4>
            <span class="admin-client-log-date">${dateStr}</span>
          </div>
          <div class="admin-client-log-exercises">
            ${exercisesHtml}
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<p class="empty-state-text" style="color: var(--color-danger); text-align: center; padding: 20px 0;">Error loading logs: ${err.message}</p>`;
  }
}

async function toggleBanClient() {
  if (!selectedAdminClient) return;

  const isBanned = selectedAdminClient.banned === 1;
  const actionText = isBanned ? "unban" : "ban";
  if (!confirm(`Are you sure you want to ${actionText} this client?`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/client/${selectedAdminClient.id}/ban`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.auth.token}`
      },
      body: JSON.stringify({ banned: !isBanned })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update ban status");
    }

    alert(`Successfully ${isBanned ? "unbanned" : "banned"} client!`);
    document.getElementById("modal-admin-client-detail").classList.add("hidden");
    
    // Refresh client list
    renderAdminView();

  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function deleteClientAccount() {
  if (!selectedAdminClient) return;

  if (!confirm(`⚠️ WARNING: Are you sure you want to permanently DELETE ${selectedAdminClient.email}?\nThis will erase all their logged workouts, templates, settings, and profile data from the cloud forever!`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/client/${selectedAdminClient.id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${state.auth.token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete account");
    }

    alert("Client account and all synced data permanently erased!");
    document.getElementById("modal-admin-client-detail").classList.add("hidden");
    
    // Refresh client list
    renderAdminView();

  } catch (err) {
    alert("Error: " + err.message);
  }
}

// --- SUPER ADMIN EXTENSIONS ---
let liveMonitorIntervalId = null;
let lastHeartbeatTime = 0;

function filterAndRenderAdminClients() {
  const q = document.getElementById("input-admin-client-search")?.value.toLowerCase().trim() || "";
  const filterVal = document.getElementById("select-admin-filter")?.value || "all";
  const sortVal = document.getElementById("select-admin-sort")?.value || "newest";

  let filtered = [...adminClients];

  // 1. Search by name or email
  if (q) {
    filtered = filtered.filter(c => {
      const emailMatch = c.email.toLowerCase().includes(q);
      const nameMatch = c.name ? c.name.toLowerCase().includes(q) : false;
      return emailMatch || nameMatch;
    });
  }

  // 2. Filter by status
  if (filterVal === "active") {
    filtered = filtered.filter(c => c.banned !== 1);
  } else if (filterVal === "banned") {
    filtered = filtered.filter(c => c.banned === 1);
  }

  // 3. Sort
  if (sortVal === "newest") {
    filtered.sort((a, b) => b.created_at - a.created_at);
  } else if (sortVal === "active") {
    filtered.sort((a, b) => {
      const timeA = a.last_workout_time || 0;
      const timeB = b.last_workout_time || 0;
      return timeB - timeA;
    });
  }

  renderAdminClientsList(filtered);
}

async function resetClientPassword() {
  if (!selectedAdminClient) return;
  const inputPass = document.getElementById("input-admin-reset-password");
  if (!inputPass) return;
  
  const password = inputPass.value;
  if (!password || password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }
  
  if (!confirm(`Are you sure you want to forcefully reset the password for ${selectedAdminClient.email}?`)) {
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/client/${selectedAdminClient.id}/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.auth.token}`
      },
      body: JSON.stringify({ password })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to reset password");
    }
    
    alert("Password reset successfully!");
    inputPass.value = "";
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function startLiveMonitorPolling() {
  if (liveMonitorIntervalId) clearInterval(liveMonitorIntervalId);
  fetchLiveMonitorData(); // initial fetch
  liveMonitorIntervalId = setInterval(fetchLiveMonitorData, 4000); // refresh every 4s
}

function stopLiveMonitorPolling() {
  if (liveMonitorIntervalId) {
    clearInterval(liveMonitorIntervalId);
    liveMonitorIntervalId = null;
  }
}

async function fetchLiveMonitorData() {
  if (!state.auth || !state.auth.token || !state.auth.isAdmin) return;
  
  try {
    // 1. Fetch online active users
    const onlineRes = await fetch(`${API_BASE_URL}/api/admin/online`, {
      headers: { "Authorization": `Bearer ${state.auth.token}` }
    });
    const onlineData = await onlineRes.json();
    const onlineUsers = onlineData.online || [];
    
    // Render online streams list
    const onlineList = document.getElementById("admin-online-users-list");
    if (onlineList) {
      if (onlineUsers.length === 0) {
        onlineList.innerHTML = '<p class="empty-state-text" style="font-size: 0.75rem; text-align: center; color: var(--text-dark); padding: 15px 0;">No active workout sessions on the network right now.</p>';
      } else {
        onlineList.innerHTML = onlineUsers.map(u => {
          return `
            <div class="active-exercise-card" style="padding: 12px; margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div>
                  <h4 style="font-family: var(--font-heading); font-size: 0.85rem; margin: 0; color: var(--text-main); font-weight: 600;">
                    ${u.name || 'Guest User'} <span style="font-size: 0.7rem; color: var(--text-dark); font-weight: normal;">(${u.email})</span>
                  </h4>
                  <div style="font-size: 0.65rem; color: var(--text-dark); margin-top: 2px;">
                    IP: ${u.ipAddress} | Dev: ${u.deviceInfo}
                  </div>
                </div>
                <span class="badge pulse-dot" style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.6rem; padding: 2px 6px;">● Live</span>
              </div>
              <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-light); border-radius: 8px; padding: 8px; font-size: 0.72rem; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="dumbbell" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                <div>
                  Workout: <strong style="color: var(--text-main);">${u.activeWorkoutName || 'Routine'}</strong><br/>
                  Current: <strong style="color: var(--text-main);">${u.currentExerciseName || 'None'}</strong> (${u.currentMuscle || 'N/A'})
                </div>
              </div>
            </div>
          `;
        }).join("");
        if (window.lucide) window.lucide.createIcons();
      }
    }
    
    // 2. Fetch network activity logs
    const logsRes = await fetch(`${API_BASE_URL}/api/admin/logs`, {
      headers: { "Authorization": `Bearer ${state.auth.token}` }
    });
    const logsData = await logsRes.json();
    const logs = logsData.logs || [];
    
    const logsContainer = document.getElementById("admin-terminal-logs");
    if (logsContainer) {
      if (logs.length === 0) {
        logsContainer.textContent = "[system@bebig.com] Live terminal feed initialized. No activities logged yet.";
      } else {
        logsContainer.textContent = logs.map(l => {
          const timeStr = new Date(l.timestamp).toLocaleTimeString();
          return `[${timeStr}] ${l.message}`;
        }).join("\n");
      }
    }
  } catch (err) {
    console.error("Error loading live monitor feeds:", err);
  }
}

async function sendActiveHeartbeat() {
  if (!state.activeWorkout || !state.auth || !state.auth.token) return;
  
  let currentExName = "No exercises yet";
  let currentMuscleName = "N/A";
  if (state.activeWorkout.exercises && state.activeWorkout.exercises.length > 0) {
    const incompleteEx = state.activeWorkout.exercises.find(e => e.sets && e.sets.some(s => !s.completed));
    const targetEx = incompleteEx || state.activeWorkout.exercises[state.activeWorkout.exercises.length - 1];
    const exDetails = state.exercises.find(e => e.id === targetEx.exerciseId);
    if (exDetails) {
      currentExName = exDetails.name;
      currentMuscleName = exDetails.muscle;
    }
  }
  
  const deviceInfo = window.innerWidth < 768 ? "Mobile App" : "Desktop Browser";
  
  try {
    await fetch(`${API_BASE_URL}/api/sync/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.auth.token}`
      },
      body: JSON.stringify({
        activeWorkoutName: state.activeWorkout.name,
        currentExerciseName: currentExName,
        currentMuscle: currentMuscleName,
        deviceInfo: deviceInfo
      })
    });
  } catch (err) {
    console.error("Heartbeat error:", err);
  }
}

async function submitGlobalBroadcast() {
  const messageInput = document.getElementById("input-admin-broadcast-message");
  const msg = messageInput.value.trim();

  if (!msg) {
    alert("Please enter a broadcast message!");
    return;
  }

  const submitBtn = document.getElementById("btn-admin-broadcast-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.auth.token}`
      },
      body: JSON.stringify({ message: msg })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to publish broadcast");
    }

    alert("Global announcement broadcasted successfully!");
    messageInput.value = "";

  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="send" style="width: 14px; height: 14px;"></i> Send`;
    if (window.lucide) window.lucide.createIcons();
  }
}

function handleBannedUserLogout(msg) {
  const alertMsg = msg || "🚫 Access Blocked: Your account has been banned/disabled by the administrator.";
  
  // Clear credentials
  state.auth = { email: null, token: null, lastSyncTime: 0, isAdmin: false };
  localStorage.removeItem("bebig_guest_mode");
  
  // Reset local cache to clean defaults
  state.exercises = [...DEFAULT_EXERCISES];
  state.templates = [...DEFAULT_TEMPLATES];
  state.history = [];
  state.settings = { unit: "lbs", defaultRest: 90, notificationsEnabled: false, updated_at: 0 };
  
  saveAllState();
  updateCloudUI();
  
  // Re-render all views to empty defaults
  renderHomeView();
  renderStartView();
  renderScheduleView();
  renderHistoryView();
  renderExercisesView();
  loadSettingsView();
  Analytics.calculateAllStats();

  // Show login modal with the session expired / blocked warning
  const authModal = document.getElementById("modal-cloud-auth");
  if (authModal) {
    authModal.classList.remove("hidden");
    const errorMsgEl = document.getElementById("auth-error-msg");
    if (errorMsgEl) {
      errorMsgEl.textContent = alertMsg;
      errorMsgEl.classList.remove("hidden");
    }
    document.getElementById("input-auth-email").value = "";
    document.getElementById("input-auth-password").value = "";
    const nameInput = document.getElementById("input-auth-name");
    if (nameInput) nameInput.value = "";
    switchAuthTab("login");
  }
}

// --- DYNAMIC RELEASE NOTES POPUP ---
const RELEASE_NOTES_DATABASE = {
  "V2.0": {
    version: "V2.0",
    subtitle: "Check out the latest tools added in this update:",
    features: [
      {
        emoji: "📝",
        title: "Exercise Note-Logging Option",
        desc: "Add specific workout notes, details, or tempo cues to any individual exercise card in your active logger, saved persistently to history."
      },
      {
        emoji: "🔃",
        title: "Reorder Workout Sequence",
        desc: "Easily rearrange exercise sequences in the active workout logger using the up and down chevrons in the header."
      },
      {
        emoji: "⏱️",
        title: "Off-screen Rest Timer Fix",
        desc: "Upgraded the rest timer to use absolute target timestamps instead of interval countdowns. Locking your screen or backgrounding the browser will no longer freeze your rest timer!"
      },
      {
        emoji: "📅",
        title: "Workout Schedule Reminders",
        desc: "Get immediate browser notifications when you schedule a template, and daily reminders to train on your workout days."
      }
    ]
  }
};

function showReleaseNotesModal() {
  const modal = document.getElementById("modal-release-notes");
  const listContainer = document.getElementById("release-notes-features-list");
  if (!modal || !listContainer) return;

  const release = RELEASE_NOTES_DATABASE[APP_CURRENT_VERSION] || {
    version: APP_CURRENT_VERSION,
    subtitle: "Check out the latest improvements added in this update:",
    features: [
      {
        emoji: "🚀",
        title: `BeBig ${APP_CURRENT_VERSION} Update`,
        desc: "Performance improvements, stability bug fixes, and optimization updates."
      }
    ]
  };

  // Generate features HTML
  let html = "";
  release.features.forEach(f => {
    html += `
      <div style="display: flex; gap: 14px; align-items: flex-start; text-align: left;">
        <span style="font-size: 1.4rem; line-height: 1; flex-shrink: 0; padding-top: 2px;">${f.emoji}</span>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <h4 style="font-size: 0.86rem; font-weight: 700; color: var(--text-main); margin: 0;">${escapeHTML(f.title)}</h4>
          <p style="font-size: 0.74rem; color: var(--text-muted); margin: 0; line-height: 1.4;">${escapeHTML(f.desc)}</p>
        </div>
      </div>
    `;
  });
  listContainer.innerHTML = html;

  modal.classList.remove("hidden");
  localStorage.setItem("bebig_app_version", APP_CURRENT_VERSION);
}

function runSplashLoadingSequence() {
  const splash = document.getElementById("app-splash-screen");
  const progress = document.querySelector(".splash-loader-progress");
  const status = document.getElementById("splash-status-text");
  
  if (!splash) return;

  const steps = [
    { pct: 25, text: "Loading training database..." },
    { pct: 55, text: "Checking authentication session..." },
    { pct: 85, text: "Connecting to Cloudflare edge..." },
    { pct: 100, text: "Welcome to BeBig!" }
  ];

  let stepIdx = 0;
  
  function nextStep() {
    if (stepIdx >= steps.length) {
      setTimeout(() => {
        splash.classList.add("fade-out");
        
        // After splash screen has faded out, check if user is not authenticated and prompt
        setTimeout(() => {
          splash.classList.add("hidden");

          // Check for version update release notes first!
          const lastSeenVersion = localStorage.getItem("bebig_app_version");
          if (lastSeenVersion !== APP_CURRENT_VERSION) {
            showReleaseNotesModal();
          }
          
          if ((!state.auth || !state.auth.token) && localStorage.getItem("bebig_guest_mode") !== "true") {
            const authModal = document.getElementById("modal-cloud-auth");
            if (authModal) {
              authModal.classList.remove("hidden");
              document.getElementById("auth-error-msg").classList.add("hidden");
              document.getElementById("input-auth-email").value = "";
              document.getElementById("input-auth-password").value = "";
              const nameInput = document.getElementById("input-auth-name");
              if (nameInput) nameInput.value = "";
              switchAuthTab("login");
            }
          }
        }, 600); // Wait for the 0.6s opacity transition to complete
      }, 400);
      return;
    }

    const current = steps[stepIdx];
    if (progress) progress.style.width = `${current.pct}%`;
    if (status) status.textContent = current.text;

    stepIdx++;
    setTimeout(nextStep, 80); // 80ms per step -> super fast splash animation!
  }


  // Start sequence
  nextStep();
}

// ==========================================================================
// 16. AI WORKOUT COACH & PROGRESSIVE OVERLOAD ENGINE
// ==========================================================================

function setupAiCoachAndRecoveryListeners() {
  // 1. AI Coach Modal Trigger
  const btnTrigger = document.getElementById("btn-ai-coach-trigger");
  const modalAiCoach = document.getElementById("modal-ai-coach");
  const btnCloseAiCoach = document.getElementById("btn-close-ai-coach");

  if (btnTrigger && modalAiCoach) {
    btnTrigger.addEventListener("click", () => {
      modalAiCoach.classList.remove("hidden");
      
      // Ensure we start with the form view
      document.getElementById("ai-coach-form").classList.remove("hidden");
      document.getElementById("ai-coach-loading").classList.add("hidden");
      document.getElementById("ai-coach-result").classList.add("hidden");
      currentGeneratedWorkout = null;
    });
  }

  const btnExerciseLibrary = document.getElementById("btn-exercise-library-trigger");
  if (btnExerciseLibrary) {
    btnExerciseLibrary.addEventListener("click", () => {
      switchView("exercises");
    });
  }


  if (btnCloseAiCoach && modalAiCoach) {
    btnCloseAiCoach.addEventListener("click", () => {
      modalAiCoach.classList.add("hidden");
    });
  }

  // 2. AI Coach Generation Submission
  const btnGenerateSubmit = document.getElementById("btn-ai-generate-submit");
  if (btnGenerateSubmit) {
    btnGenerateSubmit.addEventListener("click", async () => {
      const selectGoal = document.getElementById("select-ai-goal");
      const selectSplit = document.getElementById("select-ai-split");
      const selectEquipment = document.getElementById("select-ai-equipment");
      const selectExperience = document.getElementById("select-ai-experience");
      const selectDuration = document.getElementById("select-ai-duration");
      const inputCustomPrompt = document.getElementById("input-ai-custom-prompt");

      const goal = selectGoal ? selectGoal.value : "";
      const split = selectSplit ? selectSplit.value : "";
      const equipment = selectEquipment ? selectEquipment.value : "";
      const experience = selectExperience ? selectExperience.value : "";
      const duration = selectDuration ? selectDuration.value : "";
      const customPrompt = inputCustomPrompt ? inputCustomPrompt.value.trim() : "";

      // Show loading UI
      document.getElementById("ai-coach-form").classList.add("hidden");
      document.getElementById("ai-coach-loading").classList.remove("hidden");
      document.getElementById("ai-coach-result").classList.add("hidden");

      // Random fitness loading quote
      const FITNESS_QUOTES = [
        "\"The iron never lies to you.\" — Henry Rollins",
        "\"No citizen has a right to be an amateur in the matter of physical training.\" — Socrates",
        "\"We are what we repeatedly do. Excellence, then, is not an act, but a habit.\" — Aristotle",
        "\"If you want something you've never had, you must be willing to do something you've never done.\"",
        "\"Success isn't always about greatness. It's about consistency.\"",
        "\"Energy and persistence conquer all things.\" — Benjamin Franklin"
      ];
      const quoteEl = document.getElementById("ai-loading-quote");
      if (quoteEl) {
        quoteEl.textContent = FITNESS_QUOTES[Math.floor(Math.random() * FITNESS_QUOTES.length)];
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ goal, split, equipment, experience, duration, customPrompt })
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.workout) {
          throw new Error(data.error || "Empty response from coach API");
        }

        currentGeneratedWorkout = data.workout;

        // Populate results UI
        document.getElementById("ai-result-workout-name").textContent = currentGeneratedWorkout.name || "AI Generated Workout";
        document.getElementById("ai-result-workout-notes").textContent = currentGeneratedWorkout.notes || "";

        const listContainer = document.getElementById("ai-result-exercises-list");
        listContainer.innerHTML = "";

        if (Array.isArray(currentGeneratedWorkout.exercises)) {
          currentGeneratedWorkout.exercises.forEach(ex => {
            const item = document.createElement("div");
            item.style.background = "rgba(255, 255, 255, 0.02)";
            item.style.border = "1px solid var(--border-light)";
            item.style.borderRadius = "8px";
            item.style.padding = "10px 12px";
            item.style.display = "flex";
            item.style.justifyContent = "space-between";
            item.style.alignItems = "center";

            const setsCount = ex.sets ? ex.sets.length : 0;
            const repsInfo = setsCount > 0 ? `${setsCount} sets × ${ex.sets[0].reps} reps` : "No sets";
            const weightInfo = setsCount > 0 && ex.sets[0].weight ? `@ ${ex.sets[0].weight} ${state.settings.unit || 'lbs'}` : "";

            item.innerHTML = `
              <div>
                <h5 style="margin: 0; color: var(--text-main); font-weight: 700; font-size: 0.85rem;">${ex.name}</h5>
                <span style="font-size: 0.65rem; color: var(--text-muted);">${ex.muscle || "General"} • ${ex.category || "Exercise"}</span>
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.8rem;">${repsInfo}</span>
                <span style="display: block; font-size: 0.65rem; color: var(--text-muted);">${weightInfo}</span>
              </div>
            `;
            listContainer.appendChild(item);
          });
        }

        document.getElementById("ai-coach-loading").classList.add("hidden");
        document.getElementById("ai-coach-result").classList.remove("hidden");
        if (window.lucide) window.lucide.createIcons();
      } catch (err) {
        alert("AI Generation failed: " + err.message);
        // Reset view back to parameters form
        document.getElementById("ai-coach-loading").classList.add("hidden");
        document.getElementById("ai-coach-form").classList.remove("hidden");
      }
    });
  }

  // 3. Reset preview and form
  const btnReset = document.getElementById("btn-ai-result-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      document.getElementById("ai-coach-result").classList.add("hidden");
      document.getElementById("ai-coach-form").classList.remove("hidden");
      currentGeneratedWorkout = null;
    });
  }

  // 4. Save to Library
  const btnSave = document.getElementById("btn-ai-result-save");
  if (btnSave) {
    btnSave.addEventListener("click", () => {
      if (!currentGeneratedWorkout) return;

      const exercisesMapped = currentGeneratedWorkout.exercises.map(ex => {
        let existingEx = state.exercises.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
        let exId;
        if (existingEx) {
          exId = existingEx.id;
        } else {
          exId = "custom-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          const newEx = {
            id: exId,
            name: ex.name,
            muscle: ex.muscle || "Chest",
            category: ex.category || "Dumbbell",
            instructions: "Generated by AI Coach.",
            updated_at: Date.now(),
            deleted: 0,
            dirty: 1
          };
          state.exercises.push(newEx);
        }

        const mappedSets = ex.sets.map(s => ({
          type: s.type || "N",
          weight: s.weight || 0,
          reps: s.reps || 10
        }));

        return {
          exerciseId: exId,
          sets: mappedSets
        };
      });

      const newTmpl = {
        id: "template-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        name: currentGeneratedWorkout.name || "AI Generated Workout",
        notes: currentGeneratedWorkout.notes || "",
        exercises: exercisesMapped,
        updated_at: Date.now(),
        deleted: 0,
        dirty: 1
      };

      state.templates.push(newTmpl);
      saveAllState();

      // Reset modal inputs and states
      document.getElementById("modal-ai-coach").classList.add("hidden");
      document.getElementById("ai-coach-result").classList.add("hidden");
      document.getElementById("ai-coach-form").classList.remove("hidden");
      currentGeneratedWorkout = null;

      alert("Workout saved to Library!");
      renderStartView();

      if (state.auth && state.auth.token) {
        syncData(true);
      }
    });
  }

  // 5. Recovery modal buttons options toggles
  const recoveryCards = document.querySelectorAll(".recovery-option-card");
  recoveryCards.forEach(card => {
    card.addEventListener("click", () => {
      recoveryCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
    });
  });

  // 6. Recovery Close
  const btnCloseRecovery = document.getElementById("btn-close-recovery-check");
  if (btnCloseRecovery) {
    btnCloseRecovery.addEventListener("click", () => {
      document.getElementById("modal-recovery-check").classList.add("hidden");
      pendingTemplateId = null;
    });
  }

  // 7. Confirm Recovery & Launch Session
  const btnConfirmRecovery = document.getElementById("btn-confirm-recovery-start");
  if (btnConfirmRecovery) {
    btnConfirmRecovery.addEventListener("click", () => {
      const activeOption = document.querySelector(".recovery-option-card.active");
      const fatigue = activeOption ? activeOption.dataset.fatigue : "none";
      initializeWorkoutSession(pendingTemplateId, fatigue);
    });
  }
}

function initWorkoutTextParser() {
  const btnOpen = document.getElementById("btn-import-text-template");
  const modal = document.getElementById("modal-workout-parser");
  const btnClose = document.getElementById("btn-close-workout-parser");
  const btnCancel = document.getElementById("btn-cancel-parser");
  const btnSubmit = document.getElementById("btn-submit-parser");
  const textInput = document.getElementById("input-parser-text");

  if (!modal) return;

  if (btnOpen) {
    btnOpen.addEventListener("click", () => {
      textInput.value = "";
      modal.classList.remove("hidden");
    });
  }

  const closeModal = () => {
    modal.classList.add("hidden");
  };

  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  if (btnSubmit) {
    btnSubmit.addEventListener("click", () => {
      const text = textInput.value.trim();
      if (!text) {
        alert("Please paste some workout text first!");
        return;
      }

      const template = parseWorkoutText(text);
      if (!template || template.exercises.length === 0) {
        alert("Could not identify any exercises. Please check your text format.");
        return;
      }

      state.templates.push(template);
      saveAllState();
      
      closeModal();
      renderStartView();

      if (state.auth && state.auth.token) {
        syncData(true);
      }

      showToast("Workout template imported successfully!");
    });
  }
}

function parseWorkoutText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let templateName = "Imported Workout";
  let exercises = [];
  let currentExercise = null;

  const MUSCLE_HEADERS = [
    "chest", "back", "legs", "shoulders", "arms", "triceps", "biceps", "core", 
    "push", "pull", "legs", "cardio", "warmup", "cooldown", "abs", "quads", 
    "hams", "calves", "glutes", "forearms"
  ];

  // Check if first line is a title (doesn't start with numbers, doesn't contain sets/reps keywords)
  if (lines[0] && !/^\d/.test(lines[0]) && !/set/i.test(lines[0]) && !/rep/i.test(lines[0])) {
    templateName = lines[0].replace(/[:\-#]/g, '').trim();
    // Capitalize title
    templateName = templateName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    lines.shift();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if the line describes sets and reps (support multiplication sign \xD7, \u00d7, and ×)
    const setRepRegex = /(\d+)\s*(?:sets?|x|[\xD7\u00d7×])\s*[\x25\xD7x*-]?\s*(\d+(?:[\x25\xD7x*–-]\d+)?)?/i;
    const match = line.match(setRepRegex);

    if (match && currentExercise) {
      const setsCount = parseInt(match[1], 10);
      const repsStr = match[2] ? match[2].trim() : "";
      
      let repsVal = 10;
      if (repsStr) {
        const parts = repsStr.split(/[\x25\xD7x*–-]/);
        if (parts.length > 0) {
          repsVal = parseInt(parts[parts.length - 1], 10) || 10;
        }
      }

      currentExercise.sets = Array.from({ length: setsCount }, () => ({
        type: "N",
        weight: "",
        reps: repsVal
      }));
    } else {
      // It's a new exercise line!
      // Strip out numbering like "1. ", "2)", "A) ", "- "
      const cleanName = line.replace(/^\d+[\s.)\-–:]+/, '').replace(/^[*+\-–•]\s+/, '').trim();
      
      // Skip metadata, instructions, rest notes, tempo notes, muscle group headers, or empty symbol dividers
      const lowerClean = cleanName.toLowerCase();
      if (!cleanName || 
          /sets?/i.test(cleanName) || 
          /reps?/i.test(cleanName) || 
          /^(rest|tempo|note|focus|warmup|coaching|intensity|instructions?):/i.test(cleanName) ||
          /^(rest|tempo|warmup)\b/i.test(cleanName) ||
          MUSCLE_HEADERS.includes(lowerClean) ||
          !/[a-zA-Z]/.test(cleanName)) {
        continue;
      }

      // Search database for matching exercise
      let matchedId = null;
      const dbMatches = state.exercises.filter(ex => !ex.deleted);
      
      // 1. Exact name match
      let matchEx = dbMatches.find(ex => ex.name.toLowerCase() === cleanName.toLowerCase());
      
      // 2. Substring match
      if (!matchEx) {
        matchEx = dbMatches.find(ex => ex.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(ex.name.toLowerCase()));
      }

      // 3. Fuzzy match: common word intersection
      if (!matchEx) {
        const cleanWords = cleanName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (cleanWords.length > 0) {
          matchEx = dbMatches.find(ex => {
            const nameLower = ex.name.toLowerCase();
            return cleanWords.every(word => nameLower.includes(word));
          });
        }
      }

      if (matchEx) {
        matchedId = matchEx.id;
      } else {
        // Create custom exercise on-the-fly
        const customId = `custom-${crypto.randomUUID()}`;
        const newEx = {
          id: customId,
          name: cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
          muscle: "Other",
          category: "Other",
          instructions: "Custom exercise imported from text parser.",
          updated_at: Date.now(),
          deleted: 0,
          dirty: 1
        };
        state.exercises.push(newEx);
        matchedId = customId;
      }

      currentExercise = {
        exerciseId: matchedId,
        importedName: cleanName,
        sets: [] // Empty if no sets line follows (user requested: if sets are not there keep it empty)
      };
      exercises.push(currentExercise);
    }
  }

  return {
    id: "template-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    name: templateName,
    notes: "Imported via Workout Parser.",
    exercises,
    updated_at: Date.now(),
    deleted: 0,
    dirty: 1
  };
}



