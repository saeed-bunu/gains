export type Goal = 'Lose weight' | 'Build muscle' | 'Get fitter'
export type WorkoutLocation = 'Gym' | 'Home'

export type WorkoutExercise = {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  focus: string
  cue: string
  animationUrl?: string
  visual?: 'press' | 'pull' | 'squat' | 'cardio' | 'mobility' | 'core'
  instructions: string[]
}

export type WorkoutSession = {
  id: string
  title: string
  meta: string
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  summary: string
  exercises: WorkoutExercise[]
}

export type WorkoutLibrary = Record<Goal, WorkoutSession[]>

const workoutExercises: WorkoutLibrary = {
  'Build muscle': [
    {
      id: 'push-day',
      title: 'Push day',
      meta: 'Chest · Shoulders · Triceps',
      duration: '60 min',
      level: 'Intermediate',
      summary: 'Pair two chest presses with shoulder and triceps work for a balanced push session.',
      exercises: [
        { id: 'bench-press', name: 'Bench press', sets: 4, reps: '6–8 reps', rest: '90 sec', focus: 'Pressing power', cue: 'Squeeze shoulder blades down and keep your ribs soft.', visual: 'press', instructions: ['Set your feet flat and brace your core.', 'Lower the bar to mid-chest with control.', 'Press back up without flaring the elbows.'], animationUrl: '' },
        { id: 'incline-press', name: 'Incline dumbbell press', sets: 3, reps: '8–10 reps', rest: '75 sec', focus: 'Upper chest', cue: 'Keep your shoulder blades supported and lower the dumbbells under control.', visual: 'press', instructions: ['Set the bench to a low incline and plant your feet.', 'Lower the dumbbells beside your upper chest.', 'Press up smoothly without letting them drift together.'], animationUrl: '' },
        { id: 'shoulder-press', name: 'Seated dumbbell shoulder press', sets: 3, reps: '8–10 reps', rest: '60 sec', focus: 'Shoulders', cue: 'Brace your core and press without leaning back.', visual: 'press', instructions: ['Sit tall with the dumbbells at shoulder height.', 'Press overhead while keeping your ribs stacked.', 'Lower slowly to shoulder level.'], animationUrl: '' },
        { id: 'lateral-raise', name: 'Dumbbell lateral raise', sets: 3, reps: '12–15 reps', rest: '45 sec', focus: 'Side shoulders', cue: 'Raise with a soft elbow bend and keep your torso still.', visual: 'press', instructions: ['Stand tall with a light dumbbell at each side.', 'Lift out to the sides until your hands reach shoulder height.', 'Lower slowly without swinging.'], animationUrl: '' },
        { id: 'triceps-dip', name: 'Assisted triceps dip', sets: 3, reps: '8–10 reps', rest: '60 sec', focus: 'Triceps', cue: 'Keep your torso upright and elbows close; use an assist machine if needed.', visual: 'press', instructions: ['Hold the dip bars with your arms extended and shoulders down.', 'Bend your elbows to lower only as far as comfortable.', 'Press back up without locking the elbows hard.'], animationUrl: '' },
        { id: 'triceps-pushdown', name: 'Triceps pushdown', sets: 3, reps: '10–12 reps', rest: '45 sec', focus: 'Triceps', cue: 'Keep your upper arms still against your sides as you extend.', visual: 'press', instructions: ['Stand close to a cable with the attachment at chest height.', 'Press the handle down by straightening your elbows.', 'Return under control without letting your elbows drift forward.'], animationUrl: '' },
      ],
    },
    {
      id: 'pull-day',
      title: 'Pull day',
      meta: 'Back · Rear shoulders · Biceps',
      duration: '55 min',
      level: 'Intermediate',
      summary: 'Build your back with a vertical and horizontal pull, then finish with rear-shoulder and biceps work.',
      exercises: [
        { id: 'chin-up', name: 'Assisted chin-up', sets: 3, reps: '6–10 reps', rest: '90 sec', focus: 'Lats and biceps', cue: 'Use an assist machine or band so every rep stays controlled.', visual: 'pull', instructions: ['Take a close underhand grip and begin with arms extended.', 'Pull your chest toward the bar without kicking.', 'Lower slowly to a full, comfortable hang.'], animationUrl: '' },
        { id: 'bentover-row', name: 'Bent-over row', sets: 4, reps: '8–10 reps', rest: '75 sec', focus: 'Mid-back', cue: 'Hinge at your hips and keep your back long as you row.', visual: 'pull', instructions: ['Hold the bar with a shoulder-width grip and soften your knees.', 'Pull the bar toward your lower ribs.', 'Lower it slowly without rounding your back.'], animationUrl: '' },
        { id: 'face-pull', name: 'Cable face pull', sets: 3, reps: '12–15 reps', rest: '45 sec', focus: 'Rear shoulders and upper back', cue: 'Pull toward your face and keep your shoulders away from your ears.', visual: 'pull', instructions: ['Set a rope attachment around face height.', 'Pull the rope toward your face, separating your hands.', 'Return slowly while keeping your torso still.'], animationUrl: '' },
        { id: 'biceps-curl', name: 'Barbell curl', sets: 3, reps: '10–12 reps', rest: '45 sec', focus: 'Biceps', cue: 'Keep your elbows close to your sides and move only your forearms.', visual: 'pull', instructions: ['Stand tall with a comfortable shoulder-width grip.', 'Curl the bar toward your shoulders without swinging.', 'Lower slowly until your arms are straight.'], animationUrl: '' },
        { id: 'hammer-curl', name: 'Dumbbell hammer curl', sets: 3, reps: '10–12 reps', rest: '45 sec', focus: 'Biceps and forearms', cue: 'Keep palms facing inward and avoid rocking your torso.', visual: 'pull', instructions: ['Stand tall with a dumbbell in each hand and palms facing in.', 'Curl while keeping your upper arms still.', 'Lower the weights slowly to your sides.'], animationUrl: '' },
      ],
    },
    {
      id: 'legs-day',
      title: 'Leg day',
      meta: 'Quads · Hamstrings · Glutes · Calves',
      duration: '60 min',
      level: 'Intermediate',
      summary: 'Pair knee-dominant and hip-dominant work with direct hamstring and calf exercises.',
      exercises: [
        { id: 'back-squat', name: 'Back squat', sets: 4, reps: '6–8 reps', rest: '90 sec', focus: 'Quads and glutes', cue: 'Brace your abs and keep your knees tracking over your toes.', visual: 'squat', instructions: ['Set your feet a little wider than shoulders.', 'Sit your hips back and down.', 'Drive through the floor to stand tall.'], animationUrl: '' },
        { id: 'leg-press', name: 'Leg press', sets: 3, reps: '10–12 reps', rest: '75 sec', focus: 'Quads', cue: 'Use a comfortable depth and do not lock your knees at the top.', visual: 'squat', instructions: ['Set your feet about shoulder-width on the platform.', 'Lower until your knees bend comfortably.', 'Press through your feet without locking your knees.'], animationUrl: '' },
        { id: 'romanian-deadlift', name: 'Romanian deadlift', sets: 3, reps: '8–10 reps', rest: '75 sec', focus: 'Hamstrings and glutes', cue: 'Hinge from the hips and keep the back flat.', visual: 'pull', instructions: ['Hold the weight close to your legs.', 'Lower until you feel tension in the hamstrings.', 'Stand tall without arching your lower back.'], animationUrl: '' },
        { id: 'leg-curl', name: 'Lying leg curl', sets: 3, reps: '10–12 reps', rest: '60 sec', focus: 'Hamstrings', cue: 'Keep your hips against the pad as you curl.', visual: 'pull', instructions: ['Adjust the pad just above your heels and lie face down.', 'Curl your heels toward your glutes without lifting your hips.', 'Lower the pad slowly to the start.'], animationUrl: '' },
        { id: 'calf-raise', name: 'Standing calf raise', sets: 3, reps: '12–15 reps', rest: '45 sec', focus: 'Calves', cue: 'Pause at the top and lower your heels through a comfortable range.', visual: 'squat', instructions: ['Set the balls of your feet on the platform and hold the handles.', 'Rise onto your toes without bouncing.', 'Lower your heels slowly until you feel a gentle stretch.'], animationUrl: '' },
      ],
    },
  ],
  'Lose weight': [
    {
      id: 'full-body-strength',
      title: 'Full-body strength',
      meta: 'Strength · Arms · Core',
      duration: '50 min',
      level: 'Beginner',
      summary: 'A full-body session that keeps your effort controlled and your confidence high.',
      exercises: [
        { id: 'goblet-squat', name: 'Goblet squat', sets: 3, reps: '10–12 reps', rest: '60 sec', focus: 'Lower body', cue: 'Keep your chest up and sit down as if you are sitting into a chair.', visual: 'squat', instructions: ['Hold the weight close to your chest.', 'Brace through the midline.', 'Press through the floor to stand.'], animationUrl: '' },
        { id: 'shoulder-press', name: 'Seated dumbbell shoulder press', sets: 3, reps: '8 reps', rest: '60 sec', focus: 'Shoulder pressing strength', cue: 'Keep the core braced and avoid leaning back.', visual: 'press', instructions: ['Sit tall with the dumbbells at shoulder height.', 'Press overhead without arching your back.', 'Lower under control to shoulder level.'], animationUrl: '' },
        { id: 'row', name: 'Cable row', sets: 3, reps: '10–12 reps', rest: '60 sec', focus: 'Back and posture', cue: 'Pull the elbows backward and keep the neck long.', visual: 'pull', instructions: ['Sit tall with a neutral spine.', 'Pull until the elbows reach the ribs.', 'Release with control.'], animationUrl: '' },
        { id: 'dead-bug', name: 'Dead bug', sets: 3, reps: '8 reps each side', rest: '45 sec', focus: 'Core stability', cue: 'Keep your lower back gently rooted to the floor.', visual: 'core', instructions: ['Lift the arms and legs slightly.', 'Exhale as you reach away.', 'Keep movement slow and smooth.'], animationUrl: '' },
        { id: 'biceps-curl', name: 'Barbell curl', sets: 2, reps: '12–15 reps', rest: '45 sec', focus: 'Biceps', cue: 'Stay tall and avoid swinging your body to lift the bar.', visual: 'pull', instructions: ['Hold a light bar with palms facing forward.', 'Keep elbows near your sides as you curl.', 'Lower slowly to the starting position.'], animationUrl: '' },
        { id: 'triceps-pushdown', name: 'Triceps pushdown', sets: 2, reps: '12–15 reps', rest: '45 sec', focus: 'Triceps', cue: 'Keep your upper arms still and finish each rep smoothly.', visual: 'press', instructions: ['Stand tall at a cable station.', 'Press the handle down until your arms are straight.', 'Return slowly while keeping elbows tucked.'], animationUrl: '' },
      ],
    },
    {
      id: 'low-impact-cardio',
      title: 'Low-impact cardio',
      meta: 'Move at a pace that feels right',
      duration: '30 min',
      level: 'Beginner',
      summary: 'Low-stress, photo-guided movement; finish with an optional easy walk to cool down.',
      exercises: [
        { id: 'low-impact-mountain-climber', name: 'Step-back mountain climber', sets: 5, reps: '1 min work / 30 sec rest', rest: '30 sec', focus: 'Low-impact cardio', cue: 'Step one foot at a time and keep the pace conversational.', visual: 'cardio', instructions: ['Start in a strong high plank.', 'Step one foot toward your hands, then return it.', 'Alternate sides without hopping; pause if your form slips.'], animationUrl: '' },
        { id: 'walking-lunge', name: 'Alternating forward lunge', sets: 3, reps: '10 reps each leg', rest: '45 sec', focus: 'Leg endurance', cue: 'Take a comfortable step forward and keep your front knee tracking over your foot.', visual: 'squat', instructions: ['Stand tall with your feet hip-width apart.', 'Step one foot forward and lower both knees comfortably.', 'Push through your front foot to return, then switch sides.'], animationUrl: '' },
        { id: 'band-press', name: 'Band pull apart', sets: 3, reps: '15 reps', rest: '30 sec', focus: 'Posture and shoulders', cue: 'Keep the shoulders down and open the chest.', visual: 'pull', instructions: ['Hold the band at chest height.', 'Pull the band apart without shrugging.', 'Return slowly.'], animationUrl: '' },
      ],
    },
  ],
  'Get fitter': [
    {
      id: 'cardio-core',
      title: 'Cardio & core',
      meta: 'Build stamina one step at a time',
      duration: '40 min',
      level: 'Intermediate',
      summary: 'Work on stamina and controlled core strength without rushing the pace.',
      exercises: [
        { id: 'low-impact-mountain-climber', name: 'Step-back mountain climber', sets: 5, reps: '45 sec work / 30 sec rest', rest: '30 sec', focus: 'Cardio fitness', cue: 'Step rather than hop and keep a steady rhythm.', visual: 'cardio', instructions: ['Start in a strong high plank.', 'Step one knee toward your chest, then return.', 'Alternate legs at a pace you can sustain.'], animationUrl: '' },
        { id: 'romanian-deadlift', name: 'Romanian deadlift', sets: 3, reps: '10 reps', rest: '60 sec', focus: 'Posterior-chain strength', cue: 'Hinge from the hips and keep the back flat.', visual: 'pull', instructions: ['Hold the weight close to your legs.', 'Push your hips back with a slight knee bend.', 'Stand tall by driving your hips forward.'], animationUrl: '' },
        { id: 'walking-lunge', name: 'Alternating forward lunge', sets: 3, reps: '10 reps each leg', rest: '45 sec', focus: 'Leg conditioning', cue: 'Stay tall and move smoothly between sides.', visual: 'squat', instructions: ['Stand tall with your feet hip-width apart.', 'Step one foot forward and lower with control.', 'Push through the front foot and alternate sides.'], animationUrl: '' },
        { id: 'dead-bug', name: 'Dead bug', sets: 3, reps: '8 reps each side', rest: '45 sec', focus: 'Stability', cue: 'Move slowly and keep the lower back quiet.', visual: 'core', instructions: ['Keep the arms and legs moving in opposite directions.', 'Breathe out as you extend.', 'Pause before returning to the start.'], animationUrl: '' },
      ],
    },
    {
      id: 'strength-mobility',
      title: 'Strength & mobility',
      meta: 'Strength · Mobility · Arms',
      duration: '45 min',
      level: 'Beginner',
      summary: 'Blend strength work with mobility and focused arm finishers so you feel stronger and move well.',
      exercises: [
        { id: 'bodyweight-squat', name: 'Bodyweight squat', sets: 3, reps: '10–12 reps', rest: '60 sec', focus: 'Leg drive', cue: 'Keep your chest lifted and knees tracking over your toes.', visual: 'squat', instructions: ['Stand with your feet about shoulder-width apart.', 'Sit your hips down and back as far as comfortable.', 'Drive through your feet to stand tall.'], animationUrl: '' },
        { id: 'band-pull-apart', name: 'Band pull apart', sets: 3, reps: '12–15 reps', rest: '30 sec', focus: 'Shoulders', cue: 'Think of spreading the shoulders wide.', visual: 'pull', instructions: ['Hold a light band at chest height.', 'Pull it apart without rounding the shoulders.', 'Slowly return to neutral.'], animationUrl: '' },
        { id: 'walking-lunge', name: 'Controlled forward lunge', sets: 2, reps: '8 reps each leg', rest: '30 sec', focus: 'Hip mobility and leg control', cue: 'Use a comfortable range and keep your pelvis facing forward.', visual: 'squat', instructions: ['Stand tall and step one foot forward.', 'Bend both knees gently while staying upright.', 'Return to standing and switch sides.'], animationUrl: '' },
        { id: 'plank', name: 'Forearm plank', sets: 2, reps: '20–30 sec', rest: '30 sec', focus: 'Core and shoulders', cue: 'Keep a straight line from head to heels and breathe steadily.', visual: 'core', instructions: ['Place your elbows below your shoulders.', 'Step back and brace your core.', 'Hold the straight body position without letting your hips sag.'], animationUrl: '' },
        { id: 'biceps-curl', name: 'Barbell curl', sets: 2, reps: '12–15 reps', rest: '45 sec', focus: 'Biceps', cue: 'Keep your torso still and lower the weight with control.', visual: 'pull', instructions: ['Stand tall with a light, comfortable grip.', 'Curl without letting your elbows move forward.', 'Lower smoothly to full extension.'], animationUrl: '' },
        { id: 'triceps-pushdown', name: 'Triceps pushdown', sets: 2, reps: '12–15 reps', rest: '45 sec', focus: 'Triceps', cue: 'Keep your elbows close to your body throughout.', visual: 'press', instructions: ['Face the cable and set a light resistance.', 'Extend your elbows to press down.', 'Return slowly without rocking your torso.'], animationUrl: '' },
      ],
    },
  ],
}

export const WORKOUT_LIBRARY: WorkoutLibrary = workoutExercises

export const HOME_WORKOUT_LIBRARY: WorkoutLibrary = {
  'Build muscle': [
    {
      id: 'home-push-day',
      title: 'Home push day',
      meta: 'Chest · Shoulders · Triceps · Core',
      duration: '35 min',
      level: 'Beginner',
      summary: 'Build your push strength with two push-up variations and a short core finisher.',
      exercises: [
        { id: 'incline-push-up', name: 'Incline push-up', sets: 3, reps: '8–12 reps', rest: '60 sec', focus: 'Chest and triceps', cue: 'Keep a straight line from your head to your heels.', visual: 'press', instructions: ['Place your hands on a stable, non-sliding surface or wall.', 'Lower your chest toward your hands while keeping your body straight.', 'Press away and stop if your shoulders or wrists hurt.'] },
        { id: 'pushups', name: 'Floor push-up', sets: 3, reps: '6–12 reps', rest: '60 sec', focus: 'Chest and triceps', cue: 'Keep your elbows angled slightly back and your hips level.', visual: 'press', instructions: ['Begin in a high plank with hands just wider than your shoulders.', 'Lower your chest with control, keeping your body straight.', 'Press the floor away; use knees or the incline version if needed.'] },
        { id: 'plank', name: 'Forearm plank', sets: 3, reps: '20–30 sec', rest: '30 sec', focus: 'Core', cue: 'Brace gently and keep your hips level.', visual: 'core', instructions: ['Place your elbows below your shoulders.', 'Step back and make a straight line from head to heels.', 'Breathe steadily; finish the hold before your hips sag.'] },
      ],
    },
    {
      id: 'home-pull-day',
      title: 'Home pull day',
      meta: 'Back · Biceps · Hamstrings · Core',
      duration: '35 min',
      level: 'Beginner',
      summary: 'A loaded backpack gives rows and curls useful resistance; start light and make sure it is secure.',
      exercises: [
        { id: 'backpack-row', name: 'Backpack bent-over row', sets: 3, reps: '10–15 reps', rest: '60 sec', focus: 'Back and biceps', cue: 'Hinge at your hips, keep your back long, and pull the backpack toward your ribs.', visual: 'pull', instructions: ['Put a few books in a backpack and close it securely.', 'Hinge forward with soft knees and a neutral back.', 'Row the bag toward your lower ribs, then lower slowly.'] },
        { id: 'backpack-rdl', name: 'Backpack hip hinge', sets: 3, reps: '10–15 reps', rest: '60 sec', focus: 'Hamstrings and glutes', cue: 'Push your hips back and keep the backpack close to your legs.', visual: 'pull', instructions: ['Hold a lightly loaded backpack by its straps.', 'Soften your knees and send your hips backward.', 'Stand tall by squeezing your glutes; stop if your back rounds.'] },
        { id: 'backpack-curl', name: 'Backpack curl', sets: 2, reps: '10–15 reps', rest: '45 sec', focus: 'Biceps', cue: 'Keep your elbows near your sides and avoid swinging.', visual: 'pull', instructions: ['Hold the backpack securely by its top handle or straps.', 'Curl it toward your chest without moving your upper arms.', 'Lower slowly; reduce the load if your grip slips.'] },
        { id: 'dead-bug', name: 'Dead bug', sets: 3, reps: '8 reps each side', rest: '30 sec', focus: 'Core stability', cue: 'Keep your lower back gently against the floor.', visual: 'core', instructions: ['Lie on your back with knees over hips and arms raised.', 'Slowly extend opposite arm and leg.', 'Return and alternate without arching your lower back.'] },
      ],
    },
    {
      id: 'home-legs-day',
      title: 'Home legs day',
      meta: 'Quads · Glutes · Hamstrings · Core',
      duration: '35 min',
      level: 'Beginner',
      summary: 'Train your legs with bodyweight squats, lunges, and a controlled hip hinge.',
      exercises: [
        { id: 'bodyweight-squat', name: 'Bodyweight squat', sets: 3, reps: '10–15 reps', rest: '60 sec', focus: 'Quads and glutes', cue: 'Keep your chest lifted and knees tracking over your toes.', visual: 'squat', instructions: ['Stand with feet about shoulder-width apart.', 'Sit your hips down and back as far as comfortable.', 'Drive through your feet to stand tall.'] },
        { id: 'walking-lunge', name: 'Alternating forward lunge', sets: 3, reps: '8–10 reps each leg', rest: '60 sec', focus: 'Leg strength and balance', cue: 'Take a comfortable step and keep your front knee tracking over your foot.', visual: 'squat', instructions: ['Stand tall with your feet hip-width apart.', 'Step one foot forward and lower both knees comfortably.', 'Push through your front foot to return, then switch sides.'] },
        { id: 'backpack-rdl', name: 'Backpack hip hinge', sets: 3, reps: '10–15 reps', rest: '60 sec', focus: 'Hamstrings and glutes', cue: 'Push your hips back and keep the backpack close to your legs.', visual: 'pull', instructions: ['Hold a lightly loaded backpack by its straps.', 'Soften your knees and send your hips backward.', 'Stand tall by squeezing your glutes; stop if your back rounds.'] },
        { id: 'crunches', name: 'Controlled crunch', sets: 3, reps: '10–15 reps', rest: '30 sec', focus: 'Abs', cue: 'Lift your shoulders gently without pulling on your neck.', visual: 'core', instructions: ['Lie on your back with knees bent and feet on the floor.', 'Brace your abdomen and lift your shoulder blades slightly.', 'Lower slowly and keep your neck relaxed.'] },
      ],
    },
  ],
  'Lose weight': [
    {
      id: 'home-full-body',
      title: 'Home full-body strength',
      meta: 'Push · Legs · Back · Abs',
      duration: '30 min',
      level: 'Beginner',
      summary: 'A no-gym circuit of simple compound movements and core work; use a backpack for rows if available.',
      exercises: [
        { id: 'incline-push-up', name: 'Incline push-up', sets: 3, reps: '8–12 reps', rest: '45 sec', focus: 'Chest and triceps', cue: 'Keep a straight line from your head to your heels.', visual: 'press', instructions: ['Place your hands on a stable, non-sliding surface or wall.', 'Lower your chest toward your hands while keeping your body straight.', 'Press away and stop if your shoulders or wrists hurt.'] },
        { id: 'bodyweight-squat', name: 'Bodyweight squat', sets: 3, reps: '10–15 reps', rest: '45 sec', focus: 'Legs', cue: 'Use a comfortable depth and keep your knees tracking over your toes.', visual: 'squat', instructions: ['Stand with feet about shoulder-width apart.', 'Sit your hips down and back.', 'Drive through your feet to stand.'] },
        { id: 'backpack-row', name: 'Backpack bent-over row', sets: 3, reps: '10–15 reps', rest: '45 sec', focus: 'Back', cue: 'Use a lightly loaded, securely closed backpack if available.', visual: 'pull', instructions: ['Add a few books to a backpack and close it securely.', 'Hinge forward with soft knees and a neutral back.', 'Row the bag toward your ribs and lower slowly.'] },
        { id: 'dead-bug', name: 'Dead bug', sets: 3, reps: '8 reps each side', rest: '30 sec', focus: 'Abs and core control', cue: 'Keep your lower back gently against the floor.', visual: 'core', instructions: ['Lie on your back with knees over hips and arms raised.', 'Extend opposite arm and leg slowly.', 'Return and alternate without arching your back.'] },
      ],
    },
    {
      id: 'home-low-impact',
      title: 'Home low-impact conditioning',
      meta: 'Cardio · Legs · Core',
      duration: '25 min',
      level: 'Beginner',
      summary: 'Move at a steady, low-impact pace with step-back climbers, lunges, and abdominal work.',
      exercises: [
        { id: 'low-impact-mountain-climber', name: 'Step-back mountain climber', sets: 4, reps: '30 sec work / 30 sec rest', rest: '30 sec', focus: 'Low-impact cardio', cue: 'Step one foot at a time; there is no need to hop.', visual: 'cardio', instructions: ['Start in a strong high plank.', 'Step one foot toward your hands, then return it.', 'Alternate sides at a conversational pace.'] },
        { id: 'walking-lunge', name: 'Alternating forward lunge', sets: 3, reps: '8 reps each leg', rest: '45 sec', focus: 'Legs and balance', cue: 'Keep each step comfortable and controlled.', visual: 'squat', instructions: ['Stand tall with your feet hip-width apart.', 'Step forward and lower both knees gently.', 'Push through your front foot to return and switch sides.'] },
        { id: 'bodyweight-squat', name: 'Bodyweight squat', sets: 3, reps: '10–12 reps', rest: '45 sec', focus: 'Leg endurance', cue: 'Move smoothly and keep your chest lifted.', visual: 'squat', instructions: ['Stand with feet about shoulder-width apart.', 'Sit your hips down and back.', 'Stand tall without locking your knees.'] },
        { id: 'plank', name: 'Forearm plank', sets: 3, reps: '20–30 sec', rest: '30 sec', focus: 'Abs and shoulders', cue: 'Keep your hips level and breathe steadily.', visual: 'core', instructions: ['Place your elbows below your shoulders.', 'Step back into a straight body line.', 'End the hold if your hips begin to sag.'] },
      ],
    },
  ],
  'Get fitter': [
    {
      id: 'home-cardio-core',
      title: 'Home cardio & core',
      meta: 'Cardio · Push · Legs · Abs',
      duration: '30 min',
      level: 'Beginner',
      summary: 'Build stamina at home with low-impact intervals and simple compound movements.',
      exercises: [
        { id: 'low-impact-mountain-climber', name: 'Step-back mountain climber', sets: 4, reps: '30 sec work / 30 sec rest', rest: '30 sec', focus: 'Cardio fitness', cue: 'Step rather than hop and keep a steady rhythm.', visual: 'cardio', instructions: ['Start in a strong high plank.', 'Step one knee toward your chest, then return.', 'Alternate legs at a pace you can sustain.'] },
        { id: 'pushups', name: 'Floor push-up', sets: 3, reps: '6–12 reps', rest: '45 sec', focus: 'Chest and triceps', cue: 'Keep your body straight and elbows angled slightly back.', visual: 'press', instructions: ['Begin in a high plank with hands just wider than shoulders.', 'Lower your chest with control.', 'Press back up; use knees or an incline if needed.'] },
        { id: 'walking-lunge', name: 'Alternating forward lunge', sets: 3, reps: '8 reps each leg', rest: '45 sec', focus: 'Legs and balance', cue: 'Take a comfortable step and keep your front knee stable.', visual: 'squat', instructions: ['Stand tall with your feet hip-width apart.', 'Step forward and lower with control.', 'Push through the front foot and switch sides.'] },
        { id: 'crunches', name: 'Controlled crunch', sets: 3, reps: '10–15 reps', rest: '30 sec', focus: 'Abs', cue: 'Lift gently and keep your neck relaxed.', visual: 'core', instructions: ['Lie on your back with knees bent.', 'Brace your abdomen and lift your shoulders slightly.', 'Lower slowly without pulling your head forward.'] },
      ],
    },
    {
      id: 'home-strength-mobility',
      title: 'Home strength & mobility',
      meta: 'Squat · Push · Pull · Core',
      duration: '30 min',
      level: 'Beginner',
      summary: 'Practice controlled full-body patterns; use a securely loaded backpack for rows and hinges if available.',
      exercises: [
        { id: 'bodyweight-squat', name: 'Bodyweight squat', sets: 3, reps: '10–15 reps', rest: '45 sec', focus: 'Leg strength', cue: 'Keep your chest lifted and knees tracking over your toes.', visual: 'squat', instructions: ['Stand with feet about shoulder-width apart.', 'Sit your hips down and back.', 'Drive through your feet to stand tall.'] },
        { id: 'incline-push-up', name: 'Incline push-up', sets: 3, reps: '8–12 reps', rest: '45 sec', focus: 'Chest and arms', cue: 'Keep your body in one straight line.', visual: 'press', instructions: ['Use a stable wall or elevated surface.', 'Lower your chest toward your hands.', 'Press away while keeping your hips level.'] },
        { id: 'backpack-row', name: 'Backpack bent-over row', sets: 3, reps: '10–15 reps', rest: '45 sec', focus: 'Back', cue: 'Keep your spine long and use a light backpack if available.', visual: 'pull', instructions: ['Secure a few books in a backpack.', 'Hinge forward with soft knees and a neutral back.', 'Row the bag toward your ribs and lower slowly.'] },
        { id: 'plank', name: 'Forearm plank', sets: 3, reps: '20–30 sec', rest: '30 sec', focus: 'Core stability', cue: 'Breathe steadily and keep your hips level.', visual: 'core', instructions: ['Place your elbows below your shoulders.', 'Step back and brace your core.', 'Finish the hold before your lower back sags.'] },
      ],
    },
  ],
}

export function loadWorkoutLibrary(goal: Goal, location: WorkoutLocation = 'Gym'): WorkoutSession[] {
  return location === 'Home' ? HOME_WORKOUT_LIBRARY[goal] : WORKOUT_LIBRARY[goal]
}
