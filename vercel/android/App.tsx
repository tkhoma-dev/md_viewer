/**
 * MD Viewer — read-only React Native client.
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ViewerApp } from './src/ViewerApp';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ViewerApp />
    </SafeAreaProvider>
  );
}

export default App;
