/**
 * BeBig - Premium Workout Tracker JS Engine
 * Core architectural logic, state manager, logging engine, and UI renderer.
 */

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

function initStore() {
  state.exercises = store.get("exercises", DEFAULT_EXERCISES);
  state.templates = store.get("templates", DEFAULT_TEMPLATES);
  state.history = store.get("history", []);
  state.activeWorkout = store.get("activeWorkout", null);
  state.settings = store.get("settings", { unit: "lbs", defaultRest: 90, notificationsEnabled: false });
  state.auth = store.get("auth", { email: null, token: null, lastSyncTime: 0 });
  state.schedule = store.get("bebig_schedule", {
    "Mon": null,
    "Tue": null,
    "Wed": null,
    "Thu": null,
    "Fri": null,
    "Sat": null,
    "Sun": null
  });

  // Ensure all entities have sync properties
  state.exercises.forEach(ex => {
    if (ex.updated_at === undefined) ex.updated_at = 0;
    if (ex.deleted === undefined) ex.deleted = 0;
  });
  state.templates.forEach(t => {
    if (t.updated_at === undefined) t.updated_at = 0;
    if (t.deleted === undefined) t.deleted = 0;
  });
  state.history.forEach(h => {
    if (h.updated_at === undefined) h.updated_at = 0;
    if (h.deleted === undefined) h.deleted = 0;
  });
  if (state.settings.notificationsEnabled === undefined) {
    state.settings.notificationsEnabled = false;
  }
  if (state.settings.updated_at === undefined) {
    state.settings.updated_at = 0;
  }
}

function saveAllState() {
  store.set("exercises", state.exercises);
  store.set("templates", state.templates);
  store.set("history", state.history);
  store.set("activeWorkout", state.activeWorkout);
  store.set("settings", state.settings);
  store.set("auth", state.auth);
  store.set("bebig_schedule", state.schedule);
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
let restTimeRemaining = 0;

const RestTimer = {
  start(seconds) {
    this.stop();
    SoundSynth.init(); // Warm up audio context on user interaction
    restTotalDuration = seconds;
    restTimeRemaining = seconds;

    const overlay = document.getElementById("rest-timer-overlay");
    if (overlay) overlay.classList.remove("hidden");

    this.tick();
    restTimerId = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const textEl = document.getElementById("rest-countdown-text");
    const ring = document.getElementById("timer-progress-ring");

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

    restTimeRemaining--;
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
    restTimeRemaining = Math.max(0, restTimeRemaining + sec);
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
              color: "#94a3b8",
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
      if (sets <= 3) return "rgba(59, 130, 246, 0.35)";
      if (sets <= 8) return "rgba(59, 130, 246, 0.75)";
      return "#00f2fe"; // Neon glowing cyan
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
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
            labels: { color: '#9ca3af', font: { family: 'Inter', size: 10 } },
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }
          },
          y1: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(255,255,255,0.05)' },
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

// ==========================================================================
// 8. ACTIVE WORKOUT LOGGER & CONTROL ENGINE
// ==========================================================================

function startWorkoutSession(templateId = null) {
  // If a workout is already active, prompt to finish it
  if (state.activeWorkout) {
    const restoreBtn = document.getElementById("btn-restore-workout");
    if (restoreBtn) restoreBtn.click();
    return;
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
        // For previous values, lookup this exercise in completed history
        const previousString = getPreviousSetStatsString(ex.exerciseId);
        
        return {
          exerciseId: ex.exerciseId,
          sets: ex.sets.map((s, idx) => ({
            id: `set-${Date.now()}-${idx}-${Math.random()}`,
            type: s.type || "N",
            weight: s.weight,
            reps: s.reps,
            completed: false,
            previous: previousString
          }))
        };
      });
    }
  }

  // Create active workout state
  state.activeWorkout = {
    name: workoutName,
    notes: workoutNotes,
    startTime: Date.now(),
    exercises: exercisesToLoad
  };

  saveAllState();
  renderActiveWorkoutUI();
  
  // Set UI input values
  document.getElementById("input-workout-name").value = workoutName;
  document.getElementById("input-workout-notes").value = workoutNotes;
  
  // Toggle screens
  document.getElementById("workout-panel").classList.remove("minimized");
  document.getElementById("workout-panel").classList.add("open");
  document.getElementById("mini-workout-bar").classList.add("hidden");

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
      
      rowsHTML += `
        <tr class="set-table-row ${isCompleted ? 'completed' : ''}" data-set-index="${setIdx}">
          <td>
            <button class="set-type-tag ${set.type}" title="Set Type: Warmup, Drop, Failure, Normal" data-action="toggle-set-type">
              ${typeDisplay}
            </button>
          </td>
          <td class="set-previous">${set.previous || '—'}</td>
          <td class="set-input-cell">
            <input type="number" class="input-set-weight" placeholder="0" min="0" step="any" value="${set.weight !== undefined ? set.weight : ''}" data-field="weight">
          </td>
          <td class="set-input-cell">
            <input type="number" class="input-set-reps" placeholder="0" min="0" value="${set.reps !== undefined ? set.reps : ''}" data-field="reps">
          </td>
          <td>
            <div class="set-checkmark" data-action="toggle-complete">
              <i data-lucide="check"></i>
            </div>
          </td>
          <td>
            <button class="btn-delete-set" data-action="delete-set" title="Delete set">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    });

    card.innerHTML = `
      <div class="active-exercise-header">
        <div class="active-exercise-title-container">
          <h4 class="active-exercise-title">${exName}</h4>
          <span class="badge" style="font-size:0.65rem;">${exDetails ? exDetails.muscle : 'Muscle'}</span>
        </div>
        <div class="active-exercise-actions">
          <button class="btn-icon-only-flat" data-action="open-plate-calc" title="Plate Calculator">
            <i data-lucide="calculator" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="btn-icon-only-flat" data-action="remove-exercise" title="Remove exercise from workout">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
      
      <table class="set-table">
        <thead>
          <tr class="set-table-header">
            <th>Set</th>
            <th>Prev</th>
            <th>Weight</th>
            <th>Reps</th>
            <th><i data-lucide="check" style="width:12px;height:12px;margin:0 auto;stroke-width:3;"></i></th>
            <th></th>
          </tr>
        </thead>
        <tbody class="sets-tbody">
          ${rowsHTML}
        </tbody>
      </table>

      <button class="btn-add-set" data-action="add-set">
        <i data-lucide="plus"></i> Add Set
      </button>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
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

    if (action === "toggle-complete") {
      // Weight & Rep validation
      const weightInput = row.querySelector(".input-set-weight");
      const repsInput = row.querySelector(".input-set-reps");
      const weight = parseFloat(weightInput.value) || 0;
      const reps = parseInt(repsInput.value) || 0;

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
      let newWeight = 0;
      let newReps = 0;
      let newType = "N";

      if (setLength > 0) {
        const lastSet = activeEx.sets[setLength - 1];
        newWeight = lastSet.weight || 0;
        newReps = lastSet.reps || 0;
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
  if (!input.classList.contains("input-set-weight") && !input.classList.contains("input-set-reps")) return;

  const card = input.closest(".active-exercise-card");
  const row = input.closest(".set-table-row");
  if (!card || !row) return;

  const exIdx = parseInt(card.dataset.index);
  const setIdx = parseInt(row.dataset.setIndex);
  const field = input.dataset.field;
  
  if (state.activeWorkout && state.activeWorkout.exercises[exIdx]) {
    const set = state.activeWorkout.exercises[exIdx].sets[setIdx];
    if (field === "weight") {
      set.weight = parseFloat(input.value) || 0;
    } else if (field === "reps") {
      set.reps = parseInt(input.value) || 0;
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
      existing.sets.push({
        id: `set-${Date.now()}-${existing.sets.length}-${Math.random()}`,
        type: "N",
        weight: existing.sets[0]?.weight || 0,
        reps: existing.sets[0]?.reps || 0,
        completed: false,
        previous: prevStr
      });
    } else {
      state.activeWorkout.exercises.push({
        exerciseId: id,
        sets: [
          { id: `set-${Date.now()}-0-${Math.random()}`, type: "N", weight: 0, reps: 0, completed: false, previous: prevStr },
          { id: `set-${Date.now()}-1-${Math.random()}`, type: "N", weight: 0, reps: 0, completed: false, previous: prevStr },
          { id: `set-${Date.now()}-2-${Math.random()}`, type: "N", weight: 0, reps: 0, completed: false, previous: prevStr }
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
      sets: ex.sets.filter(s => s.completed) // only save completed sets in history
    })).filter(ex => ex.sets.length > 0), // only save exercises with completed sets
    updated_at: Date.now(),
    deleted: 0
  };

  // Push to history
  state.history.push(completedWorkout);
  
  // Clear active workout
  state.activeWorkout = null;
  saveAllState();
  stopWorkoutTimer();

  // Reset overlays
  document.getElementById("workout-panel").classList.remove("open");
  document.getElementById("workout-panel").classList.remove("minimized");
  document.getElementById("mini-workout-bar").classList.add("hidden");

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

function cancelActiveWorkout() {
  if (confirm("Are you sure you want to discard this workout? All logged sets will be lost.")) {
    state.activeWorkout = null;
    saveAllState();
    stopWorkoutTimer();

    document.getElementById("workout-panel").classList.remove("open");
    document.getElementById("workout-panel").classList.remove("minimized");
    document.getElementById("mini-workout-bar").classList.add("hidden");
    
    // Switch to workouts view
    switchView("workouts");
  }
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

  // Update profile avatar
  const avatar = document.getElementById("home-profile-avatar");
  if (avatar) {
    if (state.settings.profilePhoto) {
      avatar.innerHTML = `<img src="${state.settings.profilePhoto}" alt="Avatar">`;
    } else {
      const emailName = state.auth.email ? state.auth.email.split('@')[0] : "Adi";
      const initials = emailName.slice(0, 2).toUpperCase();
      avatar.innerHTML = `<span id="home-avatar-initials">${initials}</span>`;
    }
  }

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
    const name = state.auth.email ? state.auth.email.split('@')[0].split('.')[0] : "Adi";
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    greetingTitle.innerHTML = `${timeGreeting},<br><span style="background: linear-gradient(135deg, #d4fc34 0%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${displayName}</span>`;
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

  // Populate Weekly Dot Calendar
  const dotsContainer = document.getElementById("home-weekly-dots");
  if (dotsContainer) {
    const daysAbbrev = ["S", "M", "T", "W", "T", "F", "S"];
    const today = new Date();
    const dots = dotsContainer.querySelectorAll(".week-dot");
    
    dots.forEach(dot => {
      const offset = parseInt(dot.dataset.offset) || 0;
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - offset);
      targetDate.setHours(0, 0, 0, 0);

      const label = dot.querySelector("span");
      if (label) {
        label.textContent = daysAbbrev[targetDate.getDay()];
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
    const totalExercises = template.exercises.length;
    const totalSets = template.exercises.reduce((sum, ex) => sum + (ex.sets ? ex.sets.length : 0), 0);

    // Extract unique muscles
    const musclesMap = {};
    template.exercises.forEach(ex => {
      const det = state.exercises.find(e => e.id === ex.exerciseId);
      if (det && det.muscle) {
        musclesMap[det.muscle] = true;
      }
    });
    const targetedMuscles = Object.keys(musclesMap);

    // Build names of exercises in template as capsule tags (max 4)
    const maxToShow = 4;
    const tags = template.exercises.slice(0, maxToShow).map(ex => {
      const det = state.exercises.find(e => e.id === ex.exerciseId);
      return det ? `<span class="template-exercise-tag">${det.name}</span>` : "";
    }).filter(Boolean);

    if (template.exercises.length > maxToShow) {
      tags.push(`<span class="template-exercise-tag more">+${template.exercises.length - maxToShow} more</span>`);
    }

    const tagsHTML = tags.length > 0 ? tags.join("") : '<span class="template-exercise-tag">No exercises</span>';

    // Muscle group badges
    let musclesHTML = "";
    if (targetedMuscles.length > 0) {
      const badges = targetedMuscles.map(muscle => {
        const muscleClean = muscle.toLowerCase().replace(/\s+/g, '-');
        const badgeClass = `primary-muscle-badge ${muscleClean}`;
        return `<span class="${badgeClass}" style="font-size: 0.58rem; padding: 2px 6px; border-radius: 4px;">${muscle}</span>`;
      });
      musclesHTML = `<div class="template-card-muscle-badges">${badges.join(" ")}</div>`;
    }

    card.innerHTML = `
      <div class="template-card-header">
        <div>
          <span class="template-card-title">${template.name}</span>
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
      <div class="template-card-exercises">${tagsHTML}</div>
      ${template.notes ? `<div class="template-card-notes">${template.notes}</div>` : ''}
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
      ? `<span class="badge primary-muscle-badge ${primaryMuscle.toLowerCase()}">${primaryMuscle}</span>` 
      : '';

    const card = document.createElement("div");
    card.className = "history-card";
    
    let exerciseLinesHTML = "";
    w.exercises.forEach(ex => {
      const det = state.exercises.find(e => e.id === ex.exerciseId);
      const name = det ? det.name : "Exercise";
      const setsStr = ex.sets.map(s => `${s.weight}×${s.reps}`).join(", ");
      
      exerciseLinesHTML += `
        <div class="history-exercise-line">
          <strong class="history-exercise-name">${name}</strong> — ${ex.sets.length} sets (${setsStr})
        </div>
      `;
    });

    card.innerHTML = `
      <div class="history-card-header">
        <div class="history-card-title-box">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3>${w.name}</h3>
            ${muscleBadge}
          </div>
          <span class="history-card-date">${dateStr}</span>
        </div>
        <button class="btn-card-action" data-action="delete-history" data-id="${w.id}" title="Delete Log" style="position: absolute; right: 12px; top: 12px;">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>

      <div class="history-card-stats">
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

      <div class="history-card-exercises">
        ${exerciseLinesHTML}
      </div>
    `;

    container.appendChild(card);
  });

  // Attach delete click handlers
  container.querySelectorAll('[data-action="delete-history"]').forEach(btn => {
    btn.addEventListener("click", () => {
      deleteHistoryItem(btn.dataset.id);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function deleteHistoryItem(id) {
  if (confirm("Are you sure you want to delete this workout log?")) {
    const item = state.history.find(w => w.id === id);
    if (item) {
      item.deleted = 1;
      item.updated_at = Date.now();
      saveAllState();
      renderHistoryView(document.getElementById("input-history-search").value);
      Analytics.calculateAllStats();
    }
  }
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
    
    const categoryBadge = `<span class="exercise-cat-tag ${ex.category.toLowerCase()}">${ex.category}</span>`;
    
    item.innerHTML = `
      <div class="exercise-item-content">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="exercise-item-name">${ex.name}</span>
          ${categoryBadge}
        </div>
        <span class="exercise-item-muscle">${ex.muscle}</span>
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
        <span class="exercise-item-name">${ex.name}</span>
        <span class="exercise-item-muscle">${ex.muscle} • ${ex.category}</span>
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

  // Create unique ID
  const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

  // Check if exists
  if (state.exercises.some(ex => ex.id === id || ex.name.toLowerCase() === name.toLowerCase())) {
    alert("An exercise with this name already exists!");
    return;
  }

  const newEx = {
    id: id,
    name: name,
    muscle: muscleEl.value,
    category: catEl.value,
    instructions: instEl.value.trim(),
    updated_at: Date.now(),
    deleted: 0
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
}

// --- TEMPLATE EDITOR MODAL (Create/Edit workout template) ---
let templateEditorId = null; // if null, creating. if string, editing templateId
let templateEditorExercises = []; // exercises loaded in editor

function openTemplateEditor(templateId = null) {
  templateEditorId = templateId;
  templateEditorExercises = [];

  const modal = document.getElementById("modal-template-editor");
  const title = document.getElementById("template-editor-title");
  const nameInput = document.getElementById("input-template-name");
  const notesInput = document.getElementById("input-template-notes");
  const deleteBtn = document.getElementById("btn-delete-template-editor");
  const saveBtn = document.getElementById("btn-save-template");
  
  if (!modal) return;

  modal.classList.remove("hidden");

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
        <tr class="set-table-row" data-set-index="${setIdx}">
          <td>
            <button class="set-type-tag ${set.type}" data-action="toggle-editor-set-type">
              ${typeDisplay}
            </button>
          </td>
          <td class="set-input-cell">
            <input type="number" class="input-set-weight" placeholder="0" min="0" value="${set.weight || ''}" data-field="weight">
          </td>
          <td class="set-input-cell">
            <input type="number" class="input-set-reps" placeholder="0" min="0" value="${set.reps || ''}" data-field="reps">
          </td>
          <td>
            <button class="btn-delete-set" data-action="delete-editor-set" title="Delete set">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    });

    const currentUnit = state.settings.unit || "lbs";

    card.innerHTML = `
      <div class="active-exercise-header">
        <div>
          <h4 class="active-exercise-title">${exName}</h4>
          <span class="badge" style="font-size:0.65rem;">${exDetails ? exDetails.muscle : 'Muscle'}</span>
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
      
      <table class="set-table">
        <thead>
          <tr class="set-table-editor-header">
            <th>Set</th>
            <th>Weight (${currentUnit})</th>
            <th>Reps</th>
            <th></th>
          </tr>
        </thead>
        <tbody class="sets-tbody-editor">
          <!-- Dynamically loaded -->
        </tbody>
      </table>

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
      let newWeight = 0;
      let newReps = 0;
      let newType = "N";

      if (setLength > 0) {
        newWeight = activeEx.sets[setLength - 1].weight || 0;
        newReps = activeEx.sets[setLength - 1].reps || 0;
        newType = activeEx.sets[setLength - 1].type || "N";
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
      activeEx.sets[setIdx].weight = parseFloat(input.value) || 0;
    } else if (field === "reps") {
      activeEx.sets[setIdx].reps = parseInt(input.value) || 0;
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
    sets: ex.sets.map(s => ({
      type: s.type || "N",
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps) || 0
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
    }
  } else {
    // Create new template
    const newTmpl = {
      id: `template-${Date.now()}`,
      name: name,
      notes: notesInput.value.trim(),
      exercises: sanitizedExercises,
      updated_at: Date.now(),
      deleted: 0
    };
    state.templates.push(newTmpl);
  }

  saveAllState();
  renderStartView();

  // Close modal
  document.getElementById("modal-template-editor").classList.add("hidden");
}

function deleteWorkoutTemplate(templateId) {
  if (confirm("Are you sure you want to delete this template?")) {
    const tmpl = state.templates.find(t => t.id === templateId);
    if (tmpl) {
      tmpl.deleted = 1;
      tmpl.updated_at = Date.now();
      saveAllState();
      renderStartView();
    }
  }
}

// ==========================================================================
// 11. VIEW CONTROLLER (SPA TAB VIEW ROUTER)
// ==========================================================================

function switchView(viewName) {
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
    } else {
      panel.classList.remove("active");
    }
  });

  // Trigger view renderers
  if (viewName === "home") renderHomeView();
  else if (viewName === "workouts") renderStartView();
  else if (viewName === "schedule") renderScheduleView();
  else if (viewName === "history") renderHistoryView();
  else if (viewName === "exercises") renderExercisesView();
  else if (viewName === "analytics") Analytics.calculateAllStats();
  else if (viewName === "settings") loadSettingsView();
}

function loadSettingsView() {
  // Update unit selectors
  const isLbs = state.settings.unit === "lbs";
  document.getElementById("btn-unit-lbs").classList.toggle("active", isLbs);
  document.getElementById("btn-unit-kg").classList.toggle("active", !isLbs);
  
  // Update default rest timer duration dropdown
  document.getElementById("select-default-rest").value = state.settings.defaultRest;

  // Update notifications toggle state
  const notifEnabled = state.settings.notificationsEnabled === true;
  document.getElementById("btn-notif-on").classList.toggle("active", notifEnabled);
  document.getElementById("btn-notif-off").classList.toggle("active", !notifEnabled);
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
  // Initialize state
  initStore();
  setupMuscleFilters();
  initCustomExerciseModal();
  
  // Asynchronously load the 1300+ ExerciseDB database
  loadExercisesDatabase();
  
  // Render current view
  renderHomeView();

  // --- HOME VIEW BINDINGS ---
  const homeBtnStart = document.getElementById("home-btn-start-workout");
  if (homeBtnStart) {
    homeBtnStart.addEventListener("click", () => {
      startWorkoutSession();
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

  const bannerAdd = document.getElementById("btn-banner-add");
  if (bannerAdd) {
    bannerAdd.addEventListener("click", () => {
      const url = prompt("Enter profile image URL:");
      if (url) {
        state.settings.profilePhoto = url;
        saveAllState();
        renderHomeView();
      }
    });
  }

  // Save weight modal binding
  const btnSaveWeight = document.getElementById("btn-save-weight");
  if (btnSaveWeight) {
    btnSaveWeight.addEventListener("click", () => {
      const weightVal = parseFloat(document.getElementById("input-log-weight-value").value);
      if (weightVal && weightVal > 0) {
        state.settings.currentWeight = weightVal;
        saveAllState();
        renderHomeView();
        document.getElementById("modal-log-weight").classList.add("hidden");
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
    document.getElementById("mini-workout-bar").classList.remove("hidden");
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
      if (modal) modal.classList.add("hidden");
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
    searchHistoryInput.addEventListener("input", (e) => {
      renderHistoryView(e.target.value);
    });
  }

  // --- EXERCISES VIEW BINDINGS ---
  const searchExerciseInput = document.getElementById("input-exercise-search");
  if (searchExerciseInput) {
    searchExerciseInput.addEventListener("input", (e) => {
      renderExercisesView(e.target.value);
    });
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
    });
  }

  if (btnKg) {
    btnKg.addEventListener("click", () => {
      state.settings.unit = "kg";
      state.settings.updated_at = Date.now();
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
    });
  }

  const selectRest = document.getElementById("select-default-rest");
  if (selectRest) {
    selectRest.addEventListener("change", (e) => {
      state.settings.defaultRest = parseInt(e.target.value) || 90;
      state.settings.updated_at = Date.now();
      saveAllState();
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
        wPanel.classList.remove("minimized");
        wPanel.classList.add("open");
      }
      if (miniBar) miniBar.classList.add("hidden");
    });
  }

  const btnMinimize = document.getElementById("btn-minimize-workout");
  if (btnMinimize) {
    btnMinimize.addEventListener("click", () => {
      if (wPanel) {
        wPanel.classList.remove("open");
        wPanel.classList.add("minimized");
      }
      if (miniBar) miniBar.classList.remove("hidden");
    });
  }

  const btnRestore = document.getElementById("btn-restore-workout");
  if (btnRestore) {
    btnRestore.addEventListener("click", () => {
      if (wPanel) {
        wPanel.classList.remove("minimized");
        wPanel.classList.add("open");
      }
      if (miniBar) miniBar.classList.add("hidden");
    });
  }

  const panelDragHeader = document.querySelector(".panel-header-bar");
  if (panelDragHeader) {
    panelDragHeader.addEventListener("click", () => {
      if (wPanel) {
        if (wPanel.classList.contains("open")) {
          wPanel.classList.remove("open");
          wPanel.classList.add("minimized");
          if (miniBar) miniBar.classList.remove("hidden");
        } else {
          wPanel.classList.remove("minimized");
          wPanel.classList.add("open");
          if (miniBar) miniBar.classList.add("hidden");
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
    modalSearch.addEventListener("input", (e) => {
      renderSelectorList(e.target.value);
    });
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
        document.getElementById("modal-template-editor").classList.add("hidden");
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
              sets: [{ type: "N", weight: 0, reps: 0 }, { type: "N", weight: 0, reps: 0 }, { type: "N", weight: 0, reps: 0 }]
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
  
  // Auto sync if user is logged in
  if (state.auth && state.auth.token) {
    syncData();
  }

  // --- CLOUD SYNC & AUTH BINDINGS ---
  const btnCloudAccount = document.getElementById("btn-cloud-account");
  if (btnCloudAccount) {
    btnCloudAccount.addEventListener("click", () => {
      if (state.auth && state.auth.token) {
        if (confirm("Are you sure you want to log out from BeBig Cloud?")) {
          // Clear credentials
          state.auth = { email: null, token: null, lastSyncTime: 0 };
          
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
        }
      } else {
        document.getElementById("modal-cloud-auth").classList.remove("hidden");
        document.getElementById("auth-error-msg").classList.add("hidden");
        document.getElementById("input-auth-email").value = "";
        document.getElementById("input-auth-password").value = "";
        switchAuthTab("login");
      }
    });
  }

  const btnCloseCloudAuth = document.getElementById("btn-close-cloud-auth");
  if (btnCloseCloudAuth) {
    btnCloseCloudAuth.addEventListener("click", () => {
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
        saveAllState();
      }
    });

    btnNotifOff.addEventListener("click", () => {
      state.settings.notificationsEnabled = false;
      btnNotifOff.classList.add("active");
      btnNotifOn.classList.remove("active");
      state.settings.updated_at = Date.now();
      saveAllState();
    });
  }

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
  : "https://bebig-backend.aditya5576.workers.dev";

let isSyncing = false;

async function syncData() {
  if (isSyncing || !state.auth || !state.auth.token) return;
  isSyncing = true;
  
  const syncBtn = document.getElementById("btn-sync-now");
  const syncBtnHeader = document.getElementById("btn-sync-now-header");
  let syncIcon = null;
  let syncHeaderIcon = null;
  
  if (syncBtn) {
    syncIcon = syncBtn.querySelector(".settings-row-icon");
    if (syncIcon) syncIcon.classList.add("spinning");
  }
  if (syncBtnHeader) {
    syncHeaderIcon = syncBtnHeader.querySelector("i");
    if (syncHeaderIcon) syncHeaderIcon.classList.add("spinning");
  }

  try {
    const lastSync = state.auth.lastSyncTime || 0;
    
    // 1. Filter local modifications since last sync
    const exercisesToPush = state.exercises.filter(ex => ex.id && String(ex.id).startsWith("custom-") && (ex.updated_at || 0) > lastSync);
    const templatesToPush = state.templates.filter(t => (t.updated_at || 0) > lastSync);
    const historyToPush = state.history.filter(h => (h.updated_at || 0) > lastSync);
    
    let settingsToPush = null;
    if ((state.settings.updated_at || 0) > lastSync) {
      settingsToPush = {
        unit: state.settings.unit,
        default_rest: state.settings.defaultRest,
        updated_at: state.settings.updated_at
      };
    }

    // 2. Push local state updates
    if (exercisesToPush.length > 0 || templatesToPush.length > 0 || historyToPush.length > 0 || settingsToPush) {
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
          settings: settingsToPush
        })
      });
      if (!pushRes.ok) {
        throw new Error("Push sync failed");
      }
    }

    // 3. Pull newer remote state updates
    const pullRes = await fetch(`${API_BASE_URL}/api/sync/pull?last_pulled_at=${lastSync}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${state.auth.token}`
      }
    });
    if (!pullRes.ok) {
      throw new Error("Pull sync failed");
    }

    const remoteData = await pullRes.json();

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

    // Sync finished successfully
    state.auth.lastSyncTime = remoteData.server_time || Date.now();
    saveAllState();

    // Refresh display lists
    renderHomeView();
    renderStartView();
    renderScheduleView();
    renderHistoryView();
    renderExercisesView();
    Analytics.calculateAllStats();

  } catch (err) {
    console.error("Cloud Sync error:", err);
  } finally {
    isSyncing = false;
    if (syncIcon) syncIcon.classList.remove("spinning");
    if (syncHeaderIcon) syncHeaderIcon.classList.remove("spinning");
    updateCloudUI();
  }
}

function updateCloudUI() {
  const accountLabel = document.getElementById("cloud-account-label");
  const accountSubtext = document.getElementById("cloud-account-subtext");
  const syncRow = document.getElementById("btn-sync-now");
  const syncHeaderBtn = document.getElementById("btn-sync-now-header");
  const lastSyncText = document.getElementById("last-sync-subtext");
  const statusIcon = document.getElementById("cloud-status-icon");

  if (state.auth && state.auth.token) {
    if (accountLabel) accountLabel.textContent = `Logged in: ${state.auth.email}`;
    if (accountSubtext) accountSubtext.textContent = "Tap to logout";
    if (statusIcon) {
      statusIcon.setAttribute("data-lucide", "cloud");
      statusIcon.style.color = "var(--color-success)";
    }
    if (syncRow) syncRow.classList.remove("hidden");
    if (syncHeaderBtn) syncHeaderBtn.classList.remove("hidden");
    if (lastSyncText) {
      const timeStr = state.auth.lastSyncTime > 0 
        ? new Date(state.auth.lastSyncTime).toLocaleTimeString() 
        : "Never";
      lastSyncText.textContent = `Last synced: ${timeStr}`;
    }
  } else {
    if (accountLabel) accountLabel.textContent = "Sign In to Sync";
    if (accountSubtext) accountSubtext.textContent = "Access workouts on other devices";
    if (statusIcon) {
      statusIcon.setAttribute("data-lucide", "cloud-off");
      statusIcon.style.color = "var(--text-muted)";
    }
    if (syncRow) syncRow.classList.add("hidden");
    if (syncHeaderBtn) syncHeaderBtn.classList.add("hidden");
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

  if (tab === "login") {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    submitBtn.textContent = "Login";
    title.textContent = "Cloud Login";
  } else {
    loginTab.classList.remove("active");
    signupTab.classList.add("active");
    submitBtn.textContent = "Sign Up";
    title.textContent = "Create Cloud Account";
  }
}

async function handleAuthSubmit() {
  const email = document.getElementById("input-auth-email").value.trim();
  const password = document.getElementById("input-auth-password").value;
  const errorEl = document.getElementById("auth-error-msg");
  const submitBtn = document.getElementById("btn-auth-submit");

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
    const response = await fetch(`${API_BASE_URL}${route}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    state.auth = {
      email: data.email,
      token: data.token,
      lastSyncTime: 0
    };
    saveAllState();

    document.getElementById("modal-cloud-auth").classList.add("hidden");
    syncData();

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
