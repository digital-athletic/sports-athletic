# README #

## Get started

### Option 1: Local Setup
> 💡 We recommend [asdf](https://asdf-vm.com/) for managing build tool versions

* Node.js v20
* pnpm v10.16.1
* [watchman](https://facebook.github.io/watchman/docs/install)

**How to start:**
* Checkout the repository
* Run `pnpm install`

### Option 2: Docker (Recommended for Quick Start)
> 💡 Simplest way to get started with a consistent development environment

* [Docker](https://www.docker.com/get-started) and Docker Compose

**How to start:**
* Run: `docker compose up`
* The Expo development server will start automatically
* Access the server at http://localhost:8081
* To run commands inside the container: `docker compose exec app sh`
* To stop: `docker compose down`

If you are running inside the container (e.g. using Dev Containers), you should start with:
1. `pnpm install`
2. `pnpm start`

### Android
* Azul Zulu JDK 17.58.21 (OpenJDK 17.0.15)
* [Android Studio](https://developer.android.com/studio)
  * Android SDK Platform 35 (`VanillaIceCream`)
  * Sources for Android 35
  * Android SDK Build-Tools
  * NDK `27.1.12297006`


### iOS
* ruby v3.2
* CocoaPods v1.16.2
* Xcode 26.0 (17A324)

See: [.tool-versions](./.tool-versions)

### For developement ###

* Configure File Watcher for prettier in IDE
    * This is important to prevent git formatting issues!
    * Install Jetbrains IDE prettier plugin
    * See https://prettier.io/docs/en/webstorm.html#running-prettier-on-save-using-file-watcher
    * Use this "Arguments": --write $FilePathRelativeToProjectRoot$ --tab-width 4
    * Set Scope to "Open Files"
    
* check for flow errors with "npm run flow"

### Android build ###

* react-native run-android

### iOS build ###

* install Pods with "cd ios && pod install"
* Open ios/sportsAthleticAppClient.xcworkspace
* Run project

For showing images with react-native 63.2 and Xcode12 we need to add a case to the Image Component:

node_modules/react-native/Libraries/Image/RCTUIImageViewAnimated.m - Line 278:
`else {
  [super displayLayer:layer];
}`