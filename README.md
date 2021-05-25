# README #

### Requirements ###

* Node
* npm 
* react-native cli
* Jetbrains IDE
* Android Studio (for Android Builds)
* XCode (for iOS Builds)
* Cocoapods (for iOS Builds)


### How to start ###

* Checkout
* run npm install

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