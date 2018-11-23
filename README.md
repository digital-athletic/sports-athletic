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
    * See https://prettier.io/docs/en/webstorm.html#running-prettier-on-save-using-file-watcher
    * Use this "Arguments": --write $FilePathRelativeToProjectRoot$ --tab-width 4

### Android build ###

* react-native run-android

### iOS build ###

* install Pods with "cd ios && pod install"
* Open ios/sportsAthleticAppClient.xcworkspace
* Run project

### Release App ###

Releases are created automatically via Bitrise Continuous Integration. Just Push in the release branch :-)