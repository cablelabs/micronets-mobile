# Micronets Mobile

Micronets Mobile is an Apache Cordova based cross platform application used in the Micronets ecosystem. It currently has two modes of operation:
- **DPP Onboarding**
- **Clinic Onboarding (Idora Remote Login)**

This application has been built and tested on the iOS and Android platforms.

## Installation

### iOS
#### Pre-requisites:

- Apple iOS Developer license
- macOS - minimum version 10.13 (High Sierra)
- Node - minimum version: 8
- Cordova - version: 8.0.0 (problems with version 9)
- XCode - minimum version: 9.2
- ImageMagick

You will also need to install ios-deploy, which cordova uses to cable load the application. The `unsafe-perm` flag is required on macOS versions El Capitan and higher.

`sudo npm install -g --unsafe-perm=true ios-deploy`


#### Build Instructions

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
$ cordova run ios --device --buildFlag='-UseModernBuildSystem=0'

# Note that we expect the build to fail. We need to open the project in Xcode and
# change some settings. (platforms/ios/Micronets.xcodeproj)

```

**Open the project file in Xcode**

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
$ cordova run ios --device --buildFlag='-UseModernBuildSystem=0'
```
NOTE: If you are building for the iPhone X or later, you will need to add `arm64e` to valid architectures in Build Settings

Build should succeed and install on device. I've been getting an error around actually launching the application, which can be ignored - just tap the icon on the home screen and it should launch

You'll notice a flash of the default cordova icon on launch. To fix this, copy `res/launch/ios/LaunchImage.launchimage` folder to `platforms/ios/Micronets/Images.xcassets` and rebuild.

```
cp -R res/launch/ios/LaunchImage.launchimage/ platforms/ios/Micronets/Images.xcassets/LaunchImage.launchimage
```

If this is the first app you've loaded onto the target iPhone using your development credentials, you'll need to go int the iphone Settings and General/Device Management/Developer App/Apple Development: username

The last thing to do is set the server URLs and the Mode. Open the iOS Settings app and choose the Micronets App and change the settings as needed.

For testing, you can scan `test-qrcode.png`. While it won't have a useful mac or pubkey, you can at least use it to test the Portal and MM APIs.

If you want to generate a real one, you can do that here. Just paste your valid DPP uri and select Text as the type of QR code.
`https://www.qr-code-generator.com/`

### Android
#### Pre-requisites:

- Android SDK
- Node - minimum version: 8
- Cordova - version: 8.0.0 (problems with version 9)

#### Build Instructions

```
# Fresh checkout of this repo
$ git clone git@github.com:cablelabs/micronets-mobile.git
$ cd micronets-mobile

# Add the target platform
$ cordova platform add android

# (Note that the required plugins have already been added for you.)
# If you get this error: Failed to install 'cordova-plugin-app-preferences': Error: ENOENT,
# Run:
cordova plugin add https://github.com/vash15/me.apla.cordova.app-preferences

# (TODO) Generate Android icon set

# Initial build. Plug your Android into your computer, open to home screen.
# (you'll need to allow developer use of the phone, instructions depend on Android version)
$ cordova run android --device

## Notes:

# If you get the error 'Please run preference generator' when showing Settings you
# will need to reinstall the app preferences plugin.

mv app-settings.json app-settings-save.json
cordova plugin remove cordova-plugin-app-preferences
mv app-settings-save.json app-settings.json
cordova plugin add https://github.com/vash15/me.apla.cordova.app-preferences

# If you are getting 404 errors instead of a 401 (you were expecting a login page),
# you will need to install the whitelist plugin

cordova plugin add cordova-plugin-whitelist

```

## Operation
### Settings
You may need to change some settings for the application to run. From either the splash screen or the login screen, tap the settings icon in the upper right corner.

**GENERAL**
- Mode - DPP or Clinic
- Debug - Leave this off, it will be deprecated in the future
- Enable MUD - If enabled, it will try to fetch the MUD file for the scanned device and prepopulate the Submit form prior to onboarding.

**SERVERS**
- DPP - Server URL for submitting onboard requests
- IdOra - Server for user authentication (Clinic Mode)
- MUD - Server for looking up MUD files using the vendor code and public key in the QRCode. (Note: this only needs to be changed if you are deploying your own MUD Registry)

### Modes
#### DPP
- Login with your subscriber credentials
- Start the Onboard on the STA device
- Tap "Ready to Scan"
- Scan the QRCode
- Once the QRCode has been scanned, a submission form is presented
- Select Mode: STA or AP (should always be STA for now)
- Select a Class and enter Name for the device, then tap  `Onboard`.
- A request is sent to the MSO Portal -> Micronets Manager -> Gateway where DPP negotiations take place. - - The result of the Onboard submission is returned to the Micronets Mobile application and the result is displayed.

#### Clinic (Idora Remote Login)
- Login with your subscriber credentials
- Start the Onboard on the STA device
- Open a web browser to the Clinic Registration Portal (https://alpineseniorcare.com/micronets/portal/device-list)
- Select the advertised device in the browser
- When a QRCode is displayed, tap "Ready to Scan" on the mobile device
- Scan the QRCode
- Observe the results on the web package
