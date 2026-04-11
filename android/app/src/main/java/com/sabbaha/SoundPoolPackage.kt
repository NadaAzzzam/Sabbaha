package com.sabbaha

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SoundPoolPackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
      listOf(SoundPoolModule(ctx))

  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
      emptyList()
}
