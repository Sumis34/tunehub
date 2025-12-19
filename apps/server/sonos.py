from soco import discover, SoCo
from typing import TypedDict, Any, Optional, List

SUPPORTED_FAVORITE_TYPES = [
    "audioBroadcast",
    "object.container.playlistContainer",
    "object.item.audioItem.musicTrack",
]

class Favorite(TypedDict):
  title: str
  item_class: str
  ref: Any
  id: Optional[str]
  description: str
  album_art: Optional[str]

def extract_uri_from_item(item):
    """
    Try several ways to get a playable URI from a favorite item returned by SoCo.
    Returns (uri, title) or (None, None) if not found.
    """
    title = None
    uri = None

    # common attributes
    title = getattr(item, "title", None) or (item.get("title") if isinstance(item, dict) else None)

    # If it's a dict-like object
    if isinstance(item, dict):
        uri = item.get("uri") or item.get("res") or item.get("resource") or item.get("url")
        return uri, title

    # If it's a DIDL object with resources
    resources = getattr(item, "resources", None)
    if resources:
        try:
            # resources is usually a list of Resource objects with .uri
            uri = resources[0].uri
            return uri, title
        except Exception:
            pass

    # fallback attributes
    uri = getattr(item, "uri", None) or getattr(item, "url", None)
    return uri, title
 
def is_container(item_class: str) -> bool:
  return bool(item_class and "object.container" in item_class)

def is_playlist_container(item_class: str) -> bool:
  return bool(item_class and "object.container.playlistContainer" in item_class)

def is_radio(item_class: str) -> bool:
  return bool(item_class and ("audioBroadcast" in item_class or "radio" in item_class.lower()))

def get_playable_favorites(zone: SoCo) -> List[Favorite]:
  favorites: List[Favorite] = []
  for favorite in zone.music_library.get_sonos_favorites(full_album_art_uri=True):
    playable = False

    try:
      ref = getattr(favorite, "reference", None) or favorite
    except Exception:
      ref = favorite

    title = getattr(ref, "title", None) or getattr(favorite, "title", None)
    item_class = getattr(ref, "item_class", "") or getattr(favorite, "item_class", "")
    id = getattr(ref, "item_id", None)
    description = getattr(favorite, "description", None) or "-"
    album_art = getattr(favorite, "album_art_uri", None) or None
    
    for fav_type in SUPPORTED_FAVORITE_TYPES:
      if bool(item_class and fav_type in item_class):
        playable = True
        break

    if not playable:
      continue

    favorites.append({
      "title": title,
      "item_class": item_class,
      "ref": ref,
      "id": id,
      "description": description,
      "album_art": album_art
    })

  return favorites

def play_favorite(zone: SoCo, favorite: Favorite | list):
  """Play a favorite. Accepts the new dict Favorite or the legacy tuple (title, item_class, ref, id)."""
  # Normalize input
  title = favorite.get("title")
  item_class = favorite.get("item_class") or ""
  ref = favorite.get("ref")

  try:
      if is_radio(item_class):
        uri, _ = extract_uri_from_item(ref)
        if uri:
          print("  Radio/broadcast detected. Playing via play_uri...")
          zone.play_uri(uri=uri, title=title)
        else:
          print("  No stream URI found for radio item; skipping.")
      elif is_playlist_container(item_class):
        print("  Playlist container detected. Attempting to enqueue playlist...")
        try:
          zone.clear_queue()
          zone.add_to_queue(ref)
          zone.play_from_queue(index=0)
        except Exception as e:
          print(f"Could not enqueue playlist container: {e}")
          return

      elif is_container(item_class):
        print("NOT SUPPORTED: Container detected, skipping...")
        # TODO: Handle this case to enqueue child items individually. Unknown how it should behave. This concearns "Trending Now", "Sonos Presents", "Discover Sonos Radio"
        return

      else:
        print("  Single item detected. Enqueuing...")
        try:
          zone.clear_queue()
          zone.add_to_queue(ref)
        except Exception:
          uri, _ = extract_uri_from_item(ref)
          if uri:
            zone.clear_queue()
            zone.add_uri_to_queue(uri=uri, title=title)
          else:
            print("  Could not enqueue item (no DIDL add and no URI).")
            return
        zone.play_from_queue(index=0)
  except Exception as e:
    print(f"  Error handling favorite '{title}': {e}")

def get_favorite(favorites: List[Favorite], title: str) -> Optional[Favorite]:
  for fav in favorites:
    if fav.get("title") == title:
      return fav
  return None