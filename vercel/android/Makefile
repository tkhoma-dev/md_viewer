# MD Viewer — React Native (Android)
# Requires: Node 22+, JDK, Android SDK (android/local.properties)

GRADLE := cd android &&
APK_DEBUG := android/app/build/outputs/apk/debug/app-debug.apk

.PHONY: help clean build-debug install-debug start

help:
	@echo "Targets:"
	@echo "  make start         Metro bundler (for npm run android / fast refresh)"
	@echo "  make build-debug   Build debug APK with embedded JS ($(APK_DEBUG))"
	@echo "  make install-debug Install debug APK on device/emulator (no Metro required)"
	@echo "  make clean         Remove Gradle build outputs"

start:
	npm start

clean:
	$(GRADLE) ./gradlew clean

build-debug:
	$(GRADLE) ./gradlew :app:assembleDebug

install-debug: build-debug
	$(GRADLE) ./gradlew :app:installDebug
