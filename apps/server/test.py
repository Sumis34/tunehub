import soco

zone = soco.discover().pop()

info = zone.get_current_track_info()

print(info)