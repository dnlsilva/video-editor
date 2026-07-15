package expo.modules.videoeditor

import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.RgbMatrix

/**
 * Applies a 4×5 color matrix (row-major [r,g,b,a,bias] per output channel) on the GPU.
 * Media3's RgbMatrix shader multiplies a 4×4 (column-major) by vec4(rgb, 1.0), so the 4th
 * column carries the bias — we drop the alpha column and keep bias as the translation term.
 * This mirrors iOS's CIColorMatrix so a single preset array renders identically on both.
 */
@UnstableApi
class ColorMatrixEffect(matrix45: FloatArray) : RgbMatrix {
  private val glMatrix: FloatArray = toColumnMajor(matrix45)

  override fun getMatrix(presentationTimeUs: Long, useHdr: Boolean): FloatArray = glMatrix

  companion object {
    fun toColumnMajor(m: FloatArray): FloatArray {
      // rows: R=0..4, G=5..9, B=10..14; each [r, g, b, a, bias]. Alpha column stays opaque.
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
