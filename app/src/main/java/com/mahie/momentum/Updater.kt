package com.mahie.momentum

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class ReleaseInfo(val version: String, val notes: String, val apkUrl: String, val size: Long)

sealed interface UpdateState {
    data object Idle : UpdateState
    data object Checking : UpdateState
    data object UpToDate : UpdateState
    data class Available(val info: ReleaseInfo) : UpdateState
    data class Downloading(val info: ReleaseInfo, val progress: Float) : UpdateState
    data class Ready(val info: ReleaseInfo, val file: File) : UpdateState
    data class Error(val message: String) : UpdateState
}

object Updater {
    private const val LATEST = "https://api.github.com/repos/mahie-cs/Chrono-Events/releases/latest"

    private fun open(url: String): HttpURLConnection =
        (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout = 30_000
            setRequestProperty("Accept", "application/vnd.github+json")
            setRequestProperty("User-Agent", "Momentum-Android")
        }

    /** Latest GitHub release that has an .apk attached. */
    suspend fun latest(): ReleaseInfo = withContext(Dispatchers.IO) {
        val c = open(LATEST)
        try {
            if (c.responseCode == 404) error("No releases published yet.")
            check(c.responseCode == 200) { "GitHub returned HTTP ${c.responseCode}" }
            val o = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
            val assets = o.getJSONArray("assets")
            val apk = (0 until assets.length()).map { assets.getJSONObject(it) }
                .firstOrNull { it.getString("name").endsWith(".apk", ignoreCase = true) }
                ?: error("The latest release has no APK attached.")
            ReleaseInfo(
                version = o.getString("tag_name"),
                notes = o.optString("body").trim(),
                apkUrl = apk.getString("browser_download_url"),
                size = apk.optLong("size"),
            )
        } finally {
            c.disconnect()
        }
    }

    fun isNewer(remote: String, local: String): Boolean {
        fun parts(s: String) = s.trim().removePrefix("v").removePrefix("V").split('.')
            .map { it.takeWhile(Char::isDigit).toIntOrNull() ?: 0 }
        val r = parts(remote)
        val l = parts(local)
        for (i in 0 until maxOf(r.size, l.size)) {
            val a = r.getOrElse(i) { 0 }
            val b = l.getOrElse(i) { 0 }
            if (a != b) return a > b
        }
        return false
    }

    suspend fun download(ctx: Context, info: ReleaseInfo, onProgress: (Float) -> Unit): File =
        withContext(Dispatchers.IO) {
            val dir = File(ctx.cacheDir, "updates").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
            val part = File(dir, "Momentum.apk.part")
            val c = open(info.apkUrl) // GitHub redirects to its CDN; HttpURLConnection follows it
            try {
                check(c.responseCode == 200) { "HTTP ${c.responseCode}" }
                val total = c.contentLengthLong.takeIf { it > 0 } ?: info.size
                var done = 0L
                var lastPct = -1
                c.inputStream.use { input ->
                    part.outputStream().use { out ->
                        val buf = ByteArray(32 * 1024)
                        while (true) {
                            val n = input.read(buf)
                            if (n < 0) break
                            out.write(buf, 0, n)
                            done += n
                            if (total > 0) {
                                val pct = (done * 100 / total).toInt()
                                if (pct != lastPct) { lastPct = pct; onProgress(done.toFloat() / total) }
                            }
                        }
                    }
                }
            } finally {
                c.disconnect()
            }
            File(dir, "Momentum-${info.version}.apk").also { part.renameTo(it) }
        }

    /** Returns false if the user first has to allow installs from this app (settings screen is opened). */
    fun install(ctx: Context, file: File): Boolean {
        if (!ctx.packageManager.canRequestPackageInstalls()) {
            ctx.startActivity(
                Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${ctx.packageName}"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
            return false
        }
        val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.fileprovider", file)
        ctx.startActivity(
            Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK),
        )
        return true
    }
}
