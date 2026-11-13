# MD Viewer — React Native (Android)
# Requires: Node 22+, JDK, Android SDK (android/local.properties)

GRADLE := cd android &&
APK_DEBUG := android/app/build/outputs/apk/debug/app-debug.apk
LOCAL_PROPERTIES := android/local.properties
SDK_DIR ?= $(firstword $(wildcard $(HOME)/Android/Sdk) $(ANDROID_HOME) $(ANDROID_SDK_ROOT))

.PHONY: help clean build-debug install-debug start reverse-metro local.properties

help:
	@echo "Targets:"
	@echo "  make start         Metro bundler (for npm run android / fast refresh)"
	@echo "  make build-debug   Build debug APK with embedded JS ($(APK_DEBUG))"
	@echo "  make install-debug Install debug APK on device/emulator (no Metro required)"
	@echo "  make reverse-metro adb reverse :8081 for USB + Metro dev (with make start)"
	@echo "  make clean         Remove Gradle build outputs"
	@echo ""
	@echo "Gradle needs android/local.properties (sdk.dir). Make creates it from"
	@echo "ANDROID_HOME, ANDROID_SDK_ROOT, or ~/Android/Sdk before build/install."

start:
	npm start

reverse-metro:
	adb reverse tcp:8081 tcp:8081

local.properties:
	@if [ -z "$(SDK_DIR)" ]; then \
		echo "Android SDK not found."; \
		echo "  Install Android Studio SDK or set ANDROID_HOME, then retry."; \
		echo "  Or create $(LOCAL_PROPERTIES) with: sdk.dir=/path/to/Android/Sdk"; \
		exit 1; \
	fi
	@if [ ! -f $(LOCAL_PROPERTIES) ]; then \
		echo "sdk.dir=$(SDK_DIR)" > $(LOCAL_PROPERTIES); \
		echo "Wrote $(LOCAL_PROPERTIES) -> $(SDK_DIR)"; \
	elif ! grep -q '^sdk.dir=' $(LOCAL_PROPERTIES); then \
		echo "sdk.dir=$(SDK_DIR)" >> $(LOCAL_PROPERTIES); \
	fi

clean: local.properties
	$(GRADLE) ./gradlew clean

build-debug: local.properties
	$(GRADLE) ./gradlew :app:assembleDebug

install-debug: build-debug
	$(GRADLE) ./gradlew :app:installDebug
