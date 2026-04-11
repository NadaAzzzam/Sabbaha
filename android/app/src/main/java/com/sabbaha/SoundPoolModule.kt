package com.sabbaha

import android.media.AudioAttributes
import android.media.SoundPool
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SoundPoolModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "SoundPoolModule"

  private val pool: SoundPool = SoundPool.Builder()
      .setMaxStreams(8)
      .setAudioAttributes(
          AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_GAME)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build()
      )
      .build()

  private var tapSoundId = 0
  private var stopSoundId = 0

  // initialize() is called after the React context is fully attached — safe to
  // access resources and package name here.
  override fun initialize() {
    super.initialize()
    val ctx = reactApplicationContext
    val tapRes = ctx.resources.getIdentifier("tap", "raw", ctx.packageName)
    if (tapRes != 0) {
      tapSoundId = pool.load(ctx, tapRes, 1)
    } else {
      android.util.Log.w("SoundPoolModule", "tap raw resource not found")
    }
    // Named sb_stop (not "stop") — avoids Android getIdentifier / R.raw clashes with RNSound and framework ids.
    val stopRes = ctx.resources.getIdentifier("sb_stop", "raw", ctx.packageName)
    if (stopRes != 0) {
      stopSoundId = pool.load(ctx, stopRes, 1)
    } else {
      android.util.Log.w("SoundPoolModule", "sb_stop raw resource not found")
    }
  }

  @ReactMethod
  fun playTap(volume: Float) {
    if (tapSoundId != 0) {
      val vol = volume.coerceIn(0f, 1f)
      pool.play(tapSoundId, vol, vol, 1, 0, 1.0f)
    }
  }

  /** Not named `playStop` — New Architecture interop can omit that symbol on the JS module object. */
  @ReactMethod
  fun playStopSound(volume: Float) {
    if (stopSoundId != 0) {
      val vol = volume.coerceIn(0f, 1f)
      pool.play(stopSoundId, vol, vol, 1, 0, 1.0f)
    }
  }

  /** Single entry point for both SFX; use if discrete methods are missing on the JS proxy. */
  @ReactMethod
  fun playRaw(which: String, volume: Float) {
    val vol = volume.coerceIn(0f, 1f)
    when (which) {
      "tap" -> if (tapSoundId != 0) pool.play(tapSoundId, vol, vol, 1, 0, 1.0f)
      "stop" -> if (stopSoundId != 0) pool.play(stopSoundId, vol, vol, 1, 0, 1.0f)
    }
  }

  override fun invalidate() {
    super.invalidate()
    pool.release()
  }

  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}
}
