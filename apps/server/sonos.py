from soco import discover

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

for zone in discover():
  # zone.pause()
  track = zone.get_current_track_info()
  # print(track)
  # zone.play_uri('http://ia801402.us.archive.org/20/items/TenD2005-07-16.flac16/TenD2005-07-16t10Wonderboy.mp3')
  
  # for favorite in zone.music_library.get_sonos_favorites():
  #   uri = None
  #   for resource in favorite.resources:
  #     uri = resource.uri
  #     break
  #   print(f"Favorite: {favorite.title} - {uri}")

  favorite = zone.music_library.get_sonos_favorites()[4]
  uri = extract_uri_from_item(favorite)[0]
  
  # for resource in favorite.resources:
    # uri = resource.uri

  zone.add_uri_to_queue(uri=uri, title=favorite.title)
  zone.play_from_queue(index=0)

  # zone.play_uri(uri=uri, title=favorite.title)

  print(f"Playing favorite: {favorite.title}")