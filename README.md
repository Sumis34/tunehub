<p align="center">
  <img src="./docs/image.png" alt="TuneHub" width="400"/>
</p>

# TuneHub

A UI for controlling Sonos speakers, designed to be setup in a living room and gives the whole family and visitors easy access to the Sonos system without needing to use a phone or tablet.

## Features

- **Playback Controls**: Play, pause, skip tracks, and adjust volume directly from the interface.
- **Now Playing Info**: View current track information and album art.
- **Shortcuts**: Quick access to favorite playlists and radio stations from configured in the Sonos app.
- **Device Management**: Easily switch between multiple Sonos devices on your network.
- **Touchscreen-Friendly UI**: Optimized for use on small touchscreen displays. ( e.g. Raspberry Pi with a touchscreen )

## About

If you think of an embedded device, React and Python might not be the first technologies that come to mind. However, there is a saying: "Use the tools you know". And since I am most familiar with React I decided to give it a try. The reason I chose Python for the backend is that it has a mature Sonos library (SoCo) which makes it easy to interact with Sonos devices.

Besides that there are a few advantages of using these technologies:

- It is cross platform and mostly just works.
- It is easy to develop modern UIs with React.

Some of the caveats are that a fairly recent Raspberry Pi is required to run the UI smoothly and that the startup time is a bit longer compared to a native application. I would recommend choosing a lightweight OS like Raspberry Pi OS Lite and only install the necessary packages to keep resource usage low.

## Installation

### Hardware Specific Setup

This setup is meant for Pi OS Lite Trixie and the [3.5inch DPI LCD](https://www.waveshare.com/wiki/3.5inch_DPI_LCD?srsltid=AfmBOoqEQ8b2K71XAvbje4K5-Gjc011bOH9yJL84BaxcW-uSN3YL_Jjs) screen.

1. Follow the instructions in the [Waveshare Wiki](https://www.waveshare.com/wiki/3.5inch_DPI_LCD?srsltid=AfmBOoqEQ8b2K71XAvbje4K5-Gjc011bOH9yJL84BaxcW-uSN3YL_Jjs).

1. Install Chromium and xserver-xorg:

```bash
sudo apt update
sudo apt full-upgrade -y

sudo apt install --no-install-recommends \
  xserver-xorg-core \
  xserver-xorg-video-all \
  xserver-xorg-input-all \
  xinit \
  x11-xserver-utils \
  chromium \
  unclutter
```

1. Enable autologin.

```bash
sudo raspi-config
# Auto login > Console Autologin > Yes
```

1. Auto-Start X Only on the Physical Console

```bash
nano ~/.bash_profile
```

Add:

```bash
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  startx -- -nocursor
fi
```

1. Add Software I2C bus and enable I2C on the Raspberry Pi:

```bash
# Append to /boot/firmware/config.txt:
# Use free GPIO pins, this may vary based on your setup.
dtoverlay=i2c-gpio,i2c_gpio_sda=19,i2c_gpio_scl=26,bus=4
```

### Tunhub Installation

1. Start the installation script:

```bash
curl -fsSL https://raw.githubusercontent.com/Sumis34/tunehub/refs/heads/master/download.sh | bash -s v0.0.4
```

1. Verify that the `tunehubd` service is running:

```bash
systemctl status tunehubd
```

## User Guide

### Debugging

- Tripple click the time in the header to reload the window.

## Development

It's the simplest if you run the server and UI on your local machine and just connect to it from the Raspberry Pi or any other device you intend to use later. This way you can develop and test without having to copy files to the Pi every time but you can still see how it looks and works on the target device display.

```bash
# On the target device (e.g. Raspberry Pi)
DISPLAY=:0 nohup chromium http://YOUR_LOCAL_IP:5173 --kiosk --start-fullscreen -disable-pinch --incognito
```

### Release a new version

1. Checkout the `main` branch and make sure all your changes are merged there.
2. Run `git tag vX.Y.Z` to create a new tag for the release.
3. Push the tag to GitHub with `git push origin vX.Y.Z`.
4. Pipeline will run and create a new release with all the necessary files.
