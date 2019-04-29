# Micronets Mobile

Micronets Mobile is an Apache Cordova based cross platform application used in the Micronets environent. It currently has two modes of operation:
- DPP Onboarding
- Idora Remote Login

The mode is set in the application's settings page (found in the iOS Settings application under Micronets). You can also set the base server URIs for both IdOra and DPP.

This application has been built and tested on the iOS platform. It could/should also run on Android and probably OSX (using the macbook webcam), but these builds are left as an exercise for the reader :)

Development was done on the OSX platform, and these instructions are specific to OSX.

## Pre-requisites:

- Apple iOS Developer license
- macOS - minimum version 10.13 (High Sierra)
- Node - minimum version: 8
- Cordova - minimum version: 8
- XCode - minimum version: 9.2

## Build Instructions (iOS)

```
# Fresh checkout of this repo
$ git clone git@github.com:cablelabs/micronets-mobile.git
$ cd micronets-mobile

# Add the target platform
$ cordova platform add ios

# (Note that the required plugins have already been added for you.)

# Generate iOS icon set
$ npx app-icon generate

# Initial build. Plug your iPhone into your computer, open to home screen.
# (you'll need to allow developer use of the phone, you'll be prompted)
$ cordova run ios --device

# Note that we expect the build to fail. We need to open the project in Xcode and
# change some settings. (platforms/ios/Micronets.xcodeproj)

```

### Open the project file in Xcode.
1. Click the `Micronets` icon in the navigator pane on the left. The properties pane should now be visible on the right.
2. Select `Micronets` under `TARGETS`
3. Select `General` in heading
4. Under `Signing` ensure `Automatically manage signing` is checked and that your Team is selected under `Team`.
5. Under `Deployment Info`:
  - Deployment Target ( I use 10.3)
  - Universal/iPhone
  - Orientation: Portrait & Upside Down
  - Hide Status Bar
6. Select `Info` in heading
  - On last entry in `Custom iOS Target Properties`, click down arrow
  - A plus sign appears, click it to create a new property.
  - In the combo box dropdown, start typing `View controller` and chose the auto-fill suggestion: `View controller-based status bar appearance`
  - RETURN to add, default is NO which is the value we want.

Try the build again: (ensure device is unlocked first)
```
$ cordova run ios --device
```

NOTE: If you are building for the iPhone X or later, you will need to add `arm64e` to valid architectures in Build Settings

Build should succeed and install on device. I've been getting an error around actually launching the application, which can be ignored - just tap the icon on the home screen and it should launch

You'll notice a flash of the default cordova icon on launch. To fix this, copy `res/launch/ios/LaunchImage.launchimage` folder to `platforms/ios/Micronets/Images.xcassets` and rebuild.

The last thing to do is set the server URLs and the Mode. Open the iOS Settings app and choose the Micronets App and change the settings as needed.
