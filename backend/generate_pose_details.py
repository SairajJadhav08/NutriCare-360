"""
Fill static/data/yoga_details.json with AI-written details (Groq) for every pose in the library.

    python generate_pose_details.py                  # only poses missing from the file
    python generate_pose_details.py --force <slug>   # regenerate one pose
    python generate_pose_details.py --force all      # regenerate everything

To add a pose: append {name, category, description, image_url, steps} to static/data/yoga.json,
add its photo to frontend/image-sources/ as yoga-<slug>.png, then run this script.
The file is mirrored to ../api/static/data so the Vercel deployment serves the same details.
Review new entries before committing; the "avoid_if" lists are safety guidance.
"""
import json
import os
import shutil
import sys
import time

import app as A

API_COPY = os.path.join(os.path.dirname(A.BASE_DIR), 'api', 'static', 'data', 'yoga_details.json')


def main():
    force = sys.argv[sys.argv.index('--force') + 1] if '--force' in sys.argv else None
    if not A.GROQ_API_KEY:
        sys.exit('GROQ_API_KEY is not set in backend/.env')

    poses = A._load_poses()
    names = [p['name'] for p in poses]
    try:
        with open(A.POSE_DETAILS_PATH, encoding='utf-8') as f:
            existing = json.load(f).get('poses', {})
    except FileNotFoundError:
        existing = {}

    todo = [p for p in poses
            if force == 'all' or force == A._pose_slug(p['name']) or A._pose_slug(p['name']) not in existing]
    print(f'{len(poses)} poses in library, {len(existing)} with details, {len(todo)} to generate')

    failed = []
    for i, pose in enumerate(todo, 1):
        slug = A._pose_slug(pose['name'])
        for attempt in range(1, 5):
            try:
                existing[slug] = A._generate_pose_details(pose, names)
                print(f'  [{i}/{len(todo)}] ok    {slug}')
                break
            except A.AIError as e:
                if attempt == 4:
                    failed.append(slug)
                    print(f'  [{i}/{len(todo)}] FAIL  {slug}: {e}')
                else:
                    # Free-tier rate limits reset within a minute; back off harder on 429
                    wait = 15 * attempt if e.status == 429 else 3
                    print(f'  [{i}/{len(todo)}] retry {slug} in {wait}s ({e})')
                    time.sleep(wait)
        time.sleep(2)  # pace requests to stay under the per-minute limit
        # Save after every pose so an interruption keeps finished work
        ordered = {A._pose_slug(n): existing[A._pose_slug(n)] for n in names if A._pose_slug(n) in existing}
        with open(A.POSE_DETAILS_PATH, 'w', encoding='utf-8') as f:
            json.dump({'poses': ordered}, f, indent=2, ensure_ascii=False)
            f.write('\n')

    if os.path.isdir(os.path.dirname(API_COPY)):
        shutil.copyfile(A.POSE_DETAILS_PATH, API_COPY)
        print(f'Mirrored to {API_COPY}')
    if failed:
        sys.exit(f'{len(failed)} failed: {", ".join(failed)}. Re-run to retry.')


if __name__ == '__main__':
    main()
