package expo.modules.videoeditor

import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.RgbMatrix

@UnstableApi
class ColorMatrixEffect(matrix45: FloatArray) : RgbMatrix {
  private val glMatrix: FloatArray = toColumnMajor(matrix45)

  override fun getMatrix(presentationTimeUs: Long, useHdr: Boolean): FloatArray = glMatrix

  companion object {
    fun toColumnMajor(m: FloatArray): FloatArray {
      val rr = m[0]; val rg = m[1]; val rb = m[2]; val rBias = m[4]
      val gr = m[5]; val gg = m[6]; val gb = m[7]; val gBias = m[9]
      val br = m[10]; val bg = m[11]; val bb = m[12]; val bBias = m[14]
      return floatArrayOf(
        rr, gr, br, 0f,
        rg, gg, bg, 0f,
        rb, gb, bb, 0f,
        rBias, gBias, bBias, 1f,
      )
    }
  }
}
