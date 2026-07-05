# set up tmp dir
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

# clone source repo
source_repo_url="https://github.com/$INPUT_SOURCE_SLUG"
source_repo_dir="$tmp_dir/source"

git clone "$source_repo_url" "$source_repo_dir"

source_base_dir="$source_repo_dir/$INPUT_SOURCE_DIR"
target_base_dir="$INPUT_TARGET_DIR"

# look for tags
ref=$(git -C "$source_repo_dir" rev-parse --short HEAD)
[[ "$INPUT_USE_TAGS" == "true" ]] && {
  ref=$(git -C "$source_repo_dir" describe --tags --first-parent --abbrev=0 2>/dev/null || true)
  [[ -n "$ref" ]] && git -C "$source_repo_dir" checkout "$ref"
}

# copy mappings
while IFS= read -r mapping; do
  [[ -z "$mapping" ]] && continue

  source="${mapping%%:*}"
  target="${mapping#*:}"

  mapfile -t sources < <(compgen -G "$source_base_dir/$source")

  ((${#sources[@]})) || { echo "No files found for source pattern '$source'" >&2; exit 1; }

  if ((${#sources[@]} == 1)); then
    if [[ -d "${sources[0]}" ]]; then
      source_dir="${sources[0]}"
      target_dir="$target_base_dir/$target"

      [[ -e "$target_dir" && ! -d "$target_dir" ]] && rm -f -- "$target_dir"

      mkdir -p "$target_dir"
      rsync -a --delete-before -- "$source_dir/" "$target_dir/"
    else
      source_file="${sources[0]}"
      target_file="$target_base_dir/$target"

      [[ -d "$target_file" ]] && rm -rf -- "$target_file"

      mkdir -p "$(dirname "$target_file")"
      rsync -a -- "$source_file" "$target_file"
    fi
  else
  target_dir="$target_base_dir/$target"

  [[ -e "$target_dir" && ! -d "$target_dir" ]] && rm -f -- "$target_dir"

  mkdir -p "$target_dir"
  rsync -a -- "${sources[@]}" "$target_dir/"
  fi

  echo "Copied ${#sources[@]} file(s) from '$source' to '$target'"
done <<< "$INPUT_MAPPINGS"

REPO_URL="$source_repo_url" REF="$ref" COMMIT="$(git -C "$source_repo_dir" rev-parse --short HEAD)" \
yq -n '
  .repository = strenv(REPO_URL) |
  .ref = strenv(REF) |
  .commit = strenv(COMMIT)
' > "$target_base_dir/.upstream.yml"

# commit changes if any
git add "$target_base_dir"

git diff --cached --quiet "$target_base_dir" && {
  echo "No changes to commit."
  exit 0
}

if ! git rev-parse --verify HEAD >/dev/null 2>&1 || [[ -z $(git ls-tree -r --name-only HEAD -- "$target_base_dir") ]]; then
  message="added $INPUT_SOURCE_SLUG ($ref)"
else
  message="updated $INPUT_SOURCE_SLUG to $ref"
fi

echo "$message"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git commit -m "ci: $message" || echo "No changes to commit."

git push
