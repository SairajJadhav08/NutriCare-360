# NutriCare-360 — Image prompts for Gemini

Every image the redesigned frontend can use, with a ready-to-paste prompt for each.
The code already points at these files, so each image shows up as soon as it is in place.
Until then, the app shows a neutral placeholder, so nothing looks broken.

## How to use this

1. Paste the **style block** below into Gemini once at the start of a chat, then paste
   each prompt one at a time in that same chat. That keeps the set looking like one shoot.
2. Download each result as PNG, at the highest resolution Gemini gives you.
3. Save it in `frontend/image-sources/` using the **exact filename** shown (`.png`).
   That folder keeps the full-size originals; it is never bundled or deployed.
4. Run `python frontend/scripts/optimize_images.py`. It crops each image to the right
   ratio and writes small WebP versions (several widths each) into `frontend/public/images/`,
   which is what the app actually loads. You don't need to resize anything yourself.

If a result has text, logos, extra fingers, warped yoga limbs or a visible watermark,
regenerate it. Those are the usual failures.

---

## Style block (paste this first)

```
For every image in this chat, use one consistent photographic style:
editorial lifestyle photography, natural window light from the left, soft shadows,
warm neutral palette — light oak wood, warm off-white walls (#F4F1EC), sage green
textiles and plants, small accents of muted rose (#E11D48 at low saturation, never neon).
35mm lens look, shallow depth of field, gentle film grain, true-to-life color, calm mood.
No text, no logos, no watermarks, no UI overlays, no brand names, no stock-photo smiles
at the camera. Real, unposed moments. Photorealistic.
```

This matches the existing hero photo (original: `frontend/image-sources/hero.png`).

---

## 1. Landing page — feature rows (3 images)

The landing page now has three alternating rows, each showing one feature beside a photo.
The app draws its own UI card on top of each photo, so the photos must have **calm,
uncluttered space** on the side named in each prompt.

| File | Ratio | Where it shows |
|---|---|---|
| `feature-meal.png` | 4:3 landscape | "Describe a meal, get the macros" row |
| `feature-meds.png` | 4:3 landscape | Medication reminders row |
| `feature-yoga.png` | 4:3 landscape | Yoga routine builder row |

**feature-meal.png**
```
Overhead top-down photo of a simple home breakfast on a light oak table: two soft
scrambled eggs on a matte off-white ceramic plate, one slice of whole-wheat toast with
a little butter, a cup of black coffee in a sage-green mug, a linen napkin. Natural
morning light from the left. The plate sits in the left 60% of the frame; the right
40% is empty oak tabletop for a UI card. 4:3 landscape.
```

**feature-meds.png**
```
A seven-day pill organizer with small white and pale yellow tablets, a glass of water,
and a sprig of eucalyptus on a warm off-white kitchen counter, early morning light from
a window on the left. Shot at a low 30-degree angle, shallow depth of field. Subject in
the right 55% of the frame; left side is soft, empty counter and blurred wall. No
medicine packaging or labels visible. 4:3 landscape.
```

**feature-yoga.png**
```
A woman in her 30s in fitted charcoal activewear resting in child's pose on a sage-green
yoga mat in a bright living room with a light oak floor, a large plant, and soft morning
light. Seen from the side, face not visible, peaceful. Person and mat occupy the left
60% of the frame; right side is calm, uncluttered wall and floor. 4:3 landscape.
```

---

## 2. Login / Register side panel (1 image)

| File | Ratio | Where it shows |
|---|---|---|
| `auth-side.png` | 4:5 portrait | Left half of the Login and Register pages on desktop |

**auth-side.png**
```
Close-up of two hands holding a warm ceramic mug of herbal tea beside an open paper
notebook and a small bowl of fresh berries on a light oak table, a sage-green linen
sleeve visible, soft window light from the left. Quiet, unhurried morning feeling.
Leave the top third of the frame as soft, out-of-focus background (a short line of text
sits there). 4:5 portrait.
```

---

## 3. Empty states (3 images)

These show when a list is empty (no meals logged yet, and so on). They render as a
small rounded tile (about 120px), so keep them simple: **one object, centered, plain
background**.

| File | Ratio | Where it shows |
|---|---|---|
| `empty-meals.png` | 1:1 | Nutrition, empty food log |
| `empty-reminders.png` | 1:1 | Reminders, no reminders yet |
| `empty-prescriptions.png` | 1:1 | Prescriptions, nothing uploaded |

**empty-meals.png**
```
A single empty matte off-white ceramic bowl with a wooden spoon resting on it, centered,
on a seamless plain warm off-white background (#F4F1EC), soft shadow below, studio
product-photo style, lots of empty space around the object. 1:1 square.
```

**empty-reminders.png**
```
A small minimalist analog alarm clock in sage green, centered, on a seamless plain warm
off-white background (#F4F1EC), soft shadow below, studio product-photo style, lots of
empty space around the object. The clock face has simple marks and no numbers or text.
1:1 square.
```

**empty-prescriptions.png**
```
A neat closed folder in muted rose-colored card stock with a single blank sheet of paper
peeking out, centered, on a seamless plain warm off-white background (#F4F1EC), soft
shadow below, studio product-photo style, lots of empty space. No writing on the paper.
1:1 square.
```

---

## 4. Yoga pose library (23 images)

Right now 26 poses share 3 unrelated stock photos, so a headstand shows the same
picture as cobra pose. These replace them. For these, paste this **pose style block**
once, after the main style block:

```
For the yoga pose images: the same woman in every image — early 30s, dark hair in a low
bun, fitted charcoal-grey long-sleeve top and leggings, barefoot. Same setting every
time: a sage-green yoga mat on a light oak floor in front of a plain warm off-white wall,
one small plant at the edge of frame, soft daylight from the left. Full body always in
frame with space around her, camera at hip height, shot from the side unless the prompt
says otherwise. Anatomically correct pose with correct alignment, realistic hands and
feet. 4:3 landscape.
```

Then for each row, prompt: **"Yoga pose image: _description_"**.

| File | Pose | Description to paste |
|---|---|---|
| `yoga-tadasana-mountain-pose.png` | Mountain Pose | standing tall in mountain pose, feet hip-width, arms relaxed at her sides, palms facing forward, front view |
| `yoga-surya-namaskara-sun-salutation.png` | Sun Salutation *(also used for Sun Salutation A)* | in the upward-salute moment of a sun salutation, arms reaching overhead, palms together, slight backward lift of the chest |
| `yoga-padmasana-lotus-pose.png` | Lotus Pose | seated in full lotus pose, spine tall, hands resting on knees in a relaxed mudra, eyes closed, front three-quarter view |
| `yoga-balasana-child-s-pose.png` | Child's Pose | in child's pose, knees wide, forehead on the mat, arms extended forward |
| `yoga-vrikshasana-tree-pose.png` | Tree Pose *(also used for "Tree Pose")* | balancing in tree pose, right foot on inner left thigh, palms together at chest, front view |
| `yoga-bhujangasana-cobra-pose.png` | Cobra Pose | in cobra pose, lying on her front, chest lifted, elbows slightly bent and close to her body, shoulders relaxed |
| `yoga-adho-mukha-svanasana-downward-dog.png` | Downward Dog | in downward-facing dog, hips high, arms and back in one straight line, heels reaching toward the mat |
| `yoga-virabhadrasana-i-warrior-i.png` | Warrior I | in warrior I, front knee bent over the ankle, back foot angled at 45 degrees, hips facing forward, arms reaching overhead |
| `yoga-ustrasana-camel-pose.png` | Camel Pose | in camel pose, kneeling, hips over knees, chest open, hands on her heels, gentle backbend |
| `yoga-halasana-plow-pose.png` | Plow Pose | in plow pose, lying on her back with legs lifted over her head, toes touching the mat behind her head, arms flat on the mat |
| `yoga-cat-cow-stretch.png` | Cat-Cow | on hands and knees in the "cow" phase, belly lowered, chest and gaze lifted, wrists under shoulders |
| `yoga-plank-pose.png` | Plank | in high plank, straight line from head to heels, wrists under shoulders, core engaged |
| `yoga-paschimottanasana-seated-forward-fold.png` | Seated Forward Fold | in seated forward fold, legs straight together, folding forward from the hips, hands holding her shins |
| `yoga-virabhadrasana-ii-warrior-ii.png` | Warrior II | in warrior II, front knee bent, arms extended parallel to the floor, gaze over her front hand, front view |
| `yoga-matsyasana-fish-pose.png` | Fish Pose | in fish pose, lying on her back, chest lifted high, crown of the head lightly touching the mat, legs straight |
| `yoga-marichyasana-marichi-s-pose.png` | Marichi's Pose | in seated Marichi's twist, one knee bent with the foot flat, twisting toward the bent knee, opposite elbow outside the knee |
| `yoga-legs-up-the-wall.png` | Legs Up the Wall | lying on her back on the mat with legs resting straight up against the off-white wall, arms relaxed by her sides |
| `yoga-twisted-triangle.png` | Twisted Triangle | in revolved triangle pose, legs straight and apart, torso twisted, one hand on the mat near the front foot, other arm reaching up |
| `yoga-happy-baby.png` | Happy Baby | in happy baby pose, lying on her back, knees bent toward her armpits, holding the outer edges of her feet, soles facing the ceiling |
| `yoga-savasana-corpse-pose.png` | Savasana *(also used for "Corpse Pose")* | lying flat on her back in savasana, arms slightly away from her body, palms up, eyes closed, fully relaxed, shot from a slightly higher angle |
| `yoga-utthita-trikonasana-triangle-pose.png` | Triangle Pose | in extended triangle pose, legs straight and wide, front hand on the shin, other arm reaching straight up, chest open to the side, front view |
| `yoga-setu-bandhasana-bridge-pose.png` | Bridge Pose | in bridge pose, lying on her back, knees bent, feet flat, hips lifted, arms flat on the mat |
| `yoga-sirsasana-headstand.png` | Headstand | in a supported headstand, forearms on the mat with fingers interlaced around her head, body in one straight vertical line, legs together |

---

## 5. Social share image (1 image, optional)

| File | Ratio | Where it shows |
|---|---|---|
| `og-image.png` | 1200×630 (1.91:1) | Link previews on WhatsApp, LinkedIn, X, and similar |

```
Wide editorial photo: a light oak table with a sage-green mug of tea, a simple bowl of
oatmeal topped with berries, and a seven-day pill organizer, soft morning light from the
left. Objects arranged in the right half; the left half is calm, empty warm off-white
wall and tabletop where a title will be placed. 1.91:1 wide landscape.
```

---

## Checklist

- [x] feature-meal.png
- [x] feature-meds.png
- [x] feature-yoga.png
- [x] auth-side.png
- [x] empty-meals.png
- [x] empty-reminders.png
- [x] empty-prescriptions.png
- [x] yoga-tadasana-mountain-pose.png
- [x] yoga-surya-namaskara-sun-salutation.png
- [x] yoga-padmasana-lotus-pose.png
- [x] yoga-balasana-child-s-pose.png
- [x] yoga-vrikshasana-tree-pose.png
- [x] yoga-bhujangasana-cobra-pose.png
- [x] yoga-adho-mukha-svanasana-downward-dog.png
- [x] yoga-virabhadrasana-i-warrior-i.png
- [x] yoga-ustrasana-camel-pose.png
- [x] yoga-halasana-plow-pose.png
- [x] yoga-cat-cow-stretch.png
- [x] yoga-plank-pose.png
- [x] yoga-paschimottanasana-seated-forward-fold.png
- [x] yoga-virabhadrasana-ii-warrior-ii.png
- [x] yoga-matsyasana-fish-pose.png
- [x] yoga-marichyasana-marichi-s-pose.png
- [x] yoga-legs-up-the-wall.png
- [x] yoga-twisted-triangle.png
- [x] yoga-happy-baby.png
- [x] yoga-savasana-corpse-pose.png
- [x] yoga-utthita-trikonasana-triangle-pose.png
- [x] yoga-setu-bandhasana-bridge-pose.png
- [x] yoga-sirsasana-headstand.png
- [x] og-image.jpg (high-resolution brand fallback active)

Total: 30 of 30 main application images. Originals: `frontend/image-sources/`. Optimized web versions: `frontend/public/images/`.
